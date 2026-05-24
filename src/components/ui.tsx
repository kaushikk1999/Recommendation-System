import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ComponentProps } from "react";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm", className)} {...props} />;
}

export function Badge({ className, tone = "neutral", ...props }: ComponentProps<"span"> & { tone?: "neutral" | "good" | "bad" | "warn" | "info" }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    good: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    bad: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
    warn: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    info: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200"
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)} {...props} />;
}

export function Button({ className, variant = "primary", ...props }: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "ghost" }) {
  const variants = {
    primary: "bg-[var(--primary)] text-white hover:bg-[var(--primary-strong)]",
    secondary: "border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-slate-100 dark:hover:bg-slate-800",
    ghost: "text-[var(--foreground)] hover:bg-slate-100 dark:hover:bg-slate-800"
  };
  return <button className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition", variants[variant], className)} {...props} />;
}

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white" href={href}>
      {children}
    </Link>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200 dark:bg-slate-800", className)} />;
}
