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

  const prompt = `Sos estratega de contenido para NEMEF (No es Magia, Es Finanzas), cuenta de educación financiera en Instagram orientada a Argentina.

PERFIL DE VOZ: Profesional pero accesible. Educativo sin ser condescendiente. Directo, con fundamento y datos reales. Sin frases sensacionalistas ni clickbait vacío. El modelo de referencia es el estilo de @freenance, @joveninversor o academias como Finit: contenido que forma criterio, explica con rigor y conecta con la audiencia desde el conocimiento, no desde el chiste o el slogan.

El creador quiere hacer contenido sobre: "${topic}"

Generá 5 ideas de posts de Instagram, cada una con un ángulo diferente. Para cada idea incluí:
- Un hook de apertura claro y directo (máx. 12 palabras) — puede ser una pregunta real, un dato concreto o una afirmación con sustento
- El formato sugerido (Reel, Carrusel, Post, Historia)
- Un caption de 3-4 líneas que eduque, contextualice y cierre con una invitación a la conversación (incluir hashtags relevantes)

Respondé ÚNICAMENTE con un JSON con este formato exacto, sin texto adicional:
{
  "ideas": [
    {
      "hook": "hook de apertura",
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
