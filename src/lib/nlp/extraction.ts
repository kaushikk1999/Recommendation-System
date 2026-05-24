import crypto from "crypto";
import { entityDictionary, eventRules, negativeWords, positiveWords } from "@/lib/nlp/dictionaries";
import type { ExtractedEntity, IntelligenceDocument, RawSourceItem, Sentiment } from "@/lib/types";

export function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function hashDocument(item: Pick<RawSourceItem, "title" | "url" | "rawText">) {
  return crypto.createHash("sha256").update(`${item.url}|${item.title}|${item.rawText.slice(0, 800)}`).digest("hex");
}

export function extractEntities(text: string): ExtractedEntity[] {
  const found = new Map<string, ExtractedEntity>();
  for (const [type, terms] of Object.entries(entityDictionary)) {
    for (const term of terms) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      if (regex.test(text)) {
        found.set(`${type}:${term.toLowerCase()}`, {
          text: term,
          type: type as ExtractedEntity["type"],
          confidence: 0.9
        });
      }
    }
  }
  return [...found.values()];
}

export function classifyEventType(text: string) {
  const lower = text.toLowerCase();
  let best = "general update";
  let score = 0;
  for (const [event, terms] of Object.entries(eventRules)) {
    const hits = terms.filter((term) => lower.includes(term)).length;
    if (hits > score) {
      score = hits;
      best = event;
    }
  }
  return best;
}

export function classifySentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  const positives = positiveWords.filter((word) => lower.includes(word)).length;
  const negatives = negativeWords.filter((word) => lower.includes(word)).length;
  if (positives > negatives + 1) return "positive";
  if (negatives > positives) return "negative";
  return "neutral";
}

export function assignMaterialityScore(text: string, eventType: string, entities: ExtractedEntity[]) {
  const highImpactEvents = ["earnings", "production update", "dividend", "capex", "policy announcement", "commodity price movement"];
  let score = 0.25;
  if (entities.some((entity) => ["NALCO", "NATIONALUM", "National Aluminium Company"].includes(entity.text))) score += 0.25;
  if (highImpactEvents.includes(eventType)) score += 0.25;
  if (/(sebi|nse|bse|ministry|government|lme|price|profit|dividend|production)/i.test(text)) score += 0.15;
  if (text.length > 1200) score += 0.1;
  return Math.min(1, Number(score.toFixed(2)));
}

export function summarize(text: string) {
  const clean = cleanText(text);
  const firstSentence = clean.match(/[^.!?]+[.!?]/)?.[0] || clean.slice(0, 220);
  return firstSentence.length > 320 ? `${firstSentence.slice(0, 317)}...` : firstSentence;
}

export function createLocalEmbedding(text: string, dimensions = 64) {
  const vector = new Array(dimensions).fill(0);
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  for (const token of tokens) {
    const hash = crypto.createHash("md5").update(token).digest();
    const index = hash[0] % dimensions;
    vector[index] += 1;
  }
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / norm).toFixed(6)));
}

export function normalizeDocument(item: RawSourceItem): IntelligenceDocument {
  const cleanedText = cleanText(item.rawText || item.title);
  const entities = extractEntities(`${item.title}. ${cleanedText}`);
  const eventType = classifyEventType(`${item.title}. ${cleanedText}`);
  const sentiment = classifySentiment(`${item.title}. ${cleanedText}`);
  return {
    ...item,
    id: hashDocument(item).slice(0, 16),
    fetchedAt: new Date().toISOString(),
    publishedAt: item.publishedAt || null,
    cleanedText,
    summary: summarize(cleanedText),
    entities,
    commodities: entities.filter((e) => e.type === "COMMODITY").map((e) => e.text),
    geographies: entities.filter((e) => e.type === "GEOGRAPHY").map((e) => e.text),
    policymakers: entities.filter((e) => ["POLICYMAKER", "REGULATOR", "GOVERNMENT_BODY"].includes(e.type)).map((e) => e.text),
    eventType,
    sentiment,
    materialityScore: assignMaterialityScore(cleanedText, eventType, entities),
    embedding: createLocalEmbedding(`${item.title} ${cleanedText}`),
    hashKey: hashDocument(item)
  };
}

export function cosineSimilarity(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }
  return dot / ((Math.sqrt(normA) || 1) * (Math.sqrt(normB) || 1));
}
