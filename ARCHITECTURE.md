# Architecture

## Frontend

Next.js App Router, TypeScript, Tailwind CSS and a small local component system. The UI is built like a fintech intelligence product: dense dashboard, source cards, badges, entity chips, source details and floating assistant.

## Backend

Next.js route handlers expose health, ingestion, documents, analytics, search and chat APIs. The code is typed and modular so ingestion can run from API routes, cron jobs or `npm run ingest`.

## Database

Prisma models define `Document` and `IngestionRun` tables for PostgreSQL. Documents store normalized text, entities, commodities, geographies, policymakers, event type, sentiment, materiality, embeddings and source URLs.

For local recruiter demos, the app has an in-memory seeded fallback so it still works before provisioning PostgreSQL.

## Ingestion Pipeline

`fetchSources()` calls modular adapters:

- NALCO official website
- NALCO investor relations
- GDELT news
- NewsAPI when `NEWS_API_KEY` is configured
- Commodity adapter with transparent fallback
- Government policy watch

The pipeline then normalizes, deduplicates, extracts entities, classifies event type, classifies sentiment, scores materiality, creates embeddings and stores documents.

## AI/NLP

Entity detection combines domain dictionaries with deterministic classification. The RAG layer uses local hashed embeddings plus keyword scoring, then optionally calls OpenAI with strict evidence-only instructions. Answers include citations, confidence and date range.

## Source Transparency

All answers are grounded in retrieved documents. If no adequate evidence is retrieved, the assistant refuses unsupported claims with the required verification sentence.
