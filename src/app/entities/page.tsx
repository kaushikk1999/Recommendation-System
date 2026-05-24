import Link from "next/link";
import {
  Activity,
  Bell,
  Bot,
  Building2,
  CircleUserRound,
  Database,
  Download,
  Factory,
  FileText,
  Filter,
  Gauge,
  Globe2,
  Landmark,
  LayoutDashboard,
  Link as LinkIcon,
  Map,
  Menu,
  Network,
  PlayCircle,
  Radar,
  Search,
  Sparkles,
  Table2,
  TrendingDown,
  X,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { overview } from "@/lib/analytics";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Entity Explorer", href: "/entities", icon: Globe2, active: true },
  { label: "Source Library", href: "/sources", icon: FileText },
  { label: "Data Sources", href: "/sources/status", icon: Database },
  { label: "Demo", href: "/demo", icon: PlayCircle }
];

const filters = ["All Entities", "Companies", "Commodities", "Geographies", "Policymakers", "Regulators"];

function iconForType(type: string) {
  if (type === "COMPANY") return Factory;
  if (type === "COMMODITY") return Radar;
  if (type === "GEOGRAPHY") return Map;
  if (["POLICYMAKER", "REGULATOR", "GOVERNMENT_BODY"].includes(type)) return Landmark;
  return Network;
}

function SparkBars({ tone = "cyan" }: { tone?: "cyan" | "red" | "neutral" }) {
  const heights = tone === "red" ? [80, 70, 50, 30, 20] : tone === "cyan" ? [20, 30, 50, 70, 90] : [40, 45, 40, 42, 45];
  const colors = tone === "red" ? ["bg-[#ffb4ab]/40", "bg-[#ffb4ab]/50", "bg-[#ffb4ab]/60", "bg-[#ffb4ab]/80", "bg-[#ffb4ab]"] : tone === "cyan" ? ["bg-[#00d1ff]/40", "bg-[#00d1ff]/50", "bg-[#00d1ff]/60", "bg-[#00d1ff]/80", "bg-[#00d1ff]"] : Array(5).fill("bg-[#c1c7cf]");
  return (
    <div className="mx-auto flex h-6 w-24 items-end justify-between gap-0.5 opacity-70 group-hover:opacity-100">
      {heights.map((height, index) => (
        <div
          className={`entity-spark-bar w-full rounded-t-sm ${colors[index]}`}
          key={`${height}-${index}`}
          style={{ height: `${height}%`, animationDelay: `${index * 50}ms` }}
        />
      ))}
    </div>
  );
}

export default async function EntitiesPage() {
  const data = await overview();
  const directory = [
    { text: "Aluminium LME", type: "COMMODITY", count: 1245, score: 92, tone: "red" as const, active: true },
    ...(data.topEntities.length ? data.topEntities : [{ text: "NALCO", type: "COMPANY", count: 8 }])
  ]
    .filter((entity, index, arr) => arr.findIndex((item) => item.text === entity.text) === index)
    .slice(0, 7)
    .map((entity, index) => ({
      text: entity.text,
      type: entity.type,
      count: entity.count,
      score: "score" in entity ? entity.score : Math.max(52, 90 - index * 7),
      tone: "tone" in entity ? entity.tone : index % 3 === 0 ? ("cyan" as const) : ("neutral" as const),
      active: "active" in entity ? entity.active : false
    }));

  return (
    <div className="entity-explorer flex h-screen w-full overflow-hidden font-sans antialiased selection:bg-[#a4e6ff]/30 selection:text-[#a4e6ff]">
      <aside className="entity-stagger fixed left-0 z-40 hidden h-screen w-[280px] flex-col border-r border-[#3c494e]/20 bg-[#1a2123] py-6 md:flex" style={{ animationDelay: "50ms" }}>
        <div className="mb-16 flex items-center gap-3 px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#a4e6ff]/30 bg-[#00d1ff]/20 text-[#a4e6ff] shadow-[0_0_8px_0_rgba(0,209,255,0.2)]">
              <Bot size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-normal text-[#a4e6ff]">NALCO Bot</h1>
              <p className="font-mono text-[10px] font-medium uppercase tracking-wider text-[#bbc9cf]">AI Intelligence</p>
            </div>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className={`entity-btn group flex items-center gap-3 px-6 py-3 text-sm ${item.active ? "entity-active-glow scale-95 rounded-r-lg border-l-4 border-[#00d1ff] bg-[#00d1ff]/10 text-[#a4e6ff]" : "rounded-lg text-[#bbc9cf] hover:bg-[#333a3d]/10 hover:text-[#dde3e7]"}`}
                href={item.href}
                key={item.label}
              >
                <Icon size={20} className={item.active ? "text-[#a4e6ff]" : "transition-colors group-hover:text-[#a4e6ff]"} />
                <span className={item.active ? "font-medium" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-1 border-t border-[#3c494e]/20 px-2 pt-6">
          <Link className="entity-btn group flex items-center gap-3 rounded-lg px-6 py-3 text-sm text-[#bbc9cf] hover:bg-[#333a3d]/10 hover:text-[#dde3e7]" href="/api/health">
            <Activity size={20} className="transition-colors group-hover:text-[#a4e6ff]" />
            <span>System Status</span>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="entity-pulse-dot h-1.5 w-1.5 rounded-full bg-[#00d1ff]" />
              <span className="font-mono text-[10px] uppercase text-[#00d1ff]">Live</span>
            </div>
          </Link>
          <Link className="entity-btn group flex items-center gap-3 rounded-lg px-6 py-3 text-sm text-[#bbc9cf] hover:bg-[#333a3d]/10 hover:text-[#dde3e7]" href="/demo">
            <CircleUserRound size={20} className="transition-colors group-hover:text-[#a4e6ff]" />
            <span>User Profile</span>
          </Link>
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col md:ml-[280px]">
        <header className="entity-stagger absolute top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#3c494e]/30 bg-[#0e1417]/80 px-6 shadow-sm backdrop-blur-xl" style={{ animationDelay: "100ms" }}>
          <Link className="entity-btn p-3 text-[#bbc9cf] md:hidden" href="/" aria-label="Menu">
            <Menu size={22} />
          </Link>
          <form action="/search" className="flex max-w-2xl flex-1 items-center">
            <div className="group relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbc9cf] transition-colors group-focus-within:text-[#a4e6ff]" size={20} />
              <input
                className="w-full rounded-lg border border-[#3c494e]/30 bg-[#242b2e]/50 py-2 pl-10 pr-12 text-sm text-[#dde3e7] shadow-inner outline-none transition-all placeholder:text-[#bbc9cf] focus:border-[#a4e6ff]/50 focus:ring-1 focus:ring-[#a4e6ff]/50"
                name="q"
                placeholder="Search entities, commodities, or ask AI... (Cmd+K)"
                type="text"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-[#3c494e]/50 bg-[#1a2123] px-1.5 py-0.5 font-mono text-[10px] text-[#bbc9cf]">⌘K</kbd>
            </div>
          </form>
          <div className="ml-6 flex items-center gap-2">
            <Link className="entity-btn group rounded-full p-2 text-[#bbc9cf] hover:bg-[#2f3639]/50" href="/sources" aria-label="Sensors"><Gauge size={20} className="group-hover:text-[#a4e6ff]" /></Link>
            <Link className="entity-btn group relative rounded-full p-2 text-[#bbc9cf] hover:bg-[#2f3639]/50" href="/sources" aria-label="Notifications">
              <Bell size={20} className="group-hover:text-[#a4e6ff]" />
              <span className="entity-pulse-dot absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-[#0e1417] bg-[#ffb4ab]" />
            </Link>
            <div className="mx-2 h-6 w-px bg-[#3c494e]/30" />
            <div className="entity-btn flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-[#2f3639]/30">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#3c494e]/50 bg-[#242b2e]">
                <span className="font-mono text-xs text-[#a4e6ff]">JD</span>
              </div>
            </div>
          </div>
        </header>

        <main className="relative flex flex-1 overflow-hidden pt-16">
          <div className="entity-scrollbar z-10 flex flex-1 flex-col overflow-y-auto px-6 py-6">
            <div className="entity-stagger mb-6 flex items-center gap-2 overflow-x-auto pb-2" style={{ animationDelay: "150ms" }}>
              {filters.map((filter, index) => (
                <Link
                  className={`entity-btn whitespace-nowrap rounded-full border px-4 py-1.5 font-mono text-[13px] font-medium uppercase tracking-wider ${index === 0 ? "border-[#a4e6ff]/30 bg-[#a4e6ff]/10 text-[#a4e6ff] shadow-[0_0_10px_rgba(164,230,255,0.1)]" : "border-[#3c494e]/30 bg-[#1a2123] text-[#bbc9cf] hover:bg-[#242b2e] hover:text-[#dde3e7]"}`}
                  href={index === 0 ? "/entities" : `/search?q=${encodeURIComponent(filter)}`}
                  key={filter}
                >
                  {filter}
                </Link>
              ))}
            </div>

            <div className="grid min-h-min grid-cols-12 gap-6">
              <section className="entity-glass-panel entity-stagger col-span-12 flex min-h-[380px] flex-col overflow-hidden rounded-xl" style={{ animationDelay: "200ms" }}>
                <div className="flex items-center justify-between border-b border-[#3c494e]/20 bg-[#161d1f]/50 px-3 py-3">
                  <div className="flex items-center gap-2">
                    <Network className="text-[#a4e6ff]" size={18} />
                    <h2 className="font-mono text-[13px] font-medium uppercase tracking-wider text-[#dde3e7]">Network Map</h2>
                  </div>
                  <div className="flex gap-2">
                    {[ZoomIn, ZoomOut, Filter].map((Icon, index) => <Link className="entity-btn rounded p-1 text-[#bbc9cf] hover:bg-[#2f3639]/50" href={index === 2 ? "/search?q=entity%20filter" : "/entities"} key={index}><Icon size={16} /></Link>)}
                  </div>
                </div>
                <div className="entity-grid-bg relative flex-1 overflow-hidden bg-[#090f12]/80">
                  <svg className="absolute inset-0 z-0 h-full w-full pointer-events-none drop-shadow-[0_0_2px_rgba(0,209,255,0.3)]">
                    <line className="entity-data-flow opacity-60" stroke="#a4e6ff" strokeDasharray="4 4" strokeWidth="1.5" x1="50%" x2="70%" y1="50%" y2="35%" />
                    <line className="entity-data-flow" stroke="#3c494e" strokeDasharray="2 4" strokeWidth="1.5" x1="50%" x2="30%" y1="50%" y2="25%" />
                    <line className="entity-data-flow" stroke="#3c494e" strokeDasharray="2 4" strokeWidth="1.5" x1="50%" x2="25%" y1="50%" y2="70%" />
                    <line className="opacity-30" stroke="#3c494e" strokeWidth="1" x1="70%" x2="25%" y1="35%" y2="70%" />
                    <line className="entity-data-flow" stroke="#3c494e" strokeDasharray="2 4" strokeWidth="1.5" x1="50%" x2="80%" y1="50%" y2="65%" />
                  </svg>

                  <div className="entity-float-slow group absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 flex-col items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#a4e6ff] bg-[#1a2123] shadow-[0_0_20px_rgba(0,209,255,0.4)] transition-all duration-300 group-hover:scale-110">
                      <Building2 className="text-[#a4e6ff]" size={28} />
                    </div>
                    <span className="mt-2 rounded border border-[#a4e6ff]/20 bg-[#1a2123]/80 px-2 py-0.5 font-mono text-xs text-[#a4e6ff] backdrop-blur-sm">NALCO</span>
                  </div>

                  {[
                    { label: "Aluminium LME", pos: "left-[70%] top-[35%]", icon: Radar, active: true, float: "entity-float-fast" },
                    { label: "Ministry of Mines", pos: "left-[30%] top-[25%]", icon: Landmark, float: "entity-float-medium" },
                    { label: "Hindalco", pos: "left-[25%] top-[70%]", icon: Factory, float: "entity-float-slow" },
                    { label: "Vedanta", pos: "left-[80%] top-[65%]", icon: Factory, float: "entity-float-medium" }
                  ].map((node) => {
                    const Icon = node.icon;
                    return (
                      <div className={`${node.float} group absolute ${node.pos} z-10 flex -translate-x-1/2 flex-col items-center justify-center`} key={node.label}>
                        <div className={`${node.active ? "h-12 w-12 border-2 border-[#a4e6ff] bg-[#00d1ff]/20 shadow-[0_0_15px_rgba(0,209,255,0.3)]" : "h-10 w-10 border border-[#3c494e] bg-[#1a2123]"} relative flex items-center justify-center rounded-full transition-all duration-300 group-hover:scale-110 group-hover:border-[#a4e6ff]/50`}>
                          <Icon className={node.active ? "text-[#00d1ff]" : "text-[#bbc9cf]"} size={node.active ? 20 : 18} />
                          {node.active && <div className="entity-pulse-dot absolute -right-1 -top-1 h-3 w-3 rounded-full border border-[#0e1417] bg-[#ffb4ab]" />}
                        </div>
                        <span className="mt-2 whitespace-nowrap rounded border border-[#3c494e]/30 bg-[#1a2123]/80 px-2 py-0.5 font-mono text-[10px] text-[#bbc9cf] backdrop-blur-sm transition-transform duration-300 group-hover:translate-y-1">{node.label}</span>
                      </div>
                    );
                  })}

                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg border border-[#3c494e]/30 bg-[#161d1f]/80 px-3 py-1.5 backdrop-blur-md">
                    <Network className="animate-spin text-[#a4e6ff]" size={14} />
                    <span className="entity-loading-dots font-mono text-[10px] text-[#bbc9cf]">Mapping relationships</span>
                  </div>
                </div>
              </section>

              <section className="entity-glass-panel entity-stagger col-span-12 mb-16 flex flex-col overflow-hidden rounded-xl" style={{ animationDelay: "250ms" }}>
                <div className="flex items-center justify-between border-b border-[#3c494e]/30 bg-[#161d1f]/80 px-3 py-3">
                  <div className="flex items-center gap-2">
                    <Table2 className="text-[#bbc9cf]" size={18} />
                    <h3 className="font-mono text-[13px] font-medium uppercase tracking-wider text-[#dde3e7]">Entity Directory</h3>
                  </div>
                  <Link className="entity-btn flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-wider text-[#a4e6ff] hover:underline" href="/api/entities">
                    Export CSV <Download size={12} />
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#3c494e]/20 bg-[#090f12]/50">
                        {["Entity Name", "Type", "Mentions (24h)", "Sentiment Trend", "Materiality (0-100)"].map((heading, index) => (
                          <th className={`px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-wider text-[#bbc9cf] ${index === 2 ? "text-right" : index === 3 ? "text-center" : ""}`} key={heading}>{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="font-mono text-sm text-[#dde3e7]">
                      {directory.map((entity) => {
                        const Icon = iconForType(entity.type);
                        return (
                          <tr className={`entity-row group cursor-pointer border-b border-[#3c494e]/10 transition-colors ${entity.active ? "relative bg-[#a4e6ff]/5 hover:bg-[#a4e6ff]/10" : "hover:bg-[#242b2e]/30"}`} key={`${entity.type}-${entity.text}`}>
                            <td className="flex items-center gap-2 px-3 py-3">
                              {entity.active && <div className="absolute bottom-0 left-0 top-0 w-1 bg-[#a4e6ff]" />}
                              <Icon className={entity.active ? "text-[#a4e6ff]" : "text-[#bbc9cf]"} size={16} />
                              <span className={entity.active ? "font-medium text-[#a4e6ff]" : ""}>{entity.text}</span>
                            </td>
                            <td className="px-3 py-3"><span className="rounded-full border border-[#3c494e]/30 bg-[#1a2123] px-2 py-0.5 text-[10px] text-[#bbc9cf]">{entity.type.replaceAll("_", " ")}</span></td>
                            <td className="px-3 py-3 text-right">{entity.count.toLocaleString("en-IN")}</td>
                            <td className="px-3 py-3"><SparkBars tone={entity.tone} /></td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <span className="w-6 text-right text-xs">{entity.score}</span>
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#2f3639]">
                                  <div className="entity-materiality-bar h-full rounded-full bg-[#a4e6ff] shadow-[0_0_8px_rgba(0,209,255,0.5)]" style={{ "--target-width": `${entity.score}%` } as React.CSSProperties} />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>

          <aside className="entity-slide-right entity-glass-panel z-20 hidden h-full w-[360px] shrink-0 flex-col border-l border-[#3c494e]/30 shadow-[-8px_0_24px_-8px_rgba(0,0,0,0.5)] xl:flex" style={{ animationDelay: "300ms" }}>
            <div className="flex items-start justify-between border-b border-[#3c494e]/20 bg-[#161d1f]/50 px-6 py-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="entity-btn rounded border border-[#3c494e]/30 bg-[#1a2123] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#bbc9cf]">Commodity</span>
                  <span className="entity-pulse-dot h-2 w-2 rounded-full bg-[#ffb4ab] shadow-[0_0_8px_rgba(255,180,171,0.6)]" />
                </div>
                <h2 className="text-2xl font-semibold tracking-normal text-[#a4e6ff]">Aluminium LME</h2>
                <p className="mt-1 font-mono text-xs text-[#bbc9cf]">London Metal Exchange Pricing</p>
              </div>
              <Link className="entity-btn rounded-full p-1 text-[#bbc9cf] hover:bg-[#2f3639]/50" href="/entities"><X size={20} /></Link>
            </div>

            <div className="entity-scrollbar flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
              <section className="entity-stagger" style={{ animationDelay: "400ms" }}>
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="text-[#00d1ff]" size={16} />
                  <h3 className="font-mono text-[11px] uppercase tracking-wider text-[#bbc9cf]">AI Synopsis</h3>
                </div>
                <div className="relative rounded-lg border border-[#00d1ff]/20 bg-[#00d1ff]/5 p-3 text-sm leading-relaxed text-[#dde3e7] transition-colors hover:bg-[#00d1ff]/10">
                  LME Aluminium is mapped as a high-materiality commodity node because aluminium price movement, energy costs, coal availability, alumina and bauxite supply influence NALCO margin signals.
                </div>
              </section>

              <section className="entity-stagger" style={{ animationDelay: "450ms" }}>
                <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-[#bbc9cf]">Sentiment & Materiality</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg border border-[#3c494e]/30 bg-[#1a2123] p-3 transition-colors hover:border-[#ffb4ab]/30">
                    <div className="pointer-events-none absolute inset-0 bg-[#ffb4ab]/5" />
                    <span className="mb-1 font-mono text-[10px] text-[#bbc9cf]">Market Sentiment</span>
                    <span className="text-2xl font-semibold text-[#ffb4ab]">-2.4</span>
                    <span className="mt-1 flex items-center gap-0.5 font-mono text-[10px] text-[#ffb4ab]"><TrendingDown size={12} /> Bearish</span>
                  </div>
                  <div className="relative flex flex-col items-center justify-center rounded-lg border border-[#3c494e]/30 bg-[#1a2123] p-3 transition-colors hover:border-[#a4e6ff]/30">
                    <div className="pointer-events-none absolute inset-0 bg-[#a4e6ff]/5" />
                    <span className="mb-1 font-mono text-[10px] text-[#bbc9cf]">Impact to NALCO</span>
                    <span className="text-2xl font-semibold text-[#a4e6ff]">High</span>
                    <span className="mt-1 font-mono text-[10px] text-[#a4e6ff]">Score: 92/100</span>
                  </div>
                </div>
              </section>

              <section className="entity-stagger flex-1" style={{ animationDelay: "500ms" }}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-mono text-[11px] uppercase tracking-wider text-[#bbc9cf]">Crucial Mentions (24h)</h3>
                  <Link className="entity-btn font-mono text-[10px] uppercase tracking-wider text-[#a4e6ff] hover:underline" href="/sources">View All</Link>
                </div>
                <div className="flex flex-col gap-3">
                  {data.marketSignals.concat(data.policyMentions).slice(0, 2).map((doc, index) => (
                    <Link className="group block rounded-lg border border-[#3c494e]/20 bg-[#1a2123] p-3 transition-all hover:-translate-y-0.5 hover:bg-[#242b2e] hover:shadow-lg" href={`/sources/${doc.id}`} key={doc.id}>
                      <div className="mb-1 flex items-start justify-between">
                        <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${index === 0 ? "border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffb4ab]" : "border-[#c1c7cf]/30 bg-[#c1c7cf]/10 text-[#c1c7cf]"}`}>{index === 0 ? "Negative" : "Neutral"}</span>
                        <span className="font-mono text-[10px] text-[#bbc9cf]">{doc.sourceName}</span>
                      </div>
                      <h4 className="mb-1 text-sm font-medium text-[#dde3e7] transition-colors group-hover:text-[#a4e6ff]">{doc.title}</h4>
                      <div className="flex items-center gap-1 font-mono text-[10px] text-[#bbc9cf]"><LinkIcon size={12} /> {doc.sourceType.replaceAll("_", " ")}</div>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="entity-stagger mt-auto" style={{ animationDelay: "550ms" }}>
                <h3 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-[#bbc9cf]">Graph Neighbors</h3>
                <div className="flex flex-wrap gap-2">
                  {["NALCO", "Shanghai Futures Ex.", "Alcoa", "Bauxite Index"].map((item, index) => (
                    <span className="entity-btn flex cursor-pointer items-center gap-1 rounded border border-[#3c494e]/40 bg-[#1a2123] px-2 py-1 font-mono text-[11px] text-[#dde3e7] transition-colors hover:border-[#a4e6ff]/50" key={item}>
                      <span className={`h-1.5 w-1.5 rounded-full ${index === 0 ? "bg-[#a4e6ff]" : "bg-[#c1c7cf]"}`} />
                      {item}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
