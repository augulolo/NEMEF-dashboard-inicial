export type Platform = "instagram" | "youtube" | "tiktok" | "twitter" | "linkedin";
export type CalendarStatus = "scheduled" | "published";

export interface CalendarItem {
  id: string;
  title: string;
  platform: Platform;
  status: CalendarStatus;
  date: string; // ISO yyyy-mm-dd
}

export const PLATFORMS: Platform[] = ["instagram", "youtube", "tiktok", "twitter", "linkedin"];

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  twitter: "Twitter / X",
  linkedin: "LinkedIn",
};

export const STATUS_LABELS_CAL: Record<CalendarStatus, string> = {
  scheduled: "Programado",
  published: "Publicado",
};

export const PLATFORM_STYLES: Record<Platform, { chip: string; dot: string; ring: string }> = {
  instagram: {
    chip: "bg-pink-500/15 text-pink-300 border-pink-500/30 hover:bg-pink-500/25",
    dot: "bg-pink-400",
    ring: "ring-pink-500/40",
  },
  youtube: {
    chip: "bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/25",
    dot: "bg-red-400",
    ring: "ring-red-500/40",
  },
  tiktok: {
    chip: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/25",
    dot: "bg-cyan-400",
    ring: "ring-cyan-500/40",
  },
  twitter: {
    chip: "bg-sky-500/15 text-sky-300 border-sky-500/30 hover:bg-sky-500/25",
    dot: "bg-sky-400",
    ring: "ring-sky-500/40",
  },
  linkedin: {
    chip: "bg-blue-600/15 text-blue-300 border-blue-600/30 hover:bg-blue-600/25",
    dot: "bg-blue-400",
    ring: "ring-blue-600/40",
  },
};

// Seed orientado a finanzas (hoy = 2026-04-15)
export const SEED_CALENDAR: CalendarItem[] = [
  { id: "c1", title: "Reel: cómo leer un balance", platform: "instagram", status: "scheduled", date: "2026-04-18" },
  { id: "c2", title: "Carrusel: Dólar MEP vs CCL", platform: "instagram", status: "scheduled", date: "2026-04-20" },
  { id: "c3", title: "Historia: Q&A FCI", platform: "instagram", status: "scheduled", date: "2026-04-22" },
  { id: "c4", title: "Análisis semanal Merval", platform: "youtube", status: "scheduled", date: "2026-04-18" },
  { id: "c5", title: "Tutorial: comprar bonos en IOL", platform: "youtube", status: "scheduled", date: "2026-04-25" },
  { id: "c6", title: "Tip rápido: interés compuesto", platform: "tiktok", status: "scheduled", date: "2026-04-16" },
  { id: "c7", title: "Diccionario: ¿Qué es el CER?", platform: "tiktok", status: "scheduled", date: "2026-04-17" },
  { id: "c8", title: "Hilo: inflación marzo", platform: "twitter", status: "scheduled", date: "2026-04-22" },
  { id: "c9", title: "Post: finanzas personales para equipos", platform: "linkedin", status: "scheduled", date: "2026-04-23" },
  { id: "c10", title: "Caso de estudio: cartera conservadora", platform: "linkedin", status: "scheduled", date: "2026-04-28" },

  // Publicados
  { id: "p1", title: "Resumen semanal mercados", platform: "instagram", status: "published", date: "2026-04-10" },
  { id: "p2", title: "Reel: 3 errores al invertir", platform: "instagram", status: "published", date: "2026-04-07" },
  { id: "p3", title: "Short: qué es el riesgo país", platform: "tiktok", status: "published", date: "2026-04-03" },
  { id: "p4", title: "Entrevista a economista", platform: "youtube", status: "published", date: "2026-04-01" },
  { id: "p5", title: "Encuesta: ¿dólar o pesos?", platform: "twitter", status: "published", date: "2026-04-08" },
  { id: "p6", title: "Artículo: educación financiera en empresas", platform: "linkedin", status: "published", date: "2026-04-05" },
  { id: "p7", title: "Reel: plazo fijo UVA explicado", platform: "instagram", status: "published", date: "2026-03-28" },
  { id: "p8", title: "Video: balance Q1", platform: "youtube", status: "published", date: "2026-03-30" },
  { id: "p9", title: "Hilo: bonos AL30 vs GD30", platform: "twitter", status: "published", date: "2026-03-25" },
  { id: "p10", title: "Case study de cliente", platform: "linkedin", status: "published", date: "2026-03-22" },
];
