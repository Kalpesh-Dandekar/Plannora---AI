import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plannora — Adaptive AI Study Planning",
  description:
    "Your study plan. Smarter every day. Build a realistic plan that adapts as life changes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
