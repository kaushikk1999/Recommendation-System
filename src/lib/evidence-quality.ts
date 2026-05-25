import type { IntelligenceDocument, RawSourceItem } from "@/lib/types";

const utilityTitlePattern = /^(help|privacy policy|legal disclaimer|query\/appeal online|vigilance|vigilance complaints|complaints handling process|intensive examinations|nalco vigilance administration|best initiatives & practices)$/i;
const utilityUrlPattern = /\/(?:help|home\/(?:privacy-policy|legal-disclaimer)|vigilance(?:\/|$)|query-appeal|query\/appeal)/i;
const lowValueDocumentPattern =
  /\b(?:rti|right to information|code of conduct|sd policy|vigilance manual|vigilance handbook|nit|gem bidding|technical bid|necessary forms|tender|eprocurement|published nit|integrity pact format|trading\s*window|LetterTradingWindow)\b/i;
const proceduralNoticePattern =
  /\b(?:unclaimed (?:final )?dividend|transfer of (?:equity )?shares to (?:IEPF|investor education)|closure of register of members|newspaper publication regarding|unpaid.*dividend pertaining)\b/i;
const rtiSectionPattern = /^\s*\((?:i{1,3}|iv|v|vi{0,3}|ix|x{1,3}|xv|xvi{0,3})\)\s+(?:The |A )/i;
const adminPagePattern = /\b(?:powers and duties of its officers|particulars of facilities available to citizens|boards,?\s*councils,?\s*committees|statement of the boards)\b/i;
const redirectTextPattern = /^×?\s*Alert\s+You are being redirected to the external website/i;
const badPdfTitlePattern = /^Size:\s*[\d.]+\s*(?:KB|MB),\s*Format:\s*PDF,\s*Language:/i;

export function validEvidenceDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const maxYear = new Date().getUTCFullYear() + 1;
  if (year < 2000 || year > maxYear) return null;
  return date.toISOString();
}

export function isUtilityEvidence(item: Pick<RawSourceItem, "title" | "url" | "rawText"> & { cleanedText?: string; summary?: string }) {
  const title = item.title || "";
  const url = item.url || "";
  const text = item.cleanedText || item.summary || item.rawText || "";
  const titleAndUrl = `${title} ${url}`;
  return utilityTitlePattern.test(title) || utilityUrlPattern.test(url) || redirectTextPattern.test(text) || badPdfTitlePattern.test(title) || lowValueDocumentPattern.test(titleAndUrl) || proceduralNoticePattern.test(titleAndUrl) || rtiSectionPattern.test(title) || adminPagePattern.test(titleAndUrl);
}

export function isUsableEvidence(item: Pick<RawSourceItem, "title" | "url" | "rawText"> & { cleanedText?: string; summary?: string }) {
  return !isUtilityEvidence(item);
}

export function sanitizeDocumentDates<T extends IntelligenceDocument>(doc: T): T {
  return { ...doc, publishedAt: validEvidenceDate(doc.publishedAt) };
}
