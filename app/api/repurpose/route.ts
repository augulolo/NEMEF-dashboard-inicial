import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

const PROMPTS: Record<string, string> = {
  twitter_thread: `Convertí este post de finanzas de Instagram en un hilo de Twitter/X de 5-7 tweets.
Reglas: cada tweet empieza con "X/" (X = número), máximo 280 caracteres por tweet, el primero es el hook que genera curiosidad, el último tiene CTA. Solo el texto de los tweets, separados por línea en blanco.`,

  linkedin: `Adaptá este post de Instagram de finanzas para LinkedIn.
Reglas: tono más profesional pero accesible, párrafos cortos (2-3 líneas), sin emojis en exceso (máx 2-3), datos y cifras destacados, CTA profesional al final. Máx 1300 caracteres.`,

  reel_script: `Convertí este post en un guión para Reel de Instagram de 30-45 segundos.
Formato:
🎬 HOOK (0-3s): [texto hablado + indicación visual]
📖 DESARROLLO (3-35s): [puntos clave hablados + indicaciones de corte/texto en pantalla]
🎯 CTA (35-45s): [cierre y llamado a la acción]
Escribí exactamente lo que se dice en cámara.`,

  story: `Adaptá este contenido para una secuencia de 4-5 Instagram Stories.
Por cada story:
SLIDE X: [Texto principal corto, máx 15 palabras] | Elemento interactivo: [poll/slider/pregunta/link sugerido]
Hacelos visuales, con texto mínimo y acción clara.`,

  email: `Convertí este post en la introducción de un newsletter financiero.
Estructura: subject line atractivo, párrafo de apertura con hook, 2-3 párrafos de desarrollo, CTA para seguir leyendo. Tono cercano pero profesional. En español rioplatense.`,
};

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Falta ANTHROPIC_API_KEY" }, { status: 500 });

  const { caption, target } = await req.json();
  if (!caption?.trim() || !target) return NextResponse.json({ error: "Parámetros requeridos" }, { status: 400 });

  const systemPrompt = PROMPTS[target];
  if (!systemPrompt) return NextResponse.json({ error: "Target no válido" }, { status: 400 });

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `${systemPrompt}\n\nPost original:\n"""\n${caption.slice(0, 1000)}\n"""`,
      }],
    });
    const result = (message.content[0] as { text: string }).text.trim();
    return NextResponse.json({ result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
