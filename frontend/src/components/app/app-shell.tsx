"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, BookOpen, CalendarDays, ChevronDown, Clock3, LayoutDashboard, Menu, Settings, Target, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { demoUser } from "@/lib/demo-data";

const nav = [
  ["/dashboard", "Today", LayoutDashboard], ["/plan", "My Plan", CalendarDays],
  ["/subjects", "Subjects", BookOpen], ["/exams", "Exams", Target],
  ["/progress", "Progress", BarChart3], ["/focus", "Focus", Clock3],
  ["/settings", "Settings", Settings],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = nav.map(([href, label, Icon]) => (
    <Link href={href} aria-current={path === href ? "page" : undefined} className={path === href ? "active" : ""} onClick={() => setMobileOpen(false)} key={href}>
      <Icon /><span>{label}</span>
    </Link>
  ));
  return <div className="main-app">
    <aside className="app-sidebar"><Link href="/dashboard"><Logo /></Link><nav aria-label="Application navigation">{links}</nav><div className="side-profile"><i>{demoUser.initials}</i><span><b>{demoUser.name}</b><small>Exam mode</small></span><ChevronDown /></div></aside>
    <header className="mobile-appbar"><Link href="/dashboard"><Logo /></Link><button className="mobile-nav-trigger" onClick={() => setMobileOpen(true)} aria-label="Open application navigation" aria-expanded={mobileOpen}><Menu /></button>{mobileOpen && <><button className="mobile-nav-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation"/><nav className="mobile-nav-sheet" aria-label="Mobile application navigation"><span>Navigate</span><button onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X /></button>{links}</nav></>}</header>
    <div className="app-body">{children}</div>
  </div>;
}
