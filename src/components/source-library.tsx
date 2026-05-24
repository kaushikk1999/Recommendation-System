"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  Bot,
  ChevronDown,
  Database,
  ExternalLink,
  Filter,
  HelpCircle,
  LayoutDashboard,
  Network,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Terminal,
  UserCircle
} from "lucide-react";
import { compactDate, cn, percent } from "@/lib/utils";
import type { ConfiguredHtmlSource, IngestionRunRecord, IntelligenceDocument, Sentiment, SourceType } from "@/lib/types";
import type { SourceStatus } from "@/lib/source-status";

const sourceOptions: Array<{ label: string; value: SourceType | "all" }> = [
  { label: "All sources", value: "all" },
  { label: "Press release", value: "press_release" },
  { label: "Exchange filing", value: "exchange_filing" },
  { label: "Investor announcement", value: "investor_announcement" },
  { label: "Commodity", value: "commodity" },
  { label: "Policy", value: "policy" },
  { label: "News", value: "news" }
];

const sentimentOptions: Array<{ label: string; value: Sentiment | "all" }> = [
  { label: "All sentiment", value: "all" },
  { label: "Positive", value: "positive" },
  { label: "Neutral", value: "neutral" },
  { label: "Negative", value: "negative" }
];

function sourceLabel(value: string) {
  return value.replaceAll("_", " ");
}

function sentimentClass(sentiment: Sentiment) {
  if (sentiment === "positive") {
    return "border-emerald-300/20 bg-emerald-300/10 text-emerald-200";
  }
  if (sentiment === "negative") {
    return "border-[#ffb4ab]/20 bg-[#ffb4ab]/10 text-[#ffb4ab]";
  }
  return "bg-[#2f3639] text-[#bbc9cf]";
}

function SourceLibraryShell({ active }: { active: "library" | "data-sources" }) {
  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Entity Explorer", href: "/entities", icon: Network },
    { label: "Source Library", href: "/sources", icon: Bot, active: active === "library" },
    { label: "Data Sources", href: "/sources/status", icon: Database, active: active === "data-sources" },
    { label: "Demo", href: "/demo", icon: Sparkles }
  ];

  return (
    <>
      <nav className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] flex-col border-r border-[#3c494e] bg-[#0e1417] p-6 text-[#a4e6ff] shadow-sm md:flex">
        <Link className="mb-16 flex items-center gap-3" href="/">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#a4e6ff]/30 bg-[#00d1ff]/20">
            <Terminal size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-none tracking-normal text-[#a4e6ff]">NALCO</h1>
            <p className="mt-1 font-mono text-[13px] font-medium uppercase tracking-wider text-[#bbc9cf]">Intelligence Terminal</p>
          </div>
        </Link>

        <ul className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <Link
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-base transition-colors duration-200 hover:bg-[#2f3639] hover:text-[#a4e6ff]",
                    item.active ? "overflow-hidden border-l-4 border-[#a4e6ff] bg-[#00d1ff]/10 font-bold text-[#a4e6ff]" : "text-[#bbc9cf]"
                  )}
                  href={item.href}
                >
                  {item.active ? <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#a4e6ff]/10 to-transparent" /> : null}
                  <Icon className="relative z-10 transition-colors group-hover:text-[#a4e6ff]" size={21} />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mb-6 mt-auto">
          <Link
            className="source-btn-tactile group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-[#3c494e] bg-[#2f3639] py-3 font-mono text-[13px] font-medium uppercase tracking-wider text-[#dde3e7] transition-all duration-200 hover:bg-[#333a3d]"
            href="/dashboard"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#a4e6ff]/5 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <Sparkles className="relative z-10 text-[#a4e6ff]" size={16} />
            <span className="relative z-10">Analyze Trends</span>
          </Link>
        </div>

        <div className="border-t border-[#3c494e] pt-3">
          <Link className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#bbc9cf] transition-colors hover:bg-[#2f3639]" href="/dashboard">
            <Settings size={18} />
            Settings
          </Link>
          <Link className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#bbc9cf] transition-colors hover:bg-[#2f3639]" href="/demo">
            <HelpCircle size={18} />
            Support
          </Link>
        </div>
      </nav>

      <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-[#3c494e] bg-[#0e1417]/80 px-4 text-[#a4e6ff] backdrop-blur-md md:left-[280px] md:px-6">
        <div className="flex items-center gap-4">
          <Link className="font-bold tracking-normal text-[#dde3e7]" href="/">
            NALCO Intelligence Terminal
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-[#3c494e]/30 bg-[#2f3639]/50 px-3 py-1 sm:flex">
            <span className="source-live-dot h-2 w-2 rounded-full bg-[#4cd6ff]" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#bbc9cf]">Live Ingestion</span>
          </div>
        </div>

        <form action="/search" className="mx-6 hidden max-w-md flex-1 lg:block">
          <div className="source-search-scan group relative rounded-lg focus-within:ring-1 focus-within:ring-[#a4e6ff]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbc9cf] transition-colors group-focus-within:text-[#a4e6ff]" size={16} />
            <input
              className="block w-full rounded-lg border border-[#3c494e]/50 bg-transparent py-2 pl-10 pr-16 font-mono text-sm text-[#dde3e7] placeholder:text-[#bbc9cf]/50 focus:border-[#a4e6ff]/50 focus:outline-none"
              name="q"
              placeholder="Command 'Cmd+K' to query global graph..."
              type="search"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-[#3c494e]/30 bg-[#2f3639]/30 px-1.5 py-0.5 font-mono text-xs text-[#bbc9cf]/60">Cmd K</span>
          </div>
        </form>

        <div className="flex items-center gap-2">
          <Link className="rounded-full p-2 text-[#bbc9cf] transition-all hover:bg-[#2f3639] hover:text-[#a4e6ff]" href="/search" aria-label="Open search">
            <Search size={20} />
          </Link>
          <Link className="rounded-full p-2 text-[#bbc9cf] transition-all hover:bg-[#2f3639] hover:text-[#a4e6ff]" href="/sources/status" aria-label="Data source status">
            <Bell size={20} />
          </Link>
          <div className="mx-2 hidden h-6 w-px bg-[#3c494e] sm:block" />
          <Link className="hidden items-center gap-2 rounded-full border border-transparent py-1.5 pl-2 pr-3 transition-all hover:border-[#3c494e] hover:bg-[#2f3639] sm:flex" href="/demo">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#a4e6ff]/40 bg-[#a4e6ff]/20">
              <UserCircle className="text-[#a4e6ff]" size={17} />
            </span>
            <span className="font-mono text-xs text-[#dde3e7]">Admin</span>
          </Link>
        </div>
      </header>
    </>
  );
}

function SourceTerminalLayout({ active, children }: { active: "library" | "data-sources"; children: ReactNode }) {
  return (
    <div className="source-terminal min-h-screen overflow-x-hidden bg-[#0e1417] text-[#dde3e7]">
      <SourceLibraryShell active={active} />
      <div className="relative flex min-h-screen flex-col md:ml-[280px]">
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-16 pt-[88px] md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function SourceCard({ doc, index }: { doc: IntelligenceDocument; index: number }) {
  return (
    <article className="source-glass-card source-card-reveal flex h-full flex-col rounded-xl p-4 lg:p-6" style={{ animationDelay: `${0.1 + index * 0.08}s` }}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-[#a4e6ff]/20 bg-[#a4e6ff]/10 px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wide text-[#a4e6ff]">
            {sourceLabel(doc.sourceType)}
          </span>
          <span className={cn("rounded-full border px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wide", sentimentClass(doc.sentiment))}>{doc.sentiment}</span>
          <span className="source-pulse-glow flex items-center gap-1 rounded-full border border-[#ffd59c]/20 bg-[#ffd59c]/10 px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wide text-[#ffd59c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ffd59c]" />
            {percent(doc.materialityScore)} material
          </span>
        </div>
        <a className="rounded-md p-1 text-[#bbc9cf] transition-colors hover:bg-[#2f3639] hover:text-[#a4e6ff]" href={doc.url} target="_blank" rel="noreferrer" title="Open original source" aria-label="Open original source">
          <ExternalLink size={18} />
        </a>
      </div>

      <Link className="mb-3 line-clamp-3 text-2xl font-semibold leading-8 tracking-normal text-[#dde3e7] transition-colors hover:text-[#a4e6ff]" href={`/sources/${doc.id}`}>
        {doc.title}
      </Link>
      <p className="mb-6 line-clamp-3 flex-1 text-sm leading-6 text-[#bbc9cf]">{doc.summary}</p>

      <div className="mt-auto">
        <div className="mb-4 flex flex-wrap gap-1.5">
          {doc.entities.slice(0, 3).map((entity) => (
            <span className="rounded border border-[#3c494e]/30 bg-[#2f3639]/50 px-2 py-0.5 font-mono text-xs text-[#bbc9cf] transition-colors hover:border-[#3c494e]" key={`${doc.id}-${entity.type}-${entity.text}`}>
              {entity.text}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[#3c494e]/30 pt-3 font-mono text-xs text-[#bbc9cf]/70">
          <span className="truncate">{doc.sourceName}</span>
          <span className="shrink-0">{compactDate(doc.publishedAt)}</span>
        </div>
      </div>
    </article>
  );
}

export function SourceLibrary({ docs }: { docs: IntelligenceDocument[] }) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<SourceType | "all">("all");
  const [sentiment, setSentiment] = useState<Sentiment | "all">("all");

  const filteredDocs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return docs.filter((doc) => {
      const matchesQuery = !normalizedQuery || [doc.title, doc.summary, doc.sourceName, doc.sourceType, ...doc.entities.map((entity) => entity.text)].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesSource = source === "all" || doc.sourceType === source;
      const matchesSentiment = sentiment === "all" || doc.sentiment === sentiment;
      return matchesQuery && matchesSource && matchesSentiment;
    });
  }, [docs, query, sentiment, source]);

  return (
    <SourceTerminalLayout active="library">
          <section className="source-fade-in-up mb-10" style={{ animationDelay: "0.1s" }}>
            <h2 className="mb-2 text-4xl font-bold leading-[48px] tracking-normal text-[#dde3e7]">Source Library</h2>
            <p className="max-w-3xl text-lg leading-7 text-[#bbc9cf]">All normalized documents retain original URLs, source names and materiality metadata.</p>
          </section>

          <section className="source-glass-panel source-fade-in-up relative z-20 mb-10 flex flex-col items-center gap-3 rounded-xl p-3 shadow-sm md:flex-row" style={{ animationDelay: "0.2s" }}>
            <div className="source-search-scan relative w-full flex-1 rounded-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbc9cf]" size={20} />
              <input
                className="w-full rounded-lg border border-[#3c494e]/60 bg-transparent py-2.5 pl-10 pr-4 text-sm text-[#dde3e7] placeholder:text-[#bbc9cf] transition-all focus:border-[#a4e6ff] focus:outline-none focus:ring-1 focus:ring-[#a4e6ff]/50"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search source title"
                type="search"
                value={query}
              />
            </div>

            <div className="relative w-full md:w-52">
              <select
                className="w-full appearance-none rounded-lg border border-[#3c494e]/60 bg-[#161d1f] py-2.5 pl-4 pr-10 text-sm text-[#dde3e7] transition-all hover:border-[#859399] focus:border-[#a4e6ff] focus:outline-none focus:ring-1 focus:ring-[#a4e6ff]/50"
                onChange={(event) => setSource(event.target.value as SourceType | "all")}
                value={source}
              >
                {sourceOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#bbc9cf]" size={17} />
            </div>

            <div className="relative w-full md:w-48">
              <select
                className="w-full appearance-none rounded-lg border border-[#3c494e]/60 bg-[#161d1f] py-2.5 pl-4 pr-10 text-sm text-[#dde3e7] transition-all hover:border-[#859399] focus:border-[#a4e6ff] focus:outline-none focus:ring-1 focus:ring-[#a4e6ff]/50"
                onChange={(event) => setSentiment(event.target.value as Sentiment | "all")}
                value={sentiment}
              >
                {sentimentOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#bbc9cf]" size={17} />
            </div>

            <button className="source-btn-tactile flex w-full items-center justify-center gap-2 rounded-lg bg-[#00677f] px-6 py-2.5 font-mono text-[13px] font-medium uppercase tracking-wider text-[#003543] shadow-[0_0_15px_rgba(0,103,127,0.3)] transition-all duration-300 hover:bg-[#00d1ff] md:w-auto" type="button">
              <Filter size={18} />
              Filter
            </button>
          </section>

          <div className="mb-4 font-mono text-xs uppercase tracking-wider text-[#bbc9cf]">{filteredDocs.length} of {docs.length} sources shown</div>

          {filteredDocs.length ? (
            <section className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredDocs.map((doc, index) => <SourceCard doc={doc} index={index} key={doc.id} />)}
            </section>
          ) : (
            <section className="source-glass-panel rounded-xl p-8 text-center">
              <h3 className="text-2xl font-semibold tracking-normal text-[#dde3e7]">No sources match the current filters</h3>
              <p className="mt-2 text-[#bbc9cf]">Try a broader title, source type, or sentiment.</p>
            </section>
          )}
    </SourceTerminalLayout>
  );
}

function statusClass(status: string) {
  if (status === "configured") {
    return "border-[#a4e6ff]/20 bg-[#a4e6ff]/10 text-[#a4e6ff]";
  }
  if (status === "needs_api_key" || status === "disabled") {
    return "border-[#ffb4ab]/20 bg-[#ffb4ab]/10 text-[#ffb4ab]";
  }
  if (status === "fallback_mode") {
    return "border-[#ffd59c]/20 bg-[#ffd59c]/10 text-[#ffd59c]";
  }
  return "border-[#3c494e] bg-[#2f3639] text-[#bbc9cf]";
}

export function DataSourcesStatus({
  sources,
  sheets,
  ollama,
  lastRun,
  configuredSources
}: {
  sources: SourceStatus[];
  sheets: { configured: boolean; ok: boolean; message: string };
  ollama: { configured: boolean; ok: boolean; model: string; message: string };
  lastRun: IngestionRunRecord | null;
  configuredSources: ConfiguredHtmlSource[];
}) {
  const liveCount = sources.filter((source) => source.live).length;
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function runIngestionNow() {
    setRunning(true);
    setMessage(null);
    try {
      const response = await fetch("/api/ingest/run", { method: "POST" });
      const result = await response.json();
      setMessage(response.ok ? `Ingestion ${result.status}: ${result.stored || 0} documents stored.` : result.error || "Ingestion failed.");
      router.refresh();
    } catch {
      setMessage("Ingestion failed. Check source credentials and network access.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <SourceTerminalLayout active="data-sources">
      <section className="source-fade-in-up mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between" style={{ animationDelay: "0.1s" }}>
        <div>
          <h2 className="mb-2 text-4xl font-bold leading-[48px] tracking-normal text-[#dde3e7]">Data Sources</h2>
          <p className="max-w-3xl text-lg leading-7 text-[#bbc9cf]">Connector health, live ingestion status, and fallback modes for the evidence pipeline.</p>
        </div>
        <div className="relative">
          <button
            className="source-btn-tactile flex items-center justify-center gap-2 rounded-lg bg-[#00d1ff] px-5 py-2.5 font-mono text-[13px] font-bold uppercase tracking-wider text-[#003543] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={running}
            onClick={runIngestionNow}
            type="button"
          >
            <RefreshCw className={running ? "animate-spin" : ""} size={18} />
            {running ? "Running" : "Run ingestion now"}
          </button>
          {message ? <div className="absolute right-0 top-12 z-20 w-80 rounded-lg border border-[#3c494e] bg-[#161d1f] p-3 text-sm text-[#dde3e7] shadow-xl">{message}</div> : null}
        </div>
      </section>

      <section className="source-glass-panel source-fade-in-up mb-8 grid gap-4 rounded-xl p-4 md:grid-cols-3" style={{ animationDelay: "0.2s" }}>
        <div className="rounded-lg border border-[#3c494e]/60 bg-[#161d1f] p-4">
          <div className="font-mono text-xs uppercase tracking-wider text-[#bbc9cf]">Total Sources</div>
          <div className="mt-2 text-3xl font-bold text-[#dde3e7]">{sources.length}</div>
        </div>
        <div className="rounded-lg border border-[#3c494e]/60 bg-[#161d1f] p-4">
          <div className="font-mono text-xs uppercase tracking-wider text-[#bbc9cf]">Live Connectors</div>
          <div className="mt-2 text-3xl font-bold text-[#a4e6ff]">{liveCount}</div>
        </div>
        <div className="rounded-lg border border-[#3c494e]/60 bg-[#161d1f] p-4">
          <div className="font-mono text-xs uppercase tracking-wider text-[#bbc9cf]">Fallback / Linkout</div>
          <div className="mt-2 text-3xl font-bold text-[#ffd59c]">{sources.length - liveCount}</div>
        </div>
      </section>

      <section className="source-glass-panel source-fade-in-up mb-8 grid gap-4 rounded-xl p-4 md:grid-cols-3" style={{ animationDelay: "0.25s" }}>
        <div className="rounded-lg border border-[#3c494e]/60 bg-[#161d1f] p-4">
          <div className="font-mono text-xs uppercase tracking-wider text-[#bbc9cf]">Google Sheets</div>
          <div className={cn("mt-2 text-lg font-semibold", sheets.ok ? "text-[#a4e6ff]" : "text-[#ffd59c]")}>{sheets.configured ? (sheets.ok ? "Connected" : "Needs attention") : "Not configured"}</div>
          <p className="mt-2 text-sm leading-6 text-[#bbc9cf]">{sheets.message}</p>
        </div>
        <div className="rounded-lg border border-[#3c494e]/60 bg-[#161d1f] p-4">
          <div className="font-mono text-xs uppercase tracking-wider text-[#bbc9cf]">Ollama Cloud</div>
          <div className={cn("mt-2 text-lg font-semibold", ollama.ok ? "text-[#a4e6ff]" : "text-[#ffd59c]")}>{ollama.configured ? (ollama.ok ? "Connected" : "Needs attention") : "Not configured"}</div>
          <p className="mt-2 text-sm leading-6 text-[#bbc9cf]">{ollama.model}: {ollama.message}</p>
        </div>
        <div className="rounded-lg border border-[#3c494e]/60 bg-[#161d1f] p-4">
          <div className="font-mono text-xs uppercase tracking-wider text-[#bbc9cf]">Last Ingestion</div>
          <div className="mt-2 text-lg font-semibold text-[#dde3e7]">{lastRun ? lastRun.status.replaceAll("_", " ") : "No run recorded"}</div>
          <p className="mt-2 text-sm leading-6 text-[#bbc9cf]">{lastRun ? `${lastRun.stored} stored from ${lastRun.fetched} fetched at ${new Date(lastRun.timestamp).toLocaleString()}` : "Runs are recorded when Google Sheets is configured."}</p>
        </div>
      </section>

      {configuredSources.length ? (
        <section className="source-glass-panel source-fade-in-up mb-8 rounded-xl p-4" style={{ animationDelay: "0.3s" }}>
          <h3 className="mb-4 text-2xl font-semibold tracking-normal text-[#dde3e7]">Configured HTML Sources</h3>
          <div className="grid gap-3">
            {configuredSources.map((source) => (
              <a className="rounded-lg border border-[#3c494e]/60 bg-[#161d1f] p-4 transition-colors hover:border-[#00d1ff]/50" href={source.url} key={`${source.sourceName}-${source.url}`} rel="noreferrer" target="_blank">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-semibold text-[#dde3e7]">{source.sourceName}</span>
                  <span className="rounded-full border border-[#a4e6ff]/20 bg-[#a4e6ff]/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-[#a4e6ff]">{source.sourceType.replaceAll("_", " ")}</span>
                </div>
                <div className="mt-2 break-all font-mono text-xs text-[#bbc9cf]">{source.url}</div>
                {source.selector ? <div className="mt-2 font-mono text-xs text-[#ffd59c]">Selector: {source.selector}</div> : null}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sources.map((source, index) => (
          <article className="source-glass-card source-card-reveal rounded-xl p-5" key={source.name} style={{ animationDelay: `${0.1 + index * 0.07}s` }}>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold tracking-normal text-[#dde3e7]">{source.name}</h3>
                <p className="mt-1 font-mono text-xs uppercase tracking-wider text-[#bbc9cf]">Pipeline connector</p>
              </div>
              <span className={cn("rounded-full border px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wide", statusClass(source.status))}>{source.status.replaceAll("_", " ")}</span>
            </div>
            <div className="flex items-center justify-between border-t border-[#3c494e]/30 pt-4">
              <span className="font-mono text-xs uppercase tracking-wider text-[#bbc9cf]">Runtime</span>
              <span className={cn("flex items-center gap-2 font-mono text-sm", source.live ? "text-[#a4e6ff]" : "text-[#bbc9cf]")}>
                <span className={cn("h-2 w-2 rounded-full", source.live ? "source-live-dot bg-[#4cd6ff]" : "bg-[#3c494e]")} />
                {source.live ? "Live" : "Not live"}
              </span>
            </div>
          </article>
        ))}
      </section>
    </SourceTerminalLayout>
  );
}
