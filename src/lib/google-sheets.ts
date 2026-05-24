import { GoogleAuth } from "google-auth-library";
import { env } from "@/lib/env";
import type { ConfiguredHtmlSource, IngestionRunRecord, IntelligenceDocument, Sentiment, SourceType } from "@/lib/types";

const sheetsScope = "https://www.googleapis.com/auth/spreadsheets";

const documentHeaders = [
  "id",
  "title",
  "sourceName",
  "sourceType",
  "url",
  "publishedAt",
  "fetchedAt",
  "rawText",
  "cleanedText",
  "summary",
  "entities",
  "commodities",
  "geographies",
  "policymakers",
  "eventType",
  "sentiment",
  "materialityScore",
  "embedding",
  "hashKey"
] as const;

const sourceConfigHeaders = ["enabled", "sourceName", "sourceType", "url", "selector", "notes"] as const;
const ingestionRunHeaders = ["timestamp", "fetched", "stored", "status", "errors"] as const;

type SheetName = "Documents" | "SourceConfig" | "IngestionRuns";

interface GoogleServiceAccount {
  client_email: string;
  private_key: string;
}

function decodeServiceAccount() {
  if (!env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) return null;
  try {
    return JSON.parse(Buffer.from(env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64, "base64").toString("utf8")) as GoogleServiceAccount;
  } catch {
    return null;
  }
}

export function sheetsConfigured() {
  return Boolean(env.GOOGLE_SHEETS_ID && decodeServiceAccount());
}

async function sheetsClient() {
  const credentials = decodeServiceAccount();
  if (!env.GOOGLE_SHEETS_ID || !credentials) throw new Error("Google Sheets is not configured");
  const auth = new GoogleAuth({ credentials, scopes: [sheetsScope] });
  return auth.getClient();
}

function range(sheet: SheetName, a1: string) {
  return `${encodeURIComponent(sheet)}!${a1}`;
}

async function request<T>(path: string, init?: { method?: string; data?: unknown }) {
  const client = await sheetsClient();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEETS_ID}${path}`;
  const response = await client.request<T>({ url, method: init?.method || "GET", data: init?.data });
  return response.data;
}

async function readValues(sheet: SheetName, a1 = "A:Z") {
  await ensureSheetExists(sheet);
  const data = await request<{ values?: string[][] }>(`/values/${range(sheet, a1)}`);
  return data.values || [];
}

async function updateValues(sheet: SheetName, a1: string, values: unknown[][]) {
  await ensureSheetExists(sheet);
  await request(`/values/${range(sheet, a1)}?valueInputOption=RAW`, {
    method: "PUT",
    data: { values }
  });
}

async function appendValues(sheet: SheetName, values: unknown[][]) {
  await ensureSheetExists(sheet);
  await request(`/values/${encodeURIComponent(sheet)}!A:Z:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    data: { values }
  });
}

const ensuredSheets = new Set<SheetName>();

async function ensureSheetExists(sheet: SheetName) {
  if (ensuredSheets.has(sheet)) return;
  const metadata = await request<{ sheets?: Array<{ properties?: { title?: string } }> }>("");
  const exists = metadata.sheets?.some((entry) => entry.properties?.title === sheet);
  if (!exists) {
    await request(":batchUpdate", {
      method: "POST",
      data: { requests: [{ addSheet: { properties: { title: sheet } } }] }
    });
  }
  ensuredSheets.add(sheet);
}

async function ensureHeaders(sheet: SheetName, headers: readonly string[]) {
  const [current] = await readValues(sheet, "A1:Z1");
  if (!current?.length) await updateValues(sheet, `A1:${columnName(headers.length)}1`, [headers as unknown as string[]]);
}

function columnName(index: number) {
  let name = "";
  let current = index;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
}

function parseJson<T>(value: string | undefined, fallback: T) {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function documentToRow(doc: IntelligenceDocument) {
  return [
    doc.id,
    doc.title,
    doc.sourceName,
    doc.sourceType,
    doc.url,
    doc.publishedAt || "",
    doc.fetchedAt,
    doc.rawText,
    doc.cleanedText,
    doc.summary,
    JSON.stringify(doc.entities),
    JSON.stringify(doc.commodities),
    JSON.stringify(doc.geographies),
    JSON.stringify(doc.policymakers),
    doc.eventType,
    doc.sentiment,
    String(doc.materialityScore),
    JSON.stringify(doc.embedding),
    doc.hashKey
  ];
}

function rowToDocument(row: string[]): IntelligenceDocument | null {
  if (!row[0] || !row[1] || !row[18]) return null;
  return {
    id: row[0],
    title: row[1],
    sourceName: row[2] || "Configured HTML Source",
    sourceType: (row[3] || "news") as SourceType,
    url: row[4] || "",
    publishedAt: row[5] || null,
    fetchedAt: row[6] || new Date().toISOString(),
    rawText: row[7] || "",
    cleanedText: row[8] || row[7] || "",
    summary: row[9] || "",
    entities: parseJson(row[10], []),
    commodities: parseJson(row[11], []),
    geographies: parseJson(row[12], []),
    policymakers: parseJson(row[13], []),
    eventType: row[14] || "general",
    sentiment: (row[15] || "neutral") as Sentiment,
    materialityScore: Number(row[16] || 0),
    embedding: parseJson(row[17], []),
    hashKey: row[18]
  };
}

export async function getSheetDocuments(limit = 100) {
  await ensureHeaders("Documents", documentHeaders);
  const rows = await readValues("Documents", "A2:S");
  return rows.map(rowToDocument).filter((doc): doc is IntelligenceDocument => Boolean(doc)).slice(0, limit);
}

export async function upsertSheetDocuments(documents: IntelligenceDocument[]) {
  if (!documents.length) return 0;
  await ensureHeaders("Documents", documentHeaders);
  const rows = await readValues("Documents", "A2:S");
  const existing = new Map<string, number>();
  rows.forEach((row, index) => {
    const hashKey = row[18];
    if (hashKey) existing.set(hashKey, index + 2);
  });

  const toAppend: unknown[][] = [];
  for (const doc of documents) {
    const row = documentToRow(doc);
    const rowNumber = existing.get(doc.hashKey);
    if (rowNumber) {
      await updateValues("Documents", `A${rowNumber}:S${rowNumber}`, [row]);
    } else {
      toAppend.push(row);
    }
  }
  if (toAppend.length) await appendValues("Documents", toAppend);
  return documents.length;
}

export async function getSheetSourceConfigs(): Promise<ConfiguredHtmlSource[]> {
  await ensureHeaders("SourceConfig", sourceConfigHeaders);
  const rows = await readValues("SourceConfig", "A2:F");
  return rows
    .map((row) => ({
      enabled: !["false", "0", "no", "disabled"].includes((row[0] || "true").toLowerCase()),
      sourceName: row[1] || "Configured HTML Source",
      sourceType: (row[2] || "news") as SourceType,
      url: row[3] || "",
      selector: row[4] || null,
      notes: row[5] || null
    }))
    .filter((source) => source.enabled && Boolean(source.url));
}

export async function appendIngestionRun(run: IngestionRunRecord) {
  await ensureHeaders("IngestionRuns", ingestionRunHeaders);
  await appendValues("IngestionRuns", [[run.timestamp, run.fetched, run.stored, run.status, JSON.stringify(run.errors)]]);
}

export async function getLastIngestionRun(): Promise<IngestionRunRecord | null> {
  await ensureHeaders("IngestionRuns", ingestionRunHeaders);
  const rows = await readValues("IngestionRuns", "A2:E");
  const row = rows.at(-1);
  if (!row) return null;
  return {
    timestamp: row[0] || "",
    fetched: Number(row[1] || 0),
    stored: Number(row[2] || 0),
    status: row[3] || "unknown",
    errors: parseJson(row[4], [])
  };
}

export async function getSheetsStatus() {
  if (!sheetsConfigured()) return { configured: false, ok: false, message: "Google Sheets is not configured" };
  try {
    await readValues("SourceConfig", "A1:F1");
    return { configured: true, ok: true, message: "Google Sheets connection is ready" };
  } catch (error) {
    return { configured: true, ok: false, message: error instanceof Error ? error.message : "Google Sheets check failed" };
  }
}
