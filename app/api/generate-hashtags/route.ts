import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 20;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Falta ANTHROPIC_API_KEY" }, { status: 500 });

  const { caption, type } = await req.json();
  if (!caption?.trim()) return NextResponse.json({ error: "Caption requerido" }, { status: 400 });

  const prompt = `Generá hashtags para Instagram para un creador de contenido de finanzas personales en Argentina.

Caption / tema del post:
"""
${caption.slice(0, 500)}
"""

Formato del post: ${type ?? "post"}

Reglas:
- Entre 15 y 25 hashtags en total
- Mezcla: 5-6 hashtags grandes (+500k posts), 8-10 medianos (50k-500k), 4-5 nicho (<50k)
- En español, orientados al mercado argentino y latinoamericano
- Relevantes al contenido (no genéricos de lifestyle)
- Sin el símbolo #, solo las palabras

Respondé ÚNICAMENTE con un array JSON de strings, sin markdown ni texto extra. Ejemplo:
["inversionesargentina","dolarep","finanzaspersonales"]`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = (message.content[0] as { text: string }).text.trim();
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No se pudo parsear la respuesta");
    const hashtags: string[] = JSON.parse(match[0]);
    return NextResponse.json({ hashtags });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
