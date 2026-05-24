import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Bot,
  FileText,
  Gavel,
  Globe2,
  LineChart,
  Newspaper,
  Radar,
  RadioTower,
  ShieldAlert,
  Telescope
} from "lucide-react";

const capabilities = [
  {
    title: "News Ingestion",
    body: "Real-time aggregation of industry news, market reports, and regulatory announcements relevant to NALCO.",
    icon: Newspaper
  },
  {
    title: "Entity Detection",
    body: "Automated extraction and mapping of key entities, competitors, commodities, geographies, and policy institutions.",
    icon: Globe2
  },
  {
    title: "Source-Cited Answers",
    body: "AI responses backed by direct citations to original filings, official releases, and verified reports.",
    icon: FileText
  },
  {
    title: "Aluminium Market Signals",
    body: "Monitoring of LME context, energy costs, input commodities, inventory signals, and macro indicators affecting aluminium.",
    icon: LineChart
  },
  {
    title: "Policy Monitoring",
    body: "Tracking of government policy, export/import duties, mining regulation, and environmental updates impacting operations.",
    icon: Gavel
  },
  {
    title: "Risk Analysis",
    body: "Proactive identification of supply chain disruptions, commodity volatility, policy risk, and operational vulnerabilities.",
    icon: ShieldAlert
  }
];

export default function Home() {
  return (
    <div className="nalco-landing min-h-screen overflow-hidden antialiased">
      <header className="fixed top-0 z-40 w-full border-b border-[#3c494e]/30 bg-[#0e1417]/80 shadow-sm backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-6">
          <Link className="nalco-interactive text-2xl font-bold tracking-normal text-[#a4e6ff] transition-opacity hover:opacity-80" href="/">
            NALCO Intelligence
          </Link>
          <div className="flex items-center gap-6">
            <nav className="hidden gap-10 md:flex">
              <Link className="border-b-2 border-[#a4e6ff] py-4 font-mono text-[13px] font-medium uppercase tracking-wider text-[#a4e6ff] transition-colors hover:text-[#b7eaff]" href="/">
                Platform
              </Link>
              <Link className="nalco-interactive rounded-t px-2 py-4 font-mono text-[13px] font-medium uppercase tracking-wider text-[#bbc9cf] transition-colors hover:text-[#a4e6ff]" href="/dashboard">
                Features
              </Link>
              <Link className="nalco-interactive rounded-t px-2 py-4 font-mono text-[13px] font-medium uppercase tracking-wider text-[#bbc9cf] transition-colors hover:text-[#a4e6ff]" href="/demo">
                Architecture
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link className="nalco-interactive rounded-full p-2 text-[#a4e6ff] transition-all hover:bg-[#2f3639]/50 hover:text-[#b7eaff]" href="/sources" aria-label="Source sensors">
                <Radar size={22} />
              </Link>
              <Link className="nalco-interactive rounded-full p-2 text-[#a4e6ff] transition-all hover:bg-[#2f3639]/50 hover:text-[#b7eaff]" href="/dashboard" aria-label="Notifications">
                <Bell size={22} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow pb-20 pt-24">
        <section className="relative mx-auto flex max-w-[1440px] flex-col items-center overflow-hidden px-6 py-16 text-center md:py-24">
          <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00d1ff]/5 blur-[100px]" />
          <div className="nalco-fade-in-up nalco-float mb-8 inline-flex items-center gap-2 rounded-full border border-[#00d1ff]/30 bg-[#00d1ff]/10 px-3 py-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#00d1ff]" />
            <span className="font-mono text-[13px] font-medium uppercase tracking-wider text-[#00d1ff]">Live Intelligence Feed Active</span>
          </div>
          <h1 className="nalco-fade-in-up nalco-stagger-1 mb-6 max-w-4xl text-5xl font-bold leading-tight tracking-normal text-[#dde3e7] md:text-[40px] md:leading-[48px] lg:text-6xl lg:leading-tight">
            Real-Time NALCO Intelligence,
            <br />
            <span className="nalco-pulse-glow bg-gradient-to-r from-[#00d1ff] to-[#4cd6ff] bg-clip-text text-transparent">
              Powered by AI
            </span>
          </h1>
          <p className="nalco-fade-in-up nalco-stagger-2 mb-10 max-w-2xl text-lg leading-8 text-[#bbc9cf]">
            Track filings, news, aluminium signals, policy updates, and entity-level intelligence from verified public sources.
          </p>
          <div className="nalco-fade-in-up nalco-stagger-3 flex flex-col gap-4 sm:flex-row">
            <Link className="nalco-interactive nalco-shimmer-btn glow-effect flex items-center justify-center gap-2 rounded px-8 py-3 text-base font-semibold transition-all" href="/dashboard">
              Open Intelligence Dashboard
              <ArrowRight size={20} />
            </Link>
            <Link className="nalco-interactive flex items-center justify-center gap-2 rounded border border-[#3c494e] bg-[#242b2e] px-8 py-3 text-base font-semibold text-[#dde3e7] transition-all hover:border-[#859399] hover:bg-[#333a3d]" href="/search?q=latest%20NALCO%20announcements">
              Try the Bot
              <Bot size={20} />
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-6 py-16">
          <h2 className="mb-12 text-center text-3xl font-semibold tracking-normal text-[#dde3e7] md:text-[32px] md:leading-[40px]">Core Capabilities</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((capability, index) => {
              const Icon = capability.icon;
              return (
                <div
                  className="nalco-glass-panel nalco-interactive nalco-fade-in-up flex flex-col gap-4 rounded-xl p-6"
                  style={{ animationDelay: `${index * 100}ms` }}
                  key={capability.title}
                >
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-[#242b2e] text-[#00d1ff] transition-transform duration-300">
                    <Icon size={28} />
                  </div>
                  <h3 className="text-2xl font-semibold tracking-normal text-[#dde3e7]">{capability.title}</h3>
                  <p className="text-base leading-6 text-[#bbc9cf]">{capability.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-6 pb-16">
          <div className="nalco-glass-panel grid gap-6 rounded-xl p-6 md:grid-cols-3">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#242b2e] text-[#00d1ff]">
                <RadioTower size={26} />
              </div>
              <div>
                <div className="font-mono text-[13px] uppercase tracking-wider text-[#bbc9cf]">Sources</div>
                <div className="text-xl font-semibold text-[#dde3e7]">Official, exchange, news, commodity</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#242b2e] text-[#00d1ff]">
                <Telescope size={26} />
              </div>
              <div>
                <div className="font-mono text-[13px] uppercase tracking-wider text-[#bbc9cf]">RAG</div>
                <div className="text-xl font-semibold text-[#dde3e7]">Citation-first answers only</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#242b2e] text-[#00d1ff]">
                <Bot size={26} />
              </div>
              <div>
                <div className="font-mono text-[13px] uppercase tracking-wider text-[#bbc9cf]">Assistant</div>
                <div className="text-xl font-semibold text-[#dde3e7]">Floating Ask Eva style bot</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-[#3c494e]/30 bg-[#090f12]">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="nalco-interactive text-lg font-bold text-[#a4e6ff] transition-colors hover:text-[#b7eaff]">NALCO Intelligence</span>
            <span className="text-[#bbc9cf]">|</span>
            <span className="text-sm text-[#bbc9cf]">AI-Powered Analytics Platform Demo</span>
          </div>
          <div className="flex gap-4">
            <Link className="nalco-interactive font-mono text-[13px] font-medium uppercase tracking-wider text-[#bbc9cf] transition-colors hover:text-[#a4e6ff]" href="/demo">
              Documentation
            </Link>
            <Link className="nalco-interactive font-mono text-[13px] font-medium uppercase tracking-wider text-[#bbc9cf] transition-colors hover:text-[#a4e6ff]" href="/api/health">
              API Access
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
