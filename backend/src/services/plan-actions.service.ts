import type { IPlannerProfile } from "../models/PlannerProfile.js";
import type { IStudySession } from "../models/StudyPlan.js";

import {
  addCalendarDays,
  parseDateOnly,
  startOfLocalDay,
  toDateOnly,
} from "./date.service.js";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function compareStrings(a: unknown, b: unknown): number {
  return safeString(a).localeCompare(safeString(b));
}

function availableMinutes(
  profile: IPlannerProfile,
  dayName: string,
): number {
  const days = profile.days as Map<string, number> & Record<string, number>;

  const hours =
    typeof days.get === "function" ? days.get(dayName) : days[dayName];

  return Math.max(0, Math.round(Number(hours ?? 0) * 60));
}

function scheduleEnd(
  profile: IPlannerProfile,
  sessions: IStudySession[],
  today: Date,
): Date {
  if (profile.mode === "exam" && profile.exam.date) {
    const exam = parseDateOnly(profile.exam.date);

    if (exam) {
      return addCalendarDays(exam, -1);
    }
  }

  const lastPlanned = sessions
    .map((session) => parseDateOnly(session.date))
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return lastPlanned && lastPlanned > today
    ? lastPlanned
    : addCalendarDays(today, 6);
}

interface WorkItem {
  subject: string;
  topic: string;
  durationMinutes: number;
  strategy: string;
  priorityScore: number;
  why: string;
  recovery: boolean;
}

function toWorkItem(
  session: IStudySession,
  overrides: Partial<WorkItem> = {},
): WorkItem {
  return {
    subject: safeString(session.subject),
    topic: safeString(session.topic),
    durationMinutes: Math.max(
      0,
      Math.round(Number(session.durationMinutes ?? 0)),
    ),
    strategy: safeString(session.strategy),
    priorityScore: Number(session.priorityScore ?? 0),
    why: safeString(session.why),
    recovery: false,
    ...overrides,
  };
}

export function rescueStudyPlan(
  sessions: IStudySession[],
  profile: IPlannerProfile,
  now = new Date(),
) {
  const today = startOfLocalDay(now);
  const todayString = toDateOnly(today);

  const historical = sessions.filter(
    (session) => session.status !== "planned",
  );

  const futurePlanned = sessions.filter((session) => {
    const date = safeString(session.date);

    return session.status === "planned" && date >= todayString;
  });

  const work: WorkItem[] = futurePlanned.map((session) =>
    toWorkItem(session),
  );

  for (const session of sessions.filter((item) => {
    const date = safeString(item.date);

    return item.status === "planned" && date < todayString;
  })) {
    work.push(
      toWorkItem(session, {
        priorityScore: Number(session.priorityScore ?? 0) + 20,
        why: "Recovered because this planned session is overdue.",
        recovery: true,
      }),
    );
  }

  for (const session of sessions.filter(
    (item) => item.status === "missed" || item.status === "partial",
  )) {
    const originalDuration = Math.max(
      0,
      Math.round(Number(session.durationMinutes ?? 0)),
    );

    const durationMinutes =
      session.status === "missed"
        ? originalDuration
        : Math.max(25, Math.ceil(originalDuration / 2));

    work.push(
      toWorkItem(session, {
        durationMinutes,
        priorityScore: Number(session.priorityScore ?? 0) + 20,
        why: "Recovered from unfinished study work.",
        recovery: true,
      }),
    );
  }

  work.sort(
    (a, b) =>
      b.priorityScore - a.priorityScore ||
      compareStrings(a.topic, b.topic) ||
      compareStrings(a.subject, b.subject),
  );

  const rebuilt: IStudySession[] = [];
  const stranded: WorkItem[] = [];

  let recoveredMinutes = 0;

  const end = scheduleEnd(profile, sessions, today);

  for (
    let date = new Date(today);
    date <= end && work.length;
    date = addCalendarDays(date, 1)
  ) {
    let capacity = availableMinutes(
      profile,
      DAY_NAMES[date.getDay()],
    );

    while (capacity >= 25 && work.length) {
      const item = work[0];

      const durationMinutes = Math.min(
        item.durationMinutes,
        capacity,
      );

      if (durationMinutes < 25) {
        break;
      }

      rebuilt.push({
        date: toDateOnly(date),
        subject: item.subject,
        topic: item.topic,
        durationMinutes,
        strategy: item.strategy,
        priorityScore: item.priorityScore,
        why: item.why,
        status: "planned",
        feedback: null,
      });

      if (item.recovery) {
        recoveredMinutes += durationMinutes;
      }

      item.durationMinutes -= durationMinutes;
      capacity -= durationMinutes;

      if (item.durationMinutes <= 0) {
        work.shift();
      } else if (item.durationMinutes < 25) {
        stranded.push({ ...item });
        work.shift();
      }
    }
  }

  const unscheduled = [...work, ...stranded];

  const remainingUnscheduledMinutes = unscheduled.reduce(
    (sum, item) => sum + item.durationMinutes,
    0,
  );

  const overloadedTopics = [
    ...new Set(
      unscheduled.map(
        (item) => `${item.subject}: ${item.topic}`,
      ),
    ),
  ];

  sessions.splice(
    0,
    sessions.length,
    ...historical,
    ...rebuilt,
  );

  sessions.sort((a, b) => {
    const dateComparison = compareStrings(a.date, b.date);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    const subjectComparison = compareStrings(
      a.subject,
      b.subject,
    );

    if (subjectComparison !== 0) {
      return subjectComparison;
    }

    return compareStrings(a.topic, b.topic);
  });

  return {
    movedSessions: rebuilt.length,
    recoveredMinutes,
    overloadedTopics,
    remainingUnscheduledMinutes,
  };
}

export function createQuickPlan(
  sessions: IStudySession[],
  requestedMinutes: number,
  now = new Date(),
) {
  const today = toDateOnly(startOfLocalDay(now));

  const candidates = sessions
    .filter((session) => {
      const date = safeString(session.date);

      return session.status === "planned" && date >= today;
    })
    .sort(
      (a, b) =>
        Number(b.priorityScore ?? 0) -
          Number(a.priorityScore ?? 0) ||
        compareStrings(a.date, b.date) ||
        compareStrings(a.topic, b.topic) ||
        compareStrings(a.subject, b.subject),
    );

  const seen = new Set<string>();

  const selected: Array<{
    subject: string;
    topic: string;
    durationMinutes: number;
    strategy: string;
    priorityScore: number;
    why: string;
  }> = [];

  let remainingMinutes = requestedMinutes;

  for (const session of candidates) {
    if (remainingMinutes < 10) {
      break;
    }

    const subject = safeString(session.subject);
    const topic = safeString(session.topic);

    const key = `${subject}\u0000${topic}`;

    if (seen.has(key)) {
      continue;
    }

    const sessionDuration = Math.max(
      0,
      Math.round(Number(session.durationMinutes ?? 0)),
    );

    const durationMinutes = Math.min(
      sessionDuration,
      remainingMinutes,
    );

    if (durationMinutes < 10) {
      continue;
    }

    selected.push({
      subject,
      topic,
      durationMinutes,
      strategy: safeString(session.strategy),
      priorityScore: Number(session.priorityScore ?? 0),
      why: safeString(session.why),
    });

    seen.add(key);
    remainingMinutes -= durationMinutes;
  }

  return {
    requestedMinutes,
    allocatedMinutes:
      requestedMinutes - remainingMinutes,
    remainingMinutes,
    sessions: selected,
  };
}