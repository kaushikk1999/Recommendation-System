import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  OLLAMA_API_KEY: z.string().optional(),
  OLLAMA_HOST: z.string().default("https://ollama.com"),
  OLLAMA_MODEL: z.string().default("gemma4:31b-cloud"),
  GOOGLE_SHEETS_ID: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_JSON_BASE64: z.string().optional(),
  NEWS_API_KEY: z.string().optional(),
  GDELT_ENABLED: z.coerce.boolean().default(true),
  COMMODITY_API_KEY: z.string().optional(),
  SCRAPER_USER_AGENT: z.string().default("NALCO-Intelligence-Bot/1.0 (+public-demo)"),
  INGESTION_INTERVAL_MINUTES: z.coerce.number().default(30),
  NEXT_PUBLIC_APP_NAME: z.string().default("NALCO Intelligence Bot"),
  APP_BASE_URL: z.string().default("http://localhost:3000"),
  ENABLE_LIVE_INGEST: z.coerce.boolean().default(true),
  ENABLE_PAGE_LOAD_INGEST: z.coerce.boolean().default(false)
});

export const env = envSchema.parse(process.env);
