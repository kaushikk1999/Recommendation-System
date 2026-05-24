import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { PageLoadIngestion } from "@/components/page-load-ingestion";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "NALCO Intelligence Bot",
  description: "Market intelligence and corporate monitoring assistant for NALCO."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppShell>{children}</AppShell>
        <PageLoadIngestion enabled={env.ENABLE_PAGE_LOAD_INGEST} />
      </body>
    </html>
  );
}
