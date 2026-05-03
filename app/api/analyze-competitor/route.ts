import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { competitor } = await request.json();

    if (!competitor) {
      return NextResponse.json({ error: "Falta el competitor" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const prompt = `Analyze this finance content creator's strategy for a competitor analysis. The user is NEMEF (No es Magia, Es Finanzas), an Argentine finance content creator.

Competitor data:
- Name: ${competitor.name}
- Handle: ${competitor.handle}
- Platform: ${competitor.platform}
- Followers: ${competitor.followers?.toLocaleString() ?? "unknown"}
- Engagement Rate: ${competitor.engagementRate ?? "unknown"}%
- Posts per week: ${competitor.postsPerWeek ?? "unknown"}
- Bio: ${competitor.bio ?? "N/A"}
- Recent posts: ${competitor.recentPosts?.map((p: { caption: string }) => `"${p.caption}"`).join(", ") ?? "N/A"}

Return ONLY valid JSON with this exact structure:
{
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "contentStrategy": "2 sentence description of their content strategy",
  "opportunities": ["opportunity 1 for NEMEF to differentiate", "opportunity 2"],
  "verdict": "1 sentence strategic verdict"
}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
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

    // Extract JSON from the response
    const text = content.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "No se pudo parsear la respuesta" }, { status: 500 });
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Error en analyze-competitor:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}
