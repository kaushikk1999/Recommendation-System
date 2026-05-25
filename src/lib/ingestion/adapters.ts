import * as cheerio from "cheerio";
import { env } from "@/lib/env";
import { isUsableEvidence, validEvidenceDate } from "@/lib/evidence-quality";
import { getSheetSourceConfigs, sheetsConfigured } from "@/lib/google-sheets";
import type { RawSourceItem, SourceFetchMetadata, SourceFetchStatus, SourceType } from "@/lib/types";

export interface SourceAdapter {
  name: string;
  errors?: string[];
  critical?: boolean;
  metadata?: Partial<SourceFetchMetadata>;
  fetch(): Promise<RawSourceItem[]>;
}

interface GdeltArticle {
  title?: string;
  sourceCountry?: string;
  url?: string;
  seendate?: string;
  domain?: string;
  language?: string;
}

interface NewsApiArticle {
  title?: string;
  source?: { name?: string };
  url?: string;
  publishedAt?: string;
  description?: string;
  content?: string;
}

const nalcoRoots = [
  "https://nalcoindia.com/",
  "https://nalcoindia.com/media/",
  "https://nalcoindia.com/news-room/press-release/",
  "https://nalcoindia.com/investor-services/",
  "https://nalcoindia.com/investor-services/financial-results/",
  "https://nalcoindia.com/investor-services/annual-reports/",
  "https://nalcoindia.com/company/our-growth-story/production-financial-highlights/"
];

const transientStatuses = new Set([429, 500, 502, 503, 504]);
const maxFetchAttempts = 3;

function emptyMetadata(): SourceFetchMetadata {
  return { sourceStatuses: [], failedUrls: [], retriedUrls: [], successfulNalcoPages: 0 };
}

export function sourceStatus(adapter: SourceAdapter, fetched: number): SourceFetchStatus {
  if (adapter.name === "NewsAPI" && !env.NEWS_API_KEY) return { name: adapter.name, status: "skipped", critical: Boolean(adapter.critical), fetched: 0, errors: [] };
  if (adapter.name === "GDELT News" && !env.GDELT_ENABLED) return { name: adapter.name, status: "skipped", critical: Boolean(adapter.critical), fetched: 0, errors: [] };
  const errors = adapter.errors || [];
  return {
    name: adapter.name,
    status: errors.length ? (fetched > 0 ? "warning" : "failed") : "ok",
    critical: Boolean(adapter.critical),
    fetched,
    errors
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryAfterMs(response: Response) {
  const retryAfter = response.headers.get("retry-after");
  if (!retryAfter) return null;
  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = new Date(retryAfter).getTime();
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
}

function isTransientError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /abort|timeout|fetch failed|network|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN/i.test(message);
}

async function fetchWithRetry(url: string, init: RequestInit, retriedUrls?: string[]) {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxFetchAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.INGEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
      if (response.ok || !transientStatuses.has(response.status) || attempt === maxFetchAttempts - 1) return response;
      if (!retriedUrls?.includes(url)) retriedUrls?.push(url);
      await sleep(retryAfterMs(response) ?? 500 * 2 ** attempt + Math.floor(Math.random() * 250));
    } catch (error) {
      lastError = error;
      if (!isTransientError(error) || attempt === maxFetchAttempts - 1) throw error;
      if (!retriedUrls?.includes(url)) retriedUrls?.push(url);
      await sleep(500 * 2 ** attempt + Math.floor(Math.random() * 250));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError || "Fetch failed"));
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function stripHash(url: string) {
  const parsed = new URL(url);
  parsed.hash = "";
  return parsed.toString();
}

function normalizeSourceDate(value?: string | null) {
  if (!value) return null;
  const compact = value.match(/^(\d{4})(\d{2})(\d{2})(?:T?(\d{2})(\d{2})(\d{2})Z?)?$/);
  if (compact) {
    const [, year, month, day, hour = "00", minute = "00", second = "00"] = compact;
    return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
  }
  const cleaned = value.replace(/(\d+)(st|nd|rd|th)/gi, "$1").replace(/\s+/g, " ").trim();
  const dmy = cleaned.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy;
    const date = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00.000Z`);
    if (!Number.isNaN(date.getTime())) return validEvidenceDate(date.toISOString());
  }
  const date = new Date(cleaned);
  return Number.isNaN(date.getTime()) ? null : validEvidenceDate(date.toISOString());
}

function inferDateFromText(text: string) {
  const patterns = [
    /\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/,
    /\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b/,
    /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*[,]?\s+\d{4}\b/i,
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?[,]?\s+\d{4}\b/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const date = normalizeSourceDate(match?.[0]);
    if (date) return date;
  }
  return null;
}

function inferDateFromUrl(url: string) {
  const match = url.match(/\/(20\d{2})\/(\d{2})\//) || url.match(/(20\d{2})[-_](\d{2})[-_](\d{2})/);
  if (!match) return null;
  if (match.length === 3) return validEvidenceDate(normalizeSourceDate(`${match[1]}-${match[2]}-01`));
  return normalizeSourceDate(`${match[1]}-${match[2]}-${match[3]}`);
}

async function fetchText(url: string, retriedUrls?: string[]) {
  const response = await fetchWithRetry(
    url,
    {
      headers: { "user-agent": env.SCRAPER_USER_AGENT }
    },
    retriedUrls
  );
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return { text: await response.text(), contentType: response.headers.get("content-type") || "" };
}

async function fetchHtml(url: string, retriedUrls?: string[]) {
  const { text, contentType } = await fetchText(url, retriedUrls);
  if (!contentType.includes("text/html")) throw new Error(`Unsupported content type ${contentType || "unknown"}`);
  return text;
}

function canonicalUrl($: cheerio.CheerioAPI, fallbackUrl: string) {
  const canonical = $('link[rel="canonical"]').attr("href") || $('meta[property="og:url"]').attr("content");
  try {
    return stripHash(canonical ? new URL(canonical, fallbackUrl).toString() : fallbackUrl);
  } catch {
    return stripHash(fallbackUrl);
  }
}

function isNalcoUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "nalcoindia.com" || parsed.hostname === "www.nalcoindia.com";
  } catch {
    return false;
  }
}

function isPdfUrl(url: string) {
  return /\.pdf(?:$|[?#])/i.test(url);
}

function shouldCrawlHtml(url: string) {
  if (!isNalcoUrl(url) || isPdfUrl(url)) return false;
  if (/\.(jpg|jpeg|png|gif|webp|svg|zip|xlsx?|docx?|pptx?)(?:$|[?#])/i.test(url)) return false;
  return true;
}

function classifyNalcoSource(url: string, text: string): SourceType {
  const haystack = `${url} ${text}`.toLowerCase();
  const path = new URL(url).pathname.toLowerCase();
  if (path.includes("press-release") || path.includes("news-room") || path.includes("media")) return "press_release";
  if (path.includes("financial-result")) return "financial_result";
  if (path.includes("annual-report")) return "annual_report";
  if (path.includes("investor-services")) return "investor_announcement";
  if (/annual[-\s]?report|annual-reports/.test(haystack)) return "annual_report";
  if (/financial[-\s]?result|results?|quarter|audited|unaudited/.test(haystack)) return "financial_result";
  if (/investor|dividend|shareholder|board meeting|agm|egm|stock exchange|sebi/.test(haystack)) return "investor_announcement";
  if (/press[-\s]?release|news-room|media|announcement|cmd|award|production|sales/.test(haystack)) return "press_release";
  if (/ministry|government|policy|tender|procurement/.test(haystack)) return "policy";
  return "news";
}

function pageTitle($: cheerio.CheerioAPI, sourceName: string) {
  const heading = cleanText($("h1").first().text() || $("h2").first().text() || $('meta[property="og:title"]').attr("content") || $("title").text());
  return (heading || sourceName).replace(/\s*\|\s*NALCO.*$/i, "").slice(0, 220);
}

function contentText($: cheerio.CheerioAPI) {
  $("script,style,noscript,svg,form,nav,header,footer,.menu,.navbar,.breadcrumb,.breadcrumbs,.social,.share").remove();
  const selectors = [
    "article",
    "main",
    ".entry-content",
    ".post-content",
    ".page-content",
    ".content-area",
    ".site-content",
    ".elementor-widget-theme-post-content",
    ".vc_column-inner"
  ];
  for (const selector of selectors) {
    const text = cleanText($(selector).text());
    if (text.length > 300) return text;
  }
  return cleanText($("body").text());
}

function extractPublishedAt($: cheerio.CheerioAPI, url: string, text: string) {
  const meta =
    $('meta[property="article:published_time"]').attr("content") ||
    $('meta[property="article:modified_time"]').attr("content") ||
    $('meta[name="date"]').attr("content") ||
    $("time[datetime]").first().attr("datetime") ||
    cleanText($("time").first().text());
  return normalizeSourceDate(meta) || inferDateFromText(cleanText($(".date,.posted-on,.entry-date,.post-date").first().text())) || inferDateFromUrl(url) || inferDateFromText(text.slice(0, 1200));
}

export function extractNalcoPage(html: string, pageUrl: string, sourceName = "NALCO Official Website"): RawSourceItem {
  const $ = cheerio.load(html);
  const url = canonicalUrl($, pageUrl);
  const rawText = contentText($);
  const title = pageTitle($, sourceName);
  return {
    title,
    sourceName,
    sourceType: classifyNalcoSource(url, `${title} ${rawText}`),
    url,
    publishedAt: validEvidenceDate(extractPublishedAt($, url, rawText)),
    rawText: rawText.slice(0, 16000) || title
  };
}

function extractLinks(html: string, baseUrl: string) {
  const $ = cheerio.load(html);
  const links: Array<{ url: string; text: string }> = [];
  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;
    try {
      const url = stripHash(new URL(href, baseUrl).toString());
      if (!isNalcoUrl(url)) return;
      links.push({ url, text: cleanText($(element).text()) });
    } catch {
      // Ignore malformed links from the source page.
    }
  });
  return links;
}

function pdfItem(link: { url: string; text: string }, sourceName: string): RawSourceItem | null {
  const fileName = decodeURIComponent(link.url.split("/").pop()?.replace(/\.pdf(?:[?#].*)?$/i, "") || "");
  const linkText = /^Size:\s*[\d.]+\s*(?:KB|MB),\s*Format:\s*PDF,\s*Language:/i.test(link.text) ? "" : link.text;
  const title = cleanText(linkText || fileName.replace(/[-_]+/g, " "));
  if (!title || title.length < 4) return null;
  return {
    title: title.slice(0, 220),
    sourceName,
    sourceType: classifyNalcoSource(link.url, title),
    url: link.url,
    publishedAt: validEvidenceDate(inferDateFromText(title) || inferDateFromUrl(link.url)),
    rawText: `PDF metadata indexed only. Title: ${title}. URL: ${link.url}`
  };
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, mapper: (item: T, index: number) => Promise<R>) {
  const results: R[] = [];
  let next = 0;
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function sitemapUrls(xml: string) {
  const $ = cheerio.load(xml, { xmlMode: true });
  return $("loc")
    .map((_, element) => cleanText($(element).text()))
    .get()
    .filter((url) => shouldCrawlHtml(url));
}

async function discoverNalcoSitemapUrls(metadata: SourceFetchMetadata) {
  const sitemapCandidates = ["https://nalcoindia.com/sitemap.xml", "https://nalcoindia.com/wp-sitemap.xml"];
  const urls = new Set<string>();
  for (const sitemapUrl of sitemapCandidates) {
    try {
      const { text } = await fetchText(sitemapUrl, metadata.retriedUrls);
      for (const url of sitemapUrls(text)) urls.add(stripHash(url));
    } catch {
      metadata.failedUrls.push(sitemapUrl);
      // Sitemap discovery is opportunistic; root crawling still covers the core site.
    }
  }
  return [...urls];
}

export async function crawlNalcoSite() {
  const sourceName = "NALCO Official Website";
  const metadata = emptyMetadata();
  const discoveredUrls = await discoverNalcoSitemapUrls(metadata);
  const queue = [...nalcoRoots.map(stripHash), ...discoveredUrls].slice(0, env.NALCO_CRAWL_MAX_PAGES);
  const queued = new Set(queue);
  const visited = new Set<string>();
  const items = new Map<string, RawSourceItem>();
  const errors: string[] = [];

  while (queue.length && visited.size < env.NALCO_CRAWL_MAX_PAGES) {
    const batch = queue.splice(0, env.NALCO_CRAWL_CONCURRENCY).filter((url) => !visited.has(url));
    await mapWithConcurrency(batch, env.NALCO_CRAWL_CONCURRENCY, async (url) => {
      visited.add(url);
      try {
        const html = await fetchHtml(url, metadata.retriedUrls);
        const item = extractNalcoPage(html, url, sourceName);
        if (item.rawText.length >= 80 && isUsableEvidence(item)) {
          items.set(item.url, item);
          metadata.successfulNalcoPages += 1;
        }
        for (const link of extractLinks(html, url)) {
          if (isPdfUrl(link.url)) {
            const pdf = pdfItem(link, sourceName);
            if (pdf && isUsableEvidence(pdf)) items.set(pdf.url, pdf);
            continue;
          }
          if (shouldCrawlHtml(link.url) && !queued.has(link.url) && visited.size + queue.length < env.NALCO_CRAWL_MAX_PAGES) {
            queued.add(link.url);
            queue.push(link.url);
          }
        }
      } catch (error) {
        const message = `${url}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(message);
        metadata.failedUrls.push(url);
      }
    });
  }

  return { items: [...items.values()], errors, metadata };
}

function configuredItems(html: string, baseUrl: string, sourceName: string, sourceType: RawSourceItem["sourceType"], selector?: string | null) {
  const $ = cheerio.load(html);
  const items: RawSourceItem[] = [];
  const scope = selector ? $(selector) : $("article, main, section, a");
  scope.each((_, element) => {
    const node = $(element);
    const link = node.is("a") ? node : node.find("a").first();
    const href = link.attr("href");
    const heading = node.find("h1,h2,h3").first().text();
    const title = cleanText(heading || link.text() || node.text());
    const rawText = cleanText(node.text()) || title;
    if (!title || title.length < 12) return;
    const url = href ? new URL(href, baseUrl).toString() : baseUrl;
    items.push({ title: title.slice(0, 220), sourceName, sourceType, url, rawText: rawText.slice(0, 4000), publishedAt: null });
  });
  if (!items.length) {
    const title = cleanText($("title").text()) || sourceName;
    const rawText = cleanText($("body").text());
    if (rawText) items.push({ title, sourceName, sourceType, url: baseUrl, rawText: rawText.slice(0, 4000), publishedAt: null });
  }
  return items.slice(0, 20);
}

export class ConfiguredHtmlAdapter implements SourceAdapter {
  name = "Configured HTML Sources";
  async fetch(): Promise<RawSourceItem[]> {
    if (!sheetsConfigured()) return [];
    const configs = await getSheetSourceConfigs();
    const settled = await Promise.allSettled(
      configs.map(async (config) => {
        const html = await fetchHtml(config.url);
        return configuredItems(html, config.url, config.sourceName, config.sourceType, config.selector);
      })
    );
    return settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  }
}

export class NalcoDeepCrawlerAdapter implements SourceAdapter {
  name = "NALCO Deep Website Crawl";
  critical = true;
  errors: string[] = [];
  metadata: Partial<SourceFetchMetadata> = {};

  async fetch() {
    const result = await crawlNalcoSite();
    this.errors = result.errors;
    this.metadata = result.metadata;
    return result.items;
  }
}

export class GdeltNewsAdapter implements SourceAdapter {
  name = "GDELT News";
  critical = false;
  async fetch(): Promise<RawSourceItem[]> {
    if (!env.GDELT_ENABLED) return [];
    const query = encodeURIComponent('(NALCO OR "National Aluminium Company" OR NATIONALUM) aluminium India');
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&format=json&maxrecords=20&sort=HybridRel`;
    const response = await fetchWithRetry(url, {});
    if (!response.ok) throw new Error(response.status === 429 ? "External news feed was temporarily rate-limited." : `External news feed failed: ${response.status}`);
    const data = await response.json();
    return ((data.articles || []) as GdeltArticle[]).filter((article) => article.title && article.url).map((article) => ({
      title: article.title || "Untitled GDELT article",
      sourceName: article.sourceCountry ? `GDELT ${article.sourceCountry}` : "GDELT",
      sourceType: "news" as const,
      url: article.url || "https://api.gdeltproject.org/",
      publishedAt: normalizeSourceDate(article.seendate),
      rawText: `${article.title}. ${article.domain || ""} ${article.language || ""}`
    }));
  }
}

export class NewsApiAdapter implements SourceAdapter {
  name = "NewsAPI";
  critical = false;
  async fetch(): Promise<RawSourceItem[]> {
    if (!env.NEWS_API_KEY) return [];
    const query = encodeURIComponent('NALCO OR "National Aluminium Company" OR aluminium India');
    const url = `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=20&apiKey=${env.NEWS_API_KEY}`;
    const response = await fetchWithRetry(url, {});
    if (!response.ok) throw new Error(`NewsAPI failed: ${response.status}`);
    const data = await response.json();
    return ((data.articles || []) as NewsApiArticle[]).filter((article) => article.title && article.url).map((article) => ({
      title: article.title || "Untitled news article",
      sourceName: article.source?.name || "NewsAPI",
      sourceType: "news" as const,
      url: article.url || "https://newsapi.org/",
      publishedAt: normalizeSourceDate(article.publishedAt),
      rawText: `${article.title}. ${article.description || ""} ${article.content || ""}`
    }));
  }
}

export class CommodityAdapter implements SourceAdapter {
  name = "Commodity Market Adapter";
  critical = false;
  async fetch(): Promise<RawSourceItem[]> {
    return [
      {
        title: env.COMMODITY_API_KEY ? "Configured aluminium commodity API signal" : "Fallback aluminium commodity signal: configure COMMODITY_API_KEY for live prices",
        sourceName: env.COMMODITY_API_KEY ? "Commodity API" : "Commodity Adapter Fallback",
        sourceType: "commodity",
        url: "https://www.lme.com/en/Metals/Non-ferrous/LME-Aluminium",
        publishedAt: new Date().toISOString(),
        rawText:
          "Aluminium price movement, LME inventories, energy cost, coal availability, alumina and bauxite supply are tracked as market signals for NALCO. This fallback does not claim a live price."
      }
    ];
  }
}

export class PolicyAdapter implements SourceAdapter {
  name = "Government Policy Watch";
  critical = false;
  async fetch(): Promise<RawSourceItem[]> {
    return [
      {
        title: "Policy source configured for Ministry of Mines, SEBI, NSE and BSE monitoring",
        sourceName: this.name,
        sourceType: "policy",
        url: "https://mines.gov.in/",
        publishedAt: new Date().toISOString(),
        rawText:
          "Monitor Government of India, Ministry of Mines, SEBI, NSE and BSE updates for aluminium, bauxite, mining, energy, export duty and import duty policy changes affecting NALCO."
      }
    ];
  }
}

export class MockLiveSourcesAdapter implements SourceAdapter {
  name = "Mock Live NALCO Sources";
  critical = true;
  metadata: Partial<SourceFetchMetadata> = { successfulNalcoPages: 2 };
  async fetch(): Promise<RawSourceItem[]> {
    const now = new Date().toISOString();
    return [
      {
        title: "Live NALCO press update: production and operations review",
        sourceName: "NALCO Official Website",
        sourceType: "press_release",
        url: "https://nalcoindia.com/news-room/press-release/live-operations-review/",
        publishedAt: now,
        rawText:
          "National Aluminium Company Limited published a live operations review covering aluminium, alumina, bauxite, Damanjodi and Angul assets. The update highlights production stability, operational readiness, Odisha assets, and market-relevant operating factors for NALCO."
      },
      {
        title: "Live NALCO investor filing: board and financial update",
        sourceName: "NALCO Investor Relations",
        sourceType: "financial_result",
        url: "https://nalcoindia.com/investor-services/financial-results/live-board-update/",
        publishedAt: now,
        rawText:
          "NALCO investor relations published a live filing covering board actions, financial results, dividend context, shareholder communication, SEBI compliance, and exchange-relevant investor disclosures for National Aluminium Company Limited."
      }
    ];
  }
}

export function getAdapters(): SourceAdapter[] {
  if (env.NALCO_MOCK_LIVE_SOURCES) return [new MockLiveSourcesAdapter(), new CommodityAdapter(), new PolicyAdapter()];
  return [new ConfiguredHtmlAdapter(), new NalcoDeepCrawlerAdapter(), new GdeltNewsAdapter(), new NewsApiAdapter(), new CommodityAdapter(), new PolicyAdapter()];
}
