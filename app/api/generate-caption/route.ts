import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { title, summary, topics } = await req.json();

  if (!title) {
    return NextResponse.json({ error: "Falta título" }, { status: 400 });
  }

  const topicContext = topics?.length
    ? `El artículo trata sobre: ${topics.join(", ")}.`
    : "";

  const prompt = `Sos community manager de una cuenta de finanzas personales en Instagram para Argentina (@nemef_finanzas). Tu tono es claro, directo y educativo — sin tecnicismos innecesarios, cercano pero profesional.

Acaba de salir esta noticia:
TÍTULO: ${title}
${summary ? `RESUMEN: ${summary}` : ""}
${topicContext}

Escribí 3 variantes de caption para Instagram sobre esta noticia. Cada variante debe:
- Empezar con un hook impactante (pregunta, dato sorprendente o afirmación fuerte)
- Explicar brevemente qué pasó y por qué le importa a alguien que quiere cuidar su plata
- Cerrar con una pregunta o llamada a la acción para generar comentarios
- Incluir 5-8 hashtags relevantes en español/inglés al final
- Tener entre 150-250 palabras

Respondé ÚNICAMENTE con un JSON con este formato exacto, sin texto adicional:
{"captions": ["caption 1 completo", "caption 2 completo", "caption 3 completo"]}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Respuesta inesperada del modelo" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ captions: parsed.captions });
  } catch (err) {
    console.error("[generate-caption]", err);
    return NextResponse.json({ error: "Error al generar captions" }, { status: 500 });
  }
}
