import type {
  IStudySession,
  StudySessionFeedback,
  StudySessionStatus,
} from "../models/StudyPlan.js";

interface AdaptiveResult {
  priorityAdjustment: number;
  reason: string;
}

export function calculateAdaptiveAdjustment(
  status: StudySessionStatus,
  feedback: StudySessionFeedback | null,
): AdaptiveResult {
  let priorityAdjustment = 0;
  const reasons: string[] = [];

  if (status === "missed") {
    priorityAdjustment += 20;
    reasons.push("the previous session was missed");
  } else if (status === "partial") {
    priorityAdjustment += 12;
    reasons.push("the previous session was only partially completed");
  } else if (status === "done") {
    priorityAdjustment -= 5;
    reasons.push("the previous session was completed");
  }

  if (feedback === "difficult") {
    priorityAdjustment += 15;
    reasons.push("the topic was reported as difficult");
  } else if (feedback === "easy") {
    priorityAdjustment -= 5;
    reasons.push("the topic was reported as easy");
  }

  if (reasons.length === 0) {
    return {
      priorityAdjustment: 0,
      reason: "No adaptive adjustment was required.",
    };
  }

  return {
    priorityAdjustment,
    reason: `Priority adjusted because ${reasons.join(" and ")}.`,
  };
}

export function applyAdaptiveAdjustment(
  sessions: IStudySession[],
  subject: string,
  topic: string,
  adjustment: number,
): void {
  for (const session of sessions) {
    if (
      session.status === "planned" &&
      session.subject === subject &&
      session.topic === topic
    ) {
      session.priorityScore = Math.max(
        0,
        session.priorityScore + adjustment,
      );
    }
  }
}