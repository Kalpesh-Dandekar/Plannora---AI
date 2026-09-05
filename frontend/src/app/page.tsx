import Link from "next/link";
import { ArrowRight, CalendarDays, Check, ChevronRight, CircleHelp, Clock3, Menu, RefreshCw, ShieldCheck, Sparkles, Target, TimerReset, TrendingUp, WandSparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const Button = ({ children, quiet = false, href = "/planner" }: { children: React.ReactNode; quiet?: boolean; href?: string }) => <Link className={`button${quiet ? " quiet" : ""}`} href={href}>{children}</Link>;
const SectionHead = ({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) => <div className="section-head"><span className="kicker">{eyebrow}</span><h2>{title}</h2>{copy && <p>{copy}</p>}</div>;

function PlanList({ large = false }: { large?: boolean }) {
  return <div className={`plan-list${large ? " large" : ""}`}>
    <div className="plan-row done"><i><Check size={12}/></i><span><b>DBMS Revision</b><small>Completed · 35 min</small></span><time>5:30 PM</time></div>
    <div className="plan-row active"><i/><span><b>Graph Traversal</b><small>Practice · High priority</small></span><time>7:00 PM</time></div>
    <div className="plan-row"><i/><span><b>Operating Systems</b><small>Review · 30 min</small></span><time>8:10 PM</time></div>
    <div className="plan-row"><i/><span><b>Quick Recall</b><small>Active recall · 15 min</small></span><time>9:00 PM</time></div>
  </div>;
}

function Ring({ value = 78 }: { value?: number }) { return <div className="ring" style={{"--value": `${value * 3.6}deg`} as React.CSSProperties}><span><b>{value}</b>%<small>ready</small></span></div>; }

function HeroPreview() {
  return <div className="hero-visual" aria-label="Static preview of the Plannora study dashboard">
    <div className="float-card score-float"><small>EXAM READINESS</small><b>78%</b><span>↑ 6% this week</span></div>
    <div className="app-window">
      <aside><Logo/><nav><span className="selected"><CalendarDays/>Today</span><span><Clock3/>Schedule</span><span><Target/>Progress</span></nav><div className="avatar">AM</div></aside>
      <div className="app-content"><div className="app-greeting"><div><small>MONDAY, 08 SEPTEMBER</small><h3>Good morning, Alex.</h3><p>You’re making steady progress.</p></div><Ring/></div>
        <div className="next-session"><div className="micro-title"><span>UP NEXT</span><em>High priority</em></div><div className="session-info"><div className="subject">DS</div><span><b>Graph Traversal</b><small>Data Structures · Practice</small></span><time>7:00 – 7:50 PM</time></div><button>Start session <ArrowRight/></button></div>
        <div className="micro-title plan-title"><span>TODAY’S PLAN</span><small>2 of 4</small></div><PlanList/>
        <div className="ai-note"><Sparkles/><span>Plan adapted 2 min ago</span><i/></div>
      </div>
    </div>
    <div className="float-card adapted-float"><small><Sparkles/> PLAN ADAPTED</small><b>Missed session redistributed</b><span>Nothing important gets lost.</span></div>
  </div>;
}

const features = [
  { cls:"adaptive", icon:<RefreshCw/>, title:"Adaptive Study Engine", text:"Your timetable evolves with your progress.", visual:<div className="schedule-shift"><span><i/>Probability <del>Tue</del><b>Wed</b></span><span><i/>Graph traversal <del>Wed</del><b>Today</b></span><small><Sparkles/> Reshaped around yesterday’s feedback</small></div> },
  { cls:"readiness", icon:<TrendingUp/>, title:"Exam Readiness", text:"Know how prepared you actually are.", visual:<div className="readiness-visual"><Ring value={72}/><div><span>Data Structures</span><b>Strong momentum</b><small>3 days to exam</small></div></div> },
  { cls:"rescue", icon:<TimerReset/>, title:"Rescue My Plan", text:"Fallen behind? Rebuild around what still matters.", visual:<div className="recovery"><span>Missed</span><i/><i/><i/><b>Recovered</b><small>4 sessions balanced across 3 days</small></div> },
  { cls:"minutes", icon:<Clock3/>, title:"I Only Have X Minutes", text:"Turn whatever time you have into the highest-value study session.", visual:<div className="minute-pills"><span>30</span><b>45</b><span>60</span><small>Graph Traversal · 35 min + recall · 10 min</small></div> },
  { cls:"why", icon:<CircleHelp/>, title:"Why This?", text:"Understand exactly why a topic was prioritized.", visual:<div className="why-pop"><Sparkles/><span><b>Moved up because</b><small>You marked it difficult yesterday and your exam is in 3 days.</small></span></div> },
  { cls:"modes", icon:<CalendarDays/>, title:"Regular + Exam Modes", text:"Build for everyday consistency or deadline-driven preparation.", visual:<div className="mode-switch"><b>Regular study</b><span>Exam preparation</span><small>Balanced weekly rhythm</small></div> },
];

export default function Home() {
  return <main>
    <header className="site-header"><div className="nav-wrap"><Link href="/" aria-label="Plannora home"><Logo/></Link><nav className="desktop-nav" aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#features">Features</a><a href="#why">Why Plannora</a></nav><Link className="login-link" href="/login">Log in</Link><Button href="/register">Build My Plan <ArrowRight/></Button><details className="mobile-menu"><summary aria-label="Open navigation"><Menu/></summary><nav><a href="#how-it-works">How it works</a><a href="#features">Features</a><a href="#why">Why Plannora</a><Link href="/login">Log in</Link><Button href="/register">Build My Plan</Button></nav></details></div></header>

    <section className="hero"><div className="hero-grid"><div className="hero-copy"><span className="eyebrow"><Sparkles/> Adaptive AI Study Planning</span><h1>Your study plan should <em>adapt</em> when life does.</h1><p>Plannora turns your subjects, exams, available time, and progress into a realistic study plan — then adapts when your day changes.</p><div className="hero-actions"><Button href="/register">Build My Study Plan <ArrowRight/></Button><Button quiet href="#how-it-works">See how it works</Button></div><div className="assurances"><span><Check/> Built around your actual time</span><span><Check/> Adapts as you study</span></div></div><HeroPreview/></div></section>

    <section className="value-strip" aria-label="Product principles"><div><span>01</span><b>Realistic</b><p>Plans around the time you actually have.</p></div><div><span>02</span><b>Adaptive</b><p>Missed a session? Your schedule adjusts.</p></div><div><span>03</span><b>Explainable</b><p>Know why every topic is prioritized.</p></div></section>

    <section className="problem section"><div className="two-col"><SectionHead eyebrow="A better premise" title="Plans fail. Students don’t." copy="Traditional timetables assume every day goes perfectly. Plannora treats change as part of the plan."/><div className="comparison"><div className="old-flow"><small>TRADITIONAL PLAN</small><span>Plan</span><ChevronRight/><span>Miss session</span><ChevronRight/><strong>Falls behind</strong></div><div className="new-flow"><small>PLANNORA</small><span>Plan</span><ChevronRight/><span>Study</span><ChevronRight/><span>Life changes</span><ChevronRight/><b>Adapt</b><ChevronRight/><strong>Continue</strong></div></div></div></section>

    <section className="loop-section section" id="how-it-works"><SectionHead eyebrow="The adaptive loop" title="A plan that learns from your progress." copy="Every study session makes the next plan more useful, more realistic, and more yours."/><div className="loop-path">{[
      ["01","Plan","Build around your real availability."],["02","Study","Follow focused, manageable sessions."],["03","Feedback","Completed, partial or missed. Easy, okay or difficult."],["04","Adapt","Plannora intelligently reshapes what comes next."],
    ].map(([n,t,d],i)=><div className="loop-step" key={t}><span>{n}</span><div className="loop-icon">{i===0?<CalendarDays/>:i===1?<Target/>:i===2?<Check/>:<RefreshCw/>}</div><h3>{t}</h3><p>{d}</p>{i<3&&<ArrowRight className="connector"/>}</div>)}<div className="repeat"><RefreshCw/> Repeat, a little smarter</div></div></section>

    <section className="features section" id="features"><SectionHead eyebrow="Built for real study" title="Not just a timetable. A thinking layer." copy="The parts of planning that usually demand willpower become flexible, visible, and easier to act on."/><div className="bento">{features.map(f=><article className={`feature-card ${f.cls}`} key={f.title}><div className="feature-copy"><span>{f.icon}</span><div><h3>{f.title}</h3><p>{f.text}</p></div></div>{f.visual}</article>)}</div></section>

    <section className="daily section"><div className="daily-grid"><div><SectionHead eyebrow="Your daily home base" title="Know exactly what matters today." copy="Open Plannora and move. No timetable archaeology, no guilt spiral, no deciding what to study next."/><div className="insight"><Sparkles/><p><b>Why Graph Traversal moved up</b><span>You marked it difficult yesterday and the exam is in 3 days.</span></p></div></div><div className="daily-preview"><div className="daily-top"><div><small>GOOD EVENING, ALEX</small><h3>Three days to Data Structures.</h3><p>You’re <b>72% ready</b> — keep the momentum.</p></div><Ring value={72}/></div><div className="progress-label"><span>Today’s progress</span><b>2 / 4 sessions</b></div><div className="progress-bar"><i/></div><div className="next-session prominent"><div className="micro-title"><span>UP NEXT</span><em>High priority</em></div><div className="session-info"><div className="subject">DS</div><span><b>Graph Traversal</b><small>7:00 – 7:50 PM · Practice</small></span></div><button>Start session <ArrowRight/></button></div><PlanList large/><button className="time-button"><Clock3/> Plans changed? <b>I only have 45 minutes</b></button></div></div></section>

    <section className="why-section section" id="why"><div className="why-inner"><span className="kicker">Why Plannora</span><p>Most planners ask:</p><h2>“Did you follow the schedule?”</h2><div className="divider"><Sparkles/></div><p>Plannora asks:</p><h2 className="accent">“What happened — and how should your plan change?”</h2><div className="adapt-demo"><span><Check/> Partial session</span><ArrowRight/><span><WandSparkles/> Plan updated</span><ArrowRight/><strong>Keep moving</strong></div></div></section>

    <section className="final-cta section"><div><span className="cta-mark"><Logo/></span><h2>Build a plan that keeps up with you.</h2><p>Study with structure without pretending every day goes perfectly.</p><Button href="/register">Create My Plan <ArrowRight/></Button><small><ShieldCheck/> No perfect week required.</small></div></section>

    <footer><div><Logo/><p>Your study plan. Smarter every day.</p></div><nav><a href="#how-it-works">How it works</a><a href="#features">Features</a><a href="#why">Why Plannora</a></nav><p className="footer-note">Adaptive study planning for real student life.</p></footer>
  </main>;
}
