import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { compactDate, percent } from "@/lib/utils";
import type { IntelligenceDocument } from "@/lib/types";

export function DocumentCard({ doc }: { doc: IntelligenceDocument }) {
  const tone = doc.sentiment === "positive" ? "good" : doc.sentiment === "negative" ? "bad" : "neutral";
  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge tone="info">{doc.sourceType.replaceAll("_", " ")}</Badge>
            <Badge tone={tone}>{doc.sentiment}</Badge>
            <Badge tone={doc.materialityScore >= 0.65 ? "warn" : "neutral"}>{percent(doc.materialityScore)} material</Badge>
          </div>
          <Link href={`/sources/${doc.id}`} className="text-base font-bold leading-snug hover:text-[var(--primary)]">
            {doc.title}
          </Link>
        </div>
        <a href={doc.url} target="_blank" rel="noreferrer" className="rounded-md p-2 text-[var(--muted)] hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Open source">
          <ExternalLink size={18} />
        </a>
      </div>
      <p className="line-clamp-3 text-sm leading-6 text-[var(--muted)]">{doc.summary}</p>
      <div className="mt-auto flex flex-wrap gap-2">
        {doc.entities.slice(0, 5).map((entity) => (
          <Badge key={`${doc.id}-${entity.type}-${entity.text}`}>{entity.text}</Badge>
        ))}
      </div>
      <div className="text-xs text-[var(--muted)]">{doc.sourceName} · {compactDate(doc.publishedAt)}</div>
    </Card>
  );
}
