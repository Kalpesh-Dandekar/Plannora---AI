"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, LogOut, Save, UserRound } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { AccountResponse, PlannerResponse } from "@/lib/api-types";
import { PageHeader } from "./primitives";
export function SettingsView() {
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [period, setPeriod] = useState("Evening"),
    [session, setSession] = useState("45"),
    [approach, setApproach] = useState("Balanced"),
    [mode, setMode] = useState("Exam"),
    [monday, setMonday] = useState(true),
    [saved, setSaved] = useState(false),
    [saving, setSaving] = useState(false);
  useEffect(() => {
    void Promise.all([
      apiRequest<AccountResponse>("/api/account"),
      apiRequest<PlannerResponse>("/api/planner"),
    ])
      .then(([account, planner]) => {
        setName(account.account.name);
        setEmail(account.account.email);
        setPeriod(planner.profile?.period ?? "Evening");
        setSession((planner.profile?.session ?? "45 min").replace(" min", ""));
        setApproach(planner.profile?.strategy ?? "Balanced");
        setMode(
          (planner.profile?.mode ?? account.account.mode) === "exam"
            ? "Exam"
            : "Regular",
        );
      })
      .catch((error) => console.error("Settings could not be loaded:", error));
  }, []);
  const save = async () => {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    try {
      const data = await apiRequest<AccountResponse>("/api/account", {
        method: "PATCH",
        body: JSON.stringify({ name, email }),
      });
      setName(data.account.name);
      setEmail(data.account.email);
      const stored = localStorage.getItem("plannora_user");
      const current: Record<string, unknown> = stored
        ? (JSON.parse(stored) as Record<string, unknown>)
        : {};
      localStorage.setItem(
        "plannora_user",
        JSON.stringify({
          ...current,
          name: data.account.name,
          email: data.account.email,
        }),
      );
      window.dispatchEvent(new Event("plannora:user-updated"));
      setSaved(true);
    } catch (error) {
      console.error("Account could not be updated:", error);
    } finally {
      setSaving(false);
    }
  };
  const group = (
    label: string,
    values: string[],
    value: string,
    set: (next: string) => void,
  ) => (
    <fieldset className="settings-choice">
      <legend>{label}</legend>
      <div>
        {values.map((item) => (
          <button
            type="button"
            aria-pressed={value === item}
            className={value === item ? "active" : ""}
            onClick={() => set(item)}
            key={item}
          >
            {value === item && <Check />}
            {item}
          </button>
        ))}
      </div>
    </fieldset>
  );
  return (
    <>
      <PageHeader
        eyebrow="YOUR PLANNORA"
        title="Settings"
        copy="Keep your profile and study preferences aligned with how you work."
      />
      <div className="settings-layout">
        <section className="settings-card">
          <header>
            <UserRound />
            <div>
              <h2>Profile</h2>
              <p>Your account details.</p>
            </div>
          </header>
          <div className="settings-fields">
            <label>
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
          </div>
        </section>
        <section className="settings-card">
          <header>
            <Save />
            <div>
              <h2>Study preferences</h2>
              <p>Defaults for future plans and sessions.</p>
            </div>
          </header>
          {group(
            "Preferred study period",
            ["Morning", "Afternoon", "Evening", "Night", "Flexible"],
            period,
            setPeriod,
          )}
          {group(
            "Typical session",
            ["25", "45", "60", "Let Plannora decide"],
            session,
            setSession,
          )}
          {group(
            "Study approach",
            [
              "Balanced",
              "Concept-first",
              "Practice-heavy",
              "Revision-focused",
              "Let Plannora decide",
            ],
            approach,
            setApproach,
          )}
        </section>
        <section className="settings-card">
          <header>
            <Save />
            <div>
              <h2>Planner defaults</h2>
              <p>Simple defaults for new plans.</p>
            </div>
          </header>
          {group("Default planning mode", ["Regular", "Exam"], mode, setMode)}
          <label className="toggle-row">
            <span>
              <b>Week starts Monday</b>
              <small>Use Monday as the first day in plan views.</small>
            </span>
            <button
              role="switch"
              aria-checked={monday}
              className={monday ? "active" : ""}
              onClick={() => setMonday((value) => !value)}
            >
              <i />
            </button>
          </label>
        </section>
        <div className="settings-actions">
          <button disabled={saving} onClick={() => void save()}>
            <Save />
            Save changes
          </button>
          {saved && (
            <span>
              <Check />
              Account changes saved
            </span>
          )}
        </div>
        <section className="account-row">
          <div>
            <h2>Account</h2>
            <p>Your authenticated Plannora account.</p>
          </div>
          <Link href="/">
            <LogOut />
            Log out
          </Link>
        </section>
      </div>
    </>
  );
}
