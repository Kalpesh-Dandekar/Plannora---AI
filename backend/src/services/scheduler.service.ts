import type {
  IPlannerProfile,
  PreparationLevel,
  TopicDifficulty,
} from "../models/PlannerProfile.js";
import type { IStudySession } from "../models/StudyPlan.js";
import { parseDateOnly, toDateOnly } from "./date.service.js";

interface RankedTopic {
  subject: string;
  topic: string;
  difficulty: TopicDifficulty;
  prep: PreparationLevel;
  priorityScore: number;
  why: string;
  strategy: string;
  assignedMinutes: number;
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

const difficultyScores: Record<TopicDifficulty, number> = {
  Easy: 10,
  Medium: 20,
  Hard: 30,
};

const preparationScores: Record<PreparationLevel, number> = {
  "Not Started": 30,
  Learning: 22,
  "Revision Needed": 16,
  Confident: 6,
};

function startOfToday(): Date {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);

  return next;
}

function daysBetween(start: Date, end: Date): number {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return Math.ceil(
    (end.getTime() - start.getTime()) / millisecondsPerDay,
  );
}

function getUrgencyScore(profile: IPlannerProfile): number {
  if (profile.mode !== "exam" || !profile.exam.date) {
    return 8;
  }

  const today = startOfToday();
  const examDate = parseDateOnly(profile.exam.date);

  if (!examDate) {
    return 8;
  }

  const remainingDays = daysBetween(today, examDate);

  if (remainingDays <= 3) {
    return 30;
  }

  if (remainingDays <= 7) {
    return 26;
  }

  if (remainingDays <= 14) {
    return 20;
  }

  if (remainingDays <= 30) {
    return 14;
  }

  return 10;
}

function isAttentionTopic(
  attention: string[],
  subject: string,
  topic: string,
): boolean {
  const normalizedAttention = attention.map((item) =>
    item.trim().toLowerCase(),
  );

  return (
    normalizedAttention.includes(subject.trim().toLowerCase()) ||
    normalizedAttention.includes(topic.trim().toLowerCase())
  );
}

function chooseStrategy(
  plannerStrategy: string,
  difficulty: TopicDifficulty,
  prep: PreparationLevel,
): string {
  if (plannerStrategy !== "Let Plannora decide") {
    return plannerStrategy;
  }

  if (prep === "Not Started") {
    return "Concepts";
  }

  if (prep === "Revision Needed") {
    return "Active Recall";
  }

  if (prep === "Confident") {
    return "Revision";
  }

  if (difficulty === "Hard") {
    return "Practice";
  }

  return "Concepts + Practice";
}

function buildWhy(
  difficulty: TopicDifficulty,
  prep: PreparationLevel,
  attentionBoost: boolean,
  urgencyScore: number,
): string {
  const reasons: string[] = [];

  if (difficulty === "Hard") {
    reasons.push("high topic difficulty");
  } else if (difficulty === "Medium") {
    reasons.push("moderate topic difficulty");
  }

  if (prep === "Not Started") {
    reasons.push("preparation has not started");
  } else if (prep === "Learning") {
    reasons.push("topic is still being learned");
  } else if (prep === "Revision Needed") {
    reasons.push("revision is needed");
  }

  if (attentionBoost) {
    reasons.push("marked for extra attention");
  }

  if (urgencyScore >= 26) {
    reasons.push("exam is very close");
  } else if (urgencyScore >= 20) {
    reasons.push("exam is approaching");
  }

  if (reasons.length === 0) {
    return "Scheduled to maintain steady progress.";
  }

  return `Prioritized because of ${reasons.join(", ")}.`;
}

function rankTopics(profile: IPlannerProfile): RankedTopic[] {
  const urgencyScore = getUrgencyScore(profile);
  const rankedTopics: RankedTopic[] = [];

  for (const subject of profile.subjects) {
    for (const topic of subject.topics) {
      const attentionBoost = isAttentionTopic(
        profile.attention,
        subject.name,
        topic.name,
      );

      const priorityScore =
        difficultyScores[topic.difficulty] +
        preparationScores[topic.prep] +
        urgencyScore +
        (attentionBoost ? 20 : 0);

      rankedTopics.push({
        subject: subject.name,
        topic: topic.name,
        difficulty: topic.difficulty,
        prep: topic.prep,
        priorityScore,
        why: buildWhy(
          topic.difficulty,
          topic.prep,
          attentionBoost,
          urgencyScore,
        ),
        strategy: chooseStrategy(
          profile.strategy,
          topic.difficulty,
          topic.prep,
        ),
        assignedMinutes: 0,
      });
    }
  }

  return rankedTopics.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }

    const subjectComparison = a.subject.localeCompare(b.subject);

    if (subjectComparison !== 0) {
      return subjectComparison;
    }

    return a.topic.localeCompare(b.topic);
  });
}

function chooseNextTopic(
  topics: RankedTopic[],
): RankedTopic {
  return [...topics].sort((a, b) => {
    const aLoad = a.assignedMinutes / a.priorityScore;
    const bLoad = b.assignedMinutes / b.priorityScore;

    if (aLoad !== bLoad) {
      return aLoad - bLoad;
    }

    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }

    const subjectComparison = a.subject.localeCompare(b.subject);

    if (subjectComparison !== 0) {
      return subjectComparison;
    }

    return a.topic.localeCompare(b.topic);
  })[0];
}

function getSessionMinutes(session: string): number {
  if (session === "25 min") {
    return 25;
  }

  if (session === "45 min") {
    return 45;
  }

  if (session === "60 min") {
    return 60;
  }

  return 45;
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

function getScheduleEndDate(profile: IPlannerProfile): Date {
  const today = startOfToday();

  if (profile.mode === "exam" && profile.exam.date) {
    const examDate = parseDateOnly(profile.exam.date);

    if (
      examDate &&
      examDate.getTime() > today.getTime()
    ) {
      return addDays(examDate, -1);
    }
  }

  return addDays(today, 6);
}

export function generateStudySessions(
  profile: IPlannerProfile,
): IStudySession[] {
  const rankedTopics = rankTopics(profile);

  if (rankedTopics.length === 0) {
    return [];
  }

  const today = startOfToday();
  const endDate = getScheduleEndDate(profile);

  if (endDate.getTime() < today.getTime()) {
    return [];
  }

  const preferredSessionMinutes = getSessionMinutes(profile.session);
  const sessions: IStudySession[] = [];

  for (
    let date = new Date(today);
    date.getTime() <= endDate.getTime();
    date = addDays(date, 1)
  ) {
    const dayName = DAY_NAMES[date.getDay()];
    const availableHours = getAvailableHours(profile, dayName);

    if (
      !Number.isFinite(availableHours) ||
      availableHours <= 0
    ) {
      continue;
    }

    let remainingMinutes = Math.round(availableHours * 60);

    while (remainingMinutes >= 25) {
      const topic = chooseNextTopic(rankedTopics);

      const durationMinutes = Math.min(
        preferredSessionMinutes,
        remainingMinutes,
      );

      if (durationMinutes < 25) {
        break;
      }

      sessions.push({
        date: toDateOnly(date),
        subject: topic.subject,
        topic: topic.topic,
        durationMinutes,
        strategy: topic.strategy,
        priorityScore: topic.priorityScore,
        why: topic.why,
        status: "planned",
        feedback: null,
      });

      topic.assignedMinutes += durationMinutes;
      remainingMinutes -= durationMinutes;
    }
  }

  return sessions;
}
