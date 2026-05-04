import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const maxDuration = 30;

interface WeeklyBriefRequest {
  newsTopics: string[];
  competitorTopics: string[];
  ownPostCount: number;
  topType: string;
}

interface ContentIdea {
  hook: string;
  format: "Reel" | "Carrusel" | "Post" | "Historia";
  topic: string;
  whyNow: string;
}

interface WeeklyBriefResponse {
  weekGoal: string;
  ideas: ContentIdea[];
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Falta ANTHROPIC_API_KEY en el servidor." },
      { status: 500 }
    );
  }

  let body: WeeklyBriefRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const { newsTopics = [], competitorTopics = [], ownPostCount = 0, topType = "" } = body;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Sos el estratega de contenido de NEMEF (No es Magia, Es Finanzas), una cuenta de educación financiera para Argentina. El creador es independiente y publica en Instagram.

Contexto de la semana:
- Temas trending en las noticias: ${newsTopics.length > 0 ? newsTopics.join(", ") : "ninguno detectado"}
- Temas que están usando los competidores: ${competitorTopics.length > 0 ? competitorTopics.join(", ") : "sin datos"}
- Posts publicados la semana pasada: ${ownPostCount}
- Formato que mejor funcionó: ${topType || "sin datos"}

Tu tarea: generá un brief de contenido semanal para NEMEF. Priorizá temas de máxima oportunidad y oportunidad temporal (lo que está pasando ahora). El tono de NEMEF es profesional, educativo y accesible — sin clickbait ni sensacionalismo.

Respondé ÚNICAMENTE con un JSON válido, sin texto adicional, con este formato exacto:
{
  "weekGoal": "objetivo editorial de esta semana en una oración clara y accionable",
  "ideas": [
    {
      "hook": "primera línea o gancho del post — directo y con sustancia",
      "format": "Reel | Carrusel | Post | Historia",
      "topic": "tema concreto del contenido",
      "whyNow": "por qué este tema es oportuno esta semana — 1 oración"
    }
  ]
}

Incluí exactamente 3 ideas, ordenadas de mayor a menor oportunidad temporal.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "La respuesta del modelo no contenía JSON válido." },
        { status: 500 }
      );
    }

    const parsed: WeeklyBriefResponse = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[weekly-brief]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
