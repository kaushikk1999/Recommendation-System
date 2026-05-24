"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";

export function IngestButton() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setToast(null);
    try {
      const response = await fetch("/api/ingest/run", { method: "POST" });
      const result = await response.json();
      setToast(`Ingestion ${result.status}: ${result.stored || 0} documents processed.`);
    } catch {
      setToast("Ingestion failed. Check source availability and environment variables.");
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 5000);
    }
  }

  return (
    <div className="relative">
      <Button onClick={run} disabled={loading}>
        <RefreshCw className={loading ? "animate-spin" : ""} size={17} />
        {loading ? "Running" : "Run ingestion"}
      </Button>
      {toast && (
        <div className="absolute right-0 top-12 z-20 w-80 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-sm shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
