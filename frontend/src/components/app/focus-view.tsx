"use client";

import {
  type CSSProperties,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Check,
  Pause,
  Play,
  RotateCcw,
  Square,
  Target,
} from "lucide-react";

import { PageHeader } from "./primitives";

type SessionStatus = "done" | "partial" | "missed";
type SessionFeedback = "easy" | "okay" | "difficult";

interface StudySession {
  _id: string;
  date: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  strategy: string;
  priorityScore: number;
  why: string;
  status: "planned" | SessionStatus;
  feedback: SessionFeedback | null;
}

interface StudyPlanResponse {
  success: boolean;
  plan?: {
    sessions: StudySession[];
  };
}

interface SessionUpdateResponse {
  success: boolean;
  message?: string;
  adaptation?: {
    priorityAdjustment: number;
    reason: string;
  };
  rescheduling?: {
    rescheduled: boolean;
    reason?: string;
  };
}

function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatSubject(subject: string): string {
  return subject.toUpperCase();
}

function formatStrategy(
  strategy: string,
  durationMinutes: number,
): string {
  return `${strategy} · ${durationMinutes} minutes`;
}

export function FocusView() {
  const [session, setSession] = useState<StudySession | null>(null);
  const [left, setLeft] = useState(2700);
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState(false);
  const [status, setStatus] = useState("");
  const [feel, setFeel] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      const token = localStorage.getItem("plannora_token");

      if (!token) {
        return;
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ??
        "http://localhost:5000";

      try {
        const response = await fetch(
          `${apiUrl}/api/study-plan`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          return;
        }

        const data =
          (await response.json()) as StudyPlanResponse;

        const sessions = data.plan?.sessions ?? [];
        const today = toDateOnly(new Date());

        const nextSession =
          sessions.find(
            (item) =>
              item.date === today &&
              item.status === "planned",
          ) ??
          sessions.find((item) => item.status === "planned") ??
          null;

        if (!nextSession) {
          return;
        }

        setSession(nextSession);
        setLeft(nextSession.durationMinutes * 60);
      } catch (error) {
        console.error(
          "Unable to load focus session:",
          error,
        );
      }
    };

    void loadSession();
  }, []);

  useEffect(() => {
    if (!running || left <= 0) {
      return;
    }

    const id = window.setInterval(() => {
      setLeft((value) => {
        const next = Math.max(0, value - 1);

        if (next === 0) {
          setRunning(false);
          setFeedback(true);
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [running, left]);

  const totalSeconds = useMemo(
    () => (session?.durationMinutes ?? 45) * 60,
    [session],
  );

  const pct =
    totalSeconds > 0
      ? ((totalSeconds - left) / totalSeconds) * 100
      : 0;

  const display = `${String(
    Math.floor(left / 60),
  ).padStart(2, "0")}:${String(left % 60).padStart(
    2,
    "0",
  )}`;

  useEffect(() => {
    if (
      !session ||
      !status ||
      !feel ||
      saved ||
      saving
    ) {
      return;
    }

    const saveFeedback = async () => {
      const token = localStorage.getItem("plannora_token");

      if (!token) {
        return;
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ??
        "http://localhost:5000";

      setSaving(true);

      try {
        const response = await fetch(
          `${apiUrl}/api/sessions/${session._id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              status: status.toLowerCase() as SessionStatus,
              feedback:
                feel.toLowerCase() as SessionFeedback,
            }),
          },
        );

        const data =
          (await response.json()) as SessionUpdateResponse;

        if (!response.ok || !data.success) {
          console.error(
            data.message ??
              "Unable to save session feedback.",
          );
          return;
        }

        setSaved(true);
      } catch (error) {
        console.error(
          "Unable to save session feedback:",
          error,
        );
      } finally {
        setSaving(false);
      }
    };

    void saveFeedback();
  }, [feel, saved, saving, session, status]);

  const resetTimer = () => {
    setRunning(false);
    setLeft(totalSeconds);
  };

  return (
    <>
      <PageHeader
        eyebrow="CURRENT SESSION"
        title="Focus"
        copy="One task. One session. No clutter."
      />

      <section className="focus-room">
        <div className="focus-topic">
          <span>
            {session
              ? formatSubject(session.subject)
              : "DATA STRUCTURES"}
          </span>

          <h2>{session?.topic ?? "Graph Traversal"}</h2>

          <p>
            {session
              ? formatStrategy(
                  session.strategy,
                  session.durationMinutes,
                )
              : "Concept + Practice · 45 minutes"}
          </p>
        </div>

        <div
          className="focus-dial"
          style={
            {
              "--timer": `${pct * 3.6}deg`,
            } as CSSProperties
          }
        >
          <div>
            <b>{display}</b>
            <span>
              {running
                ? "Stay with it"
                : "Ready when you are"}
            </span>
          </div>
        </div>

        <div className="timer-controls">
          <button
            onClick={() => setRunning((value) => !value)}
          >
            {running ? <Pause /> : <Play />}
            {running
              ? "Pause"
              : left < totalSeconds
                ? "Resume"
                : "Start"}
          </button>

          <button onClick={resetTimer}>
            <RotateCcw />
            Reset
          </button>

          <button
            onClick={() => {
              setRunning(false);
              setFeedback(true);
            }}
          >
            <Square />
            End session
          </button>
        </div>

        <small>
          Timer runs locally; your result is saved when you end the session.
        </small>
      </section>

      {feedback && (
        <section className="feedback-card">
          <span>
            <Target /> SESSION REFLECTION
          </span>

          <h2>How did it go?</h2>

          <div className="feedback-group">
            <p>Task status</p>

            {["Done", "Partial", "Missed"].map((item) => (
              <button
                aria-pressed={status === item}
                className={
                  status === item ? "active" : ""
                }
                onClick={() => {
                  setStatus(item);
                  setSaved(false);
                }}
                key={item}
              >
                {status === item && <Check />}
                {item}
              </button>
            ))}
          </div>

          <div className="feedback-group">
            <p>How did it feel?</p>

            {["Easy", "Okay", "Difficult"].map((item) => (
              <button
                aria-pressed={feel === item}
                className={feel === item ? "active" : ""}
                onClick={() => {
                  setFeel(item);
                  setSaved(false);
                }}
                key={item}
              >
                {feel === item && <Check />}
                {item}
              </button>
            ))}
          </div>

          {status && feel && (
            <div className="feedback-confirm">
              <Check />

              <div>
                <b>
                  {saving
                    ? "Saving your feedback."
                    : saved
                      ? "Feedback saved."
                      : "Feedback ready to save."}
                </b>

                <p>
                  Plannora will use this feedback to adjust
                  future sessions.
                  {status === "Partial" &&
                    feel === "Difficult" &&
                    " This topic may receive more time in your next plan."}
                </p>
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}
