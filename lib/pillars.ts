// ─────────────────────────────────────────────────────────────
// Pilares de contenido de NEMEF
// ─────────────────────────────────────────────────────────────

export interface ContentPillar {
  id: string;
  name: string;
  description: string;
  color: string;       // Tailwind bg-* class
  textColor: string;   // Tailwind text-* class
  borderColor: string; // Tailwind border-* class
  emoji: string;
}

/** Pilares predeterminados — el usuario puede renombrarlos o agregar más */
export const DEFAULT_PILLARS: ContentPillar[] = [
  {
    id: "educacion",
    name: "Educación",
    description: "Conceptos financieros explicados desde cero",
    color: "bg-blue-500/15",
    textColor: "text-blue-400",
    borderColor: "border-blue-500/30",
    emoji: "📚",
  },
  {
    id: "actualidad",
    name: "Actualidad",
    description: "Análisis de noticias económicas argentinas",
    color: "bg-amber-500/15",
    textColor: "text-amber-400",
    borderColor: "border-amber-500/30",
    emoji: "📰",
  },
  {
    id: "inversiones",
    name: "Inversiones",
    description: "Estrategias, instrumentos y carteras",
    color: "bg-emerald-500/15",
    textColor: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    emoji: "📈",
  },
  {
    id: "cripto",
    name: "Cripto",
    description: "Bitcoin, stablecoins y DeFi en contexto argentino",
    color: "bg-orange-500/15",
    textColor: "text-orange-400",
    borderColor: "border-orange-500/30",
    emoji: "₿",
  },
  {
    id: "mindset",
    name: "Mindset",
    description: "Psicología financiera y hábitos de dinero",
    color: "bg-violet-500/15",
    textColor: "text-violet-400",
    borderColor: "border-violet-500/30",
    emoji: "🧠",
  },
  {
    id: "herramientas",
    name: "Herramientas",
    description: "Apps, plataformas y recursos prácticos",
    color: "bg-pink-500/15",
    textColor: "text-pink-400",
    borderColor: "border-pink-500/30",
    emoji: "🛠",
  },
];

const LS_PILLARS_KEY = "nemef_pillars_v1";
const LS_POST_PILLARS_KEY = "nemef_post_pillars_v1"; // map: postId → pillarId

// ── Pilares ────────────────────────────────────────────────────────────────

export function loadPillars(): ContentPillar[] {
  if (typeof window === "undefined") return DEFAULT_PILLARS;
  try {
    const stored = localStorage.getItem(LS_PILLARS_KEY);
    if (!stored) return DEFAULT_PILLARS;
    return JSON.parse(stored) as ContentPillar[];
  } catch {
    return DEFAULT_PILLARS;
  }
}

export function savePillars(pillars: ContentPillar[]): void {
  localStorage.setItem(LS_PILLARS_KEY, JSON.stringify(pillars));
}

export function resetPillars(): void {
  localStorage.removeItem(LS_PILLARS_KEY);
}

// ── Asignación post → pilar ────────────────────────────────────────────────

export function loadPostPillars(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LS_POST_PILLARS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function getPostPillar(postId: string): string | null {
  return loadPostPillars()[postId] ?? null;
}

export function setPostPillar(postId: string, pillarId: string | null): void {
  const map = loadPostPillars();
  if (pillarId === null) {
    delete map[postId];
  } else {
    map[postId] = pillarId;
  }
  localStorage.setItem(LS_POST_PILLARS_KEY, JSON.stringify(map));
}

/** Devuelve un conteo { pillarId: count } para los postIds dados */
export function getPillarDistribution(postIds: string[]): Record<string, number> {
  const map = loadPostPillars();
  const dist: Record<string, number> = {};
  for (const id of postIds) {
    const p = map[id];
    if (p) dist[p] = (dist[p] ?? 0) + 1;
  }
  return dist;
}
