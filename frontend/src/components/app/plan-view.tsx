"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  CircleHelp,
  Play,
  Sparkles,
  X,
} from "lucide-react";

import { AdaptiveActions } from "./adaptive-actions";
import { PageHeader } from "./primitives";

type StudySessionStatus =
  | "planned"
  | "done"
  | "partial"
  | "missed";

interface StudySession {
  _id: string;
  date: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  strategy: string;
  priorityScore: number;
  why: string;
  status: StudySessionStatus;
  feedback: "easy" | "okay" | "difficult" | null;
}

interface StudyPlanResponse {
  success: boolean;
  plan?: {
    sessions: StudySession[];
  };
}

interface PlannerProfileResponse {
  success: boolean;
  profile?: {
    period?: string;
  };
}

interface DisplaySession {
  id: string;
  date: string;
  subject: string;
  topic: string;
  duration: string;
  durationMinutes: number;
  strategy: string;
  priority: boolean;
  priorityScore: number;
  why: string;
  status: string;
  time: string;
}

interface WeekDay {
  day: string;
  total: string;
  sessions: DisplaySession[];
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

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

function startOfToday(): Date {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
}

function getStartHour(period: string): number {
  if (period === "Morning") {
    return 8;
  }

  if (period === "Afternoon") {
    return 13;
  }

  if (period === "Evening") {
    return 17;
  }

  if (period === "Night") {
    return 20;
  }

  return 9;
}

function formatTime(minutesFromMidnight: number): string {
  const hours = Math.floor(minutesFromMidnight / 60);
  const minutes = minutesFromMidnight % 60;

  const hour12 = hours % 12 || 12;
  const suffix = hours >= 12 ? "PM" : "AM";

  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  if (minutes === 60) {
    return "1 hr";
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (remainder === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainder} min`;
}

function formatTotal(minutes: number): string {
  if (minutes === 0) {
    return "0h";
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours === 0) {
    return `${remainder}m`;
  }

  if (remainder === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainder}m`;
}

function formatStatus(status: StudySessionStatus): string {
  if (status === "done") {
    return "Done";
  }

  if (status === "partial") {
    return "Partial";
  }

  if (status === "missed") {
    return "Missed";
  }

  return "Planned";
}

function createDisplaySessions(
  sessions: StudySession[],
  period: string,
): DisplaySession[] {
  const groupedCounters = new Map<string, number>();
  const startHour = getStartHour(period);

  return sessions.map((session) => {
    const minutesAlreadyUsed =
      groupedCounters.get(session.date) ?? 0;

    const time = formatTime(
      startHour * 60 + minutesAlreadyUsed,
    );

    groupedCounters.set(
      session.date,
      minutesAlreadyUsed + session.durationMinutes,
    );

    return {
      id: session._id,
      date: session.date,
      subject: session.subject,
      topic: session.topic,
      duration: formatDuration(session.durationMinutes),
      durationMinutes: session.durationMinutes,
      strategy: session.strategy,
      priority: session.priorityScore > 0,
      priorityScore: session.priorityScore,
      why: session.why,
      status: formatStatus(session.status),
      time,
    };
  });
}

export function PlanView() {
  const [view, setView] = useState<"today" | "week">("week");
  const [why, setWhy] = useState(false);
  const [selectedSession, setSelectedSession] =
    useState<DisplaySession | null>(null);
  const [studySessions, setStudySessions] = useState<
    StudySession[]
  >([]);
  const [period, setPeriod] = useState("Flexible");
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setRefreshVersion((value) => value + 1);
    window.addEventListener("plannora:data-updated", refresh);
    return () => window.removeEventListener("plannora:data-updated", refresh);
  }, []);

  useEffect(() => {
    const loadPlan = async () => {
      const token = localStorage.getItem("plannora_token");

      if (!token) {
        console.error(
          "Study plan could not be loaded: authentication missing.",
        );
        return;
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ??
        "http://localhost:5000";

      try {
        const [planResponse, profileResponse] =
          await Promise.all([
            fetch(`${apiUrl}/api/study-plan`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
            fetch(`${apiUrl}/api/planner`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
          ]);

        if (planResponse.ok) {
          const data =
            (await planResponse.json()) as StudyPlanResponse;

          setStudySessions(data.plan?.sessions ?? []);
        } else {
          console.error(
            "Study plan could not be loaded from the server.",
          );
        }

        if (profileResponse.ok) {
          const data =
            (await profileResponse.json()) as PlannerProfileResponse;

          setPeriod(data.profile?.period ?? "Flexible");
        }
      } catch (error) {
        console.error("Study plan could not be loaded:", error);
      }
    };

    void loadPlan();
  }, [refreshVersion]);

  const displaySessions = useMemo(
    () => createDisplaySessions(studySessions, period),
    [studySessions, period],
  );

  const today = toDateOnly(startOfToday());

  const todaySessions = useMemo(
    () =>
      displaySessions.filter(
        (session) => session.date === today,
      ),
    [displaySessions, today],
  );

  const weekPlan = useMemo<WeekDay[]>(() => {
    const start = startOfToday();

    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(start, index);
      const dateString = toDateOnly(date);

      const sessions = displaySessions.filter(
        (session) => session.date === dateString,
      );

      const totalMinutes = sessions.reduce(
        (total, session) =>
          total + session.durationMinutes,
        0,
      );

      return {
        day: DAY_NAMES[date.getDay()],
        total: formatTotal(totalMinutes),
        sessions,
      };
    });
  }, [displaySessions]);

  const openWhy = (session: DisplaySession) => {
    setSelectedSession(session);
    setWhy(true);
  };

  return (
    <>
      <PageHeader
        eyebrow="EXAM PREPARATION"
        title="Your study plan"
        copy="A realistic schedule built around your subjects, priorities, and available time."
        action={
          <div className="view-switch">
            {["today", "week"].map((v) => (
              <button
                className={view === v ? "active" : ""}
                aria-pressed={view === v}
                onClick={() =>
                  setView(v as "today" | "week")
                }
                key={v}
              >
                {v}
              </button>
            ))}
          </div>
        }
      />

      <div className="plan-actions">
        <Link href="/focus">
          <Play /> Start next session
        </Link>
        <AdaptiveActions />
      </div>

      {view === "week" ? (
        <section className="week-board">
          {weekPlan.map((day) => (
            <article key={day.day}>
              <header>
                <span>{day.day.slice(0, 3)}</span>
                <b>{day.total}</b>
              </header>

              {day.sessions.length ? (
                day.sessions.map((session) => (
                  <div
                    className={`week-session ${session.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                    key={session.id}
                  >
                    <time>{session.time}</time>
                    <b>{session.topic}</b>
                    <span>{session.subject}</span>
                    <small>{session.duration}</small>

                    {session.priority && (
                      <button
                        onClick={() => openWhy(session)}
                      >
                        <CircleHelp /> Why this?
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p>Recovery & rest</p>
              )}
            </article>
          ))}
        </section>
      ) : (
        <section className="plan-today">
          {todaySessions.map((session, index) => (
            <article key={session.id}>
              <time>{session.time}</time>

              <div className="plan-line">
                <i />
              </div>

              <div>
                <span>{session.subject}</span>
                <h3>{session.topic}</h3>
                <p>
                  {session.strategy} · {session.duration}
                </p>

                {session.priority && (
                  <button
                    onClick={() => openWhy(session)}
                  >
                    <CircleHelp /> Why this?
                  </button>
                )}
              </div>

              <em>{session.status}</em>

              {index > 0 && (
                <Link href="/focus">
                  <Play /> Start
                </Link>
              )}
            </article>
          ))}
        </section>
      )}

      {why && selectedSession && (
        <div
          className="why-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="why-title"
        >
          <button
            onClick={() => setWhy(false)}
            aria-label="Close explanation"
          >
            <X />
          </button>

          <span>
            <Sparkles /> PRIORITY CONTEXT
          </span>

          <h2 id="why-title">
            Why {selectedSession.topic}?
          </h2>

          <p>
            This topic is prioritized using the setup
            information you provided:
          </p>

          <ul>
            <li>
              <CheckDot />
              {selectedSession.why}
            </li>
          </ul>

          <small>
            Priority score: {selectedSession.priorityScore}
          </small>
        </div>
      )}
    </>
  );
}

function CheckDot() {
  return (
    <i>
      <ChevronRight />
    </i>
  );
}
