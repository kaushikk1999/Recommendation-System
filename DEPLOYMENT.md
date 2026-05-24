# Deployment Guide

## Vercel

1. Push the repository to GitHub.
2. Create a Vercel project from the repository.
3. Add environment variables:
   - `DATABASE_URL`
   - `OPENAI_API_KEY`
   - `NEWS_API_KEY` optional
   - `GDELT_ENABLED=true`
   - `COMMODITY_API_KEY` optional
   - `OLLAMA_API_KEY`
   - `OLLAMA_HOST=https://ollama.com`
   - `OLLAMA_MODEL=gemma4:31b-cloud`
   - `GOOGLE_SHEETS_ID`
   - `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`
   - `SCRAPER_USER_AGENT`
   - `INGESTION_INTERVAL_MINUTES=1`
   - `NEXT_PUBLIC_APP_NAME`
4. Set build command to `npm run build`.
5. Deploy.

## PostgreSQL

Use Neon, Supabase, Railway or Render PostgreSQL.

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Scheduled Ingestion

On Vercel, create a cron job that calls every minute:

```text
POST https://your-domain.com/api/ingest/run
```

For Render/Railway/Fly.io, run:

```bash
npm run ingest
```

every `INGESTION_INTERVAL_MINUTES`. When `ENABLE_PAGE_LOAD_INGEST=true`, open dashboard/source/search/entity/demo pages also trigger a browser heartbeat every minute and refresh after successful ingestion.

## NALCO Deep Crawl

The NALCO adapter crawls official `nalcoindia.com` HTML pages from the homepage, media, press release, investor, financial result and annual report roots. HTML pages are stored with full cleaned page text and inferred dates when available. PDF links are indexed as metadata only; PDF body extraction is intentionally disabled in this version.

## Commodity Data

The included commodity adapter links to LME context and clearly labels fallback mode. Configure a licensed commodity API before showing live prices in production.
