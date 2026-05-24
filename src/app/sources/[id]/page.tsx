import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { compactDate, percent } from "@/lib/utils";
import { getDocument } from "@/lib/store";

export default async function SourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <Card>
          <h1 className="text-2xl font-black">Source not found</h1>
          <p className="mt-3 text-[var(--muted)]">The requested evidence item is not available in the current store.</p>
          <Link className="mt-5 inline-flex font-bold text-[var(--primary)]" href="/sources">Return to source library</Link>
        </Card>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone="info">{doc.sourceType.replaceAll("_", " ")}</Badge>
        <Badge>{doc.eventType}</Badge>
        <Badge tone={doc.materialityScore >= 0.65 ? "warn" : "neutral"}>{percent(doc.materialityScore)} material</Badge>
      </div>
      <h1 className="text-3xl font-black leading-tight">{doc.title}</h1>
      <p className="mt-3 text-[var(--muted)]">{doc.sourceName} · {compactDate(doc.publishedAt)}</p>
      <a href={doc.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)]">Open original source <ExternalLink size={16} /></a>
      <Card className="mt-6">
        <h2 className="text-xl font-black">Verified Summary</h2>
        <p className="mt-3 leading-7 text-[var(--muted)]">{doc.summary}</p>
      </Card>
      <Card className="mt-6">
        <h2 className="text-xl font-black">Detected Entities</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {doc.entities.map((entity) => <Badge key={`${entity.type}-${entity.text}`} tone="info">{entity.type}: {entity.text}</Badge>)}
        </div>
      </Card>
      <Card className="mt-6">
        <h2 className="text-xl font-black">Cleaned Text</h2>
        <p className="mt-3 whitespace-pre-wrap leading-7 text-[var(--muted)]">{doc.cleanedText}</p>
      </Card>
    </div>
  );
}
