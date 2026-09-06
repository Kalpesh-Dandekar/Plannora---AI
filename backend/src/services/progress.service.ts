import type { IPlannerProfile } from "../models/PlannerProfile.js";
import type { IStudySession, StudySessionFeedback, StudySessionStatus } from "../models/StudyPlan.js";
import { addCalendarDays, startOfWeek, toDateOnly } from "./date.service.js";

export function completedMinutes(session: IStudySession): number {
  if (session.status === "done") return session.durationMinutes;
  if (session.status === "partial") return Math.round(session.durationMinutes / 2);
  return 0;
}

function percentage(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export interface TopicProgress {
  subject: string;
  name: string;
  difficulty: string;
  preparationLevel: string;
  plannedSessions: number;
  completedSessions: number;
  partialSessions: number;
  missedSessions: number;
  totalPlannedMinutes: number;
  completedMinutes: number;
  progressPercentage: number;
  currentPriorityScore: number;
}

export function buildTopicProgress(profile: IPlannerProfile, sessions: IStudySession[]): TopicProgress[] {
  return profile.subjects.flatMap((subject) => subject.topics.map((topic) => {
    const matching = sessions.filter((session) => session.subject === subject.name && session.topic === topic.name);
    const totalMinutes = matching.reduce((sum, session) => sum + session.durationMinutes, 0);
    const completeMinutes = matching.reduce((sum, session) => sum + completedMinutes(session), 0);
    return {
      subject: subject.name,
      name: topic.name,
      difficulty: topic.difficulty,
      preparationLevel: topic.prep,
      plannedSessions: matching.length,
      completedSessions: matching.filter((session) => session.status === "done").length,
      partialSessions: matching.filter((session) => session.status === "partial").length,
      missedSessions: matching.filter((session) => session.status === "missed").length,
      totalPlannedMinutes: totalMinutes,
      completedMinutes: completeMinutes,
      progressPercentage: percentage(completeMinutes, totalMinutes),
      currentPriorityScore: matching.reduce((score, session) => Math.max(score, session.priorityScore), 0),
    };
  }));
}

export function buildSubjectProgress(profile: IPlannerProfile, sessions: IStudySession[]) {
  const topics = buildTopicProgress(profile, sessions);
  return profile.subjects.map((subject) => {
    const matching = sessions.filter((session) => session.subject === subject.name);
    const subjectTopics = topics.filter((topic) => topic.subject === subject.name);
    const totalMinutes = matching.reduce((sum, session) => sum + session.durationMinutes, 0);
    const completeMinutes = matching.reduce((sum, session) => sum + completedMinutes(session), 0);
    return {
      name: subject.name,
      topicCount: subject.topics.length,
      completedSessions: matching.filter((session) => session.status === "done").length,
      plannedSessions: matching.length,
      totalPlannedMinutes: totalMinutes,
      completedMinutes: completeMinutes,
      progressPercentage: percentage(completeMinutes, totalMinutes),
      topics: subjectTopics.map(({ subject: _subject, ...topic }) => topic),
    };
  });
}

export function buildProgress(profile: IPlannerProfile, sessions: IStudySession[], now = new Date()) {
  const count = (status: StudySessionStatus) => sessions.filter((session) => session.status === status).length;
  const plannedMinutes = sessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const completeMinutes = sessions.reduce((sum, session) => sum + completedMinutes(session), 0);
  const topics = buildTopicProgress(profile, sessions);
  const subjectProgress = buildSubjectProgress(profile, sessions);
  const weekStart = startOfWeek(now);
  const weeklyProgress = Array.from({ length: 7 }, (_, index) => {
    const date = toDateOnly(addCalendarDays(weekStart, index));
    const daySessions = sessions.filter((session) => session.date === date);
    const dayPlanned = daySessions.reduce((sum, session) => sum + session.durationMinutes, 0);
    const dayCompleted = daySessions.reduce((sum, session) => sum + completedMinutes(session), 0);
    return { date, plannedMinutes: dayPlanned, completedMinutes: dayCompleted, percentage: percentage(dayCompleted, dayPlanned) };
  });
  const feedbackDistribution: Record<StudySessionFeedback, number> = { easy: 0, okay: 0, difficult: 0 };
  for (const session of sessions) if (session.feedback) feedbackDistribution[session.feedback] += 1;
  const ranked = [...topics].sort((a, b) => a.progressPercentage - b.progressPercentage || b.currentPriorityScore - a.currentPriorityScore);
  return {
    totalPlannedSessions: sessions.length,
    completedSessions: count("done"),
    partialSessions: count("partial"),
    missedSessions: count("missed"),
    completionRate: percentage(count("done") + count("partial"), sessions.length),
    plannedMinutes,
    completedMinutes: completeMinutes,
    completionPercentage: percentage(completeMinutes, plannedMinutes),
    subjectProgress,
    topicProgress: topics,
    weeklyProgress,
    weakAreas: ranked.slice(0, 3),
    strongerAreas: [...ranked].reverse().slice(0, 3),
    feedbackDistribution,
  };
}
