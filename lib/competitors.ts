import type { Platform } from "./calendar";
export type { Platform };

export type Region = "argentina" | "mundo";

export const REGION_LABELS: Record<Region, string> = {
  argentina: "Argentina",
  mundo: "Mundo",
};

export interface RecentPost {
  id: string;
  caption: string;
  date: string;
  likes: number;
  comments: number;
}

export interface Competitor {
  id: string;
  handle: string;
  name: string;
  platform: Platform;
  region: Region;
  followers: number;
  followersHistory: number[];
  engagementRate: number;
  postsPerWeek: number;
  recentPosts: RecentPost[];
  profilePicUrl?: string;
  bio?: string;
  syncedAt?: string;
}

export const SEED_COMPETITORS: Competitor[] = [];

/**
 * Genera la URL de avatar usando unavatar.io (gratis, sin API key).
 * Soporta instagram, twitter, youtube, tiktok.
 */
export function getAvatarUrl(platform: Platform, handle: string): string {
  const username = handle.replace(/^@/, "");
  const service =
    platform === "instagram" ? "instagram" :
    platform === "twitter"   ? "twitter"   :
    platform === "youtube"   ? "youtube"   :
    platform === "tiktok"    ? "tiktok"    : "instagram";
  return `https://unavatar.io/${service}/${username}`;
}

export function growthPct(history: number[]): number {
  if (history.length < 2) return 0;
  const first = history[0];
  const last = history[history.length - 1];
  if (first === 0) return 0;
  return ((last - first) / first) * 100;
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
