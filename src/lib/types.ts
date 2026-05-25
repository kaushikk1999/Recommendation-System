export type EntityType =
  | "COMPANY"
  | "COMMODITY"
  | "GEOGRAPHY"
  | "POLICYMAKER"
  | "REGULATOR"
  | "GOVERNMENT_BODY"
  | "EVENT_TYPE"
  | "RISK_FACTOR";

export type SourceType =
  | "press_release"
  | "investor_announcement"
  | "financial_result"
  | "annual_report"
  | "exchange_filing"
  | "commodity"
  | "news"
  | "policy";

export type Sentiment = "positive" | "negative" | "neutral";
export type Materiality = "high" | "medium" | "low";

export interface ExtractedEntity {
  text: string;
  type: EntityType;
  confidence: number;
}

export interface RawSourceItem {
  title: string;
  sourceName: string;
  sourceType: SourceType;
  url: string;
  publishedAt?: string | null;
  rawText: string;
}

export interface ConfiguredHtmlSource {
  enabled: boolean;
  sourceName: string;
  sourceType: SourceType;
  url: string;
  selector?: string | null;
  notes?: string | null;
}

export interface IngestionRunRecord {
  timestamp: string;
  fetched: number;
  stored: number;
  status: string;
  errors: string[];
  nalcoStatus?: string;
  gdeltStatus?: string;
  newsApiStatus?: string;
  failedUrls?: string[];
  retriedUrls?: string[];
  successfulNalcoPages?: number;
}

export interface SourceFetchStatus {
  name: string;
  status: "ok" | "warning" | "failed" | "skipped";
  critical: boolean;
  fetched: number;
  errors: string[];
}

export interface SourceFetchMetadata {
  sourceStatuses: SourceFetchStatus[];
  failedUrls: string[];
  retriedUrls: string[];
  successfulNalcoPages: number;
}

export interface IntelligenceDocument extends RawSourceItem {
  id: string;
  fetchedAt: string;
  cleanedText: string;
  summary: string;
  entities: ExtractedEntity[];
  commodities: string[];
  geographies: string[];
  policymakers: string[];
  eventType: string;
  sentiment: Sentiment;
  materialityScore: number;
  embedding: number[];
  hashKey: string;
}

export interface ChatCitation {
  id: string;
  title: string;
  sourceName: string;
  url: string;
  publishedAt?: string | null;
}

export interface ChatAnswer {
  answer: string;
  confidence: number;
  evidenceDateRange: string;
  entities: ExtractedEntity[];
  citations: ChatCitation[];
  liveRefreshStatus?: "completed" | "completed_with_warnings" | "failed";
  liveFetchedAt?: string;
  liveFetchedCount?: number;
  liveRefreshErrors?: string[];
  nalcoStatus?: string;
  gdeltStatus?: string;
  newsApiStatus?: string;
  failedUrls?: string[];
  retriedUrls?: string[];
  successfulNalcoPages?: number;
}
