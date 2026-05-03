import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { topic } = await req.json();

  if (!topic?.trim()) {
    return NextResponse.json({ error: "Falta el tema" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Falta ANTHROPIC_API_KEY" }, { status: 500 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Sos estratega de contenido para @noesmagiaesfinanzas, cuenta de finanzas personales en Instagram para Argentina. Tono: claro, directo, educativo, cercano.

El creador quiere hacer contenido sobre: "${topic}"

Generá 5 ideas de posts de Instagram, cada una con un ángulo diferente. Para cada idea incluí:
- Un título/hook de máximo 10 palabras
- El formato sugerido (Reel, Carrusel, Post de imagen, Historia)
- Un caption corto de 3-4 líneas listo para usar (con emojis y hashtags)

Respondé ÚNICAMENTE con un JSON con este formato exacto, sin texto adicional:
{
  "ideas": [
    {
      "hook": "título corto impactante",
      "format": "Reel | Carrusel | Post | Historia",
      "caption": "caption listo para usar con emojis y hashtags"
    }
  ]
}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Respuesta inesperada del modelo" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ ideas: parsed.ideas });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[generate-ideas]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
