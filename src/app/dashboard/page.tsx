import Link from "next/link";
import {
  Activity,
  ArrowUp,
  Bell,
  Bot,
  CircleUserRound,
  Database,
  FileText,
  Filter,
  Gauge,
  LayoutDashboard,
  Menu,
  Package,
  PlayCircle,
  Radar,
  Search,
  RadioTower,
  TrendingUp
} from "lucide-react";
import { compactDate } from "@/lib/utils";
import { overview } from "@/lib/analytics";
import type { ReactNode } from "react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, active: true },
  { label: "Entity Explorer", href: "/entities", icon: Radar },
  { label: "Source Library", href: "/sources", icon: FileText },
  { label: "Data Sources", href: "/sources/status", icon: Database },
  { label: "Demo", href: "/demo", icon: PlayCircle }
];

function MiniSparkline({ tone = "cyan" }: { tone?: "cyan" | "green" }) {
  return (
    <svg className="h-8 w-16" viewBox="0 0 64 32">
      <path
        d={tone === "green" ? "M0 28 Q 10 20, 20 24 T 40 16 T 64 8" : "M0 24 L 15 20 L 30 22 L 45 10 L 64 4"}
        fill="none"
        stroke={tone === "green" ? "#4ade80" : "#00d1ff"}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
  highlighted = false,
  children,
  delay = 0
}: {
  label: string;
  value: string | number;
  detail: ReactNode;
  icon: React.ElementType;
  highlighted?: boolean;
  children?: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className={`dashboard-glass-panel dashboard-card-hover dashboard-entrance ${highlighted ? "dashboard-glow-cyan border-[#00d1ff]/30" : ""} ${highlighted ? "dashboard-shimmer" : ""} flex h-[120px] cursor-pointer flex-col justify-between rounded-xl p-3`}
      style={{ animationDelay: `${delay}s` }}
    >
      {highlighted && <div className="absolute right-0 top-0 h-16 w-16 translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00d1ff]/10 blur-xl" />}
      <div className="relative z-10 flex items-start justify-between">
        <span className={`font-mono text-[13px] font-medium uppercase tracking-wider ${highlighted ? "text-[#00d1ff]" : "text-[#bbc9cf]"}`}>{label}</span>
        <Icon size={18} className={highlighted ? "text-[#00d1ff]" : "text-[#bbc9cf]"} />
      </div>
      <div className="relative z-10 flex items-end justify-between">
        <div>
          <div className="text-2xl font-semibold text-[#dde3e7]">{value}</div>
          <div className="mt-1 flex items-center gap-1 font-mono text-xs text-[#bbc9cf]">{detail}</div>
        </div>
        {children}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const data = await overview();
  const latest = data.latestDocuments.slice(0, 3);
  const entityTotal = data.topEntities.reduce((sum, entity) => sum + entity.count, 0);
  const positive = data.sentiment.find((item) => item.name === "positive")?.value || 0;
  const sentimentScore = Math.round(((positive + data.totalDocuments) / Math.max(1, data.totalDocuments * 2)) * 100);

  return (
    <div className="nalco-dashboard flex h-screen overflow-hidden antialiased selection:bg-[#00d1ff] selection:text-[#00566a]">
      <nav className="dashboard-entrance z-40 hidden h-screen w-[280px] flex-col border-r border-[#3c494e]/20 bg-[#1a2123] py-6 md:flex">
        <div className="mb-10 px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#00d1ff]/30 bg-[#00d1ff]/20 text-[#a4e6ff]">
              <Activity size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#a4e6ff]">NALCO Bot</h1>
              <p className="font-mono text-[13px] font-medium uppercase tracking-wider text-[#bbc9cf]/80">AI Intelligence</p>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <Link
                    className={`dashboard-interactive flex items-center gap-3 px-6 py-3 text-sm ${item.active ? "border-l-4 border-[#00d1ff] bg-[#00d1ff]/10 text-[#a4e6ff]" : "text-[#bbc9cf] hover:bg-[#333a3d]/10 hover:text-[#dde3e7]"}`}
                    href={item.href}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-auto border-t border-[#3c494e]/20 pt-6">
          <Link className="dashboard-interactive flex items-center gap-3 px-6 py-3 text-sm text-[#bbc9cf] hover:bg-[#333a3d]/10 hover:text-[#dde3e7]" href="/api/health">
            <Gauge size={20} />
            <span>System Status</span>
          </Link>
          <Link className="dashboard-interactive flex items-center gap-3 px-6 py-3 text-sm text-[#bbc9cf] hover:bg-[#333a3d]/10 hover:text-[#dde3e7]" href="/demo">
            <CircleUserRound size={20} />
            <span>User Profile</span>
          </Link>
        </div>
      </nav>

      <main className="relative flex h-screen flex-1 flex-col overflow-hidden">
        <header className="dashboard-entrance sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#3c494e]/30 bg-[#0e1417]/80 px-6 shadow-sm backdrop-blur-xl">
          <Link className="dashboard-interactive p-3 text-[#bbc9cf] transition-colors hover:text-[#a4e6ff] md:hidden" href="/" aria-label="Menu">
            <Menu size={22} />
          </Link>
          <div className="text-2xl font-bold tracking-normal text-[#a4e6ff] md:hidden">NALCO Intelligence</div>

          <form action="/search" className="group relative hidden max-w-md flex-1 md:flex">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={20} className="text-[#bbc9cf]" />
            </div>
            <input
              className="w-full rounded-lg border border-[#3c494e]/50 bg-[#242b2e] py-2 pl-10 pr-12 text-sm text-[#dde3e7] outline-none transition-all placeholder:text-[#bbc9cf]/70 focus:border-[#00d1ff] focus:ring-1 focus:ring-[#00d1ff]"
              name="q"
              placeholder="Search entities, filings, metrics..."
              type="text"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="rounded border border-[#3c494e]/50 bg-[#1a2123] px-1.5 py-0.5 font-mono text-[10px] text-[#bbc9cf]">⌘K</span>
            </div>
          </form>

          <div className="flex items-center gap-3">
            <div className="mr-6 hidden items-center gap-2 md:flex">
              <span className="relative flex h-2 w-2">
                <span className="dashboard-pulse-indicator absolute inline-flex h-full w-full rounded-full bg-[#00d1ff] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00d1ff]" />
              </span>
              <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-[#00d1ff]">Live Ingestion</span>
            </div>
            <Link className="dashboard-interactive rounded-full p-2 text-[#bbc9cf] hover:bg-[#2f3639]/50 hover:text-[#a4e6ff]" href="/sources" aria-label="Sensors">
              <RadioTower size={21} />
            </Link>
            <Link className="dashboard-interactive relative rounded-full p-2 text-[#bbc9cf] hover:bg-[#2f3639]/50 hover:text-[#a4e6ff]" href="/sources" aria-label="Notifications">
              <Bell size={21} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-[#0e1417] bg-[#ffb4ab]" />
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-[1440px] space-y-6">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="NALCO Stock" value="NATIONALUM" detail={<><ArrowUp size={14} className="text-[#4ade80]" /> Evidence-linked</>} icon={TrendingUp} delay={0.08}>
                <div className="opacity-70 transition-opacity group-hover:opacity-100"><MiniSparkline tone="green" /></div>
              </KpiCard>
              <KpiCard label="Aluminium Spot" value="LME Context" detail={<><ArrowUp size={14} className="text-[#4ade80]" /> Fallback mode</>} icon={Package} highlighted delay={0.16}>
                <MiniSparkline />
              </KpiCard>
              <KpiCard label="Sentiment Index" value={`${sentimentScore}/100`} detail="Neutral vs source mix" icon={Bot} delay={0.24}>
                <span className="rounded border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-400">Positive</span>
              </KpiCard>
              <KpiCard label="Entities Detected" value={entityTotal || data.topEntities.length} detail="Current evidence store" icon={Radar} delay={0.32}>
                <div className="flex h-8 items-end gap-1">
                  {[12, 20, 16, 28, 24, 32].map((height, index) => (
                    <div key={height} className={`w-2 rounded-sm ${index > 2 ? "bg-[#00d1ff]/70" : "bg-[#333a3d]"}`} style={{ height }} />
                  ))}
                </div>
              </KpiCard>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="space-y-3 lg:col-span-2">
                <section className="dashboard-glass-panel dashboard-card-hover dashboard-chart-card dashboard-entrance flex h-[320px] flex-col overflow-hidden rounded-xl p-3" style={{ animationDelay: "0.4s" }}>
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-[#dde3e7]">Aluminium Market Signals</h2>
                      <p className="font-mono text-[11px] uppercase tracking-wider text-[#bbc9cf]">LME Price vs AI Event Detection (30D)</p>
                    </div>
                    <div className="flex gap-2">
                      <Link className="dashboard-interactive rounded border border-[#3c494e]/30 bg-[#0e1417] px-2 py-1 font-mono text-xs text-[#bbc9cf] hover:text-[#dde3e7]" href="/search?q=aluminium%20NALCO%201W">1W</Link>
                      <Link className="dashboard-interactive rounded border border-[#00d1ff]/50 bg-[#00d1ff]/20 px-2 py-1 font-mono text-xs text-[#00d1ff]" href="/search?q=aluminium%20NALCO%201M">1M</Link>
                      <Link className="dashboard-interactive rounded border border-[#3c494e]/30 bg-[#0e1417] px-2 py-1 font-mono text-xs text-[#bbc9cf] hover:text-[#dde3e7]" href="/search?q=aluminium%20NALCO%203M">3M</Link>
                    </div>
                  </div>
                  <div className="dashboard-chart-grid relative mb-8 ml-8 flex-1 border-b border-l border-[#3c494e]/30">
                    <div className="dashboard-scan-line pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-[#00d1ff]/40 opacity-0" />
                    <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 500 200">
                      <defs>
                        <linearGradient id="dashboard-area-gradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#00d1ff" />
                          <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                      </defs>
                      <path d="M0 150 Q 50 140, 100 160 T 200 120 T 300 80 T 400 90 T 500 40" fill="none" stroke="#00d1ff" strokeWidth="2" />
                      <path d="M0 150 Q 50 140, 100 160 T 200 120 T 300 80 T 400 90 T 500 40 L 500 200 L 0 200 Z" fill="url(#dashboard-area-gradient)" opacity="0.14" />
                    </svg>
                    <div className="group absolute left-[60%] top-[35%] flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center">
                      <div className="z-10 mb-1 whitespace-nowrap rounded border border-[#00d1ff] bg-[#00d1ff]/20 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-[#00d1ff] opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                        Supply Disruption Warning
                      </div>
                      <div className="dashboard-chart-point dashboard-pulse-indicator relative z-0 h-3 w-3 rounded-full border-2 border-[#00d1ff] bg-[#0e1417]">
                        <div className="absolute inset-0 animate-ping rounded-full bg-[#00d1ff]/50" />
                      </div>
                      <div className="h-16 border-l border-dashed border-[#00d1ff]/50" />
                    </div>
                    <div className="absolute -left-8 top-0 font-mono text-[10px] text-[#bbc9cf]">2.6k</div>
                    <div className="absolute -left-8 bottom-0 font-mono text-[10px] text-[#bbc9cf]">2.2k</div>
                    <div className="absolute -bottom-6 left-0 font-mono text-[10px] text-[#bbc9cf]">Oct 1</div>
                    <div className="absolute -bottom-6 right-0 font-mono text-[10px] text-[#bbc9cf]">Oct 30</div>
                  </div>
                </section>

                <section className="dashboard-glass-panel dashboard-card-hover dashboard-entrance rounded-xl p-3" style={{ animationDelay: "0.48s" }}>
                  <h2 className="mb-3 text-lg font-semibold text-[#dde3e7]">Latest NALCO Intelligence</h2>
                  <div className="space-y-1">
                    {latest.map((doc) => (
                      <Link key={doc.id} href={`/sources/${doc.id}`} className="dashboard-interactive group block rounded-lg border border-[#3c494e]/20 bg-[#242b2e]/50 p-3 transition-colors hover:bg-[#242b2e]">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded border border-[#3c494e]/30 bg-[#0e1417] text-[10px] font-bold text-[#dde3e7]">{doc.sourceName.slice(0, 1)}</span>
                            <span className="font-mono text-[11px] uppercase tracking-wider text-[#bbc9cf]">{doc.sourceName} · {compactDate(doc.publishedAt)}</span>
                          </div>
                          <span className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${doc.sentiment === "negative" ? "border-[#ffb4ab]/20 bg-[#ffb4ab]/10 text-[#ffb4ab]" : doc.sentiment === "positive" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-[#3c494e]/30 bg-[#333a3d] text-[#bbc9cf]"}`}>
                            {doc.sentiment}{doc.materialityScore >= 0.65 ? " Risk" : ""}
                          </span>
                        </div>
                        <h3 className="font-semibold text-[#dde3e7] transition-colors group-hover:text-[#b7eaff]">{doc.title}</h3>
                        <p className="mt-1 line-clamp-1 text-sm text-[#bbc9cf]/80">{doc.summary}</p>
                      </Link>
                    ))}
                  </div>
                  <Link className="dashboard-interactive mt-3 block w-full rounded-lg border border-[#3c494e]/30 py-2 text-center font-mono text-xs font-medium uppercase tracking-wider text-[#bbc9cf] hover:bg-[#333a3d]/30 hover:text-[#dde3e7]" href="/sources">
                    View All Intelligence ({data.totalDocuments}+)
                  </Link>
                </section>
              </div>

              <div className="space-y-3">
                <section className="dashboard-glass-panel dashboard-card-hover dashboard-entrance flex flex-col items-center rounded-xl p-3" style={{ animationDelay: "0.56s" }}>
                  <h2 className="mb-4 w-full self-start text-base font-semibold text-[#dde3e7]">Entity Sentiment Distribution</h2>
                  <div className="relative my-2 flex h-40 w-40 items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" fill="transparent" r="40" stroke="#2f3639" strokeWidth="15" />
                      <circle cx="50" cy="50" fill="transparent" r="40" stroke="#00d1ff" strokeDasharray="251.2" strokeDashoffset="100" strokeWidth="15" />
                      <circle cx="50" cy="50" fill="transparent" r="40" stroke="#859399" strokeDasharray="251.2" strokeDashoffset="200" strokeWidth="15" transform="rotate(140 50 50)" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-semibold text-[#dde3e7]">{entityTotal || data.topEntities.length}</span>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#bbc9cf]">Entities</span>
                    </div>
                  </div>
                  <div className="mt-4 w-full space-y-2">
                    {[
                      ["Companies", "55%", "#00d1ff"],
                      ["Regulators", "30%", "#859399"],
                      ["Policymakers", "15%", "#333a3d"]
                    ].map(([label, value, color]) => (
                      <div className="flex items-center justify-between font-mono text-xs font-medium uppercase tracking-wider" key={label}>
                        <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full" style={{ background: color }} /><span className="text-[#dde3e7]">{label}</span></div>
                        <span className="text-[#bbc9cf]">{value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="dashboard-glass-panel dashboard-card-hover dashboard-entrance flex-1 rounded-xl p-3" style={{ animationDelay: "0.64s" }}>
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-[#dde3e7]">High-Impact Events</h2>
                    <Filter size={18} className="text-[#bbc9cf]" />
                  </div>
                  <div className="relative space-y-4 border-l border-[#3c494e]/30 pl-4">
                    {(data.highImpactEvents.length ? data.highImpactEvents : data.latestDocuments).slice(0, 4).map((doc, index) => (
                      <div className="dashboard-interactive relative" key={doc.id}>
                        <div className={`absolute -left-[21px] top-1 h-2 w-2 rounded-full ring-4 ring-[#0e1417] ${index === 0 ? "dashboard-pulse-indicator bg-[#00d1ff]" : "bg-[#859399]"}`} />
                        <div className={`mb-1 font-mono text-[10px] uppercase tracking-wider ${index === 0 ? "text-[#00d1ff]" : "text-[#bbc9cf]"}`}>{compactDate(doc.publishedAt)}</div>
                        <div className={index === 0 ? "text-sm font-medium leading-tight text-[#dde3e7]" : "text-sm leading-tight text-[#bbc9cf]"}>{doc.title}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
            <div className="h-24" />
          </div>
        </div>
      </main>

      <div className="dashboard-bot-entrance pointer-events-none fixed bottom-10 right-10 z-50 hidden w-[340px] flex-col items-end gap-3 md:flex">
        <div className="dashboard-glass-panel dashboard-ai-message pointer-events-auto relative rounded-2xl rounded-br-none border-[#00d1ff]/20 p-4 shadow-2xl transition-transform duration-300 hover:-translate-y-1">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#00d1ff]/30 bg-[#00d1ff]/10">
              <Bot size={18} className="text-[#00d1ff]" />
            </div>
            <div>
              <div className="text-[13px] leading-relaxed text-[#dde3e7]">
                Hi, I&apos;m Eva. I&apos;ve detected a high-materiality signal from <span className="dashboard-interactive inline-block cursor-pointer rounded bg-[#00d1ff]/10 px-1 font-mono text-[#b7eaff]">NSE</span> related evidence.
              </div>
              <div className="mt-2 text-[13px] text-[#bbc9cf]">Would you like a summary?</div>
              <div className="mt-3 flex gap-2">
                <Link className="dashboard-interactive rounded bg-[#00d1ff] px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wider text-[#00566a] hover:bg-[#a4e6ff]" href="/search">
                  Yes, summarize
                </Link>
                <Link className="dashboard-interactive rounded border border-[#3c494e]/50 bg-[#0e1417] px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wider text-[#bbc9cf] hover:bg-[#333a3d]/50 hover:text-[#dde3e7]" href="/dashboard">
                  Dismiss
                </Link>
              </div>
            </div>
          </div>
          <div className="absolute -inset-1 -z-10 rounded-full bg-[#00d1ff]/10 blur-xl" />
        </div>
        <Link className="dashboard-interactive dashboard-breathing-glow group pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full border border-[#3c494e]/30 bg-[#0e1417] shadow-lg transition-all hover:border-[#00d1ff]/50 hover:bg-[#333a3d]" href="/search?q=high%20materiality%20NALCO%20filing" aria-label="Open assistant">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#00d1ff]/5 group-hover:bg-[#00d1ff]/20" />
          <Bot size={24} className="relative z-10 text-[#00d1ff]" />
          <div className="dashboard-pulse-indicator absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-[#0e1417] bg-[#ffb4ab]" />
        </Link>
      </div>
    </div>
  );
}
