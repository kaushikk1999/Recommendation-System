import OpenAI from "openai";
import { env } from "@/lib/env";
import { cosineSimilarity, createLocalEmbedding, extractEntities } from "@/lib/nlp/extraction";
import { ollamaChat, ollamaConfigured } from "@/lib/ollama";
import { listDocuments } from "@/lib/store";
import type { ChatAnswer, IntelligenceDocument } from "@/lib/types";

function keywordScore(query: string, doc: IntelligenceDocument) {
  const terms = query.toLowerCase().match(/[a-z0-9]+/g) || [];
  const haystack = `${doc.title} ${doc.cleanedText} ${doc.eventType} ${doc.entities.map((e) => e.text).join(" ")}`.toLowerCase();
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 0.08 : 0), 0);
}

function refusal(question: string): ChatAnswer {
  return {
    answer: "I could not verify this from available sources.",
    confidence: 0,
    evidenceDateRange: "No adequate evidence retrieved",
    entities: extractEntities(question),
    citations: []
  };
}

export async function retrieveDocuments(query: string, limit = 5) {
  const docs = await listDocuments(100);
  const queryEmbedding = createLocalEmbedding(query);
  return docs
    .map((doc) => ({ doc, score: cosineSimilarity(queryEmbedding, doc.embedding) + keywordScore(query, doc) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function evidenceRange(docs: IntelligenceDocument[]) {
  const dates = docs
    .map((doc) => doc.publishedAt)
    .filter(Boolean)
    .map((date) => new Date(date as string).getTime())
    .filter((time) => !Number.isNaN(time))
    .sort();
  if (!dates.length) return "Source dates unavailable";
  const formatter = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  return `${formatter.format(new Date(dates[0]))} to ${formatter.format(new Date(dates[dates.length - 1]))}`;
}

function groundedFallback(query: string, docs: IntelligenceDocument[]): ChatAnswer {
  if (!docs.length) {
    return refusal(query);
  }
  const bullets = docs.slice(0, 4).map((doc) => `- ${doc.summary} (${doc.sourceName})`).join("\n");
  const allEntities = docs.flatMap((doc) => doc.entities);
  return {
    answer: `Based on the retrieved sources, here is the verified summary:\n${bullets}\n\nI did not use unsupported claims beyond these sources.`,
    confidence: Math.min(0.88, 0.45 + docs.length * 0.08),
    evidenceDateRange: evidenceRange(docs),
    entities: allEntities.filter((entity, index, array) => array.findIndex((e) => e.text === entity.text && e.type === entity.type) === index).slice(0, 12),
    citations: docs.map((doc) => ({ id: doc.id, title: doc.title, sourceName: doc.sourceName, url: doc.url, publishedAt: doc.publishedAt }))
  };
}

function needsLiveCommodityPrice(question: string) {
  return /\b(current|live|today|now|latest|spot)\b/i.test(question) && /\b(price|rate|quote|lme)\b/i.test(question) && /\b(aluminium|aluminum|metal|commodity|lme)\b/i.test(question);
}

function asksPrivateOrUndisclosed(question: string) {
  return /\b(private|undisclosed|confidential|secret|leaked|rumou?r|unannounced)\b/i.test(question);
}

function meaningfulTerms(question: string) {
  const stop = new Set(["what", "when", "where", "which", "about", "tell", "give", "show", "from", "with", "that", "this", "have", "does", "could", "would", "latest", "current", "today"]);
  return (question.toLowerCase().match(/[a-z0-9]+/g) || []).filter((term) => term.length > 2 && !stop.has(term));
}

function hasAdequateEvidence(question: string, retrieved: Awaited<ReturnType<typeof retrieveDocuments>>) {
  const topScore = retrieved[0]?.score || 0;
  if (topScore < 0.18) return false;
  const terms = meaningfulTerms(question);
  if (!terms.length) return topScore >= 0.25;
  const topDocs = retrieved.slice(0, 3).map((item) => `${item.doc.title} ${item.doc.cleanedText} ${item.doc.sourceName}`.toLowerCase()).join(" ");
  const hits = terms.filter((term) => topDocs.includes(term)).length;
  return hits / terms.length >= 0.35;
}

export async function answerQuestion(question: string): Promise<ChatAnswer> {
  if (asksPrivateOrUndisclosed(question)) return refusal(question);
  if (needsLiveCommodityPrice(question) && !env.COMMODITY_API_KEY) return refusal(question);

  const retrieved = await retrieveDocuments(question, 5);
  if (!hasAdequateEvidence(question, retrieved)) return refusal(question);
  const docs = retrieved.filter((item) => item.score > 0.12).map((item) => item.doc);
  if (!docs.length) return refusal(question);

  const evidence = docs
    .map((doc, index) => `[${index + 1}] ${doc.title}\nSource: ${doc.sourceName}\nURL: ${doc.url}\nDate: ${doc.publishedAt || "unknown"}\nText: ${doc.summary} ${doc.cleanedText.slice(0, 1800)}`)
    .join("\n\n");

  if (ollamaConfigured()) {
    try {
      const answer = await ollamaChat([
        {
          role: "system",
          content:
            "You are NALCO Intelligence Bot. Answer only from the supplied evidence. Cite sources as [1], [2]. If evidence is insufficient or unrelated to the question, say exactly: I could not verify this from available sources. Do not infer private, live price, or current numeric facts unless directly present in evidence. Keep answers concise and executive-ready."
        },
        { role: "user", content: `Question: ${question}\n\nEvidence:\n${evidence}` }
      ]);
      const allEntities = docs.flatMap((doc) => doc.entities);
      return {
        answer: answer || groundedFallback(question, docs).answer,
        confidence: Math.min(0.92, 0.55 + retrieved[0].score * 0.3),
        evidenceDateRange: evidenceRange(docs),
        entities: allEntities.filter((entity, index, array) => array.findIndex((e) => e.text === entity.text && e.type === entity.type) === index).slice(0, 12),
        citations: docs.map((doc) => ({ id: doc.id, title: doc.title, sourceName: doc.sourceName, url: doc.url, publishedAt: doc.publishedAt }))
      };
    } catch {
      return groundedFallback(question, docs);
    }
  }

  if (!env.OPENAI_API_KEY) return groundedFallback(question, docs);

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY, baseURL: env.OPENAI_BASE_URL || undefined });
  const response = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content:
          "You are NALCO Intelligence Bot. Answer only from the supplied evidence. Cite sources as [1], [2]. If evidence is insufficient or unrelated to the question, say exactly: I could not verify this from available sources. Do not infer private, live price, or current numeric facts unless directly present in evidence. Keep answers concise and executive-ready."
      },
      { role: "user", content: `Question: ${question}\n\nEvidence:\n${evidence}` }
    ]
  });
  const allEntities = docs.flatMap((doc) => doc.entities);
  return {
    answer: response.choices[0]?.message.content || groundedFallback(question, docs).answer,
    confidence: Math.min(0.92, 0.55 + retrieved[0].score * 0.3),
    evidenceDateRange: evidenceRange(docs),
    entities: allEntities.filter((entity, index, array) => array.findIndex((e) => e.text === entity.text && e.type === entity.type) === index).slice(0, 12),
    citations: docs.map((doc) => ({ id: doc.id, title: doc.title, sourceName: doc.sourceName, url: doc.url, publishedAt: doc.publishedAt }))
  };
}
