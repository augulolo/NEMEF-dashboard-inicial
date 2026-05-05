import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Newsletter } from "@/lib/newsletter";

export const maxDuration = 60;

const client = new Anthropic();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchMarketData(): Promise<string> {
  const lines: string[] = [];

  try {
    const blueRes = await fetch("https://api.bluelytics.com.ar/v2/latest", {
      headers: { "User-Agent": "NEMEF-Dashboard/1.0" },
      signal: AbortSignal.timeout(4000),
    });
    if (blueRes.ok) {
      const d = await blueRes.json() as {
        blue?: { value_buy: number; value_sell: number };
        oficial?: { value_buy: number; value_sell: number };
        blue_euro?: { value_sell: number };
      };
      if (d.blue)   lines.push(`Dólar Blue: compra $${d.blue.value_buy} / venta $${d.blue.value_sell}`);
      if (d.oficial) lines.push(`Dólar Oficial: compra $${d.oficial.value_buy} / venta $${d.oficial.value_sell}`);
      if (d.blue && d.oficial) {
        const brecha = (((d.blue.value_sell - d.oficial.value_sell) / d.oficial.value_sell) * 100).toFixed(1);
        lines.push(`Brecha cambiaria: ${brecha}%`);
      }
    }
  } catch { /* skip */ }

  try {
    const cgRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true",
      { signal: AbortSignal.timeout(4000) }
    );
    if (cgRes.ok) {
      const d = await cgRes.json() as {
        bitcoin?: { usd: number; usd_24h_change: number };
        ethereum?: { usd: number; usd_24h_change: number };
      };
      if (d.bitcoin)  lines.push(`Bitcoin: USD ${d.bitcoin.usd.toLocaleString("en-US")} (${d.bitcoin.usd_24h_change?.toFixed(2)}% 24h)`);
      if (d.ethereum) lines.push(`Ethereum: USD ${d.ethereum.usd.toLocaleString("en-US")} (${d.ethereum.usd_24h_change?.toFixed(2)}% 24h)`);
    }
  } catch { /* skip */ }

  return lines.length
    ? `Datos de mercado actuales:\n${lines.join("\n")}`
    : "Datos de mercado no disponibles en este momento.";
}

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NEMEF-Bot/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    // Strip tags, collapse whitespace, take first 4000 chars
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);
    return text;
  } catch {
    return "";
  }
}

// ── POST /api/newsletter ──────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { topic, url, context } = await req.json() as {
      topic: string;
      url?: string;
      context?: string;
    };

    if (!topic?.trim()) {
      return NextResponse.json({ ok: false, error: "topic_required" }, { status: 400 });
    }

    const [marketData, urlContent] = await Promise.all([
      fetchMarketData(),
      url ? fetchUrlContent(url) : Promise.resolve(""),
    ]);

    const today = new Date().toLocaleDateString("es-AR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
      timeZone: "America/Argentina/Buenos_Aires",
    });

    const prompt = `Sos el analista principal de NEMEF (No es Magia, Es Finanzas), el newsletter de finanzas personales e inversiones más analítico y confiable de habla hispana, con foco en Argentina y Latinoamérica.

Hoy es ${today}.

${marketData}

${urlContent ? `\nContenido extraído de fuente (${url}):\n${urlContent}\n` : ""}
${context ? `\nContexto adicional del usuario:\n${context}\n` : ""}

Tu tarea: redactá un informe newsletter analítico completo sobre el siguiente tema:
"${topic}"

ESTILO Y TONO:
- Español rioplatense profesional (vos, pero formal)
- Analítico, con datos y contexto, no superficial
- Confianza de experto sin arrogancia
- Conecta los datos macroeconómicos con el impacto real en el inversor argentino
- Incluye contexto histórico o comparativo cuando suma
- El sello NEMEF: pensamiento crítico + datos + implicancias prácticas

ESTRUCTURA REQUERIDA:
Devolvé un JSON válido con exactamente esta estructura (sin markdown, sin texto extra, solo el JSON):

{
  "subject": "Línea de asunto del email (máx 60 chars, genera curiosidad)",
  "previewText": "Texto de preview del email (máx 90 chars, complementa el asunto)",
  "title": "Título principal del newsletter (impactante, informativo)",
  "subtitle": "Subtítulo que contextualiza o amplía (1 oración)",
  "summary": "Párrafo ejecutivo de 2-3 oraciones que resume la tesis central del análisis",
  "sections": [
    {
      "heading": "Título de sección",
      "body": "Desarrollo analítico de 150-250 palabras. Puede incluir \\n\\n para separar párrafos.",
      "dataPoints": [
        { "label": "Métrica", "value": "Valor", "change": "+X%", "positive": true }
      ]
    }
  ],
  "quotes": [
    {
      "text": "Cita o frase destacada que encapsula una idea clave (puede ser tuya o de una fuente)",
      "context": "Fuente o contexto de la cita"
    }
  ],
  "keyTakeaways": [
    "Punto clave 1 (1 oración directa, accionable)",
    "Punto clave 2",
    "Punto clave 3",
    "Punto clave 4"
  ],
  "sources": [
    { "title": "Nombre de la fuente", "url": "https://..." }
  ],
  "cta": "Texto del botón call-to-action (máx 40 chars)"
}

REQUISITOS:
- 3-4 secciones de análisis profundo
- Cada sección puede tener 0-4 dataPoints con métricas relevantes (usá datos reales del mercado cuando corresponda)
- 1-3 citas destacadas
- 4-5 key takeaways concretos y accionables
- 2-5 fuentes citadas (incluí URLs reales cuando las conozcas)
- Las secciones deben tener progresión lógica: contexto → análisis → implicancias → perspectiva
- Si el tema incluye datos del dólar o cripto, integralos en los dataPoints
- NO inventés URLs de fuentes que no existean — si no sabés la URL, omitila del campo`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";

    // Extract JSON from response (may have surrounding text)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ ok: false, error: "parse_error", raw }, { status: 500 });
    }

    const newsletter: Newsletter = {
      ...JSON.parse(jsonMatch[0]),
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, newsletter });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
