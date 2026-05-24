import { NextResponse } from "next/server";
import { runIngestion } from "@/lib/ingestion/pipeline";
import { env } from "@/lib/env";

const globalForIngestion = globalThis as unknown as {
  nalcoIngestion?: {
    running?: Promise<Awaited<ReturnType<typeof runIngestion>>>;
    lastFinishedAt?: number;
    lastResult?: Awaited<ReturnType<typeof runIngestion>>;
  };
};

const ingestionState = (globalForIngestion.nalcoIngestion ??= {});

export async function POST(request: Request) {
  const url = new URL(request.url);
  const pageLoad = url.searchParams.get("mode") === "page-load";
  const cooldownMs = Math.max(60_000, env.INGESTION_INTERVAL_MINUTES * 60_000);

  if (pageLoad && ingestionState.running) {
    return NextResponse.json({ status: "skipped_running", fetched: 0, stored: 0, errors: [] });
  }

  if (pageLoad && ingestionState.lastFinishedAt && Date.now() - ingestionState.lastFinishedAt < cooldownMs) {
    return NextResponse.json({ status: "skipped_recent", fetched: 0, stored: 0, errors: [] });
  }

  try {
    ingestionState.running = runIngestion();
    const result = await ingestionState.running;
    ingestionState.lastFinishedAt = Date.now();
    ingestionState.lastResult = result;
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ status: "failed", error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  } finally {
    ingestionState.running = undefined;
  }
}
