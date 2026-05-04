import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { title, summary, topics } = await req.json();

  if (!title) {
    return NextResponse.json({ error: "Falta título" }, { status: 400 });
  }

  const topicContext = topics?.length
    ? `El artículo trata sobre: ${topics.join(", ")}.`
    : "";

  const prompt = `Sos redactor de contenido para NEMEF (No es Magia, Es Finanzas), cuenta de educación financiera en Instagram orientada a Argentina.

VOZ DE MARCA: Profesional y fundamentada, sin caer en el sensacionalismo. Educativa, directa y accesible — similar al estilo de @freenance, @joveninversor o Finit (@inverarg). El contenido forma criterio y explica con datos reales; no usa clickbait ni frases vacías.

Acaba de salir esta noticia:
TÍTULO: ${title}
${summary ? `RESUMEN: ${summary}` : ""}
${topicContext}

Escribí 3 variantes de caption para Instagram sobre esta noticia. Cada variante debe:
- Abrir con un hook relevante: pregunta genuina, dato concreto o afirmación con sustento real
- Explicar qué ocurrió y qué implicancias concretas tiene para quien ahorra o invierte
- Cerrar con una pregunta o invitación a la reflexión que genere comentarios de calidad
- Incluir 5-8 hashtags pertinentes al final
- Tener entre 150-250 palabras

Respondé ÚNICAMENTE con un JSON con este formato exacto, sin texto adicional:
{"captions": ["caption 1 completo", "caption 2 completo", "caption 3 completo"]}`;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Falta configurar ANTHROPIC_API_KEY en el servidor" }, { status: 500 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[generate-caption]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
