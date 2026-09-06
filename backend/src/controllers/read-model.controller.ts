import type { Response } from "express";
import { Types } from "mongoose";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import PlannerProfile from "../models/PlannerProfile.js";
import StudyPlan from "../models/StudyPlan.js";
import User from "../models/User.js";
import { daysRemaining, normalizeDateOnly, startOfLocalDay, toDateOnly } from "../services/date.service.js";
import { buildProgress, buildSubjectProgress, completedMinutes } from "../services/progress.service.js";
import { calculateReadiness } from "../services/readiness.service.js";
import { calculateStudyStreak } from "../services/streak.service.js";

async function loadContext(userId: string) {
  const [user, profile, plan] = await Promise.all([
    User.findById(userId),
    PlannerProfile.findOne({ userId } as any),
    StudyPlan.findOne({ userId } as any),
  ]);
  return { user, profile, plan };
}

function validUser(req: AuthenticatedRequest, res: Response): req is AuthenticatedRequest & { userId: string } {
  if (!req.userId || !Types.ObjectId.isValid(req.userId)) {
    res.status(401).json({ success: false, message: "Invalid authentication token." });
    return false;
  }
  return true;
}

export async function getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!validUser(req, res)) return;
    const { user, profile, plan } = await loadContext(req.userId);
    if (!user) { res.status(404).json({ success: false, message: "Account was not found." }); return; }
    if (!profile) { res.status(404).json({ success: false, message: "Planner setup has not been created yet." }); return; }
    if (!plan) { res.status(404).json({ success: false, message: "Study plan has not been generated yet." }); return; }
    const now = new Date();
    const todayDate = toDateOnly(startOfLocalDay(now));
    const todaySessions = plan.sessions.filter((session) => session.date === todayDate);
    const plannedMinutes = todaySessions.reduce((sum, session) => sum + session.durationMinutes, 0);
    const completeMinutes = todaySessions.reduce((sum, session) => sum + completedMinutes(session), 0);
    const future = plan.sessions.filter((session) => session.status === "planned" && session.date >= todayDate)
      .sort((a, b) => a.date.localeCompare(b.date) || b.priorityScore - a.priorityScore);
    const todayNext = future.find((session) => session.date === todayDate);
    const progress = buildProgress(profile, plan.sessions, now);
    const weekPlanned = progress.weeklyProgress.reduce((sum, day) => sum + day.plannedMinutes, 0);
    const weekCompleted = progress.weeklyProgress.reduce((sum, day) => sum + day.completedMinutes, 0);
    const priorityTopics = [...progress.topicProgress].sort((a, b) => b.currentPriorityScore - a.currentPriorityScore).slice(0, 5);

    res.json({
      success: true,
      dashboard: {
        user: { name: user.name, mode: profile.mode },
        today: {
          date: todayDate,
          plannedMinutes,
          completedMinutes: completeMinutes,
          remainingMinutes: Math.max(0, plannedMinutes - completeMinutes),
          totalSessions: todaySessions.length,
          completedSessions: todaySessions.filter((session) => session.status === "done").length,
          nextSession: todayNext ?? future[0] ?? null,
        },
        exam: profile.mode === "exam" && normalizeDateOnly(profile.exam.date)
          ? { name: profile.exam.name, date: normalizeDateOnly(profile.exam.date), daysRemaining: daysRemaining(profile.exam.date, now) }
          : null,
        readinessScore: calculateReadiness(profile, plan.sessions, now),
        streak: calculateStudyStreak(plan.sessions, now),
        weeklyGoal: {
          plannedMinutes: weekPlanned,
          completedMinutes: weekCompleted,
          percentage: weekPlanned ? Math.round((weekCompleted / weekPlanned) * 100) : 0,
        },
        priorityTopics,
        recentProgress: progress.weeklyProgress,
      },
    });
  } catch (error) {
    console.error(`Dashboard fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    res.status(500).json({ success: false, message: "Unable to load your dashboard right now." });
  }
}

export async function getSubjects(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!validUser(req, res)) return;
    const [profile, plan] = await Promise.all([
      PlannerProfile.findOne({ userId: req.userId } as any),
      StudyPlan.findOne({ userId: req.userId } as any),
    ]);
    if (!profile) { res.status(404).json({ success: false, message: "Planner setup has not been created yet." }); return; }
    res.json({ success: true, subjects: buildSubjectProgress(profile, plan?.sessions ?? []) });
  } catch (error) {
    console.error(`Subjects fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    res.status(500).json({ success: false, message: "Unable to load your subjects right now." });
  }
}

export async function getExams(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!validUser(req, res)) return;
    const [profile, plan] = await Promise.all([
      PlannerProfile.findOne({ userId: req.userId } as any),
      StudyPlan.findOne({ userId: req.userId } as any),
    ]);
    if (!profile) { res.status(404).json({ success: false, message: "Planner setup has not been created yet." }); return; }
    const examDate = normalizeDateOnly(profile.exam.date);
    if (profile.mode !== "exam" || !examDate) { res.json({ success: true, exam: null }); return; }
    const sessions = plan?.sessions ?? [];
    const topics = profile.subjects.flatMap((subject) => subject.topics);
    res.json({
      success: true,
      exam: {
        name: profile.exam.name,
        date: examDate,
        daysRemaining: daysRemaining(examDate),
        readinessScore: calculateReadiness(profile, sessions),
        totalTopics: topics.length,
        preparedTopics: topics.filter((topic) => topic.prep === "Confident").length,
        remainingTopics: topics.filter((topic) => topic.prep !== "Confident").length,
        plannedStudyMinutes: sessions.reduce((sum, session) => sum + session.durationMinutes, 0),
        completedStudyMinutes: sessions.reduce((sum, session) => sum + completedMinutes(session), 0),
      },
    });
  } catch (error) {
    console.error(`Exams fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    res.status(500).json({ success: false, message: "Unable to load your exam right now." });
  }
}

export async function getProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!validUser(req, res)) return;
    const [profile, plan] = await Promise.all([
      PlannerProfile.findOne({ userId: req.userId } as any),
      StudyPlan.findOne({ userId: req.userId } as any),
    ]);
    if (!profile) { res.status(404).json({ success: false, message: "Planner setup has not been created yet." }); return; }
    if (!plan) { res.status(404).json({ success: false, message: "Study plan has not been generated yet." }); return; }
    const progress = buildProgress(profile, plan.sessions);
    res.json({
      success: true,
      progress: {
        ...progress,
        readinessScore: calculateReadiness(profile, plan.sessions),
        streak: calculateStudyStreak(plan.sessions),
      },
    });
  } catch (error) {
    console.error(`Progress fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    res.status(500).json({ success: false, message: "Unable to load your progress right now." });
  }
}
