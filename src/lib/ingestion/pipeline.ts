import { getAdapters } from "@/lib/ingestion/adapters";
import { appendIngestionRun, sheetsConfigured } from "@/lib/google-sheets";
import { normalizeDocument } from "@/lib/nlp/extraction";
import { upsertDocuments } from "@/lib/store";
import type { IntelligenceDocument, RawSourceItem } from "@/lib/types";

export async function fetchSources() {
  const adapters = getAdapters();
  const results = await Promise.allSettled(adapters.map(async (adapter) => ({ adapter: adapter.name, items: await adapter.fetch(), errors: adapter.errors || [] })));
  const errors = results
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => String(result.reason?.message || result.reason))
    .concat(results.flatMap((result) => (result.status === "fulfilled" ? result.value.errors.map((error) => `${result.value.adapter}: ${error}`) : [])));
  const items = results.flatMap((result) => (result.status === "fulfilled" ? result.value.items : []));
  return { items, errors };
}

export function deduplicateDocuments(items: RawSourceItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.url || `${item.sourceName}:${item.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function runIngestion() {
  const { items, errors } = await fetchSources();
  const normalized: IntelligenceDocument[] = deduplicateDocuments(items).map(normalizeDocument);
  await upsertDocuments(normalized);
  const result = {
    status: errors.length ? "completed_with_warnings" : "completed",
    fetched: items.length,
    stored: normalized.length,
    errors
  };
  if (sheetsConfigured()) {
    await appendIngestionRun({
      timestamp: new Date().toISOString(),
      ...result
    }).catch(() => undefined);
  }
  return result;
}
