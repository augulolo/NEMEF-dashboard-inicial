import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

interface CompetitorSummary {
  name: string;
  platform: string;
  engagementRate: number;
  postsPerWeek: number;
}

interface InsightStats {
  publishedThisWeek: number;
  publishedLastWeek: number;
  totalPublished: number;
  totalScheduled: number;
  avgWeeklyPosts: number;
  topType: string;
  topCompetitors: CompetitorSummary[];
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Falta ANTHROPIC_API_KEY" }, { status: 500 });

  const { stats }: { stats: InsightStats } = await req.json();

  const weekTrend =
    stats.publishedLastWeek === 0
      ? "sin referencia de la semana pasada"
      : stats.publishedThisWeek > stats.publishedLastWeek
      ? `+${stats.publishedThisWeek - stats.publishedLastWeek} vs semana anterior`
      : stats.publishedThisWeek < stats.publishedLastWeek
      ? `${stats.publishedThisWeek - stats.publishedLastWeek} vs semana anterior`
      : "igual que la semana anterior";

  const prompt = `Sos un analista de contenido para un creador de finanzas personales en Argentina.
Analizá estos datos y generá exactamente 3 insights accionables, concretos y útiles.
Cada insight debe tener un título corto (3-5 palabras) y una sola oración de recomendación.
Hablá de forma directa, en segunda persona, sin rodeos.

Datos del creador (semana actual):
- Posts publicados esta semana: ${stats.publishedThisWeek} (${weekTrend})
- Posts publicados semana anterior: ${stats.publishedLastWeek}
- Total publicados histórico: ${stats.totalPublished}
- Posts programados pendientes: ${stats.totalScheduled}
- Promedio semanal histórico: ${stats.avgWeeklyPosts.toFixed(1)} posts/semana
- Formato más usado: ${stats.topType}

Top competidores (por engagement):
${stats.topCompetitors.map((c) => `- ${c.name} (${c.platform}): ${c.engagementRate}% engagement, ${c.postsPerWeek} posts/sem`).join("\n")}

Respondé ÚNICAMENTE con un array JSON válido, sin markdown ni texto extra:
[{"title":"Título corto","text":"Una oración con la recomendación concreta."}]`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { text: string }).text.trim();
    // Extraer JSON aunque haya texto extra
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No se pudo parsear la respuesta");
    const bullets = JSON.parse(match[0]);
    return NextResponse.json({ bullets });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
