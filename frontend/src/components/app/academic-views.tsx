"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  CircleHelp,
  Play,
  Target,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import type {
  ExamsResponse,
  AiExamStrategyResponse,
  AiInsightsResponse,
  ProgressResponse,
  SubjectProgress,
  SubjectsResponse,
} from "@/lib/api-types";
import { Insight, PageHeader, ProgressBar, Stat } from "./primitives";

function short(name: string) {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
function topicStatus(topic: SubjectProgress["topics"][number]) {
  return topic.progressPercentage >= 100
    ? "Completed"
    : topic.partialSessions > 0
      ? "In progress"
      : topic.plannedSessions > 0
        ? "Scheduled"
        : "Upcoming";
}
function formatMinutes(value: number) {
  const hours = Math.floor(value / 60),
    minutes = value % 60;
  return hours ? `${hours}h${minutes ? ` ${minutes}m` : ""}` : `${minutes}m`;
}
function formatDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}
function dayLabel(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(
    new Date(year, month - 1, day),
  );
}

export function SubjectsView() {
  const [subjects, setSubjects] = useState<SubjectProgress[]>([]);
  const [open, setOpen] = useState("");
  useEffect(() => {
    void apiRequest<SubjectsResponse>("/api/subjects")
      .then((data) => {
        setSubjects(data.subjects);
        setOpen((current) => current || data.subjects[0]?.name || "");
      })
      .catch((error) => console.error("Subjects could not be loaded:", error));
  }, []);
  return (
    <>
      <PageHeader
        eyebrow="ACADEMIC OVERVIEW"
        title="Subjects"
        copy="See where you stand across every topic."
      />
      <div className="subject-overview">
        {subjects.map((s) => {
          const ranked = [...s.topics].sort(
            (a, b) => b.currentPriorityScore - a.currentPriorityScore,
          );
          const weak = [...s.topics].sort(
            (a, b) => a.progressPercentage - b.progressPercentage,
          )[0];
          return (
            <article className={open === s.name ? "open" : ""} key={s.name}>
              <button
                onClick={() => setOpen(open === s.name ? "" : s.name)}
                aria-expanded={open === s.name}
              >
                <i>{short(s.name)}</i>
                <span>
                  <b>{s.name}</b>
                  <small>
                    {s.completedSessions} / {s.plannedSessions} sessions
                  </small>
                </span>
                <strong>{s.progressPercentage}%</strong>
                <ChevronDown />
              </button>
              <ProgressBar value={s.progressPercentage} />
              <div className="subject-glance">
                <span>
                  Next <b>{ranked[0]?.name ?? "—"}</b>
                </span>
                <span>
                  Weak area <b>{weak?.name ?? "—"}</b>
                </span>
              </div>
              {open === s.name && (
                <section className="topic-details">
                  {s.topics.map((t) => (
                    <article key={t.name}>
                      <div>
                        <b>{t.name}</b>
                        <span>{topicStatus(t)}</span>
                      </div>
                      <em className={t.difficulty.toLowerCase()}>
                        {t.difficulty}
                      </em>
                      <span>{t.preparationLevel}</span>
                      <nav>
                        <button
                          title={`Priority score: ${t.currentPriorityScore}`}
                        >
                          <CircleHelp /> Why This?
                        </button>
                        <Link href="/plan">View in Plan</Link>
                        <Link href="/focus">
                          <Play /> Start Focus
                        </Link>
                      </nav>
                    </article>
                  ))}
                </section>
              )}
            </article>
          );
        })}
      </div>
      <section className="needs-attention">
        <Target />
        <div>
          <span>NEEDS MORE ATTENTION</span>
          <h2>Weak areas worth revisiting</h2>
        </div>
        {subjects
          .flatMap((subject) =>
            subject.topics.map((topic) => ({
              subject: subject.name,
              ...topic,
            })),
          )
          .sort((a, b) => a.progressPercentage - b.progressPercentage)
          .slice(0, 2)
          .map((topic) => (
            <p key={`${topic.subject}-${topic.name}`}>
              <b>{topic.name}</b> ·{" "}
              {topic.missedSessions
                ? "missed work"
                : topic.preparationLevel.toLowerCase()}
            </p>
          ))}
      </section>
    </>
  );
}

export function ExamsView() {
  const [exam, setExam] = useState<ExamsResponse["exam"]>(null);
  const [subjects, setSubjects] = useState<SubjectProgress[]>([]);
  const [aiStrategy, setAiStrategy] = useState<AiExamStrategyResponse["strategy"] | null>(null);
  const requestedAi = useRef(false);
  useEffect(() => {
    void Promise.all([
      apiRequest<ExamsResponse>("/api/exams"),
      apiRequest<SubjectsResponse>("/api/subjects"),
    ])
      .then(([examData, subjectData]) => {
        setExam(examData.exam);
        setSubjects(subjectData.subjects);
      })
      .catch((error) => console.error("Exam data could not be loaded:", error));
  }, []);
  useEffect(() => {
    if (requestedAi.current) return;
    requestedAi.current = true;
    void apiRequest<AiExamStrategyResponse>("/api/ai/exam-strategy")
      .then((data) => setAiStrategy(data.strategy))
      .catch((error) => console.error("Exam strategy could not be loaded:", error));
  }, []);
  const coverage = exam?.totalTopics
    ? Math.round((exam.preparedTopics / exam.totalTopics) * 100)
    : 0;
  const completion = exam?.plannedStudyMinutes
    ? Math.round((exam.completedStudyMinutes / exam.plannedStudyMinutes) * 100)
    : 0;
  const remaining = exam?.totalTopics
    ? Math.round((exam.remainingTopics / exam.totalTopics) * 100)
    : 0;
  return (
    <>
      <PageHeader
        eyebrow="DEADLINES & READINESS"
        title="Exams"
        copy="Track deadlines, syllabus progress, and readiness."
      />
      <section className="exam-hero">
        <div>
          <span>UPCOMING EXAM</span>
          <h2>{exam?.name ?? "No upcoming exam"}</h2>
          <p>{exam ? formatDateOnly(exam.date) : "—"}</p>
          <strong>
            {exam?.daysRemaining ?? 0}
            <small>days remaining</small>
          </strong>
        </div>
        <div
          className="readiness-ring"
          style={
            {
              "--score": `${(exam?.readinessScore ?? 0) * 3.6}deg`,
            } as React.CSSProperties
          }
        >
          <span>
            <b>{exam?.readinessScore ?? 0}%</b>
            <small>ready</small>
          </span>
        </div>
        <div className="exam-metrics">
          <span>
            Syllabus{" "}
            <b>
              {exam?.preparedTopics ?? 0} / {exam?.totalTopics ?? 0}
            </b>
          </span>
          <span>
            Remaining workload{" "}
            <b>
              {formatMinutes(
                Math.max(
                  0,
                  (exam?.plannedStudyMinutes ?? 0) -
                    (exam?.completedStudyMinutes ?? 0),
                ),
              )}
            </b>
          </span>
          <ProgressBar value={exam?.readinessScore ?? 0} />
        </div>
      </section>
      <div className="exam-breakdown">
        <section>
          <h2>Readiness breakdown</h2>
          {[
            ["Coverage", coverage],
            ["Revision", completion],
            ["Practice", exam?.readinessScore ?? 0],
            ["Remaining workload", remaining],
          ].map(([label, value]) => (
            <div key={label}>
              <span>
                {label}
                <b>{value}%</b>
              </span>
              <ProgressBar value={value as number} />
            </div>
          ))}
        </section>
        <section>
          <h2>Topics in focus</h2>
          {aiStrategy && <p>{aiStrategy.summary} {aiStrategy.dailyApproach}</p>}
          {subjects
            .flatMap((subject) => subject.topics)
            .sort((a, b) => b.currentPriorityScore - a.currentPriorityScore)
            .slice(0, 5)
            .map((topic) => (
              <article key={topic.name}>
                <i className={topic.difficulty.toLowerCase()} />
                <span>
                  <b>{topic.name}</b>
                  <small>{topic.preparationLevel}</small>
                </span>
                <em>{topic.currentPriorityScore >= 80 ? "High" : "Medium"}</em>
              </article>
            ))}
        </section>
      </div>
    </>
  );
}

export function ProgressView() {
  const [progress, setProgress] = useState<ProgressResponse["progress"] | null>(
    null,
  );
  const [aiInsights, setAiInsights] = useState<AiInsightsResponse["insights"] | null>(null);
  const requestedAi = useRef(false);
  useEffect(() => {
    void apiRequest<ProgressResponse>("/api/progress")
      .then((data) => setProgress(data.progress))
      .catch((error) => console.error("Progress could not be loaded:", error));
  }, []);
  useEffect(() => {
    if (requestedAi.current) return;
    requestedAi.current = true;
    void apiRequest<AiInsightsResponse>("/api/ai/insights")
      .then((data) => setAiInsights(data.insights))
      .catch((error) => console.error("Study insights could not be loaded:", error));
  }, []);
  const week = progress?.weeklyProgress ?? [];
  const maxMinutes = Math.max(1, ...week.map((day) => day.plannedMinutes));
  const weak = progress?.weakAreas ?? [];
  const planned = week.reduce((total, day) => total + day.plannedMinutes, 0);
  const completed = week.reduce((total, day) => total + day.completedMinutes, 0);
  const completionRate = planned ? Math.round((completed / planned) * 100) : 0;
  return (
    <>
      <PageHeader
        eyebrow="THE LAST 7 DAYS"
        title="Progress & Insights"
        copy="See what you planned, what you completed, and where to focus next."
      />
      <div className="metric-row">
        <Stat label="Planned" value={formatMinutes(planned)} note="This week" />
        <Stat
          label="Completed"
          value={formatMinutes(completed)}
          note={`${formatMinutes(Math.max(0, planned - completed))} remaining`}
        />
        <Stat
          label="Completion rate"
          value={`${completionRate}%`}
          note="Steady pace"
        />
        <Stat
          label="Study streak"
          value={`${progress?.streak ?? 0} days`}
          note="Keep it sustainable"
        />
      </div>
      <section className="progress-layout">
        <div className="bar-chart">
          <header>
            <div>
              <span>PLANNED VS COMPLETED</span>
              <h2>Your study rhythm</h2>
            </div>
            <i>Minutes</i>
          </header>
          <div className="chart-bars">
            {week.map((day) => (
              <div key={day.date}>
                <section>
                  <i
                    style={{
                      height: `${(day.plannedMinutes / maxMinutes) * 110}px`,
                    }}
                  />
                  <b
                    style={{
                      height: `${(day.completedMinutes / maxMinutes) * 110}px`,
                    }}
                  />
                </section>
                <span>{dayLabel(day.date)}</span>
              </div>
            ))}
          </div>
          <footer>
            <span>
              <i /> Planned
            </span>
            <span>
              <b /> Completed
            </span>
          </footer>
        </div>
        <div className="subject-progress">
          <h2>Subject progress</h2>
          {(progress?.subjectProgress ?? []).map((subject) => (
            <div key={subject.name}>
              <span>
                {subject.name}
                <b>{subject.progressPercentage}%</b>
              </span>
              <ProgressBar value={subject.progressPercentage} />
              <small>
                {subject.completedSessions} of {subject.plannedSessions}{" "}
                sessions
              </small>
            </div>
          ))}
        </div>
      </section>
      <div className="consistency">
        <span>STUDY CONSISTENCY</span>
        <div>
          {week.map((day, index) => (
            <i
              className={
                day.percentage > 75
                  ? "strong"
                  : day.percentage > 50
                    ? "medium"
                    : "light"
              }
              key={day.date}
            >
              <b>{dayLabel(day.date)}</b>
              <small>{day.completedMinutes}m</small>
              {index < week.length - 1 && <em />}
            </i>
          ))}
        </div>
      </div>
      <Insight title="A useful pattern">
        {aiInsights?.summary ?? (progress?.strongerAreas[0]
          ? `${progress.strongerAreas[0].name} is currently your strongest measured topic.`
          : "Complete sessions to reveal a useful pattern.")}
      </Insight>
      <section className="weak-list">
        <h2>Needs attention</h2>
        {aiInsights?.observations.map((observation) => (
          <article key={`${observation.type}-${observation.title}`}>
            <Target /><span><b>{observation.title}</b><small>{observation.detail}</small></span><ArrowRight />
          </article>
        ))}
        {weak.map((topic) => (
          <article key={`${topic.subject}-${topic.name}`}>
            <Target />
            <span>
              <b>{topic.name}</b>
              <small>
                {topic.preparationLevel} · {topic.progressPercentage}%
                completion
              </small>
            </span>
            <ArrowRight />
          </article>
        ))}
      </section>
    </>
  );
}
