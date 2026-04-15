export type NewsTopic = "mercados" | "macro" | "empresas";

export const TOPICS: NewsTopic[] = ["mercados", "macro", "empresas"];

export const TOPIC_LABELS: Record<NewsTopic, string> = {
  mercados: "Mercados",
  macro: "Macro",
  empresas: "Empresas",
};

export const TOPIC_STYLES: Record<NewsTopic, string> = {
  mercados: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  macro: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  empresas: "bg-amber-500/15 text-amber-300 border-amber-500/30",
};

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  summary: string;
  topics: NewsTopic[];
}

export const FEEDS: { name: string; url: string }[] = [
  { name: "Ámbito", url: "https://www.ambito.com/rss/pages/economia.xml" },
  { name: "iProfesional", url: "https://www.iprofesional.com/rss/economia.xml" },
  { name: "El Cronista", url: "https://www.cronista.com/files/rss/economia.xml" },
  { name: "Infobae", url: "https://www.infobae.com/economia/rss.xml" },
  { name: "La Nación", url: "https://www.lanacion.com.ar/economia/rss" },
];

const TOPIC_KEYWORDS: Record<NewsTopic, RegExp> = {
  mercados:
    /\b(d[oó]lar|mep|ccl|blue|merval|bolsa|acciones|bonos|cedear|cripto|bitcoin|tasas|riesgo\s*pa[ií]s|rofex|futuros|banco\s*central|bcra)\b/i,
  macro:
    /\b(inflaci[oó]n|ipc|pbi|d[eé]ficit|superavit|indec|recesi[oó]n|paritaria|salario|empleo|actividad|consumo|fmi|deuda|reservas)\b/i,
  empresas:
    /\b(empresa|compa[ñn][ií]a|pyme|industria|ceo|fusi[oó]n|adquisici[oó]n|ipo|facturaci[oó]n|ganancias|balance|startup|unicornio|vaca\s*muerta)\b/i,
};

export function classifyTopics(text: string): NewsTopic[] {
  const hits: NewsTopic[] = [];
  for (const t of TOPICS) if (TOPIC_KEYWORDS[t].test(text)) hits.push(t);
  return hits.length ? hits : ["macro"];
}
