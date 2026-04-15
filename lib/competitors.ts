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
}

function rp(id: string, caption: string, daysAgo: number, likes: number, comments: number): RecentPost {
  const d = new Date("2026-04-15T00:00:00");
  d.setDate(d.getDate() - daysAgo);
  return { id, caption, date: d.toISOString().slice(0, 10), likes, comments };
}

// Generador de historia creciente/decreciente con ruido
function hist(start: number, end: number, points = 8): number[] {
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const base = start + (end - start) * t;
    const noise = (Math.sin(i * 1.7) * 0.01 + (i % 2 === 0 ? 0.005 : -0.005)) * base;
    out.push(Math.round(base + noise));
  }
  return out;
}

/**
 * Referentes de finanzas — datos públicos aproximados.
 * Los números de seguidores/engagement son ilustrativos; conviene reemplazarlos
 * con un scraper o una API pública al integrar con backend real.
 */
export const SEED_COMPETITORS: Competitor[] = [
  // ——— Argentina ———
  {
    id: "ar1",
    handle: "@CarlosMaslatn1",
    name: "Carlos Maslatón",
    platform: "twitter",
    region: "argentina",
    followers: 720000,
    followersHistory: hist(680000, 720000),
    engagementRate: 3.9,
    postsPerWeek: 42,
    recentPosts: [
      rp("m1", "Análisis del ciclo de tasas y el dólar de cara al segundo trimestre.", 1, 5200, 890),
      rp("m2", "Por qué sigo comprando acciones argentinas.", 3, 4800, 720),
    ],
  },
  {
    id: "ar2",
    handle: "@clubdeinversores",
    name: "Club de Inversores (Gastón Lentini)",
    platform: "instagram",
    region: "argentina",
    followers: 410000,
    followersHistory: hist(380000, 410000),
    engagementRate: 5.2,
    postsPerWeek: 8,
    recentPosts: [
      rp("c1", "Cómo armar tu primera cartera con $100.000 pesos.", 2, 18400, 620),
      rp("c2", "Plazo fijo vs FCI vs dólar MEP: comparativa 2026.", 5, 14200, 480),
    ],
  },
  {
    id: "ar3",
    handle: "@nicolitvinoff",
    name: "Nicolás Litvinoff",
    platform: "instagram",
    region: "argentina",
    followers: 310000,
    followersHistory: hist(295000, 310000),
    engagementRate: 4.6,
    postsPerWeek: 6,
    recentPosts: [
      rp("l1", "3 claves para entender la inflación de este mes.", 2, 11200, 410),
      rp("l2", "Carrusel: qué es el CER y por qué importa.", 6, 9800, 322),
    ],
  },
  {
    id: "ar4",
    handle: "@salvadordistefanook",
    name: "Salvador Di Stefano",
    platform: "youtube",
    region: "argentina",
    followers: 280000,
    followersHistory: hist(260000, 280000),
    engagementRate: 3.1,
    postsPerWeek: 5,
    recentPosts: [
      rp("sd1", "Informe económico semanal: dólar, bonos y campo.", 1, 42000, 1800),
      rp("sd2", "¿Se viene un nuevo plan económico?", 4, 36000, 1400),
    ],
  },
  {
    id: "ar5",
    handle: "@ramiromarra",
    name: "Ramiro Marra",
    platform: "instagram",
    region: "argentina",
    followers: 520000,
    followersHistory: hist(495000, 520000),
    engagementRate: 6.1,
    postsPerWeek: 11,
    recentPosts: [
      rp("rm1", "Por qué conviene dolarizarse ahora.", 1, 28400, 1100),
      rp("rm2", "Mis 5 reglas para invertir en Cedears.", 3, 24100, 890),
    ],
  },
  {
    id: "ar6",
    handle: "@zuchovicki",
    name: "Claudio Zuchovicki",
    platform: "twitter",
    region: "argentina",
    followers: 190000,
    followersHistory: hist(182000, 190000),
    engagementRate: 2.4,
    postsPerWeek: 20,
    recentPosts: [
      rp("z1", "El mercado siempre habla, hay que saber escucharlo.", 2, 3200, 180),
      rp("z2", "Hilo: por qué este rally puede continuar.", 5, 2700, 160),
    ],
  },
  {
    id: "ar7",
    handle: "@iol_invertironline",
    name: "IOL InvertirOnline",
    platform: "instagram",
    region: "argentina",
    followers: 260000,
    followersHistory: hist(250000, 260000),
    engagementRate: 2.8,
    postsPerWeek: 7,
    recentPosts: [
      rp("i1", "Guía: cómo comprar tu primer bono soberano.", 3, 4200, 210),
      rp("i2", "Webinar gratuito sobre Cedears.", 6, 3800, 165),
    ],
  },
  {
    id: "ar8",
    handle: "@tomasruizok",
    name: "Tomás Ruiz Palacios",
    platform: "instagram",
    region: "argentina",
    followers: 135000,
    followersHistory: hist(120000, 135000),
    engagementRate: 5.8,
    postsPerWeek: 6,
    recentPosts: [
      rp("tr1", "¿Qué acción compraría hoy? Mi watchlist.", 2, 8200, 340),
      rp("tr2", "Cedears vs acciones locales: ¿qué conviene?", 5, 6900, 280),
    ],
  },
  {
    id: "ar9",
    handle: "@damiandipace",
    name: "Damián Di Pace",
    platform: "youtube",
    region: "argentina",
    followers: 145000,
    followersHistory: hist(140000, 145000),
    engagementRate: 2.6,
    postsPerWeek: 3,
    recentPosts: [
      rp("dp1", "Consumo masivo: datos del mes.", 3, 12400, 480),
      rp("dp2", "Pymes argentinas: cómo afrontan 2026.", 7, 9800, 380),
    ],
  },
  {
    id: "ar10",
    handle: "@martintetaz",
    name: "Martín Tetaz",
    platform: "twitter",
    region: "argentina",
    followers: 340000,
    followersHistory: hist(320000, 340000),
    engagementRate: 3.3,
    postsPerWeek: 28,
    recentPosts: [
      rp("tt1", "Hilo: lo que dicen los indicadores sobre inflación.", 1, 5400, 420),
      rp("tt2", "El problema fiscal explicado en 10 tweets.", 4, 4800, 360),
    ],
  },

  // ——— Mundo ———
  {
    id: "w1",
    handle: "@GrahamStephan",
    name: "Graham Stephan",
    platform: "youtube",
    region: "mundo",
    followers: 4700000,
    followersHistory: hist(4500000, 4700000),
    engagementRate: 3.9,
    postsPerWeek: 4,
    recentPosts: [
      rp("g1", "Why most people will never retire rich.", 2, 180000, 8400),
      rp("g2", "The Fed just did something nobody expected.", 5, 210000, 9200),
    ],
  },
  {
    id: "w2",
    handle: "@MeetKevin",
    name: "Meet Kevin",
    platform: "youtube",
    region: "mundo",
    followers: 2100000,
    followersHistory: hist(2050000, 2100000),
    engagementRate: 4.2,
    postsPerWeek: 14,
    recentPosts: [
      rp("k1", "Live: reacting to CPI data", 1, 92000, 5400),
      rp("k2", "Housing market collapse? Not so fast.", 3, 88000, 4200),
    ],
  },
  {
    id: "w3",
    handle: "@humphreytalks",
    name: "Humphrey Yang",
    platform: "tiktok",
    region: "mundo",
    followers: 3400000,
    followersHistory: hist(3200000, 3400000),
    engagementRate: 7.8,
    postsPerWeek: 12,
    recentPosts: [
      rp("h1", "Roth IRA explained in 60 seconds.", 1, 420000, 6800),
      rp("h2", "The truth about index funds.", 3, 380000, 5200),
    ],
  },
  {
    id: "w4",
    handle: "@ramit",
    name: "Ramit Sethi",
    platform: "instagram",
    region: "mundo",
    followers: 520000,
    followersHistory: hist(490000, 520000),
    engagementRate: 4.8,
    postsPerWeek: 5,
    recentPosts: [
      rp("r1", "Your rich life isn't about spreadsheets.", 2, 18400, 620),
      rp("r2", "Money dials: where you want to spend extravagantly.", 5, 16200, 510),
    ],
  },
  {
    id: "w5",
    handle: "@APompliano",
    name: "Anthony Pompliano",
    platform: "twitter",
    region: "mundo",
    followers: 1720000,
    followersHistory: hist(1680000, 1720000),
    engagementRate: 2.9,
    postsPerWeek: 35,
    recentPosts: [
      rp("p1", "Bitcoin is a risk-off asset now. Change my mind.", 1, 12400, 1800),
      rp("p2", "The macro setup for 2026 looks a lot like 2017.", 3, 9800, 1400),
    ],
  },
  {
    id: "w6",
    handle: "@LynAldenContact",
    name: "Lyn Alden",
    platform: "twitter",
    region: "mundo",
    followers: 480000,
    followersHistory: hist(450000, 480000),
    engagementRate: 4.1,
    postsPerWeek: 18,
    recentPosts: [
      rp("la1", "Fiscal dominance thread — why it matters for 2026.", 2, 9800, 420),
      rp("la2", "New research piece on energy & capital cycles.", 6, 7800, 312),
    ],
  },
  {
    id: "w7",
    handle: "@morganhousel",
    name: "Morgan Housel",
    platform: "twitter",
    region: "mundo",
    followers: 510000,
    followersHistory: hist(490000, 510000),
    engagementRate: 5.3,
    postsPerWeek: 10,
    recentPosts: [
      rp("mh1", "Wealth is what you don't see.", 1, 22000, 980),
      rp("mh2", "Compounding rewards patience more than intelligence.", 4, 18400, 720),
    ],
  },
  {
    id: "w8",
    handle: "@Patrick_Boyle",
    name: "Patrick Boyle",
    platform: "youtube",
    region: "mundo",
    followers: 720000,
    followersHistory: hist(690000, 720000),
    engagementRate: 3.4,
    postsPerWeek: 2,
    recentPosts: [
      rp("pb1", "What's going on with commercial real estate?", 3, 48000, 2400),
      rp("pb2", "Explaining the latest banking headlines.", 9, 42000, 2100),
    ],
  },
];

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
