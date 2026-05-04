import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { topic } = await req.json();

  if (!topic?.trim()) {
    return NextResponse.json({ error: "Falta el tema" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Falta ANTHROPIC_API_KEY" }, { status: 500 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Generá un brief completo de contenido de Instagram para NEMEF (No es Magia, Es Finanzas), cuenta de educación financiera orientada a Argentina.

VOZ DE MARCA: Profesional, educativa y accesible. Con fundamento y datos reales. Sin sensacionalismo ni clickbait. El modelo de referencia es @freenance, @joveninversor, Finit (@inverarg): contenido que forma criterio y conecta desde el conocimiento.

El tema es: "${topic}".

Respondé ÚNICAMENTE con un JSON válido con este formato exacto, sin texto adicional:
{
  "topic": "${topic}",
  "angle": "ángulo editorial único y perspectiva fundamentada para este post",
  "format": "Reel | Carrusel | Post | Historia",
  "hooks": ["opción de hook 1 (directo y con sustento)", "opción de hook 2", "opción de hook 3"],
  "keyPoints": ["punto clave 1 con dato o argumento real", "punto clave 2", "punto clave 3", "punto clave 4"],
  "caption": "caption completo listo para publicar en español rioplatense con emojis, entre 150 y 250 palabras — tono profesional y educativo, sin frases cliché",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5", "hashtag6", "hashtag7", "hashtag8", "hashtag9", "hashtag10", "hashtag11", "hashtag12", "hashtag13", "hashtag14", "hashtag15"],
  "cta": "llamado a la acción que invite a reflexionar o compartir experiencia real",
  "bestDay": "Lunes | Martes | Miércoles | Jueves | Viernes | Sábado | Domingo",
  "difficulty": "fácil | media | difícil",
  "estimatedReach": "bajo | medio | alto"
}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Respuesta inesperada del modelo" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ brief: parsed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[content-brief]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
