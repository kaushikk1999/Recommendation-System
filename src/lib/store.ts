import { demoDocuments } from "@/lib/demo-data";
import { getSheetDocuments, sheetsConfigured, upsertSheetDocuments } from "@/lib/google-sheets";
import type { IntelligenceDocument, Sentiment, SourceType } from "@/lib/types";
import type { Prisma, Document as PrismaDocument } from "@prisma/client";

const memoryDocuments: IntelligenceDocument[] = [...demoDocuments];

function dbEnabled() {
  return Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:"));
}

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

function fromDb(doc: PrismaDocument): IntelligenceDocument {
  const publishedAt = doc.publishedAt ? new Date(doc.publishedAt) : null;
  const fetchedAt = doc.fetchedAt ? new Date(doc.fetchedAt) : null;
  return {
    id: doc.id,
    title: doc.title,
    sourceName: doc.sourceName,
    sourceType: doc.sourceType as SourceType,
    url: doc.url,
    publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt.toISOString() : null,
    fetchedAt: fetchedAt && !Number.isNaN(fetchedAt.getTime()) ? fetchedAt.toISOString() : new Date().toISOString(),
    rawText: doc.rawText,
    cleanedText: doc.cleanedText,
    summary: doc.summary,
    entities: doc.entities as unknown as IntelligenceDocument["entities"],
    commodities: doc.commodities,
    geographies: doc.geographies,
    policymakers: doc.policymakers,
    eventType: doc.eventType,
    sentiment: doc.sentiment as Sentiment,
    materialityScore: doc.materialityScore,
    embedding: doc.embedding,
    hashKey: doc.hashKey
  };
}

export async function listDocuments(limit = 50) {
  if (sheetsConfigured()) {
    try {
      const docs = await getSheetDocuments(limit);
      if (docs.length) return docs;
    } catch {
      // Fall through to the next configured store or demo memory.
    }
  }
  if (dbEnabled()) {
    try {
      const prisma = await getPrisma();
      const docs = await prisma.document.findMany({ orderBy: [{ publishedAt: "desc" }, { fetchedAt: "desc" }], take: limit });
      return docs.map(fromDb);
    } catch {
      return memoryDocuments.slice(0, limit);
    }
  }
  return memoryDocuments.slice(0, limit);
}

export async function getDocument(id: string) {
  const docs = await listDocuments(100);
  return docs.find((doc) => doc.id === id || doc.hashKey === id) || null;
}

export async function upsertDocuments(documents: IntelligenceDocument[]) {
  const existing = new Set(memoryDocuments.map((doc) => doc.hashKey));
  for (const doc of documents) {
    if (!existing.has(doc.hashKey)) memoryDocuments.unshift(doc);
  }
  if (sheetsConfigured()) {
    try {
      await upsertSheetDocuments(documents);
    } catch {
      // Keep local/demo mode resilient if Sheets is unavailable.
    }
  }
  if (dbEnabled()) {
    const prisma = await getPrisma();
    for (const doc of documents) {
      const publishedAt = doc.publishedAt ? new Date(doc.publishedAt) : null;
      const fetchedAt = new Date(doc.fetchedAt);
      await prisma.document.upsert({
        where: { hashKey: doc.hashKey },
        update: { fetchedAt: Number.isNaN(fetchedAt.getTime()) ? new Date() : fetchedAt, summary: doc.summary, entities: doc.entities as unknown as Prisma.InputJsonValue },
        create: {
          id: doc.id,
          title: doc.title,
          sourceName: doc.sourceName,
          sourceType: doc.sourceType,
          url: doc.url,
          publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
          fetchedAt: Number.isNaN(fetchedAt.getTime()) ? new Date() : fetchedAt,
          rawText: doc.rawText,
          cleanedText: doc.cleanedText,
          summary: doc.summary,
          entities: doc.entities as unknown as Prisma.InputJsonValue,
          commodities: doc.commodities,
          geographies: doc.geographies,
          policymakers: doc.policymakers,
          eventType: doc.eventType,
          sentiment: doc.sentiment,
          materialityScore: doc.materialityScore,
          embedding: doc.embedding,
          hashKey: doc.hashKey
        }
      });
    }
  }
  return documents.length;
}
