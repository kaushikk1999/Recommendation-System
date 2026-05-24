import * as cheerio from "cheerio";
import { env } from "@/lib/env";
import { getSheetSourceConfigs, sheetsConfigured } from "@/lib/google-sheets";
import type { RawSourceItem } from "@/lib/types";

export interface SourceAdapter {
  name: string;
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

function normalizeSourceDate(value?: string | null) {
  if (!value) return null;
  const compact = value.match(/^(\d{4})(\d{2})(\d{2})(?:T?(\d{2})(\d{2})(\d{2})Z?)?$/);
  if (compact) {
    const [, year, month, day, hour = "00", minute = "00", second = "00"] = compact;
    return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function fetchHtml(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      headers: { "user-agent": env.SCRAPER_USER_AGENT },
      signal: controller.signal,
      next: { revalidate: 1800 }
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function pageItems(html: string, baseUrl: string, sourceName: string, sourceType: RawSourceItem["sourceType"]) {
  const $ = cheerio.load(html);
  const items: RawSourceItem[] = [];
  $("a").each((_, element) => {
    const title = $(element).text().replace(/\s+/g, " ").trim();
    const href = $(element).attr("href");
    if (!title || title.length < 12 || !href) return;
    if (!/(nalco|result|annual|press|investor|announcement|dividend|financial|aluminium|alumina|bauxite)/i.test(title)) return;
    const url = new URL(href, baseUrl).toString();
    items.push({ title, sourceName, sourceType, url, rawText: title, publishedAt: null });
  });
  return items.slice(0, 12);
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
    const title = (heading || link.text() || node.text()).replace(/\s+/g, " ").trim();
    const rawText = node.text().replace(/\s+/g, " ").trim() || title;
    if (!title || title.length < 12) return;
    const url = href ? new URL(href, baseUrl).toString() : baseUrl;
    items.push({ title: title.slice(0, 220), sourceName, sourceType, url, rawText: rawText.slice(0, 4000), publishedAt: null });
  });
  if (!items.length) {
    const title = $("title").text().replace(/\s+/g, " ").trim() || sourceName;
    const rawText = $("body").text().replace(/\s+/g, " ").trim();
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

export class NalcoOfficialAdapter implements SourceAdapter {
  name = "NALCO Official Website";
  async fetch() {
    const url = "https://nalcoindia.com/";
    const html = await fetchHtml(url);
    return pageItems(html, url, this.name, "press_release");
  }
}

export class NalcoInvestorAdapter implements SourceAdapter {
  name = "NALCO Investor Relations";
  async fetch() {
    const url = "https://nalcoindia.com/investor-services/";
    const html = await fetchHtml(url);
    return pageItems(html, url, this.name, "investor_announcement");
  }
}

export class GdeltNewsAdapter implements SourceAdapter {
  name = "GDELT News";
  async fetch(): Promise<RawSourceItem[]> {
    if (!env.GDELT_ENABLED) return [];
    const query = encodeURIComponent('(NALCO OR "National Aluminium Company" OR NATIONALUM) aluminium India');
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&format=json&maxrecords=20&sort=HybridRel`;
    const response = await fetch(url, { next: { revalidate: 1800 } });
    if (!response.ok) throw new Error(`GDELT failed: ${response.status}`);
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
  async fetch(): Promise<RawSourceItem[]> {
    if (!env.NEWS_API_KEY) return [];
    const query = encodeURIComponent('NALCO OR "National Aluminium Company" OR aluminium India');
    const url = `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=20&apiKey=${env.NEWS_API_KEY}`;
    const response = await fetch(url, { next: { revalidate: 1800 } });
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

export function getAdapters(): SourceAdapter[] {
  return [new ConfiguredHtmlAdapter(), new NalcoOfficialAdapter(), new NalcoInvestorAdapter(), new GdeltNewsAdapter(), new NewsApiAdapter(), new CommodityAdapter(), new PolicyAdapter()];
}
