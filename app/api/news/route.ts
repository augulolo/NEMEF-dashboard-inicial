import { NextResponse } from "next/server";
import { FEEDS, classifyTopics, type NewsItem } from "@/lib/news";

export const revalidate = 600; // cache 10 min

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&aacute;/g, "á")
    .replace(/&eacute;/g, "é")
    .replace(/&iacute;/g, "í")
    .replace(/&oacute;/g, "ó")
    .replace(/&uacute;/g, "ú")
    .replace(/&ntilde;/g, "ñ")
    .replace(/&Aacute;/g, "Á")
    .replace(/&Eacute;/g, "É")
    .replace(/&Iacute;/g, "Í")
    .replace(/&Oacute;/g, "Ó")
    .replace(/&Uacute;/g, "Ú")
    .replace(/&Ntilde;/g, "Ñ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&");
}

function unwrapCdata(s: string): string {
  const m = s.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return m ? m[1] : s;
}

function pick(xml: string, tag: string): string | null {
  // Match <tag ...>value</tag> (non-greedy, multiline)
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i");
  const m = xml.match(re);
  return m ? m[1] : null;
}

function pickLink(xml: string): string | null {
  // Atom <link href="..."/>
  const atom = xml.match(/<link[^>]*href="([^"]+)"[^>]*\/?>/i);
  if (atom) return atom[1];
  // RSS <link>...</link>
  const rss = pick(xml, "link");
  return rss ? rss.trim() : null;
}

function clean(text: string, max = 240): string {
  const t = decodeEntities(stripTags(unwrapCdata(text))).replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}

interface ParsedItem {
  title: string;
  link: string;
  publishedAt: string;
  summary: string;
}

function parseFeed(xml: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  // RSS <item> or Atom <entry>
  const blockRe = /<(item|entry)\b[\s\S]*?<\/\1>/gi;
  const blocks = xml.match(blockRe) ?? [];
  for (const block of blocks) {
    const rawTitle = pick(block, "title") ?? "";
    const link = pickLink(block) ?? "";
    const rawSummary =
      pick(block, "description") ??
      pick(block, "summary") ??
      pick(block, "content:encoded") ??
      pick(block, "content") ??
      "";
    const rawDate = pick(block, "pubDate") ?? pick(block, "published") ?? pick(block, "updated") ?? "";
    const title = clean(rawTitle, 200);
    if (!title) continue;
    const dateStr = rawDate.trim();
    let iso = "";
    if (dateStr) {
      const d = new Date(dateStr);
      iso = isNaN(d.getTime()) ? "" : d.toISOString();
    }
    items.push({
      title,
      link: link.trim(),
      publishedAt: iso,
      summary: clean(rawSummary, 240),
    });
  }
  return items;
}

async function fetchFeed(url: string, source: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 600 },
      headers: { "User-Agent": "Mozilla/5.0 RRPP-Dashboard" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const parsed = parseFeed(xml);
    return parsed.map((p, i) => ({
      id: `${source}-${i}-${p.link || p.title}`,
      title: p.title,
      link: p.link,
      source,
      publishedAt: p.publishedAt,
      summary: p.summary,
      topics: classifyTopics(`${p.title} ${p.summary}`),
    }));
  } catch {
    return [];
  }
}

export async function GET() {
  const results = await Promise.all(FEEDS.map((f) => fetchFeed(f.url, f.name)));
  const all = results.flat();
  all.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
  return NextResponse.json({ items: all, fetchedAt: new Date().toISOString() });
}
