"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const ingestRoutes = ["/dashboard", "/entities", "/sources", "/sources/status", "/demo"];

export function PageLoadIngestion({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!enabled || !pathname || !ingestRoutes.includes(pathname)) return;
    const key = `nalco-ingested:${pathname}:${Math.round(performance.timeOrigin)}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    let cancelled = false;
    fetch("/api/ingest/run?mode=page-load", { method: "POST" })
      .then(() => {
        if (!cancelled) router.refresh();
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [enabled, pathname, router]);

  return null;
}
