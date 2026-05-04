import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const maxDuration = 60;

const ACTOR_URL =
  "https://api.apify.com/v2/acts/apify~youtube-scraper/run-sync-get-dataset-items";

interface YTItem {
  channelUrl?: string;
  channelHandle?: string;
  channelSubscriberCount?: number;
  channelThumbnail?: string;
  channelDescription?: string;
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

  const token = process.env.APIFY_TOKEN;
  if (!token) return NextResponse.json({ error: "Falta APIFY_TOKEN" }, { status: 500 });

  // Usar /videos para asegurar que el scraper encuentra los videos y extrae channelSubscriberCount
  const startUrls = ytComps.map((c) => {
    const handle = (c.handle as string).replace(/^@/, "");
    return { url: `https://www.youtube.com/@${handle}/videos` };
  });

  let items: YTItem[] = [];
  try {
    const res = await fetch(
      `${ACTOR_URL}?token=${token}&timeout=55`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startUrls, maxResults: 5 }),
      }
    );
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json({ error: `Apify error ${res.status}: ${errText.slice(0, 200)}` }, { status: 502 });
    }
    items = await res.json();
  } catch (err) {
    return NextResponse.json({ error: `No se pudo conectar con Apify: ${err instanceof Error ? err.message : ""}` }, { status: 502 });
  }

  if (!items.length) {
    return NextResponse.json({ error: "Apify no devolvió datos de YouTube. Verificá que los handles sean correctos.", updated: 0 }, { status: 404 });
  }

  // Agrupar videos por canal (usando channelHandle o extrayendo handle de channelUrl)
  const byChannel = new Map<string, YTItem[]>();
  for (const item of items) {
    // Preferir channelHandle; si es una URL tipo /channel/UC... usar la URL completa como key
    let key = (item.channelHandle ?? "").toLowerCase().replace(/^@/, "");
    if (!key && item.channelUrl) {
      // Extraer handle de URL tipo "https://youtube.com/@handle" o "https://youtube.com/channel/UC..."
      const match = (item.channelUrl as string).match(/@([^/?#]+)/i);
      key = match ? match[1].toLowerCase() : (item.channelUrl as string).toLowerCase();
    }
    if (!key) continue;
    if (!byChannel.has(key)) byChannel.set(key, []);
    byChannel.get(key)!.push(item);
  }

  let updated = 0;
  for (const comp of ytComps) {
    const handle = (comp.handle as string).replace(/^@/, "").toLowerCase();

    // Buscar por coincidencia parcial de handle en las claves del mapa
    const matchEntry = [...byChannel.entries()].find(([key]) =>
      key.includes(handle) || handle.includes(key)
    );
    const channelItems = matchEntry?.[1] ?? [];

    // También buscar en todos los items si no encontramos por canal
    const allItems = channelItems.length > 0
      ? channelItems
      : items.filter((i) => {
          const cUrl = (i.channelUrl ?? "").toLowerCase();
          const cHandle = (i.channelHandle ?? "").toLowerCase().replace(/^@/, "");
          return cUrl.includes(handle) || cHandle.includes(handle) || handle.includes(cHandle);
        });

    if (!allItems.length) continue;

    // Encontrar item con subscriberCount
    const itemWithSubs = allItems.find((i) => i.channelSubscriberCount && i.channelSubscriberCount > 0);
    const subscriberCount = itemWithSubs?.channelSubscriberCount ?? 0;
    if (!subscriberCount) continue;

    const history = [
      ...(Array.isArray(comp.followers_history) ? (comp.followers_history as number[]) : []),
      subscriberCount,
    ].slice(-12);

    const avgEng =
      allItems.length > 0 && subscriberCount > 0
        ? (allItems.reduce((s, v) => s + (v.likes ?? 0) + (v.commentsCount ?? 0), 0) / allItems.length / subscriberCount) * 100
        : 0;

    const recentPosts = allItems.slice(0, 5).map((v, i) => ({
      id: v.id ?? `yt-${i}`,
      caption: v.title ?? "",
      date: (v.date ?? new Date().toISOString()).slice(0, 10),
      likes: v.likes ?? 0,
      comments: v.commentsCount ?? 0,
    }));

    const profilePicUrl = itemWithSubs?.channelThumbnail ?? "";
    const bio = itemWithSubs?.channelDescription ?? "";

    const { error } = await supabase
      .from("competitors")
      .update({
        followers: subscriberCount,
        followers_history: history,
        engagement_rate: Math.round(avgEng * 10) / 10,
        recent_posts: recentPosts,
        profile_pic_url: profilePicUrl,
        bio,
        synced_at: new Date().toISOString(),
      })
      .eq("id", comp.id);

    if (!error) updated++;
  }

  return NextResponse.json({ updated, total: ytComps.length, syncedAt: new Date().toISOString() });
}
