import type { IPlannerProfile } from "../models/PlannerProfile.js";
import type {
  IStudySession,
  StudySessionStatus,
} from "../models/StudyPlan.js";

interface RescheduleResult {
  rescheduled: boolean;
  newSession?: IStudySession;
  reason?: string;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);

  return next;
}

function isReschedulableStatus(
  status: StudySessionStatus,
): boolean {
  return status === "partial" || status === "missed";
}

function getRemainingDuration(
  session: IStudySession,
): number {
  if (session.status === "missed") {
    return session.durationMinutes;
  }

  if (session.status === "partial") {
    return Math.max(
      25,
      Math.ceil(session.durationMinutes / 2),
    );
  }

  return 0;
}

function getAvailableHours(
  profile: IPlannerProfile,
  dayName: string,
): number {
  const days = profile.days as
    | Record<string, number>
    | Map<string, number>;

  if (days instanceof Map) {
    return Number(days.get(dayName) ?? 0);
  }

  const mongooseMap =
    days as Map<string, number> & Record<string, number>;

  if (typeof mongooseMap.get === "function") {
    return Number(mongooseMap.get(dayName) ?? 0);
  }

  return Number(
    (days as Record<string, number>)[dayName] ?? 0,
  );
}

function isBeforeExam(
  profile: IPlannerProfile,
  candidateDate: Date,
): boolean {
  if (profile.mode !== "exam" || !profile.exam.date) {
    return true;
  }

  const examDate = parseDateOnly(profile.exam.date);

  if (Number.isNaN(examDate.getTime())) {
    return true;
  }

  return candidateDate.getTime() < examDate.getTime();
}

function getPlannedMinutesForDate(
  sessions: IStudySession[],
  date: string,
): number {
  return sessions
    .filter(
      (session) =>
        session.date === date &&
        session.status === "planned",
    )
    .reduce(
      (total, session) =>
        total + session.durationMinutes,
      0,
    );
}

function findNextAvailableDate(
  sessions: IStudySession[],
  profile: IPlannerProfile,
  currentDate: string,
  requiredMinutes: number,
): string | null {
  const baseDate = parseDateOnly(currentDate);

  for (let offset = 1; offset <= 14; offset += 1) {
    const candidate = addDays(baseDate, offset);

    if (!isBeforeExam(profile, candidate)) {
      break;
    }

    const dayName = DAY_NAMES[candidate.getDay()];
    const availableHours = getAvailableHours(
      profile,
      dayName,
    );

    if (
      !Number.isFinite(availableHours) ||
      availableHours <= 0
    ) {
      continue;
    }

    const availableMinutes = Math.round(
      availableHours * 60,
    );

    const candidateDate = toDateOnly(candidate);

    const plannedMinutes = getPlannedMinutesForDate(
      sessions,
      candidateDate,
    );

    const remainingCapacity =
      availableMinutes - plannedMinutes;

    if (remainingCapacity >= requiredMinutes) {
      return candidateDate;
    }
  }

  return null;
}

export function rescheduleIncompleteSession(
  sessions: IStudySession[],
  completedSession: IStudySession,
  profile: IPlannerProfile,
): RescheduleResult {
  if (!isReschedulableStatus(completedSession.status)) {
    return {
      rescheduled: false,
      reason: "The completed session does not require rescheduling.",
    };
  }

  const durationMinutes =
    getRemainingDuration(completedSession);

  if (durationMinutes <= 0) {
    return {
      rescheduled: false,
      reason: "There is no remaining study duration to reschedule.",
    };
  }

  const date = findNextAvailableDate(
    sessions,
    profile,
    completedSession.date,
    durationMinutes,
  );

  if (!date) {
    return {
      rescheduled: false,
      reason:
        "No available study slot was found within the rescheduling window.",
    };
  }

  const newSession: IStudySession = {
    date,
    subject: completedSession.subject,
    topic: completedSession.topic,
    durationMinutes,
    strategy: completedSession.strategy,
    priorityScore:
      completedSession.priorityScore + 10,
    why:
      completedSession.status === "missed"
        ? "Rescheduled automatically because the previous session was missed."
        : "Rescheduled automatically to complete unfinished study work.",
    status: "planned",
    feedback: null,
  };

  sessions.push(newSession);

  return {
    rescheduled: true,
    newSession,
  };
}