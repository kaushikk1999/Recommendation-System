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
   - `SCRAPER_USER_AGENT`
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

On Vercel, create a cron job that calls:

```text
POST https://your-domain.com/api/ingest/run
```

For Render/Railway/Fly.io, run:

```bash
npm run ingest
```

every `INGESTION_INTERVAL_MINUTES`.

## Commodity Data

The included commodity adapter links to LME context and clearly labels fallback mode. Configure a licensed commodity API before showing live prices in production.
