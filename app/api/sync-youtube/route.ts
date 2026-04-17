import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const maxDuration = 60;

const ACTOR_URL =
  "https://api.apify.com/v2/acts/apify~youtube-scraper/run-sync-get-dataset-items";

interface YTItem {
  channelUrl?: string;
  channelSubscriberCount?: number;
  title?: string;
  date?: string;
  likes?: number;
  commentsCount?: number;
  id?: string;
}

export async function POST() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: ytComps } = await supabase
    .from("competitors")
    .select("id, handle, followers_history")
    .eq("platform", "youtube");

  if (!ytComps?.length) return NextResponse.json({ updated: 0, message: "Sin creadores de YouTube" });

  const startUrls = ytComps.map((c) => ({
    url: `https://www.youtube.com/${(c.handle as string).startsWith("@") ? c.handle : "@" + c.handle}`,
  }));

  let items: YTItem[] = [];
  try {
    const res = await fetch(
      `${ACTOR_URL}?token=${process.env.APIFY_TOKEN}&timeout=50`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startUrls, maxResults: 5 }),
      }
    );
    if (!res.ok) {
      return NextResponse.json({ error: `Apify error ${res.status}` }, { status: 502 });
    }
    items = await res.json();
  } catch {
    return NextResponse.json({ error: "No se pudo conectar con Apify" }, { status: 502 });
  }

  // Agrupar videos por canal
  const byChannel = new Map<string, YTItem[]>();
  for (const item of items) {
    const key = (item.channelUrl ?? "").toLowerCase();
    if (!byChannel.has(key)) byChannel.set(key, []);
    byChannel.get(key)!.push(item);
  }

  let updated = 0;
  for (const comp of ytComps) {
    const handle = (comp.handle as string).replace(/^@/, "").toLowerCase();
    const channelItems =
      [...byChannel.entries()].find(([url]) => url.includes(handle))?.[1] ?? [];

    if (!channelItems.length) continue;

    const subscriberCount = channelItems[0].channelSubscriberCount;
    if (!subscriberCount) continue;

    const history = [
      ...(Array.isArray(comp.followers_history) ? (comp.followers_history as number[]) : []),
      subscriberCount,
    ].slice(-12);

    // Engagement estimado: (likes + comments) / views
    const avgEng =
      channelItems.length > 0
        ? channelItems.reduce((s, v) => s + (v.likes ?? 0) + (v.commentsCount ?? 0), 0) /
          channelItems.length /
          Math.max(subscriberCount, 1) *
          100
        : 0;

    const recentPosts = channelItems.slice(0, 5).map((v, i) => ({
      id: v.id ?? `yt-${i}`,
      caption: v.title ?? "",
      date: (v.date ?? new Date().toISOString()).slice(0, 10),
      likes: v.likes ?? 0,
      comments: v.commentsCount ?? 0,
    }));

    const { error } = await supabase
      .from("competitors")
      .update({
        followers: subscriberCount,
        followers_history: history,
        engagement_rate: Math.round(avgEng * 10) / 10,
        recent_posts: recentPosts,
      })
      .eq("id", comp.id);

    if (!error) updated++;
  }

  return NextResponse.json({ updated, total: ytComps.length, syncedAt: new Date().toISOString() });
}
