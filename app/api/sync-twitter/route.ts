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
    followersCount?: number;
    profilePicture?: string;
    description?: string;
  };
}

function extractTwitterData(raw: ApifyTWProfile): {
  userName: string | undefined;
  followers: number;
  profilePicUrl: string;
  bio: string;
} {
  const authorData = (raw.author as Record<string, unknown>) ?? raw;
  const rawRec = raw as Record<string, unknown>;

  const userName = (
    (authorData.userName as string | undefined) ??
    (raw.userName as string | undefined)
  )?.toLowerCase();

  const followers =
    (authorData.followers as number) ??
    (authorData.followersCount as number) ??
    (rawRec.followers as number) ??
    (rawRec.followersCount as number) ??
    0;

  const profilePicUrl =
    (authorData.profilePicture as string) ??
    (rawRec.profilePicture as string) ??
    (rawRec.profileImageUrl as string) ??
    "";

  const bio =
    (authorData.description as string) ??
    (rawRec.description as string) ??
    "";

  return { userName, followers, profilePicUrl, bio };
}

export async function POST() {
  const supabase = await createServerSupabaseClient();

  const { data: twComps } = await supabase
    .from("competitors")
    .select("id, handle, followers_history")
    .eq("platform", "twitter");

  if (!twComps?.length) return NextResponse.json({ updated: 0, message: "Sin creadores de Twitter" });

  const token = process.env.APIFY_TOKEN;
  if (!token) return NextResponse.json({ error: "Falta APIFY_TOKEN" }, { status: 500 });

  const usernames = twComps.map((c) => (c.handle as string).replace(/^@/, ""));

  // Try multiple actors in order of reliability
  const actors = [
    {
      id: "apidojo~tweet-scraper",
      body: { twitterHandles: usernames, maxItems: usernames.length * 2 },
    },
    {
      id: "quacker~twitter-user-scraper",
      body: { usernames },
    },
  ];

  let profiles: ApifyTWProfile[] = [];
  let lastError = "";

  for (const actor of actors) {
    try {
      const res = await fetch(
        `${APIFY_BASE}/${actor.id}/run-sync-get-dataset-items?token=${token}&timeout=50`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(actor.body),
        }
      );
      if (!res.ok) {
        lastError = `Apify error ${res.status} en ${actor.id}`;
        continue;
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        profiles = data;
        break;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      continue;
    }
  }

  if (!profiles.length) {
    return NextResponse.json(
      {
        error:
          lastError ||
          "No se pudo obtener datos de Twitter/X. La plataforma bloquea frecuentemente el scraping.",
        updated: 0,
      },
      { status: 502 }
    );
  }

  const nowIso = new Date().toISOString();
  let updated = 0;

  for (const raw of profiles) {
    const { userName, followers, profilePicUrl, bio } = extractTwitterData(raw);
    if (!userName || !followers) continue;

    const comp = twComps.find(
      (c) => (c.handle as string).replace(/^@/, "").toLowerCase() === userName
    );
    if (!comp) continue;

    const history = [
      ...(Array.isArray(comp.followers_history) ? (comp.followers_history as number[]) : []),
      followers,
    ].slice(-12);

    const { error } = await supabase
      .from("competitors")
      .update({
        followers,
        followers_history: history,
        profile_pic_url: profilePicUrl,
        bio,
        synced_at: nowIso,
      })
      .eq("id", comp.id);

    if (!error) updated++;
  }

  return NextResponse.json({ updated, total: twComps.length, syncedAt: nowIso });
}
