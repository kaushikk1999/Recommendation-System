import type { IntelligenceDocument } from "@/lib/types";
import { normalizeDocument } from "@/lib/nlp/extraction";

const rawDemo = [
  {
    title: "NALCO board recommends final dividend and reports annual performance",
    sourceName: "NALCO Investor Relations",
    sourceType: "investor_announcement" as const,
    url: "https://nalcoindia.com/investor-services/",
    publishedAt: "2026-05-15T00:00:00.000Z",
    rawText:
      "National Aluminium Company Limited NALCO informed investors about board actions including dividend and annual performance discussion. The update references aluminium, alumina, bauxite operations in Odisha and compliance with SEBI and stock exchange requirements."
  },
  {
    title: "NSE corporate announcement for NATIONALUM references board meeting",
    sourceName: "NSE Corporate Filings",
    sourceType: "exchange_filing" as const,
    url: "https://www.nseindia.com/companies-listing/corporate-filings-announcements",
    publishedAt: "2026-05-10T00:00:00.000Z",
    rawText:
      "NATIONALUM submitted a corporate filing related to a board meeting and financial result schedule. Exchange filings are material because investors track earnings, dividend decisions and management commentary."
  },
  {
    title: "Aluminium market commentary flags energy and LME price volatility",
    sourceName: "Commodity Adapter Fallback",
    sourceType: "commodity" as const,
    url: "https://www.lme.com/en/Metals/Non-ferrous/LME-Aluminium",
    publishedAt: "2026-05-20T00:00:00.000Z",
    rawText:
      "Aluminium prices on the London Metal Exchange can influence NALCO realizations, while coal, power and caustic soda costs affect margins. China, Europe and Middle East demand conditions remain important market signals."
  },
  {
    title: "Policy watch: Ministry of Mines updates remain relevant for bauxite and aluminium producers",
    sourceName: "Government Policy Watch",
    sourceType: "policy" as const,
    url: "https://mines.gov.in/",
    publishedAt: "2026-05-18T00:00:00.000Z",
    rawText:
      "Government of India and Ministry of Mines policy updates on mining auctions, bauxite availability, export duties or import duties can affect aluminium producers including NALCO, Hindalco and Vedanta."
  },
  {
    title: "NALCO operations note highlights Damanjodi and Angul assets",
    sourceName: "NALCO Official Website",
    sourceType: "press_release" as const,
    url: "https://nalcoindia.com/",
    publishedAt: "2026-05-12T00:00:00.000Z",
    rawText:
      "NALCO operates integrated bauxite, alumina and aluminium assets with important facilities around Damanjodi and Angul in Odisha. Production stability and power availability are key operational risk factors."
  }
];

export const demoDocuments: IntelligenceDocument[] = rawDemo.map(normalizeDocument);
