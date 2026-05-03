import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const maxDuration = 60;

const APIFY_BASE = "https://api.apify.com/v2/acts";

interface ApifyPost {
  id?: string;
  caption?: string;
  timestamp?: string;
  likesCount?: number;
  commentsCount?: number;
}

interface ApifyIGProfile {
  username?: string;
  followersCount?: number;
  latestPosts?: ApifyPost[];
}

interface ApifyTWProfile {
  userName?: string;
  followers?: number;
  followersCount?: number;
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { handle, platform, currentHistory } = await req.json();
  if (!handle || !platform) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const token = process.env.APIFY_TOKEN;
  if (!token) return NextResponse.json({ error: "Falta APIFY_TOKEN" }, { status: 500 });

  const username = (handle as string).replace(/^@/, "");
  const history: number[] = Array.isArray(currentHistory) ? currentHistory : [];

  try {
    if (platform === "instagram") {
      const res = await fetch(
        `${APIFY_BASE}/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${token}&timeout=45`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usernames: [username] }),
        }
      );
      if (!res.ok) return NextResponse.json({ error: `Apify error ${res.status}` }, { status: 502 });

      const profiles: ApifyIGProfile[] = await res.json();
      const profile = profiles[0];
      if (!profile?.followersCount) {
        return NextResponse.json({ error: `No se encontró @${username} en Instagram` }, { status: 404 });
      }

      const posts = profile.latestPosts?.slice(0, 12) ?? [];
      const avgEng =
        posts.length > 0 && profile.followersCount > 0
          ? (posts.reduce((s, p) => s + (p.likesCount ?? 0) + (p.commentsCount ?? 0), 0) / posts.length / profile.followersCount) * 100
          : 0;

      const timestamps = posts.map((p) => p.timestamp ? new Date(p.timestamp).getTime() : 0).filter(Boolean).sort((a, b) => b - a);
      let postsPerWeek = 0;
      if (timestamps.length >= 2) {
        const daySpan = (timestamps[0] - timestamps[timestamps.length - 1]) / (1000 * 60 * 60 * 24);
        if (daySpan > 0) postsPerWeek = (timestamps.length / daySpan) * 7;
      }

      const recentPosts = posts.slice(0, 8).map((p, i) => ({
        id: p.id ?? `ig-${i}`,
        caption: (p.caption ?? "").slice(0, 200),
        date: (p.timestamp ?? new Date().toISOString()).slice(0, 10),
        likes: p.likesCount ?? 0,
        comments: p.commentsCount ?? 0,
      }));

      const newHistory = [...history, profile.followersCount].slice(-24);

      return NextResponse.json({
        followers: profile.followersCount,
        followersHistory: newHistory,
        engagementRate: Math.round(avgEng * 10) / 10,
        postsPerWeek: Math.round(postsPerWeek * 10) / 10,
        recentPosts,
        syncedAt: new Date().toISOString(),
      });
    }

    if (platform === "twitter") {
      const res = await fetch(
        `${APIFY_BASE}/quacker~twitter-user-scraper/run-sync-get-dataset-items?token=${token}&timeout=45`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usernames: [username] }),
        }
      );
      if (!res.ok) return NextResponse.json({ error: `Apify error ${res.status}` }, { status: 502 });

      const profiles: ApifyTWProfile[] = await res.json();
      const profile = profiles.find((p) => p.userName?.toLowerCase() === username.toLowerCase());
      const followers = profile?.followers ?? profile?.followersCount ?? 0;
      if (!followers) return NextResponse.json({ error: `No se encontró @${username} en Twitter` }, { status: 404 });

      const newHistory = [...history, followers].slice(-24);
      return NextResponse.json({
        followers,
        followersHistory: newHistory,
        engagementRate: 0,
        postsPerWeek: 0,
        recentPosts: [],
        syncedAt: new Date().toISOString(),
      });
    }

    if (platform === "youtube") {
      const channelUrl = `https://www.youtube.com/@${username}`;
      const res = await fetch(
        `${APIFY_BASE}/apify~youtube-scraper/run-sync-get-dataset-items?token=${token}&timeout=45`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startUrls: [{ url: channelUrl }], maxResults: 3 }),
        }
      );
      if (!res.ok) return NextResponse.json({ error: `Apify error ${res.status}` }, { status: 502 });

      const items: { channelSubscriberCount?: number }[] = await res.json();
      const followers = items[0]?.channelSubscriberCount ?? 0;
      if (!followers) return NextResponse.json({ error: `No se encontró @${username} en YouTube` }, { status: 404 });

      const newHistory = [...history, followers].slice(-24);
      return NextResponse.json({
        followers,
        followersHistory: newHistory,
        engagementRate: 0,
        postsPerWeek: 0,
        recentPosts: [],
        syncedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: `Plataforma '${platform}' no soportada` }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
