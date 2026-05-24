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
    return {
      answer: "I could not verify this from available sources.",
      confidence: 0,
      evidenceDateRange: "No evidence retrieved",
      entities: extractEntities(query),
      citations: []
    };
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

export async function answerQuestion(question: string): Promise<ChatAnswer> {
  const retrieved = await retrieveDocuments(question, 5);
  const docs = retrieved.filter((item) => item.score > 0.05).map((item) => item.doc);
  if (!docs.length) return groundedFallback(question, []);

  const evidence = docs
    .map((doc, index) => `[${index + 1}] ${doc.title}\nSource: ${doc.sourceName}\nURL: ${doc.url}\nDate: ${doc.publishedAt || "unknown"}\nText: ${doc.summary} ${doc.cleanedText.slice(0, 700)}`)
    .join("\n\n");

  if (ollamaConfigured()) {
    try {
      const answer = await ollamaChat([
        {
          role: "system",
          content:
            "You are NALCO Intelligence Bot. Answer only from the supplied evidence. Cite sources as [1], [2]. If evidence is insufficient, say: I could not verify this from available sources. Keep answers concise and executive-ready."
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
          "You are NALCO Intelligence Bot. Answer only from the supplied evidence. Cite sources as [1], [2]. If evidence is insufficient, say: I could not verify this from available sources. Keep answers concise and executive-ready."
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
