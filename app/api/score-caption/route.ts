import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { caption, type } = await request.json();

    if (!caption) {
      return NextResponse.json({ error: "Falta el caption" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const typeCtx: Record<string, string> = {
      reel:     "Reel (video corto — el gancho debe funcionar en los primeros 3 segundos)",
      carousel: "Carrusel (texto largo permitido — el gancho define si el usuario desliza)",
      photo:    "Foto (imagen única — el caption complementa sin repetir lo visual)",
      story:    "Historia (texto mínimo visible — foco en CTA inmediato)",
    };

    const prompt = `Sos un experto en comunicación financiera para Instagram en Argentina. Evaluá este caption de NEMEF (No es Magia, Es Finanzas), cuenta de educación financiera con voz profesional, educativa y directa.

Formato del post: ${typeCtx[type ?? ""] ?? "Post de Instagram"}

Caption a evaluar:
"""
${caption}
"""

Criterios de evaluación (todos del 1 al 10):
- hook: ¿El inicio detiene el scroll? ¿Genera curiosidad real o tiene sustancia desde el arranque?
- credibilidad: ¿Transmite autoridad financiera? ¿Usa datos, conceptos o ejemplos concretos?
- claridad: ¿El mensaje es claro y accesible sin perder profundidad?
- cta: ¿Cierra con un llamado a la acción genuino que invite a comentar o reflexionar?

Puntuación global (1-10): promedio ponderado (hook 30%, credibilidad 25%, claridad 25%, cta 20%).

Respondé ÚNICAMENTE con JSON válido con esta estructura exacta:
{
  "score": <número del 1 al 10>,
  "breakdown": {
    "hook": <1-10>,
    "credibilidad": <1-10>,
    "claridad": <1-10>,
    "cta": <1-10>
  },
  "tip": "<una sugerencia accionable en español rioplatense para mejorar el punto más débil>"
}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
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

    const result = JSON.parse(jsonMatch[0]);

    // Normalizar keys para compatibilidad con el frontend (mantiene "breakdown.hook" etc.)
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error en score-caption:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}
