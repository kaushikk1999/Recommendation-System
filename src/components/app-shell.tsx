"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, Database, Network, Presentation, Search } from "lucide-react";
import { ChatWidget } from "@/components/chat-widget";
import { NavLink } from "@/components/ui";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") {
    return (
      <>
        <main>{children}</main>
        <ChatWidget />
      </>
    );
  }

  if (pathname === "/sources" || pathname === "/sources/status" || pathname?.startsWith("/dashboard") || pathname?.startsWith("/entities") || pathname?.startsWith("/demo") || pathname?.startsWith("/search")) {
    return (
      <>
        {children}
        <ChatWidget />
      </>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal-700 text-white">
              <Bot size={22} />
            </div>
            <div>
              <div className="text-sm font-black uppercase tracking-wide">NALCO Intelligence</div>
              <div className="text-xs text-[var(--muted)]">Corporate, market and policy signals</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink href="/dashboard"><BarChart3 size={16} /> Dashboard</NavLink>
            <NavLink href="/sources"><Database size={16} /> Sources</NavLink>
            <NavLink href="/entities"><Network size={16} /> Entities</NavLink>
            <NavLink href="/search"><Search size={16} /> Search</NavLink>
            <NavLink href="/demo"><Presentation size={16} /> Demo</NavLink>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <ChatWidget />
    </>
  );
}
