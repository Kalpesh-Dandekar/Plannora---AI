"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, RefreshCw, Sparkles, X } from "lucide-react";
import { apiRequest, notifyDataUpdated } from "@/lib/api";
import type {
  ProgressResponse,
  QuickPlanResponse,
  RescueResponse,
  AiRecoveryResponse,
} from "@/lib/api-types";

export function AdaptiveActions() {
  const [modal, setModal] = useState<"rescue" | "minutes" | null>(null);
  const [rescue, setRescue] = useState<RescueResponse | null>(null);
  const [progress, setProgress] = useState<ProgressResponse["progress"] | null>(
    null,
  );
  const [quickPlan, setQuickPlan] = useState<
    QuickPlanResponse["quickPlan"] | null
  >(null);
  const [minutes, setMinutes] = useState(45);
  const [loading, setLoading] = useState(false);
  const [coach, setCoach] = useState<AiRecoveryResponse["coach"] | null>(null);

  useEffect(() => {
    if (modal !== "rescue") return;
    void apiRequest<ProgressResponse>("/api/progress")
      .then((data) => setProgress(data.progress))
      .catch((error) =>
        console.error("Recovery context could not be loaded:", error),
      );
  }, [modal]);

  useEffect(() => {
    if (
      modal !== "minutes" ||
      !Number.isInteger(minutes) ||
      minutes <= 0 ||
      minutes > 360
    )
      return;
    let current = true;
    const id = window.setTimeout(() => {
      setLoading(true);
      void apiRequest<QuickPlanResponse>("/api/study-plan/quick-replan", {
        method: "POST",
        body: JSON.stringify({ minutes }),
      })
        .then((data) => {
          if (current) setQuickPlan(data.quickPlan);
        })
        .catch((error) => {
          if (current)
            console.error("Quick replan could not be loaded:", error);
        })
        .finally(() => {
          if (current) setLoading(false);
        });
    }, 200);
    return () => {
      current = false;
      window.clearTimeout(id);
    };
  }, [minutes, modal]);

  const runRescue = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await apiRequest<RescueResponse>("/api/study-plan/rescue", {
        method: "POST",
      });
      setRescue(data);
      notifyDataUpdated();
      try {
        const coaching = await apiRequest<AiRecoveryResponse>("/api/ai/recovery-coach", { method: "POST", body: JSON.stringify(data.rescue) });
        setCoach(coaching.coach);
      } catch (error) {
        console.error("Recovery coaching could not be loaded:", error);
      }
    } catch (error) {
      console.error("Study plan rescue failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="adaptive-actions">
        <button
          onClick={() => {
            setRescue(null);
            setCoach(null);
            setModal("rescue");
          }}
        >
          <i>
            <RefreshCw />
          </i>
          <span>
            <b>Rescue My Plan</b>
            <small>Rebuild after falling behind</small>
          </span>
        </button>
        <button
          onClick={() => {
            setQuickPlan(null);
            setModal("minutes");
          }}
        >
          <i>
            <Clock3 />
          </i>
          <span>
            <b>I Only Have X Minutes</b>
            <small>Make limited time count</small>
          </span>
        </button>
      </div>
      {modal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setModal(null)
          }
        >
          <section
            className="action-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <button
              className="modal-close"
              onClick={() => setModal(null)}
              aria-label="Close"
            >
              <X />
            </button>
            {modal === "rescue" ? (
              <>
                {rescue ? (
                  <div className="modal-success">
                    <i>
                      <Check />
                    </i>
                    <span>
                      <Sparkles /> PLAN UPDATED
                    </span>
                    <h2 id="modal-title">Your recovery plan is ready.</h2>
                    <p>{coach?.summary ?? rescue.message}</p>
                    {coach && <p>{coach.priority} {coach.nextStep} {coach.warning}</p>}
                    <button onClick={() => setModal(null)}>Done</button>
                  </div>
                ) : (
                  <>
                    <span className="modal-kicker">
                      <RefreshCw /> ADAPTIVE ACTION
                    </span>
                    <h2 id="modal-title">Rescue My Plan</h2>
                    <p>
                      Rebuild the remaining schedule around what matters most.
                    </p>
                    <div className="rescue-context">
                      <div>
                        <span>Behind by</span>
                        <b>
                          {(progress?.missedSessions ?? 0) +
                            (progress?.partialSessions ?? 0)}{" "}
                          sessions
                        </b>
                      </div>
                      <div>
                        <span>Remaining study time</span>
                        <b>
                          {Math.max(
                            0,
                            (progress?.plannedMinutes ?? 0) -
                              (progress?.completedMinutes ?? 0),
                          )}{" "}
                          min
                        </b>
                      </div>
                      <section>
                        <span>High-priority topics</span>
                        <div>
                          {progress?.weakAreas.map((topic) => (
                            <i key={`${topic.subject}-${topic.name}`}>
                              {topic.name}
                            </i>
                          ))}
                        </div>
                      </section>
                    </div>
                    <button
                      className="modal-primary"
                      disabled={loading}
                      onClick={() => void runRescue()}
                    >
                      {loading ? "Rebuilding..." : "Rebuild My Remaining Plan"}
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="modal-kicker">
                  <Clock3 /> QUICK SESSION
                </span>
                <h2 id="modal-title">I only have...</h2>
                <p>
                  Choose the time you have. Plannora will surface one high-value
                  session.
                </p>
                <div className="minute-select">
                  {[30, 45, 60].map((value) => (
                    <button
                      aria-pressed={minutes === value}
                      className={minutes === value ? "active" : ""}
                      onClick={() => setMinutes(value)}
                      key={value}
                    >
                      {value} min
                    </button>
                  ))}
                  <label>
                    Custom
                    <input
                      type="number"
                      min="1"
                      max="360"
                      value={minutes}
                      onChange={(event) =>
                        setMinutes(Number(event.target.value))
                      }
                    />
                  </label>
                </div>
                <div className="quick-preview">
                  <span>BEST USE OF {minutes} MINUTES</span>
                  <h3>
                    {quickPlan?.sessions[0]?.topic ??
                      (loading ? "Loading..." : "No planned work available")}
                  </h3>
                  <p>{quickPlan?.sessions[0]?.subject ?? "—"}</p>
                  {quickPlan?.sessions.map((session) => (
                    <div key={`${session.subject}-${session.topic}`}>
                      <b>{session.durationMinutes} min</b> {session.strategy}
                    </div>
                  ))}
                  <small>
                    {quickPlan
                      ? `${quickPlan.allocatedMinutes} min allocated · ${quickPlan.remainingMinutes} min remaining`
                      : "Lower-priority work will be redistributed later."}
                  </small>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
