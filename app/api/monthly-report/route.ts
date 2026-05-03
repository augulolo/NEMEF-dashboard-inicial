import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

const client = new Anthropic();

export async function POST(req: Request) {
  try {
    const { stats } = await req.json();

    const {
      month,
      year,
      published,
      publishedLastMonth,
      scheduled,
      drafts,
      backlog,
      topType,
      topTypeCount,
      typeBreakdown,
      overdueCount,
      avgPerWeek,
      competitors,
    } = stats;

    const prompt = `Sos un analista de contenido para redes sociales, especializado en finanzas personales e inversiones en Argentina.

Analizá los siguientes datos del mes de ${month} ${year} de la cuenta NEMEF (No es Magia, Es Finanzas):

📊 POSTS DEL MES:
- Publicados este mes: ${published}
- Publicados el mes anterior: ${publishedLastMonth}
- Variación: ${published - publishedLastMonth > 0 ? "+" : ""}${published - publishedLastMonth} posts (${publishedLastMonth > 0 ? ((published - publishedLastMonth) / publishedLastMonth * 100).toFixed(0) : "N/A"}%)
- Programados pendientes: ${scheduled}
- Borradores activos: ${drafts}
- Ideas en backlog: ${backlog}
- Posts atrasados sin publicar: ${overdueCount}
- Promedio posts/semana: ${avgPerWeek.toFixed(1)}
- Formato más usado: ${topType} (${topTypeCount} posts)
- Desglose por formato: ${typeBreakdown}

🏆 TOP CREADORES DE REFERENCIA:
${competitors.length > 0 ? competitors.slice(0, 5).map((c: { name: string; followers: number; engagementRate: number; postsPerWeek: number }) => `- ${c.name}: ${c.followers.toLocaleString("es-AR")} seguidores, ${c.engagementRate.toFixed(1)}% engagement, ${c.postsPerWeek.toFixed(1)} posts/semana`).join("\n") : "- Sin datos de creadores"}

Generá un reporte mensual profesional con este formato exacto en JSON:

{
  "headline": "titular corto del mes (max 12 palabras)",
  "summary": "resumen ejecutivo de 2-3 oraciones sobre el mes",
  "highlights": [
    { "icon": "emoji", "label": "título corto", "value": "métrica o logro clave" }
  ],
  "insights": [
    { "title": "título del insight", "text": "análisis de 2 oraciones", "type": "positive|neutral|warning" }
  ],
  "recommendations": [
    "recomendación accionable para el mes que viene"
  ],
  "nextMonthGoal": "objetivo SMART para el próximo mes"
}

Reglas:
- highlights: exactamente 4 items con métricas clave
- insights: 3 insights sobre rendimiento, frecuencia y oportunidades
- recommendations: 4 recomendaciones concretas y accionables para finanzas
- Usá lenguaje profesional pero accesible, en español rioplatense
- Enfocá en contenido de finanzas personales e inversiones
- Respondé SOLO con el JSON, sin markdown ni texto adicional`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    let report;
    try {
      report = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        report = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Invalid JSON response");
      }
    }

    return NextResponse.json({ report });
  } catch (err) {
    console.error("monthly-report error:", err);
    return NextResponse.json({ error: "Error al generar el reporte" }, { status: 500 });
  }
}
