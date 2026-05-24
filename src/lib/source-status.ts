import { env } from "@/lib/env";
import { getLastIngestionRun, getSheetSourceConfigs, getSheetsStatus } from "@/lib/google-sheets";
import { getOllamaStatus } from "@/lib/ollama";
import type { ConfiguredHtmlSource, IngestionRunRecord } from "@/lib/types";

export interface SourceStatus {
  name: string;
  status: string;
  live: boolean;
}

export function getSourceStatuses(): SourceStatus[] {
  return [
    { name: "NALCO Deep Website Crawl", status: "configured", live: env.ENABLE_LIVE_INGEST },
    { name: "NALCO Investor Relations", status: "included_in_deep_crawl", live: env.ENABLE_LIVE_INGEST },
    { name: "NSE Corporate Filings", status: "linkout", live: false },
    { name: "BSE Corporate Announcements", status: "linkout", live: false },
    { name: "GDELT News", status: env.GDELT_ENABLED ? "configured" : "disabled", live: env.GDELT_ENABLED },
    { name: "NewsAPI", status: env.NEWS_API_KEY ? "configured" : "needs_api_key", live: Boolean(env.NEWS_API_KEY) },
    { name: "Commodity API", status: env.COMMODITY_API_KEY ? "configured" : "fallback_mode", live: Boolean(env.COMMODITY_API_KEY) },
    { name: "Government Policy Watch", status: "configured", live: true }
  ];
}

export async function getDataSourcesStatus() {
  const [sheets, ollama, lastRun, configuredSources] = await Promise.all([
    getSheetsStatus(),
    getOllamaStatus(),
    getLastIngestionRun().catch(() => null as IngestionRunRecord | null),
    getSheetSourceConfigs().catch(() => [] as ConfiguredHtmlSource[])
  ]);
  return {
    sources: getSourceStatuses(),
    sheets,
    ollama,
    lastRun,
    configuredSources
  };
}
