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
 * Creadores verificados de finanzas/economía para sugerir al usuario.
 * Solo se incluyen handles confirmados o de alta probabilidad.
 */
export interface PresetCreator {
  handle: string;
  name: string;
  platform: Platform;
  region: Region;
  topics: string; // resumen de qué trata su contenido
}

export const PRESET_CREATORS: PresetCreator[] = [
  // ── Argentina — Instagram ──────────────────────────────────────
  {
    handle: "@freenance",
    name: "Freenance",
    platform: "instagram",
    region: "argentina",
    topics: "finanzas personales, inversiones, libertad financiera",
  },
  {
    handle: "@leandrozicarelli",
    name: "Leandro Zicarelli",
    platform: "instagram",
    region: "argentina",
    topics: "economía macro, mercados, análisis político-económico",
  },
  {
    handle: "@inverarg",
    name: "Inverarg / Finit",
    platform: "instagram",
    region: "argentina",
    topics: "inversiones Argentina, acciones, CEDEARs, academia Finit",
  },
  {
    handle: "@joveninversor",
    name: "Joven Inversor",
    platform: "instagram",
    region: "argentina",
    topics: "inversiones, bolsa, educación financiera para jóvenes",
  },
  {
    handle: "@economia.arg",
    name: "Economía ARG",
    platform: "instagram",
    region: "argentina",
    topics: "economía argentina, inflación, noticias macro",
  },
  {
    handle: "@confinanciero",
    name: "Con Financiero",
    platform: "instagram",
    region: "argentina",
    topics: "educación financiera, ahorro, inversiones simples",
  },
  {
    handle: "@finanzasenorden",
    name: "Finanzas en Orden",
    platform: "instagram",
    region: "argentina",
    topics: "finanzas personales, presupuesto, metas financieras",
  },
  // ── Mundo — Instagram ──────────────────────────────────────────
  {
    handle: "@grahamstephan",
    name: "Graham Stephan",
    platform: "instagram",
    region: "mundo",
    topics: "real estate, inversiones, libertad financiera, YouTube finance",
  },
  {
    handle: "@andrei_jikh",
    name: "Andrei Jikh",
    platform: "instagram",
    region: "mundo",
    topics: "inversiones, cripto, finanzas personales, animaciones",
  },
  // ── Argentina — YouTube ────────────────────────────────────────
  {
    handle: "@freenance",
    name: "Freenance",
    platform: "youtube",
    region: "argentina",
    topics: "finanzas personales, inversiones, libertad financiera",
  },
  {
    handle: "@inverarg",
    name: "Inverarg / Finit",
    platform: "youtube",
    region: "argentina",
    topics: "inversiones Argentina, acciones, CEDEARs",
  },
  // ── Mundo — YouTube ────────────────────────────────────────────
  {
    handle: "@GrahamStephan",
    name: "Graham Stephan",
    platform: "youtube",
    region: "mundo",
    topics: "real estate, inversiones, finanzas personales",
  },
  {
    handle: "@AndreJikh",
    name: "Andrei Jikh",
    platform: "youtube",
    region: "mundo",
    topics: "cripto, inversiones, finanzas con animaciones",
  },
  {
    handle: "@MeetKevin",
    name: "Meet Kevin",
    platform: "youtube",
    region: "mundo",
    topics: "acciones, real estate, análisis de mercado",
  },
];

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
