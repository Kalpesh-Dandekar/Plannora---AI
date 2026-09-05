import Link from "next/link";
import { ArrowLeft, CalendarDays, Check, Sparkles, TrendingUp } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export function AuthShell({ children, register = false }: { children: React.ReactNode; register?: boolean }) {
  return <main className="auth-page"><section className="auth-story"><Link className="auth-logo" href="/"><Logo/></Link><div className="auth-story-copy"><span className="kicker">ADAPTIVE BY DESIGN</span><h1>Study plans shouldn’t break when your day does.</h1><p>Plannora keeps the structure, absorbs the changes, and helps you keep moving.</p><div className="auth-preview"><div className="auth-preview-head"><span><CalendarDays/> Today</span><span className="readiness-pill"><TrendingUp/> 72% ready</span></div><div className="auth-session"><i>DS</i><span><b>Graph Traversal</b><small>7:00 PM · High priority</small></span></div><div className="auth-adapt"><Sparkles/><span><b>Plan adapted</b><small>Missed DBMS session redistributed.</small></span><Check/></div></div></div><small className="auth-quote">PLAN · STUDY · FEEDBACK · ADAPT · REPEAT</small></section><section className="auth-form-side"><Link className="back-home" href="/"><ArrowLeft/> Back to home</Link><div className={`auth-card${register ? " register" : ""}`}>{children}</div></section></main>;
}
