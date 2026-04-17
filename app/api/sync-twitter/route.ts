import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const maxDuration = 60;

// Actor de perfiles de Twitter/X en Apify
const ACTOR_URL =
  "https://api.apify.com/v2/acts/quacker~twitter-user-scraper/run-sync-get-dataset-items";

interface TwitterProfile {
  userName?: string;
  followers?: number;       // quacker actor
  followersCount?: number;  // variante de otros actores
  profileImageUrl?: string;
  statusesCount?: number;
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

  const usernames = twComps.map((c) => (c.handle as string).replace(/^@/, ""));

  let profiles: TwitterProfile[] = [];
  try {
    const res = await fetch(
      `${ACTOR_URL}?token=${process.env.APIFY_TOKEN}&timeout=50`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames }),
      }
    );
    if (!res.ok) {
      return NextResponse.json({ error: `Apify error ${res.status}` }, { status: 502 });
    }
    profiles = await res.json();
  } catch {
    return NextResponse.json({ error: "No se pudo conectar con Apify" }, { status: 502 });
  }

  let updated = 0;
  for (const profile of profiles) {
    const username = profile.userName?.toLowerCase();
    if (!username) continue;

    const followers = profile.followers ?? profile.followersCount ?? 0;
    if (!followers) continue;

    const comp = twComps.find(
      (c) => (c.handle as string).replace(/^@/, "").toLowerCase() === username
    );
    if (!comp) continue;

    const history = [
      ...(Array.isArray(comp.followers_history) ? (comp.followers_history as number[]) : []),
      followers,
    ].slice(-12);

    const { error } = await supabase
      .from("competitors")
      .update({ followers, followers_history: history })
      .eq("id", comp.id);

    if (!error) updated++;
  }

  return NextResponse.json({ updated, total: twComps.length, syncedAt: new Date().toISOString() });
}
