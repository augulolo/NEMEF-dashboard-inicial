import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const maxDuration = 60;

const APIFY_BASE = "https://api.apify.com/v2/acts";

interface ApifyTWProfile {
  userName?: string;
  followers?: number;
  followersCount?: number;
  profilePicture?: string;
  profileImageUrl?: string;
  description?: string;
  // apidojo format
  author?: {
    userName?: string;
    followers?: number;
    profilePicture?: string;
    description?: string;
  };
}

export async function POST() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: twComps } = await supabase
    .from("competitors")
    .select("id, handle, followers_history")
    .eq("platform", "twitter");

  if (!twComps?.length) return NextResponse.json({ updated: 0, message: "Sin creadores de Twitter" });

  const token = process.env.APIFY_TOKEN;
  if (!token) return NextResponse.json({ error: "Falta APIFY_TOKEN" }, { status: 500 });

  const usernames = twComps.map((c) => (c.handle as string).replace(/^@/, ""));

  // Intentar primero con quacker, fallback a apidojo
  let profiles: ApifyTWProfile[] = [];
  let usedActor = "";

  try {
    const res = await fetch(
      `${APIFY_BASE}/quacker~twitter-user-scraper/run-sync-get-dataset-items?token=${token}&timeout=50`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        profiles = data;
        usedActor = "quacker";
      }
    }
  } catch { /* fallback below */ }

  if (!profiles.length) {
    return NextResponse.json({
      error: "No se pudo obtener datos de Twitter/X. La plataforma bloquea frecuentemente el scraping.",
      updated: 0,
    }, { status: 502 });
  }

  console.log(`[sync-twitter] Actor: ${usedActor}, profiles: ${profiles.length}`);

  let updated = 0;
  for (const raw of profiles) {
    // Normalizar campos entre actores
    const authorData = (raw.author as Record<string, unknown>) ?? raw;
    const userName = ((authorData.userName ?? raw.userName) as string | undefined)?.toLowerCase();
    if (!userName) continue;

    const followers = (authorData.followers as number)
      ?? (authorData.followersCount as number)
      ?? (raw.followers as number)
      ?? (raw.followersCount as number)
      ?? 0;
    if (!followers) continue;

    const comp = twComps.find(
      (c) => (c.handle as string).replace(/^@/, "").toLowerCase() === userName
    );
    if (!comp) continue;

    const history = [
      ...(Array.isArray(comp.followers_history) ? (comp.followers_history as number[]) : []),
      followers,
    ].slice(-12);

    const profilePicUrl = ((authorData.profilePicture ?? raw.profilePicture ?? raw.profileImageUrl) as string) ?? "";
    const bio = ((authorData.description ?? raw.description) as string) ?? "";

    const { error } = await supabase
      .from("competitors")
      .update({ followers, followers_history: history, profile_pic_url: profilePicUrl, bio })
      .eq("id", comp.id);

    if (!error) updated++;
  }

  return NextResponse.json({ updated, total: twComps.length, syncedAt: new Date().toISOString() });
}
