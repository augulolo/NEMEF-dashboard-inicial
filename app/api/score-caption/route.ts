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

    const prompt = `You are an Instagram content expert for Argentine finance accounts. Score this caption (1-10 scale) for its likely Instagram performance.

Post type: ${type ?? "unknown"}
Caption:
"""
${caption}
"""

Evaluate based on:
- hook (1-10): Does it grab attention in the first line?
- clarity (1-10): Is the message clear and easy to understand?
- cta (1-10): Does it have a clear call to action?
- length (1-10): Is the length appropriate for Instagram?

Return ONLY valid JSON with this exact structure:
{
  "score": <overall score 1-10>,
  "breakdown": {
    "hook": <1-10>,
    "clarity": <1-10>,
    "cta": <1-10>,
    "length": <1-10>
  },
  "tip": "<one actionable tip in Argentine Spanish to improve the caption>"
}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Respuesta inválida del modelo" }, { status: 500 });
    }

    const text = content.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "No se pudo parsear la respuesta" }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error en score-caption:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}
