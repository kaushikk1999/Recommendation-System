"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const ingestRoutes = ["/dashboard", "/entities", "/sources", "/sources/status", "/demo"];
const heartbeatMs = 60_000;

export function PageLoadIngestion({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!enabled || !pathname || !ingestRoutes.includes(pathname)) return;
    let cancelled = false;

    async function runHeartbeat() {
      try {
        const response = await fetch("/api/ingest/run?mode=page-load", { method: "POST" });
        if (!response.ok) return;
        if (!cancelled) router.refresh();
      } catch {
        // Keep the UI usable when a live source is slow or unavailable.
      }
    }

    runHeartbeat();
    const interval = window.setInterval(runHeartbeat, heartbeatMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [enabled, pathname, router]);

  return null;
}
