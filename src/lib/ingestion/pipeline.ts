import { getAdapters, sourceStatus } from "@/lib/ingestion/adapters";
import { appendIngestionRun, sheetsConfigured } from "@/lib/google-sheets";
import { normalizeDocument } from "@/lib/nlp/extraction";
import { upsertDocuments } from "@/lib/store";
import type { IntelligenceDocument, RawSourceItem, SourceFetchMetadata, SourceFetchStatus } from "@/lib/types";

function emptyMetadata(): SourceFetchMetadata {
  return { sourceStatuses: [], failedUrls: [], retriedUrls: [], successfulNalcoPages: 0 };
}

function mergeUnique(...lists: Array<string[] | undefined>) {
  return [...new Set(lists.flatMap((list) => list || []))];
}

function sourceState(sourceStatuses: SourceFetchStatus[], name: string) {
  return sourceStatuses.find((source) => source.name === name)?.status;
}

export async function fetchSources() {
  const adapters = getAdapters();
  const results = await Promise.all(
    adapters.map(async (adapter) => {
      try {
        const items = await adapter.fetch();
        return { adapter, items, errors: adapter.errors || [] };
      } catch (error) {
        return { adapter, items: [] as RawSourceItem[], errors: [error instanceof Error ? error.message : String(error)] };
      }
    })
  );
  const errors = results.flatMap((result) => result.errors.map((error) => `${result.adapter.name}: ${error}`));
  const items = results.flatMap((result) => result.items);
  const metadata = results.reduce<SourceFetchMetadata>((current, result) => {
    const adapterMetadata = result.adapter.metadata || {};
    return {
      sourceStatuses: [...current.sourceStatuses, sourceStatus({ ...result.adapter, errors: result.errors }, result.items.length)],
      failedUrls: mergeUnique(current.failedUrls, adapterMetadata.failedUrls),
      retriedUrls: mergeUnique(current.retriedUrls, adapterMetadata.retriedUrls),
      successfulNalcoPages: current.successfulNalcoPages + (adapterMetadata.successfulNalcoPages || 0)
    };
  }, emptyMetadata());
  return { items, errors, metadata };
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
  const { items, errors, metadata } = await fetchSources();
  const normalized: IntelligenceDocument[] = deduplicateDocuments(items).map(normalizeDocument);
  await upsertDocuments(normalized);
  const result = {
    status: errors.length ? "completed_with_warnings" : "completed",
    fetched: items.length,
    stored: normalized.length,
    errors,
    sourceStatuses: metadata.sourceStatuses,
    nalcoStatus: sourceState(metadata.sourceStatuses, "NALCO Deep Website Crawl") || sourceState(metadata.sourceStatuses, "Mock Live NALCO Sources") || "skipped",
    gdeltStatus: sourceState(metadata.sourceStatuses, "GDELT News") || "skipped",
    newsApiStatus: sourceState(metadata.sourceStatuses, "NewsAPI") || "skipped",
    failedUrls: metadata.failedUrls,
    retriedUrls: metadata.retriedUrls,
    successfulNalcoPages: metadata.successfulNalcoPages
  };
  if (sheetsConfigured()) {
    await appendIngestionRun({
      timestamp: new Date().toISOString(),
      ...result
    }).catch(() => undefined);
  }
  return result;
}
