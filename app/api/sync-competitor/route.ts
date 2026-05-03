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
  title?: string;
  date?: string;
  likes?: number;
}

interface ApifyIGProfile {
  username?: string;
  followersCount?: number;
  latestPosts?: ApifyPost[];
  profilePicUrl?: string;
  profilePicUrlHD?: string;
  biography?: string;
}

interface ApifyTWProfile {
  userName?: string;
  followers?: number;
  followersCount?: number;
  profilePicture?: string;
  profileImageUrl?: string;
  description?: string;
}

interface ApifyYTItem {
  channelSubscriberCount?: number;
  channelUrl?: string;
  channelThumbnail?: string;
  channelDescription?: string;
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, handle, platform } = await req.json();
  if (!id || !handle || !platform) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const token = process.env.APIFY_TOKEN;
  if (!token) return NextResponse.json({ error: "Falta APIFY_TOKEN" }, { status: 500 });

  const username = (handle as string).replace(/^@/, "");

  // Obtener historial actual
  const { data: current } = await supabase
    .from("competitors")
    .select("followers_history")
    .eq("id", id)
    .single();
  const currentHistory: number[] = Array.isArray(current?.followers_history) ? current.followers_history : [];

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

      const profilePicUrl = profiles[0].profilePicUrl ?? profiles[0].profilePicUrlHD ?? "";
      const bio = profiles[0].biography ?? "";

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

      const recentPosts = posts.slice(0, 5).map((p, i) => ({
        id: p.id ?? `ig-${i}`,
        caption: (p.caption ?? "").slice(0, 200),
        date: (p.timestamp ?? new Date().toISOString()).slice(0, 10),
        likes: p.likesCount ?? 0,
        comments: p.commentsCount ?? 0,
      }));

      const newHistory = [...currentHistory, profile.followersCount].slice(-12);
      const { error } = await supabase.from("competitors").update({
        followers: profile.followersCount,
        followers_history: newHistory,
        engagement_rate: Math.round(avgEng * 10) / 10,
        posts_per_week: Math.round(postsPerWeek * 10) / 10,
        recent_posts: recentPosts,
        profile_pic_url: profilePicUrl,
        bio: bio,
      }).eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({
        updated: true,
        followers: profile.followersCount,
        profilePicUrl,
        bio,
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

      const profilePicUrl = profile?.profilePicture ?? profile?.profileImageUrl ?? "";
      const bio = profile?.description ?? "";

      const newHistory = [...currentHistory, followers].slice(-12);
      const { error } = await supabase.from("competitors").update({
        followers,
        followers_history: newHistory,
        profile_pic_url: profilePicUrl,
        bio: bio,
      }).eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ updated: true, followers, profilePicUrl, bio, syncedAt: new Date().toISOString() });
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

      const items: ApifyYTItem[] = await res.json();
      const subscriberCount = items[0]?.channelSubscriberCount ?? 0;
      if (!subscriberCount) return NextResponse.json({ error: `No se encontró @${username} en YouTube` }, { status: 404 });

      const profilePicUrl = items[0]?.channelThumbnail ?? "";
      const bio = items[0]?.channelDescription ?? "";

      const newHistory = [...currentHistory, subscriberCount].slice(-12);
      const { error } = await supabase.from("competitors").update({
        followers: subscriberCount,
        followers_history: newHistory,
        profile_pic_url: profilePicUrl,
        bio: bio,
      }).eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ updated: true, followers: subscriberCount, profilePicUrl, bio, syncedAt: new Date().toISOString() });
    }

    return NextResponse.json({ error: `Plataforma '${platform}' no soportada` }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[sync-competitor]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
