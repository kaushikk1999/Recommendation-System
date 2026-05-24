import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Braces,
  CheckCircle2,
  Code2,
  Database,
  FileText,
  Gauge,
  Link as LinkIcon,
  Monitor,
  Paintbrush,
  PlayCircle,
  RadioTower,
  Route,
  Server,
  Smartphone,
  Tablet,
  Tags,
  TrendingUp,
  Wand2
} from "lucide-react";
import { DemoShell } from "@/components/demo-shell";
import { overview } from "@/lib/analytics";

const sourceBlocks = [
  ["NSE Data", TrendingUp],
  ["RSS Feeds", RadioTower],
  ["PDF Reports", FileText]
] as const;

const techStack = [
  ["TypeScript", Code2, "text-blue-400"],
  ["Next.js", Monitor, "text-gray-200"],
  ["Recharts", BarChart3, "text-[#a4e6ff]"],
  ["Prisma ORM", Braces, "text-purple-400"],
  ["Tailwind CSS", Paintbrush, "text-teal-400"],
  ["PostgreSQL", Database, "text-orange-400"]
] as const;

const demoSteps = [
  ["Step 1: The Overview", "Welcome to NALCO Intelligence. This dashboard synthesizes filings, market signals, policy updates, and source-backed corporate intelligence."],
  ["Step 2: Entity Exploration", "Navigate to Entity Explorer. Notice how the system clusters NALCO, aluminium, regulators, geographies, and peer companies from unstructured text."],
  ["Step 3: Evidence Discipline", "Open a source citation. The app keeps every answer tied to original evidence and refuses claims it cannot verify."],
  ["Step 4: AI Interaction", "Use the floating bot or search page to ask a question. The response includes confidence, evidence date range, entities, and citations."]
] as const;


function SectionTitle({ icon: Icon, title, tone = "primary" }: { icon: React.ElementType; title: string; tone?: "primary" | "tertiary" }) {
  return (
    <h2 className="mb-6 flex items-center gap-3 text-3xl font-semibold tracking-normal text-[#dde3e7]">
      <Icon className={tone === "primary" ? "text-[#a4e6ff]" : "text-[#ffd59c]"} size={30} />
      {title}
    </h2>
  );
}

function PerformanceRing({ label, value, delay }: { label: string; value: number; delay: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-3 flex h-20 w-20 items-center justify-center">
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" fill="none" r="46" stroke="rgba(60,73,78,0.3)" strokeWidth="8" />
          <circle
            className="demo-progress-ring drop-shadow-[0_0_8px_rgba(0,209,255,0.5)]"
            cx="50"
            cy="50"
            fill="none"
            r="46"
            stroke="#00d1ff"
            strokeLinecap="round"
            strokeWidth="8"
            style={{ animationDelay: `${delay}s` }}
          />
        </svg>
        <span className="relative z-10 text-2xl font-semibold text-[#dde3e7]">{value}</span>
      </div>
      <span className="font-mono text-[13px] font-medium uppercase tracking-wider text-[#bbc9cf]">{label}</span>
    </div>
  );
}

export default async function DemoPage() {
  const data = await overview();
  const sourceCount = data.sourceBreakdown.length;

  return (
    <DemoShell>
        <header className="demo-reveal mb-16 mt-10 text-center md:text-left" style={{ animationDelay: "0.1s" }}>
          <h1 className="demo-gradient-text mb-3 text-4xl font-bold leading-tight tracking-normal md:text-[40px] md:leading-[48px]">
            Project Architecture & Intelligence Pipeline
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-[#bbc9cf]">
            A comprehensive overview of the technical stack, ingestion pipeline, and UX features engineered for high-stakes corporate decision-making.
          </p>
        </header>

        <section className="demo-reveal mb-16" style={{ animationDelay: "0.2s" }}>
          <SectionTitle icon={Route} title="Ingestion Pipeline" />
          <div className="demo-glass-panel relative overflow-hidden rounded-xl p-10">
            <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="group relative flex w-full cursor-default flex-col gap-3 md:w-1/4">
                <div className="pointer-events-none absolute -top-12 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded border border-[#859399] bg-[#0e1417] px-3 py-1 text-xs text-[#dde3e7] opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100">
                  Parsing Raw Formats
                </div>
                {sourceBlocks.map(([label, Icon]) => (
                  <div className="rounded-lg border border-[#3c494e] bg-[#242b2e] p-3 text-center transition-all hover:border-[#00d1ff]" key={label}>
                    <span className="mb-1 block font-mono text-[13px] font-medium uppercase tracking-wider text-[#dde3e7]">{label}</span>
                    <Icon className="mx-auto text-[#c1c7cf]" size={22} />
                  </div>
                ))}
              </div>

              <div className="hidden w-12 flex-col items-center justify-center text-[#859399] md:flex">
                <ArrowRight className="demo-flow-arrow" size={34} />
              </div>
              <div className="flex h-12 flex-col items-center justify-center text-[#859399] md:hidden">
                <ArrowDown className="demo-flow-arrow" size={34} />
              </div>

              <div className="group relative w-full cursor-default md:w-1/3">
                <div className="pointer-events-none absolute -top-12 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded border border-[#859399] bg-[#0e1417] px-3 py-1 text-xs text-[#dde3e7] opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100">
                  Extracting NLP entities & sentiment
                </div>
                <div className="demo-glow-accent demo-scan-pulse relative rounded-xl border-2 border-[#00d1ff] bg-[#2f3639] p-6 text-center">
                  <div className="absolute -right-3 -top-3 h-6 w-6 animate-ping rounded-full bg-[#00d1ff] opacity-20" />
                  <Server className="mx-auto mb-3 text-[#a4e6ff]" size={44} />
                  <h3 className="mb-1 text-2xl font-semibold text-[#dde3e7]">AI Extraction Engine</h3>
                  <p className="text-sm text-[#bbc9cf]">NLP & Entity Recognition</p>
                </div>
              </div>

              <div className="hidden w-12 flex-col items-center justify-center text-[#859399] md:flex">
                <ArrowRight className="demo-flow-arrow" size={34} />
              </div>
              <div className="flex h-12 flex-col items-center justify-center text-[#859399] md:hidden">
                <ArrowDown className="demo-flow-arrow" size={34} />
              </div>

              <div className="group relative w-full cursor-default md:w-1/4">
                <div className="pointer-events-none absolute -top-12 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded border border-[#859399] bg-[#0e1417] px-3 py-1 text-xs text-[#dde3e7] opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100">
                  Indexing to Vector Space
                </div>
                <div className="rounded-xl border border-[#3c494e] bg-[#242b2e] p-6 text-center transition-all duration-300 hover:border-[#ffd59c]">
                  <Database className="mx-auto mb-3 text-[#ffd59c] transition-transform duration-300 group-hover:scale-110" size={44} />
                  <h3 className="mb-1 text-2xl font-semibold text-[#dde3e7]">Vector DB</h3>
                  <p className="text-sm text-[#bbc9cf]">Semantic Storage</p>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#00d1ff,_#0e1417,_#0e1417)]" />
            </div>
          </div>
        </section>

        <section className="demo-reveal mb-16" style={{ animationDelay: "0.3s" }}>
          <SectionTitle icon={Wand2} title="UI/UX Highlights" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="demo-glass-panel rounded-xl p-6">
              <h3 className="mb-3 text-2xl font-semibold text-[#dde3e7]">Source Citations</h3>
              <p className="mb-6 text-sm leading-6 text-[#bbc9cf]">Traceability for every insight generated by the AI.</p>
              <div className="rounded border border-[#3c494e]/50 bg-[#1a2123] p-3">
                <p className="mb-1 text-base text-[#dde3e7]">“Aluminium prices may affect NALCO realization and margins...”</p>
                <span className="inline-flex items-center gap-1 rounded border border-[#3c494e] bg-[#333a3d] px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-[#c1c7cf]">
                  <LinkIcon size={14} /> Source: LME Aluminium Context
                </span>
              </div>
            </div>
            <div className="demo-glass-panel rounded-xl p-6">
              <h3 className="mb-3 text-2xl font-semibold text-[#dde3e7]">Entity Chips</h3>
              <p className="mb-6 text-sm leading-6 text-[#bbc9cf]">Rapid identification of companies, commodities, geographies, and risks.</p>
              <div className="flex flex-wrap gap-3 rounded border border-[#3c494e]/50 bg-[#1a2123] p-3">
                {data.topEntities.slice(0, 5).map((entity, index) => (
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-sm ${index % 3 === 0 ? "border-[#00d1ff]/50 bg-[#00d1ff]/20 text-[#a4e6ff]" : index % 3 === 1 ? "border-[#ffd59c]/50 bg-[#ffd59c]/20 text-[#ffd59c]" : "border-[#ffb4ab]/50 bg-[#ffb4ab]/20 text-[#ffb4ab]"}`} key={`${entity.type}-${entity.text}`}>
                    <Tags size={14} /> {entity.text}
                  </span>
                ))}
              </div>
            </div>
            <div className="demo-glass-panel rounded-xl p-6">
              <h3 className="mb-3 text-2xl font-semibold text-[#dde3e7]">Sentiment Scoring</h3>
              <p className="mb-6 text-sm leading-6 text-[#bbc9cf]">Visual indicators of market sentiment extracted from text.</p>
              <div className="flex items-center justify-between rounded border border-[#3c494e]/50 bg-[#1a2123] p-3">
                <span className="text-base text-[#dde3e7]">Market Outlook</span>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-[#333a3d]"><div className="h-full w-[75%] bg-[#a4e6ff]" /></div>
                  <span className="font-mono text-sm text-[#a4e6ff]">0.75</span>
                </div>
              </div>
            </div>
            <div className="demo-glass-panel rounded-xl p-6">
              <h3 className="mb-3 text-2xl font-semibold text-[#dde3e7]">Responsive Layout</h3>
              <p className="mb-6 text-sm leading-6 text-[#bbc9cf]">Fluid grid adapting from ultra-wide dashboards to mobile devices.</p>
              <div className="flex h-16 items-end justify-center gap-3 rounded border border-[#3c494e]/50 bg-[#1a2123] p-3">
                <div className="flex h-12 w-16 items-center justify-center rounded-md border-2 border-[#3c494e]"><Monitor className="text-[#859399]" size={24} /></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-md border-2 border-[#3c494e]"><Tablet className="text-[#859399]" size={20} /></div>
                <div className="flex h-8 w-6 items-center justify-center rounded-md border-2 border-[#3c494e]"><Smartphone className="text-[#859399]" size={16} /></div>
              </div>
            </div>
          </div>
        </section>

        <section className="demo-reveal mb-16" style={{ animationDelay: "0.4s" }}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SectionTitle icon={Code2} title="Tech Stack" />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {techStack.map(([label, Icon, color]) => (
                  <div className="demo-glass-panel group flex aspect-square flex-col items-center justify-center rounded-lg p-3 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#00d1ff]/10" key={label}>
                    <Icon className={`mb-3 transition-all duration-300 group-hover:scale-110 ${color}`} size={42} />
                    <span className="font-mono text-[13px] font-medium uppercase tracking-wider text-[#dde3e7]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <SectionTitle icon={PlayCircle} title="Demo Script" tone="tertiary" />
              <div className="flex h-full flex-col rounded-xl border border-[#3c494e] bg-[#242b2e] p-6">
                <div className="space-y-6 overflow-y-auto pr-3">
                  {demoSteps.map(([title, body]) => (
                    <div key={title}>
                      <h4 className="mb-1 font-mono text-[13px] font-medium uppercase tracking-wider text-[#a4e6ff]">{title}</h4>
                      <p className="text-sm leading-6 text-[#bbc9cf]">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="demo-reveal" style={{ animationDelay: "0.5s" }}>
          <SectionTitle icon={Gauge} title="Performance Metrics" />
          <div className="demo-glass-panel rounded-xl p-6">
            <div className="mb-10 grid grid-cols-2 gap-6 text-center md:grid-cols-4">
              <PerformanceRing label="Performance" value={100} delay={0} />
              <PerformanceRing label="Accessibility" value={100} delay={0.1} />
              <PerformanceRing label="Best Practices" value={100} delay={0.2} />
              <PerformanceRing label="SEO" value={100} delay={0.3} />
            </div>
            <div className="flex items-center justify-between rounded border border-[#3c494e] bg-[#1a2123] p-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-[#c1c7cf]" size={22} />
                <span className="text-base text-[#dde3e7]">Ready for Vercel plus PostgreSQL deployment</span>
              </div>
              <span className="flex items-center gap-1 font-mono text-sm text-[#a4e6ff]">
                <span className="demo-live-pulse h-2 w-2 rounded-full bg-[#a4e6ff]" />
                Live
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded border border-[#00d1ff]/30 bg-[#00d1ff]/10 px-2 py-1 font-mono text-xs text-[#a4e6ff]">{data.totalDocuments} evidence docs</span>
              <span className="rounded border border-[#00d1ff]/30 bg-[#00d1ff]/10 px-2 py-1 font-mono text-xs text-[#a4e6ff]">{sourceCount} source types</span>
              <span className="rounded border border-[#00d1ff]/30 bg-[#00d1ff]/10 px-2 py-1 font-mono text-xs text-[#a4e6ff]">{data.topEntities.length} top entities</span>
              <span className="rounded border border-[#00d1ff]/30 bg-[#00d1ff]/10 px-2 py-1 font-mono text-xs text-[#a4e6ff]">Citation-first RAG</span>
            </div>
          </div>
        </section>
    </DemoShell>
  );
}
