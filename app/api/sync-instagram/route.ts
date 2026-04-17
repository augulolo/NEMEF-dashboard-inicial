import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// Necesario para Vercel Hobby (max 60s)
export const maxDuration = 60;

const ACTOR_URL =
  "https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items";

interface ApifyPost {
  id?: string;
  caption?: string;
  timestamp?: string;
  likesCount?: number;
  commentsCount?: number;
}

interface ApifyProfile {
  username?: string;
  followersCount?: number;
  latestPosts?: ApifyPost[];
}

export async function POST() {
  const supabase = await createServerSupabaseClient();

  // Verificar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Traer creadores de Instagram desde Supabase
  const { data: igComps, error: dbErr } = await supabase
    .from("competitors")
    .select("id, handle, followers_history")
    .eq("platform", "instagram");

  if (dbErr || !igComps?.length) {
    return NextResponse.json({ updated: 0, message: "Sin creadores de Instagram en la DB" });
  }

  const usernames = igComps.map((c) => (c.handle as string).replace(/^@/, ""));

  // Llamar a Apify (timeout 50s para no exceder el límite de Vercel)
  let profiles: ApifyProfile[] = [];
  try {
    const apifyRes = await fetch(
      `${ACTOR_URL}?token=${process.env.APIFY_TOKEN}&timeout=50`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames }),
      }
    );
    if (!apifyRes.ok) {
      const text = await apifyRes.text();
      console.error("Apify error:", apifyRes.status, text);
      return NextResponse.json(
        { error: `Apify respondió con status ${apifyRes.status}` },
        { status: 502 }
      );
    }
    profiles = await apifyRes.json();
  } catch (err) {
    console.error("Apify fetch error:", err);
    return NextResponse.json({ error: "No se pudo conectar con Apify" }, { status: 502 });
  }

  // Actualizar cada perfil en Supabase
  let updated = 0;
  for (const profile of profiles) {
    if (!profile.username || !profile.followersCount) continue;

    const comp = igComps.find(
      (c) =>
        (c.handle as string).replace(/^@/, "").toLowerCase() ===
        profile.username!.toLowerCase()
    );
    if (!comp) continue;

    // Agregar el nuevo punto al historial (máximo 12 semanas)
    const currentHistory: number[] = Array.isArray(comp.followers_history)
      ? (comp.followers_history as number[])
      : [];
    const newHistory = [...currentHistory, profile.followersCount].slice(-12);

    // Engagement rate: (likes + comments) / seguidores promedio de los últimos posts
    const posts = profile.latestPosts?.slice(0, 12) ?? [];
    const avgEngagement =
      posts.length > 0 && profile.followersCount > 0
        ? (posts.reduce(
            (s, p) => s + (p.likesCount ?? 0) + (p.commentsCount ?? 0),
            0
          ) /
            posts.length /
            profile.followersCount) *
          100
        : 0;

    // Posts por semana (calculado desde timestamps reales)
    let postsPerWeek = 0;
    const timestamps = posts
      .map((p) => (p.timestamp ? new Date(p.timestamp).getTime() : 0))
      .filter(Boolean)
      .sort((a, b) => b - a);
    if (timestamps.length >= 2) {
      const daySpan =
        (timestamps[0] - timestamps[timestamps.length - 1]) / (1000 * 60 * 60 * 24);
      if (daySpan > 0) postsPerWeek = (timestamps.length / daySpan) * 7;
    }

    // Posts recientes formateados
    const recentPosts = posts.slice(0, 5).map((p, i) => ({
      id: p.id ?? `apify-${i}`,
      caption: (p.caption ?? "").slice(0, 200),
      date: (p.timestamp ?? new Date().toISOString()).slice(0, 10),
      likes: p.likesCount ?? 0,
      comments: p.commentsCount ?? 0,
    }));

    const { error: updateErr } = await supabase
      .from("competitors")
      .update({
        followers: profile.followersCount,
        followers_history: newHistory,
        engagement_rate: Math.round(avgEngagement * 10) / 10,
        posts_per_week: Math.round(postsPerWeek * 10) / 10,
        recent_posts: recentPosts,
      })
      .eq("id", comp.id);

    if (!updateErr) updated++;
  }

  return NextResponse.json({
    updated,
    total: igComps.length,
    syncedAt: new Date().toISOString(),
  });
}
