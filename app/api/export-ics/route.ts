import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * GET /api/export-ics
 *
 * Exporta todos los posts programados de Instagram como un archivo .ics
 * compatible con Google Calendar, Apple Calendar y Outlook.
 *
 * Query params:
 *   ?months=3   — cuántos meses a futuro incluir (default: 3)
 *   ?past=true  — incluir posts pasados también
 */

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

function foldLine(line: string): string {
  // RFC 5545: lines must be max 75 octets; fold with CRLF + space
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let i = 0;
  parts.push(line.slice(0, 75));
  i = 75;
  while (i < line.length) {
    parts.push(" " + line.slice(i, i + 74));
    i += 74;
  }
  return parts.join("\r\n");
}

function toICSDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD → 20250505
  return dateStr.replace(/-/g, "");
}

const TYPE_LABELS: Record<string, string> = {
  reel: "🎬 Reel",
  carousel: "📊 Carrusel",
  photo: "🖼 Foto",
  story: "⚡ Historia",
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const months = parseInt(url.searchParams.get("months") ?? "3", 10);
  const includePast = url.searchParams.get("past") === "true";

  const supabase = await createServerSupabaseClient();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

  let query = supabase
    .from("posts")
    .select("id, caption, type, status, scheduled_date")
    .not("scheduled_date", "is", null)
    .order("scheduled_date");

  if (!includePast) {
    query = query.gte("scheduled_date", today);
  }

  if (months > 0) {
    const future = new Date(today + "T00:00:00");
    future.setMonth(future.getMonth() + months);
    const futureStr = future.toLocaleDateString("en-CA");
    query = query.lte("scheduled_date", futureStr);
  }

  const { data: posts, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";

  const events = (posts ?? []).map((p) => {
    const uid = `nemef-post-${p.id}@nemef-dashboard`;
    const dateStr = (p.scheduled_date as string).replace(/-/g, "");
    const nextDay = (() => {
      const d = new Date((p.scheduled_date as string) + "T00:00:00");
      d.setDate(d.getDate() + 1);
      return d.toLocaleDateString("en-CA").replace(/-/g, "");
    })();

    const typeLabel = TYPE_LABELS[(p.type as string) ?? ""] ?? "📱 Post";
    const caption = (p.caption as string) ?? "";
    const summary = `${typeLabel} — ${caption.slice(0, 60)}${caption.length > 60 ? "…" : ""}`;
    const status = p.status === "published" ? "CONFIRMED" : "TENTATIVE";

    const lines = [
      "BEGIN:VEVENT",
      foldLine(`UID:${uid}`),
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${nextDay}`,
      foldLine(`SUMMARY:${escapeICS(summary)}`),
      foldLine(`DESCRIPTION:${escapeICS(caption)}`),
      `STATUS:${status}`,
      `CATEGORIES:NEMEF,Instagram,${p.type ?? "post"}`,
      "END:VEVENT",
    ];

    return lines.join("\r\n");
  });

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NEMEF Dashboard//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:NEMEF — Posts de Instagram`,
    `X-WR-CALDESC:Posts programados exportados desde NEMEF Dashboard`,
    "X-WR-TIMEZONE:America/Argentina/Buenos_Aires",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(calendar, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="nemef-posts-${today}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
