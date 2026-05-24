CREATE TABLE "Document" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sourceName" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rawText" TEXT NOT NULL,
  "cleanedText" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "entities" JSONB NOT NULL,
  "commodities" TEXT[],
  "geographies" TEXT[],
  "policymakers" TEXT[],
  "eventType" TEXT NOT NULL,
  "sentiment" TEXT NOT NULL,
  "materialityScore" DOUBLE PRECISION NOT NULL,
  "embedding" DOUBLE PRECISION[],
  "hashKey" TEXT NOT NULL,
  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IngestionRun" (
  "id" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL,
  "documentsFetched" INTEGER NOT NULL DEFAULT 0,
  "documentsStored" INTEGER NOT NULL DEFAULT 0,
  "errors" JSONB,
  CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Document_url_key" ON "Document"("url");
CREATE UNIQUE INDEX "Document_hashKey_key" ON "Document"("hashKey");
CREATE INDEX "Document_sourceType_idx" ON "Document"("sourceType");
CREATE INDEX "Document_eventType_idx" ON "Document"("eventType");
CREATE INDEX "Document_sentiment_idx" ON "Document"("sentiment");
CREATE INDEX "Document_publishedAt_idx" ON "Document"("publishedAt");
