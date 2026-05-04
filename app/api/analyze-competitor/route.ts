import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { competitor } = await request.json();

    if (!competitor) {
      return NextResponse.json({ error: "Falta el competitor" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const recentPostsText = competitor.recentPosts?.length
      ? competitor.recentPosts
          .map((p: { caption: string; likes: number; comments: number }) =>
            `"${p.caption}" (${p.likes} likes, ${p.comments} comentarios)`
          )
          .join("\n")
      : "Sin posts recientes disponibles";

    const prompt = `Sos estratega de contenido para NEMEF (No es Magia, Es Finanzas), cuenta de educación financiera argentina.

Analizá este creador de contenido financiero desde la perspectiva de un competidor/referente. Respondé en español rioplatense, de forma concisa y accionable.

DATOS DEL CREADOR:
- Nombre: ${competitor.name}
- Handle: ${competitor.handle}
- Plataforma: ${competitor.platform}
- Seguidores: ${competitor.followers?.toLocaleString("es-AR") ?? "desconocido"}
- Engagement: ${competitor.engagementRate ?? "desconocido"}%
- Posts/semana: ${competitor.postsPerWeek ?? "desconocido"}
- Bio: ${competitor.bio ?? "Sin bio"}
- Posts recientes:
${recentPostsText}

Devolvé ÚNICAMENTE un JSON válido con esta estructura exacta, sin texto adicional:
{
  "mainTopics": ["tema 1", "tema 2", "tema 3", "tema 4"],
  "communicationStyle": "Descripción en 1-2 oraciones de cómo comunica: tono, formatos que usa, ángulo editorial",
  "strengths": ["fortaleza 1", "fortaleza 2", "fortaleza 3"],
  "weaknesses": ["debilidad 1", "debilidad 2"],
  "contentStrategy": "Descripción en 2 oraciones de su estrategia de contenido y qué lo hace funcionar",
  "opportunities": ["oportunidad para NEMEF 1", "oportunidad para NEMEF 2"],
  "verdict": "1 oración con el veredicto estratégico desde la perspectiva de NEMEF"
}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Respuesta inválida del modelo" }, { status: 500 });
    }

    const jsonMatch = content.text.trim().match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "No se pudo parsear la respuesta" }, { status: 500 });
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Error en analyze-competitor:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}
