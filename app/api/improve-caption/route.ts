import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { caption, type } = await req.json();
    if (!caption?.trim()) {
      return NextResponse.json({ error: "Falta el caption" }, { status: 400 });
    }

    const typeContext: Record<string, string> = {
      reel: "Reel de Instagram (vídeo corto, gancho visual en los primeros 3 seg)",
      carousel: "Carrusel de Instagram (múltiples slides, ideal para educar paso a paso)",
      photo: "Foto de Instagram (imagen única, el texto debe complementarla)",
      story: "Historia de Instagram (efímera, CTA directo, máx 125 caracteres visibles)",
    };

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `Sos un experto en copywriting para finanzas personales en Argentina.
Tu tarea es mejorar el siguiente caption de Instagram.

Formato: ${typeContext[type] ?? "Post de Instagram"}

Caption original:
"""
${caption.trim()}
"""

Reescribí el caption manteniendo la idea central pero mejorando:
1. El gancho inicial (primeras 1-2 líneas deben parar el scroll)
2. La claridad y fluidez del mensaje
3. El llamado a la acción (CTA) al final
4. Que sea en español rioplatense natural, conversacional
5. Incluí 3-5 hashtags relevantes al final (finanzas, Argentina, educación financiera)

Devolvé SOLO el caption mejorado, sin explicaciones ni comillas. Listo para copiar y pegar.`,
        },
      ],
    });

    const improved = (message.content[0] as { type: string; text: string }).text.trim();
    return NextResponse.json({ improved });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[improve-caption]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
