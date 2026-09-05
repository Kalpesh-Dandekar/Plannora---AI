import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
export const metadata: Metadata = { title: "Create your account — Plannora" };
export default function RegisterPage(){return <AuthShell register><AuthForm mode="register"/></AuthShell>}
