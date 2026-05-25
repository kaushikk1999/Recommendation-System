import OpenAI from "openai";
import { env } from "@/lib/env";
import { isUsableEvidence, validEvidenceDate } from "@/lib/evidence-quality";
import { runIngestion } from "@/lib/ingestion/pipeline";
import { cosineSimilarity, createLocalEmbedding } from "@/lib/nlp/extraction";
import { ollamaChat, ollamaChatStream, ollamaConfigured } from "@/lib/ollama";
import { listDocuments } from "@/lib/store";
import type { ChatAnswer, IntelligenceDocument } from "@/lib/types";

type LiveRefreshMetadata = Pick<
  ChatAnswer,
  | "liveRefreshStatus"
  | "liveFetchedAt"
  | "liveFetchedCount"
  | "liveRefreshErrors"
  | "nalcoStatus"
  | "gdeltStatus"
  | "newsApiStatus"
  | "failedUrls"
  | "retriedUrls"
  | "successfulNalcoPages"
>;

type PreparedAnswer = {
  refusal?: ChatAnswer;
  liveRefresh: LiveRefreshMetadata;
  retrieved: Awaited<ReturnType<typeof retrieveDocuments>>;
  docs: IntelligenceDocument[];
  evidence: string;
  confidence: number;
};

const globalForChatRefresh = globalThis as unknown as {
  nalcoChatRefresh?: {
    running?: Promise<LiveRefreshMetadata>;
  };
};

const chatRefreshState = (globalForChatRefresh.nalcoChatRefresh ??= {});

function friendlyRefreshErrors(result: Awaited<ReturnType<typeof runIngestion>>) {
  const warnings: string[] = [];
  const nalcoMessage = result.nalcoStatus === "warning" ? "NALCO refresh completed with partial warnings." : "NALCO refreshed successfully.";
  if (result.nalcoStatus === "ok" || result.nalcoStatus === "warning") {
    if (result.gdeltStatus === "failed") warnings.push(`${nalcoMessage} External news feed was temporarily rate-limited or unavailable.`);
    if (result.newsApiStatus === "failed") warnings.push(`${nalcoMessage} NewsAPI was unavailable.`);
  }
  if (result.nalcoStatus === "failed") warnings.push("NALCO live refresh had issues; using the latest stored verified evidence where available.");
  if (!warnings.length && result.errors.length) warnings.push("Some optional sources could not be refreshed, but available evidence was still used.");
  return warnings;
}

async function performLiveRefresh(): Promise<LiveRefreshMetadata> {
  const fetchedAt = new Date().toISOString();
  try {
    const result = await runIngestion();
    return {
      liveRefreshStatus: result.status === "completed_with_warnings" ? "completed_with_warnings" : "completed",
      liveFetchedAt: fetchedAt,
      liveFetchedCount: result.fetched,
      liveRefreshErrors: friendlyRefreshErrors(result),
      nalcoStatus: result.nalcoStatus,
      gdeltStatus: result.gdeltStatus,
      newsApiStatus: result.newsApiStatus,
      failedUrls: result.failedUrls.slice(0, 20),
      retriedUrls: result.retriedUrls.slice(0, 20),
      successfulNalcoPages: result.successfulNalcoPages
    };
  } catch (error) {
    return {
      liveRefreshStatus: "failed",
      liveFetchedAt: fetchedAt,
      liveFetchedCount: 0,
      liveRefreshErrors: [error instanceof Error ? error.message : "Live source refresh failed"],
      nalcoStatus: "failed",
      gdeltStatus: "skipped",
      newsApiStatus: "skipped",
      failedUrls: [],
      retriedUrls: [],
      successfulNalcoPages: 0
    };
  }
}

export async function refreshEvidenceForChat(): Promise<LiveRefreshMetadata> {
  if (!chatRefreshState.running) {
    chatRefreshState.running = performLiveRefresh().finally(() => {
      chatRefreshState.running = undefined;
    });
  }
  return chatRefreshState.running;
}

function withLiveRefresh(answer: ChatAnswer, liveRefresh: LiveRefreshMetadata): ChatAnswer {
  return {
    ...answer,
    ...liveRefresh,
    liveRefreshErrors: liveRefresh.liveRefreshErrors?.slice(0, 5) || []
  };
}

function keywordScore(query: string, doc: IntelligenceDocument) {
  const terms = query.toLowerCase().match(/[a-z0-9]+/g) || [];
  const haystack = `${doc.title} ${doc.cleanedText} ${doc.eventType} ${doc.entities.map((e) => e.text).join(" ")}`.toLowerCase();
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 0.08 : 0), 0);
}

function isLatestNewsIntent(query: string) {
  return /latest nalco news|nalco news|latest announcements?|recent announcements?|recent updates?|latest updates?|what changed.*nalco|nalco.*changed|changed in nalco|new with nalco|recently.*nalco|nalco.*recently/i.test(query);
}

function isEntityMapIntent(query: string) {
  return /entity map|entities|entity/i.test(query);
}

function isRiskSummaryIntent(query: string) {
  return /risk summary|risk|input cost|geopolitical|export|production|policy|market risk/i.test(query);
}

function isAluminiumMarketIntent(query: string) {
  return /aluminium market|aluminum market|commodity market|market signals?|market factors?|lme|aluminium prices?|aluminum prices?|metal market|alumina market|bauxite market/i.test(query);
}

function isPdfMetadataOnly(doc: IntelligenceDocument) {
  return /\.pdf(?:$|[?#])/i.test(doc.url) && /^PDF metadata indexed only/i.test(`${doc.summary} ${doc.cleanedText}`);
}

function intentBoost(query: string, doc: IntelligenceDocument) {
  const normalized = query.toLowerCase();
  let boost = 0;
  if (isLatestNewsIntent(normalized)) {
    if (["news", "press_release"].includes(doc.sourceType)) boost += 0.25;
    if (/gdelt|news|press|media/i.test(doc.sourceName)) boost += 0.12;
    if (!isPdfMetadataOnly(doc)) boost += 0.22;
    if (isPdfMetadataOnly(doc)) boost -= 0.55;
    if (doc.sourceType === "commodity") boost -= 0.15;
  }
  if (/recent filings?|filings?|financial results?|investor/.test(normalized) && ["financial_result", "investor_announcement", "exchange_filing", "annual_report"].includes(doc.sourceType)) {
    boost += 0.3;
  }
  if (isRiskSummaryIntent(normalized)) {
    if (["policy", "commodity", "news", "press_release"].includes(doc.sourceType)) boost += 0.18;
    if (/(risk|policy|market|cost|export|production|geopolitical|price|power|coal)/i.test(`${doc.title} ${doc.cleanedText}`)) boost += 0.16;
    if (!isPdfMetadataOnly(doc)) boost += 0.22;
    if (isPdfMetadataOnly(doc)) boost -= 0.5;
  }
  if (isAluminiumMarketIntent(normalized)) {
    if (["commodity", "policy", "news", "press_release", "financial_result", "investor_announcement"].includes(doc.sourceType)) boost += 0.22;
    if (/(aluminium|aluminum|lme|market|price|inventory|energy|coal|power|alumina|bauxite|demand|supply|cost)/i.test(`${doc.title} ${doc.summary} ${doc.cleanedText}`)) boost += 0.22;
    if (!isPdfMetadataOnly(doc)) boost += 0.2;
    if (isPdfMetadataOnly(doc)) boost -= 0.5;
  }
  if (isEntityMapIntent(normalized) && doc.entities.length) {
    boost += 0.35;
    if (!isPdfMetadataOnly(doc)) boost += 0.28;
    if (isPdfMetadataOnly(doc)) boost -= 0.5;
    if (["press_release", "investor_announcement", "financial_result", "exchange_filing", "policy", "commodity"].includes(doc.sourceType)) boost += 0.12;
  }
  return boost;
}

function isFilingIntent(question: string) {
  return /recent filings?|filings?|financial results?|investor|quarterly results?|annual reports?|dividends?|board recommends?|board actions?/i.test(question);
}

function isFilingEvidence(doc: IntelligenceDocument) {
  return ["financial_result", "investor_announcement", "exchange_filing", "annual_report"].includes(doc.sourceType);
}

function refusal(liveRefresh?: LiveRefreshMetadata): ChatAnswer {
  return {
    ...withLiveRefresh(
      {
        answer: "I could not verify this from available sources.",
        confidence: 0,
        evidenceDateRange: "No adequate evidence retrieved",
        entities: [],
        citations: []
      },
      liveRefresh || {}
    )
  };
}

export async function retrieveDocuments(query: string, limit = 5) {
  const docs = await listDocuments(2500);
  const queryEmbedding = createLocalEmbedding(query);
  return docs
    .filter(isUsableEvidence)
    .map((doc) => ({ doc, score: cosineSimilarity(queryEmbedding, doc.embedding) + keywordScore(query, doc) + intentBoost(query, doc) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

async function retrieveEntityMapDocuments(limit = 5) {
  const docs = await listDocuments(2500);
  return docs
    .filter(isUsableEvidence)
    .filter((doc) => doc.entities.length > 0)
    .map((doc) => {
      const publishedTime = doc.publishedAt ? new Date(doc.publishedAt).getTime() : 0;
      const recencyScore = Number.isNaN(publishedTime) ? 0 : Math.min(0.18, Math.max(0, (publishedTime - Date.UTC(2020, 0, 1)) / (1000 * 60 * 60 * 24 * 365 * 10)));
      const sourceScore = ["press_release", "investor_announcement", "financial_result", "exchange_filing", "policy", "commodity"].includes(doc.sourceType) ? 0.25 : 0;
      const qualityScore = isPdfMetadataOnly(doc) ? -0.45 : 0.35;
      const entityScore = Math.min(0.3, doc.entities.length * 0.06);
      return { doc, score: sourceScore + qualityScore + entityScore + recencyScore + doc.materialityScore * 0.15 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

async function retrieveRiskSummaryDocuments(limit = 5) {
  const docs = await listDocuments(2500);
  return docs
    .filter(isUsableEvidence)
    .map((doc) => {
      const text = `${doc.title} ${doc.summary} ${doc.cleanedText} ${doc.eventType}`.toLowerCase();
      const riskHits = ["risk", "policy", "market", "cost", "export", "import", "production", "power", "coal", "price", "lme", "bauxite", "alumina", "aluminium"].filter((term) => text.includes(term)).length;
      const sourceScore = ["policy", "commodity", "press_release", "investor_announcement", "financial_result", "exchange_filing", "news"].includes(doc.sourceType) ? 0.24 : 0;
      const qualityScore = isPdfMetadataOnly(doc) ? -0.45 : 0.34;
      const entityScore = Math.min(0.18, doc.entities.length * 0.04);
      return { doc, score: sourceScore + qualityScore + Math.min(0.34, riskHits * 0.06) + entityScore + doc.materialityScore * 0.16 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

async function retrieveAluminiumMarketDocuments(limit = 5) {
  const docs = await listDocuments(2500);
  return docs
    .filter(isUsableEvidence)
    .map((doc) => {
      const text = `${doc.title} ${doc.summary} ${doc.cleanedText} ${doc.eventType}`.toLowerCase();
      const marketHits = ["aluminium", "aluminum", "lme", "market", "price", "inventory", "energy", "coal", "power", "alumina", "bauxite", "demand", "supply", "cost"].filter((term) => text.includes(term)).length;
      const sourceScore = ["commodity", "policy", "news", "press_release", "financial_result", "investor_announcement"].includes(doc.sourceType) ? 0.28 : 0;
      const qualityScore = isPdfMetadataOnly(doc) ? -0.45 : 0.34;
      const recencyScore = doc.publishedAt ? 0.08 : 0;
      return { doc, score: sourceScore + qualityScore + Math.min(0.38, marketHits * 0.055) + recencyScore + doc.materialityScore * 0.14 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function evidenceRange(docs: IntelligenceDocument[]) {
  const dates = docs
    .map((doc) => doc.publishedAt)
    .map(validEvidenceDate)
    .filter((date): date is string => Boolean(date))
    .map((date) => new Date(date).getTime())
    .filter((time) => !Number.isNaN(time))
    .sort((a, b) => a - b);
  if (!dates.length) return "Source dates unavailable";
  const formatter = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  if (dates.length === 1 || dates[0] === dates[dates.length - 1]) return formatter.format(new Date(dates[0]));
  return `${formatter.format(new Date(dates[0]))} to ${formatter.format(new Date(dates[dates.length - 1]))}`;
}

function isRefusalText(answer: string) {
  return answer.trim().replace(/\.$/, "").toLowerCase() === "i could not verify this from available sources";
}

function citedAnswer(answer: string, docs: IntelligenceDocument[], confidence: number, liveRefresh: LiveRefreshMetadata): ChatAnswer {
  if (isRefusalText(answer)) return refusal(liveRefresh);
  const allEntities = docs.flatMap((doc) => doc.entities);
  return withLiveRefresh(
    {
      answer,
      confidence,
      evidenceDateRange: evidenceRange(docs),
      entities: allEntities.filter((entity, index, array) => array.findIndex((e) => e.text === entity.text && e.type === entity.type) === index).slice(0, 12),
      citations: docs.map((doc) => ({ id: doc.id, title: doc.title, sourceName: doc.sourceName, url: doc.url, publishedAt: doc.publishedAt }))
    },
    liveRefresh
  );
}

function groundedFallback(query: string, docs: IntelligenceDocument[], liveRefresh: LiveRefreshMetadata): ChatAnswer {
  if (!docs.length) {
    return refusal(liveRefresh);
  }
  const bullets = docs.slice(0, 4).map((doc) => `- ${doc.summary} (${doc.sourceName})`).join("\n");
  const allEntities = docs.flatMap((doc) => doc.entities);
  return withLiveRefresh(
    {
      answer: `Based on the latest retrieved sources, here is the verified summary:\n${bullets}\n\nI did not use unsupported claims beyond these sources.`,
      confidence: Math.min(0.88, 0.45 + docs.length * 0.08),
      evidenceDateRange: evidenceRange(docs),
      entities: allEntities.filter((entity, index, array) => array.findIndex((e) => e.text === entity.text && e.type === entity.type) === index).slice(0, 12),
      citations: docs.map((doc) => ({ id: doc.id, title: doc.title, sourceName: doc.sourceName, url: doc.url, publishedAt: doc.publishedAt }))
    },
    liveRefresh
  );
}

function answerMessages(question: string, evidence: string) {
  return [
    {
      role: "system" as const,
      content:
        "You are NALCO Intelligence Bot. Produce a polished, executive-ready answer only from the supplied latest evidence. Adapt the structure to the user's question: lead with the most material update, group related points, mention source dates when useful, and cite every factual claim as [1], [2]. Go beyond restating facts — explain the significance, causal relationships, and business implications (e.g. how input costs affect margins, why a policy matters for operations). If evidence is insufficient or unrelated to the question, say exactly: I could not verify this from available sources. Do not infer private, live price, or current numeric facts unless directly present in evidence."
    },
    { role: "user" as const, content: `Question: ${question}\n\nEvidence:\n${evidence}` }
  ];
}

function needsLiveCommodityPrice(question: string) {
  return /\b(current|live|today|now|latest|spot)\b/i.test(question) && /\b(price|rate|quote|lme)\b/i.test(question) && /\b(aluminium|aluminum|metal|commodity|lme)\b/i.test(question);
}

function asksPrivateOrUndisclosed(question: string) {
  return /\b(private|undisclosed|confidential|secret|leaked|rumou?r|unannounced)\b/i.test(question);
}

function meaningfulTerms(question: string) {
  const stop = new Set([
    "what", "when", "where", "which", "about", "tell", "give", "show", "from", "with", "that", "this", "have", "does", "could", "would", "latest", "current", "today",
    "did", "the", "and", "but", "for", "out", "our", "you", "your", "its", "his", "her", "their", "are", "was", "were", "been", "has", "had", "can", "may", "how", "why",
    "who", "whom", "will", "shall", "should", "than", "then", "into", "onto", "upon", "recently", "recent", "regarding"
  ]);
  return (question.toLowerCase().match(/[a-z0-9]+/g) || []).filter((term) => term.length > 2 && !stop.has(term));
}

function matchesTerm(term: string, text: string) {
  if (text.includes(term)) return true;
  if (term.endsWith("s") && text.includes(term.slice(0, -1))) return true;
  if (term.endsWith("ies") && text.includes(term.slice(0, -3) + "y")) return true;
  if (term.endsWith("ing") && text.includes(term.slice(0, -3))) return true;
  if (term.endsWith("ed") && text.includes(term.slice(0, -2))) return true;
  return false;
}

function hasAdequateEvidence(question: string, retrieved: Awaited<ReturnType<typeof retrieveDocuments>>) {
  const topScore = retrieved[0]?.score || 0;
  if (isLatestNewsIntent(question) && retrieved.some((item) => !isPdfMetadataOnly(item.doc) && ["news", "press_release"].includes(item.doc.sourceType) && item.score > 0.12)) return true;
  if (isEntityMapIntent(question) && retrieved.some((item) => item.doc.entities.length > 0 && !isPdfMetadataOnly(item.doc) && item.score > 0.12)) return true;
  if (isRiskSummaryIntent(question) && retrieved.some((item) => !isPdfMetadataOnly(item.doc) && ["policy", "commodity", "press_release", "investor_announcement", "financial_result", "exchange_filing", "news"].includes(item.doc.sourceType) && item.score > 0.12)) return true;
  if (isAluminiumMarketIntent(question) && retrieved.some((item) => !isPdfMetadataOnly(item.doc) && ["commodity", "policy", "press_release", "investor_announcement", "financial_result", "news"].includes(item.doc.sourceType) && item.score > 0.12)) return true;
  if (isFilingIntent(question) && retrieved.some((item) => isFilingEvidence(item.doc) && item.score > 0.12)) return true;
  if (topScore < 0.18) return false;
  const terms = meaningfulTerms(question);
  if (!terms.length) return topScore >= 0.25;
  const topDocs = retrieved.slice(0, 3).map((item) => `${item.doc.title} ${item.doc.cleanedText} ${item.doc.sourceName}`.toLowerCase()).join(" ");
  const hits = terms.filter((term) => matchesTerm(term, topDocs)).length;
  return hits / terms.length >= 0.35;
}

async function prepareAnswer(question: string): Promise<PreparedAnswer> {
  const liveRefresh = await refreshEvidenceForChat();
  const empty = { liveRefresh, retrieved: [], docs: [], evidence: "", confidence: 0 };
  if (asksPrivateOrUndisclosed(question)) return { ...empty, refusal: refusal(liveRefresh) };
  if (needsLiveCommodityPrice(question) && !env.COMMODITY_API_KEY) return { ...empty, refusal: refusal(liveRefresh) };

  const retrieved = isEntityMapIntent(question) ? await retrieveEntityMapDocuments(5) : isRiskSummaryIntent(question) ? await retrieveRiskSummaryDocuments(5) : isAluminiumMarketIntent(question) ? await retrieveAluminiumMarketDocuments(5) : await retrieveDocuments(question, 5);
  if (!hasAdequateEvidence(question, retrieved)) return { ...empty, retrieved, refusal: refusal(liveRefresh) };
  const topScore = retrieved[0]?.score || 0;
  const docs = retrieved
    .filter((item) => item.score > 0.18 && item.score >= topScore * 0.3)
    .filter((item) => !isLatestNewsIntent(question) || !isPdfMetadataOnly(item.doc))
    .filter((item) => !isEntityMapIntent(question) || (!isPdfMetadataOnly(item.doc) && item.doc.entities.length > 0))
    .filter((item) => !isRiskSummaryIntent(question) || !isPdfMetadataOnly(item.doc))
    .filter((item) => !isAluminiumMarketIntent(question) || !isPdfMetadataOnly(item.doc))
    .filter((item) => !isFilingIntent(question) || isFilingEvidence(item.doc))
    .map((item) => item.doc);
  if (!docs.length) return { ...empty, retrieved, refusal: refusal(liveRefresh) };

  const evidence = docs
    .map((doc, index) => `[${index + 1}] ${doc.title}\nSource: ${doc.sourceName}\nURL: ${doc.url}\nDate: ${doc.publishedAt || "unknown"}\nText: ${doc.summary} ${doc.cleanedText.slice(0, 1800)}`)
    .join("\n\n");
  return { liveRefresh, retrieved, docs, evidence, confidence: Math.min(0.92, 0.55 + retrieved[0].score * 0.3) };
}

export async function answerQuestion(question: string): Promise<ChatAnswer> {
  const prepared = await prepareAnswer(question);
  if (prepared.refusal) return prepared.refusal;

  if (ollamaConfigured()) {
    try {
      const answer = await ollamaChat(answerMessages(question, prepared.evidence));
      return citedAnswer(answer || groundedFallback(question, prepared.docs, prepared.liveRefresh).answer, prepared.docs, prepared.confidence, prepared.liveRefresh);
    } catch {
      return groundedFallback(question, prepared.docs, prepared.liveRefresh);
    }
  }

  if (!env.OPENAI_API_KEY) return groundedFallback(question, prepared.docs, prepared.liveRefresh);

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY, baseURL: env.OPENAI_BASE_URL || undefined });
  const response = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.1,
    messages: [
      ...answerMessages(question, prepared.evidence)
    ]
  });
  return citedAnswer(response.choices[0]?.message.content || groundedFallback(question, prepared.docs, prepared.liveRefresh).answer, prepared.docs, prepared.confidence, prepared.liveRefresh);
}

export type ChatStreamEvent = { type: "status"; message: string } | { type: "delta"; text: string } | { type: "metadata"; result: ChatAnswer } | { type: "done" };

export async function* streamAnswerQuestion(question: string): AsyncGenerator<ChatStreamEvent> {
  yield { type: "status", message: "Fetching latest sources..." };
  const prepared = await prepareAnswer(question);
  yield { type: "status", message: "Reading verified evidence..." };
  if (prepared.refusal) {
    yield { type: "delta", text: prepared.refusal.answer };
    yield { type: "metadata", result: prepared.refusal };
    yield { type: "done" };
    return;
  }

  if (!ollamaConfigured()) {
    const fallback = groundedFallback(question, prepared.docs, prepared.liveRefresh);
    yield { type: "delta", text: fallback.answer };
    yield { type: "metadata", result: fallback };
    yield { type: "done" };
    return;
  }

  yield { type: "status", message: "Formatting response..." };
  let answer = "";
  try {
    for await (const chunk of ollamaChatStream(answerMessages(question, prepared.evidence))) {
      answer += chunk;
      yield { type: "delta", text: chunk };
    }
  } catch {
    const fallback = groundedFallback(question, prepared.docs, prepared.liveRefresh);
    yield { type: "delta", text: fallback.answer };
    yield { type: "metadata", result: fallback };
    yield { type: "done" };
    return;
  }

  const result = citedAnswer(answer || groundedFallback(question, prepared.docs, prepared.liveRefresh).answer, prepared.docs, prepared.confidence, prepared.liveRefresh);
  if (isRefusalText(result.answer) && !answer) yield { type: "delta", text: result.answer };
  yield { type: "metadata", result };
  yield { type: "done" };
}
