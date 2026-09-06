"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  Check,
  Edit3,
  Flag,
  Layers3,
  ListChecks,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
  WandSparkles,
} from "lucide-react";

export type PlannerTopic = {
  id: number;
  name: string;
  difficulty: string;
  prep: string;
};

export type PlannerSubject = {
  id: number;
  name: string;
  topics: PlannerTopic[];
};

export type PlannerState = {
  mode: "regular" | "exam" | undefined;
  exam: { name: string; date: string };
  subjects: PlannerSubject[];
  days: Record<string, number>;
  period: string;
  session: string;
  goal: string;
  attention: string[];
  strategy: string;
};

type Nav = {
  back: () => void;
  next: () => void;
  edit: (step: number) => void;
};

const goalOptions = [
  [
    "Stay consistent",
    "Build a sustainable routine and avoid falling behind.",
    RefreshCw,
  ],
  [
    "Complete my syllabus",
    "Prioritize coverage and finish remaining topics.",
    BookOpenCheck,
  ],
  [
    "Revise everything",
    "Balance revision across subjects before your deadline.",
    Layers3,
  ],
  [
    "Be exam-ready",
    "Focus on readiness, weak areas, and high-priority topics.",
    Trophy,
  ],
] as const;

const strategies = [
  "Balanced",
  "Concept-first",
  "Practice-heavy",
  "Revision-focused",
  "Let Plannora decide",
];

export function GoalsStep({
  state,
  setGoal,
  setAttention,
  setStrategy,
  back,
  next,
}: {
  state: PlannerState;
  setGoal: (x: string) => void;
  setAttention: (x: string[]) => void;
  setStrategy: (x: string) => void;
} & Pick<Nav, "back" | "next">) {
  const toggle = (item: string) =>
    setAttention(
      state.attention.includes(item)
        ? state.attention.filter((x) => x !== item)
        : [...state.attention, item],
    );

  return (
    <div className="planner-step goals-step">
      <StepTitle
        n="04"
        title="What are you working toward?"
        copy="Tell Plannora what matters most so your study plan can reflect your priorities."
      />

      <section className="goal-block">
        <h3>What’s your main goal?</h3>

        <div className="goal-grid">
          {goalOptions.map(([title, text, Icon]) => (
            <button
              key={title}
              aria-pressed={state.goal === title}
              className={state.goal === title ? "selected" : ""}
              onClick={() => setGoal(title)}
            >
              <i>
                <Icon />
              </i>

              <span>
                <b>{title}</b>
                <small>{text}</small>
              </span>

              <em>{state.goal === title ? <Check /> : null}</em>
            </button>
          ))}
        </div>
      </section>

      <section className="attention-block">
        <div>
          <h3>Anything that needs extra attention?</h3>
          <p>
            Optional — highlight subjects or topics you especially want Plannora
            to prioritize.
          </p>
        </div>

        {state.subjects.map((s) => (
          <div className="attention-subject" key={s.id}>
            <button
              aria-pressed={state.attention.includes(s.name)}
              onClick={() => toggle(s.name)}
            >
              <BookOpenCheck />
              {s.name}
              {state.attention.includes(s.name) && <Check />}
            </button>

            <div>
              {s.topics
                .filter((t) => t.name.trim())
                .map((t) => (
                  <button
                    aria-pressed={state.attention.includes(t.name)}
                    className={
                      state.attention.includes(t.name) ? "selected" : ""
                    }
                    onClick={() => toggle(t.name)}
                    key={t.id}
                  >
                    {state.attention.includes(t.name) && <Check />}
                    {t.name}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </section>

      <section className="strategy-block">
        <h3>How should Plannora approach your study sessions?</h3>

        <div>
          {strategies.map((s) => (
            <button
              key={s}
              aria-pressed={state.strategy === s}
              className={state.strategy === s ? "selected" : ""}
              onClick={() => setStrategy(s)}
            >
              {s}
              {s === "Let Plannora decide" && <small>Recommended</small>}
            </button>
          ))}
        </div>

        <p>This will influence how study sessions are structured later.</p>
      </section>

      <div className="direction-summary">
        <span>YOUR DIRECTION</span>

        <dl>
          <div>
            <dt>Main goal</dt>
            <dd>{state.goal || "Choose a goal"}</dd>
          </div>

          <div>
            <dt>Extra attention</dt>
            <dd>
              {state.attention.length
                ? state.attention.join(", ")
                : "None selected"}
            </dd>
          </div>

          <div>
            <dt>Study approach</dt>
            <dd>{state.strategy || "Choose an approach"}</dd>
          </div>
        </dl>
      </div>

      <Actions
        back={back}
        next={next}
        label="Review My Plan"
        disabled={!state.goal || !state.strategy}
      />
    </div>
  );
}

export function ReviewStep({
  state,
  back,
  next,
  edit,
}: {
  state: PlannerState;
} & Nav) {
  const [today] = useState(() => Date.now());

  const total = Object.values(state.days).reduce((a, b) => a + b, 0);

  const daysLeft =
    state.mode === "exam" && state.exam.date
      ? Math.max(
          0,
          Math.ceil(
            (new Date(`${state.exam.date}T00:00:00`).getTime() - today) /
              86400000,
          ),
        )
      : null;

  return (
    <div className="planner-step review-step">
      <StepTitle
        n="05"
        title="Everything look right?"
        copy="Review your setup before Plannora builds your study plan."
      />

      <div className="review-grid">
        <ReviewCard title="Planning mode" icon={<Flag />} edit={() => edit(1)}>
          <strong>
            {state.mode === "exam" ? "Exam Preparation" : "Regular Study"}
          </strong>

          {state.mode === "exam" && (
            <>
              <span>{state.exam.name}</span>
              <small>{daysLeft} days remaining</small>
            </>
          )}
        </ReviewCard>

        <ReviewCard
          title="Weekly availability"
          icon={<CalendarDays />}
          edit={() => edit(3)}
          wide
        >
          <div className="week-strip">
            {Object.entries(state.days).map(([day, h]) => (
              <div className={h ? "available" : ""} key={day}>
                <span>{day.slice(0, 3).toUpperCase()}</span>
                <b>{h ? `${h}h` : "—"}</b>
              </div>
            ))}
          </div>

          <div className="review-stats">
            <span>
              <b>{total}h</b> weekly
            </span>
            <span>
              <b>{state.period}</b> preferred
            </span>
            <span>
              <b>{state.session}</b> sessions
            </span>
          </div>
        </ReviewCard>

        <ReviewCard
          title="Subjects & topics"
          icon={<BookOpenCheck />}
          edit={() => edit(2)}
          wide
        >
          {state.subjects
            .filter((s) => s.name)
            .map((s) => (
              <div className="review-subject" key={s.id}>
                <div>
                  <b>{s.name}</b>
                  <small>
                    {s.topics.filter((t) => t.name).length} topics
                  </small>
                </div>

                <div>
                  {s.topics
                    .filter((t) => t.name)
                    .slice(0, 4)
                    .map((t) => (
                      <span key={t.id}>
                        <em className={t.difficulty.toLowerCase()} />
                        {t.name}
                        <small>{t.prep}</small>
                      </span>
                    ))}
                </div>
              </div>
            ))}
        </ReviewCard>

        <ReviewCard
          title="Goal & strategy"
          icon={<Target />}
          edit={() => edit(4)}
        >
          <strong>{state.goal}</strong>
          <span>{state.strategy}</span>

          {state.attention.length > 0 && (
            <div className="review-chips">
              {state.attention.map((x) => (
                <small key={x}>{x}</small>
              ))}
            </div>
          )}
        </ReviewCard>
      </div>

      <div className="ready-panel">
        <Sparkles />

        <div>
          <b>Ready to build</b>
          <p>
            Plannora has enough information to create a realistic schedule
            around your subjects, priorities, and available time.
          </p>
        </div>
      </div>

      <Actions
        back={back}
        next={next}
        label="Generate My Plan"
      />
    </div>
  );
}

function ReviewCard({
  title,
  icon,
  edit,
  wide = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  edit: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article className={`review-card${wide ? " wide" : ""}`}>
      <header>
        <span>
          {icon}
          {title}
        </span>

        <button onClick={edit} aria-label={`Edit ${title}`}>
          <Edit3 /> Edit
        </button>
      </header>

      <div>{children}</div>
    </article>
  );
}

export function GenerateStep({
  state,
  back,
}: {
  state: PlannerState;
  back: () => void;
}) {
  const [stage, setStage] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const savePlannerProfile = async () => {
      const token = localStorage.getItem("plannora_token");

      if (!token) {
        console.error("Planner setup could not be saved: authentication missing.");
        return;
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

      try {
        const response = await fetch(`${apiUrl}/api/planner`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mode: state.mode,
            exam: state.exam,
            subjects: state.subjects.map((subject) => ({
              name: subject.name,
              topics: subject.topics.map((topic) => ({
                name: topic.name,
                difficulty: topic.difficulty,
                prep: topic.prep,
              })),
            })),
            days: state.days,
            period: state.period,
            session: state.session,
            goal: state.goal,
            attention: state.attention,
            strategy: state.strategy,
          }),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as
            | { message?: string }
            | null;

          console.error(
            `Planner setup could not be saved: ${
              data?.message ?? "Unknown server error."
            }`,
          );
        }
      } catch (error) {
        console.error("Planner setup could not be saved:", error);
      }
    };

    void savePlannerProfile();
  }, [state]);

  useEffect(() => {
    if (reduced) return;

    const timers = [1, 2, 3, 4].map((n, i) =>
      window.setTimeout(() => setStage(n), (i + 1) * 650),
    );

    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  const visibleStage = reduced ? 4 : stage;

  const sessions = useMemo(() => makePreview(state), [state]);

  const labels = [
    "Understanding priorities",
    "Balancing available time",
    "Structuring study sessions",
    "Preparing your plan",
  ];

  if (visibleStage < 4)
    return (
      <div className="planner-step generate-step" aria-live="polite">
        <div className="generation-heading">
          <span>
            <WandSparkles /> PLANNORA PREVIEW
          </span>
          <h1>Building your study plan</h1>
          <p>
            Plannora is organizing your subjects, priorities, and available time
            into a realistic schedule.
          </p>
        </div>

        <div className="generation-workspace">
          <div className="generation-stages">
            {labels.map((label, i) => (
              <div
                className={
                  visibleStage > i
                    ? "done"
                    : visibleStage === i
                      ? "active"
                      : ""
                }
                key={label}
              >
                <i>{visibleStage > i ? <Check /> : i + 1}</i>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="building-grid">
            <small>PREVIEW</small>

            {sessions.map((s, i) => (
              <div
                className={visibleStage > i ? "filled" : ""}
                key={s.day}
              >
                <span>{s.day.slice(0, 3)}</span>
                <i />

                <div>
                  <b>{s.topic}</b>
                  <small>{s.time}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  return (
    <div className="planner-step generate-step complete">
      <div className="complete-mark">
        <Check />
      </div>

      <StepTitle
        n="06"
        title="Your plan is ready."
        copy="You now have a study plan built around your available time and priorities."
      />

      <div className="plan-preview">
        <header>
          <div>
            <small>THIS WEEK</small>
            <h3>Your first study sessions</h3>
          </div>

          <span>Plan preview</span>
        </header>

        {sessions.map((s) => (
          <div className="preview-session" key={s.day}>
            <time>
              <b>{s.day.slice(0, 3)}</b>
              <span>{s.time}</span>
            </time>

            <i />

            <div>
              <b>{s.topic}</b>
              <span>{s.subject}</span>
            </div>

            <em>
              {state.session}
              <small>{state.strategy}</small>
            </em>
          </div>
        ))}
      </div>

      <div className="built-around">
        <h3>Built around you</h3>

        <div>
          <span>
            <CalendarDays />{" "}
            {Object.values(state.days).filter(Boolean).length} available study
            days
          </span>

          <span>
            <ListChecks /> {state.session} session length
          </span>

          <span>
            <Target /> {state.goal}
          </span>

          <span>
            <Sparkles /> Topic difficulty and preparation
          </span>
        </div>

        <small>
          This preview reflects your setup. Your saved plan is available on the
          Dashboard.
        </small>
      </div>

      <div className="generation-actions">
        <button onClick={back}>
          <ArrowLeft /> Review setup
        </button>

        <Link href="/dashboard">
          Go to Dashboard <ArrowRight />
        </Link>
      </div>
    </div>
  );
}

function makePreview(state: PlannerState) {
  const available = Object.entries(state.days)
    .filter(([, h]) => h > 0)
    .slice(0, 4);

  const topics = state.subjects.flatMap((s) =>
    s.topics
      .filter((t) => t.name)
      .map((t) => ({
        topic: t.name,
        subject: s.name,
      })),
  );

  return available.map(([day], i) => ({
    day,
    time: ["7:00 PM", "6:30 PM", "7:15 PM", "5:45 PM"][i],
    ...(topics[i % Math.max(topics.length, 1)] || {
      topic: "Focused review",
      subject: state.subjects[0]?.name || "Study session",
    }),
  }));
}

function useReducedMotion() {
  return useSyncExternalStore(
    (notify) => {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      media.addEventListener("change", notify);

      return () => media.removeEventListener("change", notify);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function StepTitle({
  n,
  title,
  copy,
}: {
  n: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="step-title">
      <span>STEP {n} OF 06</span>
      <h1>{title}</h1>
      <p>{copy}</p>
    </div>
  );
}

function Actions({
  back,
  next,
  label,
  disabled = false,
}: {
  back: () => void;
  next: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className="planner-actions">
      <button className="back-button" onClick={back}>
        <ArrowLeft /> Back
      </button>

      <button
        className="next-button"
        disabled={disabled}
        onClick={next}
      >
        {label}
        <ArrowRight />
      </button>
    </div>
  );
}
