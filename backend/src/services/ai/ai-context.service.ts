import PlannerProfile from "../../models/PlannerProfile.js";
import StudyPlan from "../../models/StudyPlan.js";
import { daysRemaining, normalizeDateOnly } from "../date.service.js";
import { buildProgress } from "../progress.service.js";
import { calculateReadiness } from "../readiness.service.js";
import { calculateStudyStreak } from "../streak.service.js";
import type { AiContext, TopicContext } from "./ai.types.js";

function sessionMinutes(value: string) { const match = value.match(/\d+/); return match ? Math.min(60, Math.max(25, Number(match[0]))) : 45; }
function available(profile: Awaited<ReturnType<typeof PlannerProfile.findOne>>) {
  if (!profile) return { weeklyAvailableMinutes: 0, zeroHourDays: [] as string[] };
  const days = profile.days as Map<string, number> & Record<string, number>;
  const names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const values = names.map((name) => [name, Number(typeof days.get === "function" ? days.get(name) : days[name]) || 0] as const);
  return { weeklyAvailableMinutes: values.reduce((sum, [, hours]) => sum + hours * 60, 0), zeroHourDays: values.filter(([, hours]) => hours <= 0).map(([name]) => name) };
}

export async function loadAiContext(userId: string) {
  const [profile, plan] = await Promise.all([PlannerProfile.findOne({ userId } as any), StudyPlan.findOne({ userId } as any)]);
  if (!profile) return null;
  const sessions = plan?.sessions ?? [];
  const progress = buildProgress(profile, sessions);
  const byTopic = new Map(progress.topicProgress.map((topic) => [`${topic.subject}\u0000${topic.name}`, topic]));
  const topics: TopicContext[] = profile.subjects.flatMap((subject) => subject.topics.map((topic) => {
    const metric = byTopic.get(`${subject.name}\u0000${topic.name}`);
    const matching = sessions.filter((session) => session.subject === subject.name && session.topic === topic.name);
    return { subject: subject.name, topic: topic.name, difficulty: topic.difficulty, preparation: topic.prep, priorityScore: metric?.currentPriorityScore ?? 0, strategy: matching[0]?.strategy ?? profile.strategy, completedSessions: metric?.completedSessions ?? 0, partialSessions: metric?.partialSessions ?? 0, missedSessions: metric?.missedSessions ?? 0, difficultFeedbackCount: matching.filter((session) => session.feedback === "difficult").length };
  }));
  const ranked = [...topics].sort((a, b) => b.priorityScore - a.priorityScore);
  const weak = [...topics].sort((a, b) => (a.completedSessions - b.completedSessions) || b.priorityScore - a.priorityScore);
  const availability = available(profile);
  const date = normalizeDateOnly(profile.exam.date);
  const context: AiContext = {
    mode: profile.mode,
    exam: profile.mode === "exam" && date ? { name: profile.exam.name, date, daysRemaining: daysRemaining(date) } : null,
    readiness: calculateReadiness(profile, sessions),
    availability: { ...availability, preferredSessionMinutes: sessionMinutes(profile.session) },
    progress: { completionRate: progress.completionRate, completedMinutes: progress.completedMinutes, plannedMinutes: progress.plannedMinutes, streak: calculateStudyStreak(sessions), feedback: progress.feedbackDistribution },
    priorityTopics: ranked.slice(0, 5), weakAreas: weak.slice(0, 3), strongAreas: [...weak].reverse().slice(0, 3),
  };
  return { profile, plan, context, topics };
}
