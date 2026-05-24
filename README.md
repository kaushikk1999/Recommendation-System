# NALCO Intelligence Bot

Production-style market intelligence assistant for National Aluminium Company Limited (NALCO). The app ingests public evidence, extracts entities, classifies events and answers questions with citations.

## Features

- Floating chatbot widget with suggested prompts, confidence, evidence date range and source citations.
- Intelligence dashboard with latest documents, sentiment, high-impact events, market signals and policy mentions.
- Modular ingestion adapters for NALCO official pages, investor pages, GDELT, NewsAPI, commodity context and government policy monitoring.
- Hybrid NLP layer using NALCO-specific dictionaries, event classification, sentiment scoring and materiality scoring.
- Citation-first RAG pipeline with local vector-style retrieval and optional OpenAI answer generation.
- PostgreSQL Prisma schema, deployable on Vercel with Neon/Supabase.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`.

The app runs in demo fallback mode without API keys or a database. Configure `DATABASE_URL` for persistence and `OPENAI_API_KEY` for LLM-generated grounded answers.

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run typecheck
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run ingest
```

## Evidence Discipline

The bot never presents fallback commodity data as live price data. If evidence is missing, it responds: `I could not verify this from available sources.`

## Key Routes

- `/` landing page
- `/dashboard` intelligence dashboard
- `/sources` source library
- `/sources/[id]` evidence detail
- `/entities` entity explorer
- `/search` retrieval search
- `/demo` recruiter demo mode

## API Routes

- `GET /api/health`
- `POST /api/ingest/run`
- `GET /api/documents`
- `GET /api/documents/:id`
- `GET /api/entities`
- `GET /api/analytics/overview`
- `POST /api/chat`
- `GET /api/sources/status`
- `GET /api/search?q=`
