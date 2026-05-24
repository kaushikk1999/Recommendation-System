"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  Activity,
  Bell,
  CircleUserRound,
  Database,
  FileText,
  Globe2,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  PlayCircle,
  RadioTower
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Entity Explorer", href: "/entities", icon: Globe2 },
  { label: "Source Library", href: "/sources", icon: FileText },
  { label: "Data Sources", href: "/sources/status", icon: Database },
  { label: "Demo", href: "/demo", icon: PlayCircle, active: true }
];

function DemoSidebar({ collapsed, onCollapse }: { collapsed: boolean; onCollapse: () => void }) {
  return (
    <nav
      className={cn(
        "fixed left-0 z-40 hidden h-screen w-[280px] flex-col border-r border-[#3c494e]/20 bg-[#1a2123] py-6 transition-transform duration-300 md:flex",
        collapsed && "-translate-x-full"
      )}
    >
      <div className="mb-10 flex items-start justify-between gap-3 px-6">
        <Link href="/" className="block">
          <h1 className="text-2xl font-bold text-[#a4e6ff]">NALCO Bot</h1>
          <p className="text-sm text-[#bbc9cf]">AI Intelligence</p>
        </Link>
        <button
          aria-label="Collapse sidebar"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#3c494e] text-[#a4e6ff] transition-colors hover:border-[#00d1ff] hover:bg-[#00d1ff]/10"
          onClick={onCollapse}
          title="Collapse sidebar"
          type="button"
        >
          <PanelLeftClose size={19} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              className={cn(
                "flex items-center gap-3 px-6 py-3 text-sm transition-all hover:bg-[#333a3d]/10 hover:text-[#dde3e7]",
                item.active ? "translate-x-1 border-l-4 border-[#00d1ff] bg-[#00d1ff]/10 text-[#a4e6ff]" : "text-[#bbc9cf]"
              )}
              href={item.href}
              key={item.label}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="mt-auto flex flex-col gap-1 px-6">
        <Link className="flex items-center gap-3 px-6 py-3 text-sm text-[#bbc9cf] transition-all hover:bg-[#333a3d]/10 hover:text-[#dde3e7]" href="/api/health">
          <Activity size={20} />
          <span>System Status</span>
        </Link>
        <Link className="flex items-center gap-3 px-6 py-3 text-sm text-[#bbc9cf] transition-all hover:bg-[#333a3d]/10 hover:text-[#dde3e7]" href="/demo">
          <CircleUserRound size={20} />
          <span>User Profile</span>
        </Link>
      </div>
    </nav>
  );
}

function MobileHeader() {
  return (
    <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[#3c494e]/30 bg-[#0e1417]/80 px-6 shadow-sm backdrop-blur-xl md:hidden">
      <div className="text-2xl font-bold tracking-normal text-[#a4e6ff]">NALCO Intelligence</div>
      <div className="flex gap-3">
        <Link className="rounded-full p-2 text-[#a4e6ff] transition-colors hover:bg-[#2f3639]/50" href="/sources" aria-label="Sensors">
          <RadioTower size={20} />
        </Link>
        <Link className="rounded-full p-2 text-[#a4e6ff] transition-colors hover:bg-[#2f3639]/50" href="/dashboard" aria-label="Notifications">
          <Bell size={20} />
        </Link>
      </div>
    </header>
  );
}

export function DemoShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="demo-showcase min-h-screen overflow-x-hidden font-sans antialiased">
      <DemoSidebar collapsed={collapsed} onCollapse={() => setCollapsed(true)} />
      <button
        aria-label="Expand sidebar"
        className={cn(
          "fixed left-4 top-4 z-50 hidden h-10 w-10 items-center justify-center rounded-md border border-[#3c494e] bg-[#1a2123] text-[#a4e6ff] opacity-0 shadow-lg shadow-black/20 transition-all duration-300 hover:border-[#00d1ff] hover:bg-[#00d1ff]/10 md:inline-flex",
          collapsed ? "pointer-events-auto opacity-100" : "pointer-events-none"
        )}
        onClick={() => setCollapsed(false)}
        title="Expand sidebar"
        type="button"
      >
        <PanelLeftOpen size={20} />
      </button>
      <MobileHeader />

      <main className={cn("mx-auto w-full max-w-[1440px] flex-1 px-6 pb-16 pt-20 transition-[margin] duration-300 md:pt-6 lg:px-10", collapsed ? "md:ml-0" : "md:ml-[280px]")}>
        {children}
      </main>
    </div>
  );
}
