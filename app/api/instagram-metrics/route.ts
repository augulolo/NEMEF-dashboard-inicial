import { NextResponse } from "next/server";

const BASE = "https://graph.facebook.com/v21.0";

async function gql(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams({
    ...params,
    access_token: process.env.META_ACCESS_TOKEN ?? "",
  });
  const res = await fetch(`${BASE}${path}?${qs}`, { cache: "no-store" });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json;
}

export async function GET() {
  const token = process.env.META_ACCESS_TOKEN;
  const igAccountId = process.env.META_IG_ACCOUNT_ID;

  if (!token || !igAccountId) {
    return NextResponse.json(
      { error: "Faltan META_ACCESS_TOKEN y META_IG_ACCOUNT_ID en las variables de entorno" },
      { status: 500 }
    );
  }

  try {
    // Perfil
    const profile = await gql(`/${igAccountId}`, {
      fields: "followers_count,media_count,profile_picture_url,username,biography",
    });

    // Últimos 20 posts con métricas
    const mediaRes = await gql(`/${igAccountId}/media`, {
      fields: "id,caption,media_type,timestamp,like_count,comments_count,media_url,thumbnail_url",
      limit: "20",
    });
    const media: Record<string, unknown>[] = mediaRes.data ?? [];

    // Insights de reach e impressions por post
    const mediaWithInsights = await Promise.all(
      media.map(async (post) => {
        try {
          const insights = await gql(`/${post.id}/insights`, {
            metric: "reach,impressions",
          });
          const reach = insights.data?.find((d: { name: string }) => d.name === "reach")?.values?.[0]?.value ?? 0;
          const impressions = insights.data?.find((d: { name: string }) => d.name === "impressions")?.values?.[0]?.value ?? 0;
          return { ...post, reach, impressions };
        } catch {
          return { ...post, reach: 0, impressions: 0 };
        }
      })
    );

    // Promedios
    const totalLikes = mediaWithInsights.reduce((s, p) => s + ((p.like_count as number) ?? 0), 0);
    const totalComments = mediaWithInsights.reduce((s, p) => s + ((p.comments_count as number) ?? 0), 0);
    const totalReach = mediaWithInsights.reduce((s, p) => s + ((p.reach as number) ?? 0), 0);
    const count = mediaWithInsights.length || 1;

    const avgEngagement =
      profile.followers_count > 0
        ? ((totalLikes + totalComments) / count / profile.followers_count) * 100
        : 0;

    return NextResponse.json({
      profile: {
        username: profile.username,
        followers: profile.followers_count,
        mediaCount: profile.media_count,
        avatar: profile.profile_picture_url,
        bio: profile.biography,
      },
      stats: {
        avgLikes: Math.round(totalLikes / count),
        avgComments: Math.round(totalComments / count),
        avgReach: Math.round(totalReach / count),
        avgEngagement: Number(avgEngagement.toFixed(2)),
      },
      recentMedia: mediaWithInsights.slice(0, 12),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[instagram-metrics]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
