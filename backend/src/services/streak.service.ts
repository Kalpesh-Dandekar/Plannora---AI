import type { IStudySession } from "../models/StudyPlan.js";
import { addCalendarDays, startOfLocalDay, toDateOnly } from "./date.service.js";

export function calculateStudyStreak(sessions: IStudySession[], now = new Date()): number {
  const successfulDays = new Set(sessions
    .filter((session) => session.status === "done" || session.status === "partial")
    .map((session) => session.date));
  let cursor = startOfLocalDay(now);
  if (!successfulDays.has(toDateOnly(cursor))) cursor = addCalendarDays(cursor, -1);
  let streak = 0;
  while (successfulDays.has(toDateOnly(cursor))) {
    streak += 1;
    cursor = addCalendarDays(cursor, -1);
  }
  return streak;
}
