import { listDocuments } from "@/lib/store";

export async function overview() {
  const docs = await listDocuments(100);
  const entityCounts = new Map<string, { text: string; type: string; count: number }>();
  const sourceCounts = new Map<string, number>();
  const sentiment = { positive: 0, neutral: 0, negative: 0 };
  for (const doc of docs) {
    sourceCounts.set(doc.sourceType, (sourceCounts.get(doc.sourceType) || 0) + 1);
    sentiment[doc.sentiment] += 1;
    for (const entity of doc.entities) {
      const key = `${entity.type}:${entity.text}`;
      entityCounts.set(key, { text: entity.text, type: entity.type, count: (entityCounts.get(key)?.count || 0) + 1 });
    }
  }
  return {
    totalDocuments: docs.length,
    highImpact: docs.filter((doc) => doc.materialityScore >= 0.65).length,
    latestDocuments: docs.slice(0, 8),
    topEntities: [...entityCounts.values()].sort((a, b) => b.count - a.count).slice(0, 12),
    sentiment: Object.entries(sentiment).map(([name, value]) => ({ name, value })),
    sourceBreakdown: [...sourceCounts.entries()].map(([name, value]) => ({ name, value })),
    highImpactEvents: docs.filter((doc) => doc.materialityScore >= 0.65).slice(0, 8),
    marketSignals: docs.filter((doc) => doc.sourceType === "commodity" || doc.eventType.includes("commodity")).slice(0, 5),
    policyMentions: docs.filter((doc) => doc.sourceType === "policy" || doc.policymakers.length).slice(0, 5)
  };
}
