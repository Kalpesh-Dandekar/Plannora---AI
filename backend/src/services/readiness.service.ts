import type { IPlannerProfile } from "../models/PlannerProfile.js";
import type { IStudySession } from "../models/StudyPlan.js";
import { daysRemaining } from "./date.service.js";
import { buildProgress } from "./progress.service.js";
import { calculateStudyStreak } from "./streak.service.js";

const PREPARATION_SCORE = { "Not Started": 10, Learning: 45, "Revision Needed": 70, Confident: 100 } as const;

export function calculateReadiness(profile: IPlannerProfile, sessions: IStudySession[], now = new Date()): number {
  const progress = buildProgress(profile, sessions, now);
  const allTopics = profile.subjects.flatMap((subject) => subject.topics);
  const preparation = allTopics.length
    ? allTopics.reduce((sum, topic) => sum + PREPARATION_SCORE[topic.prep], 0) / allTopics.length
    : 0;
  const streak = calculateStudyStreak(sessions, now);
  const consistency = Math.min(100, streak * 20);
  const negativeHistory = sessions.length
    ? ((progress.missedSessions + progress.partialSessions * 0.5) / sessions.length) * 100
    : 0;
  const difficultFeedback = sessions.length
    ? (progress.feedbackDistribution.difficult / sessions.length) * 100
    : 0;
  const remaining = profile.exam.date ? daysRemaining(profile.exam.date, now) : null;
  const urgencyPenalty = remaining !== null && remaining <= 7 ? Math.max(0, 8 - remaining) : 0;

  // Completion 45%, declared preparation 35%, consistency 20%, less observed difficulty/missed-work penalties.
  const score = progress.completionPercentage * 0.45 + preparation * 0.35 + consistency * 0.2
    - negativeHistory * 0.12 - difficultFeedback * 0.08 - urgencyPenalty;
  return Math.max(0, Math.min(100, Math.round(score)));
}
