"use client";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { FormEvent, useState } from "react";

import { ArrowRight, Check, Eye, EyeOff } from "lucide-react";

type Errors = Partial<
  Record<"name" | "email" | "password" | "confirm", string>
>;

type AuthResponse = {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();

  const [visible, setVisible] = useState(false);

  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [errors, setErrors] = useState<Errors>({});

  const isRegister = mode === "register";

  const update = (key: keyof typeof values, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  async function submit(event: FormEvent) {
    event.preventDefault();

    const next: Errors = {};

    if (isRegister && values.name.trim().length < 2) {
      next.name = "Enter your name.";
    }

    if (!/^\S+@\S+\.\S+$/.test(values.email)) {
      next.email = "Enter a valid email address.";
    }

    if (values.password.length < 8 || !/\d/.test(values.password)) {
      next.password = "Use 8+ characters and at least one number.";
    }

    if (isRegister && values.confirm !== values.password) {
      next.confirm = "Passwords don’t match yet.";
    }

    setErrors(next);

    if (Object.keys(next).length) {
      return;
    }

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

    try {
      const response = await fetch(
        `${apiUrl}/api/auth/${isRegister ? "register" : "login"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isRegister
              ? {
                  name: values.name.trim(),
                  email: values.email.trim(),
                  password: values.password,
                }
              : {
                  email: values.email.trim(),
                  password: values.password,
                },
          ),
        },
      );

      const data = (await response.json()) as AuthResponse;

      if (!response.ok || !data.success || !data.token || !data.user) {
        if (
          isRegister &&
          data.message === "An account with this email already exists."
        ) {
          setErrors({
            email: data.message,
          });
          return;
        }

        if (!isRegister && response.status === 401) {
          setErrors({
            password: data.message || "Invalid email or password.",
          });
          return;
        }

        setErrors({
          email: data.message || "Something went wrong. Please try again.",
        });
        return;
      }

      localStorage.setItem("plannora_token", data.token);
      localStorage.setItem("plannora_user", JSON.stringify(data.user));

      if (isRegister) {
        router.push("/planner");
        return;
      }

      router.push("/dashboard");
    } catch {
      setErrors({
        email: "Unable to connect to Plannora. Please try again.",
      });
    }
  }

  const field = (
    id: keyof typeof values,
    label: string,
    type = "text",
  ) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          id={id}
          name={id}
          type={type === "password" && visible ? "text" : type}
          value={values[id]}
          onChange={(e) => update(id, e.target.value)}
          aria-invalid={!!errors[id]}
          aria-describedby={errors[id] ? `${id}-error` : undefined}
          autoComplete={id === "confirm" ? "new-password" : id}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff /> : <Eye />}
          </button>
        )}
      </div>
      {errors[id] && (
        <small id={`${id}-error`} className="field-error">
          {errors[id]}
        </small>
      )}
    </div>
  );

  return (
    <>
      <span className="auth-eyebrow">
        {isRegister ? "START YOUR PLAN" : "WELCOME BACK"}
      </span>
      <h1>
        {isRegister
          ? "Build a plan that adapts to you."
          : "Continue where your plan left off."}
      </h1>
      <p>
        {isRegister
          ? "Turn your subjects, deadlines, and available time into a study plan you can actually follow."
          : "Sign in to view your study plan, progress, and upcoming sessions."}
      </p>
      <form onSubmit={submit} noValidate>
        {isRegister && field("name", "Name")}
        {field("email", "Email", "email")}
        {field("password", "Password", "password")}
        {isRegister && (
          <div className="password-rules">
            <span className={values.password.length >= 8 ? "met" : ""}>
              <Check /> 8 characters
            </span>
            <span className={/\d/.test(values.password) ? "met" : ""}>
              <Check /> One number
            </span>
          </div>
        )}
        {isRegister && field("confirm", "Confirm password", "password")}
        {!isRegister && (
          <Link className="forgot" href="#">
            Forgot password?
          </Link>
        )}
        <button className="auth-submit" type="submit">
          {isRegister ? "Create account" : "Sign in"}
          <ArrowRight />
        </button>
      </form>
      <p className="auth-switch">
        {isRegister ? "Already have an account?" : "New to Plannora?"}{" "}
        <Link href={isRegister ? "/login" : "/register"}>
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
      <small className="mock-note">
        UI preview only — no credentials are stored or sent.
      </small>
    </>
  );
}