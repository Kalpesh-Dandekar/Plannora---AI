"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Flame,
  Play,
  RefreshCw,
  Target,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import type {
  DashboardResponse,
  ExamsResponse,
  PlannerResponse,
  StudyPlanResponse,
  StudySession,
} from "@/lib/api-types";
import { AdaptiveActions } from "./adaptive-actions";
import { Insight, PageHeader, ProgressBar, Stat } from "./primitives";

function minutes(value: number) {
  const h = Math.floor(value / 60),
    m = value % 60;
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
}
function status(value: StudySession["status"]) {
  return value === "done"
    ? "Completed"
    : value === "partial"
      ? "In progress"
      : value === "missed"
        ? "Missed"
        : "Upcoming";
}
function initials(subject: string) {
  return subject
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
function startHour(period?: string) {
  return period === "Morning"
    ? 8
    : period === "Afternoon"
      ? 13
      : period === "Evening"
        ? 17
        : period === "Night"
          ? 20
          : 9;
}
function timeAt(value: number) {
  const hour = Math.floor(value / 60),
    minute = value % 60;
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

function greetingForHour(hour: number) {
  return hour < 12
    ? "Good morning"
    : hour < 17
      ? "Good afternoon"
      : "Good evening";
}

function subscribeToBrowser() {
  return () => undefined;
}

export function DashboardView() {
  const isBrowser = useSyncExternalStore(
    subscribeToBrowser,
    () => true,
    () => false,
  );
  const [data, setData] = useState<DashboardResponse["dashboard"] | null>(null);
  const [exam, setExam] = useState<ExamsResponse["exam"]>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [period, setPeriod] = useState("Flexible");
  const load = useCallback(async () => {
    try {
      const [dashboard, examData, plan, profile] = await Promise.all([
        apiRequest<DashboardResponse>("/api/dashboard"),
        apiRequest<ExamsResponse>("/api/exams"),
        apiRequest<StudyPlanResponse>("/api/study-plan"),
        apiRequest<PlannerResponse>("/api/planner"),
      ]);
      setData(dashboard.dashboard);
      setExam(examData.exam);
      setSessions(
        (plan.plan?.sessions ?? []).filter(
          (item) => item.date === dashboard.dashboard.today.date,
        ),
      );
      setPeriod(profile.profile?.period ?? "Flexible");
    } catch (error) {
      console.error("Dashboard could not be loaded:", error);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    window.addEventListener("plannora:data-updated", load);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener("plannora:data-updated", load);
    };
  }, [load]);

  const displaySessions = useMemo(
    () =>
      sessions.map((item, index) => ({
        ...item,
        time: timeAt(
          startHour(period) * 60 +
            sessions
              .slice(0, index)
              .reduce((sum, session) => sum + session.durationMinutes, 0),
        ),
      })),
    [period, sessions],
  );
  const today = data?.today;
  const next = today?.nextSession ?? null;
  const percentage = today?.plannedMinutes
    ? Math.round((today.completedMinutes / today.plannedMinutes) * 100)
    : 0;
  const weak = data?.priorityTopics[0];

  return (
    <>
      <PageHeader
        eyebrow={`${new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()} · ${(data?.user.mode ?? "regular").toUpperCase()} MODE`}
        title={`${isBrowser ? greetingForHour(new Date().getHours()) : "Good evening"}, ${data?.user.name ?? ""}.`}
        copy="Here’s what matters today — and enough room for life to happen."
      />
      <section className="dashboard-hero">
        <div className="today-progress">
          <div className="dash-label">
            <span>TODAY’S PROGRESS</span>
            <b>
              {today?.completedSessions ?? 0} of {today?.totalSessions ?? 0}{" "}
              sessions
            </b>
          </div>
          <h2>
            <b>{today?.completedMinutes ?? 0}</b> / {today?.plannedMinutes ?? 0}{" "}
            minutes
          </h2>
          <ProgressBar value={percentage} />
          <div className="daily-mini">
            <span>
              <Target /> Daily goal <b>{percentage}%</b>
            </span>
            <span>
              <Flame /> Study streak <b>{data?.streak ?? 0} days</b>
            </span>
          </div>
        </div>
        <div className="next-focus">
          <span>
            UP NEXT <em>HIGH PRIORITY</em>
          </span>
          <div>
            <i>{next ? initials(next.subject) : "—"}</i>
            <p>
              <b>{next?.topic ?? "No planned session"}</b>
              <small>
                {next
                  ? `${next.subject} · ${next.strategy}`
                  : "Your schedule is clear"}
              </small>
            </p>
            <time>
              {next?.date ?? "—"}
              <small>{next ? `${next.durationMinutes} min` : "—"}</small>
            </time>
          </div>
          <Link href="/focus">
            <Play /> Start Focus Session
          </Link>
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="today-schedule">
          <header>
            <div>
              <span>TODAY’S PLAN</span>
              <h2>Your sessions</h2>
            </div>
            <Link href="/plan">
              View full plan <ArrowRight />
            </Link>
          </header>
          {displaySessions.map((session, index) => (
            <article
              className={`schedule-item ${status(session.status).toLowerCase().replace(" ", "-")}`}
              key={session._id}
            >
              <time>{session.time}</time>
              <i>{session.status === "done" ? <Check /> : null}</i>
              <div>
                <b>{session.topic}</b>
                <span>
                  {session.subject} · {session.strategy}
                </span>
              </div>
              <em>
                {session.durationMinutes} min
                <small>{status(session.status)}</small>
              </em>
              {index === 0 && session.status === "planned" && (
                <Link href="/focus" aria-label={`Start ${session.topic}`}>
                  <Play />
                </Link>
              )}
            </article>
          ))}
        </section>
        <aside className="dash-aside">
          <div className="exam-snapshot">
            <span>
              <CalendarDays /> UPCOMING EXAM
            </span>
            <h3>{exam?.name ?? "No upcoming exam"}</h3>
            <b>
              {exam?.daysRemaining ?? 0}
              <small>days left</small>
            </b>
            <div>
              <span>
                Readiness{" "}
                <b>{exam?.readinessScore ?? data?.readinessScore ?? 0}%</b>
              </span>
              <ProgressBar
                value={exam?.readinessScore ?? data?.readinessScore ?? 0}
              />
              <small>
                {exam?.preparedTopics ?? 0} / {exam?.totalTopics ?? 0} topics
                complete
              </small>
            </div>
          </div>
          <div className="mini-stats">
            <Stat
              label="This week"
              value={minutes(data?.weeklyGoal.completedMinutes ?? 0)}
            />
            <Stat
              label="Completion"
              value={`${data?.weeklyGoal.percentage ?? 0}%`}
            />
            <Stat label="Weak area" value={weak?.name ?? "—"} />
          </div>
        </aside>
      </div>
      <Insight title="Your plan adjusted">
        {weak
          ? `${weak.name} currently has the highest priority score in your plan.`
          : "No priority topic is currently available."}
      </Insight>
      <div className="adaptive-heading">
        <div>
          <span>QUICK ADAPTIVE ACTIONS</span>
          <h2>When your day changes</h2>
        </div>
        <RefreshCw />
      </div>
      <AdaptiveActions />
    </>
  );
}
