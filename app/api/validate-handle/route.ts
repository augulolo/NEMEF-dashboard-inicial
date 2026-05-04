import { NextResponse } from "next/server";

export const maxDuration = 10;

/**
 * Validates whether a social media handle exists by checking unavatar.io.
 * Returns { valid: boolean, avatarUrl: string }
 */
export async function POST(req: Request) {
  try {
    const { handle, platform } = await req.json() as { handle: string; platform: string };

    if (!handle || !platform) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    const username = handle.replace(/^@/, "").trim();
    const service =
      platform === "instagram" ? "instagram" :
      platform === "twitter"   ? "twitter"   :
      platform === "youtube"   ? "youtube"   :
      platform === "tiktok"    ? "tiktok"    : "instagram";

    const avatarUrl = `https://unavatar.io/${service}/${username}`;

    // HEAD request to check if unavatar resolves the account
    const res = await fetch(avatarUrl, {
      method: "HEAD",
      headers: { "User-Agent": "Mozilla/5.0 NEMEF-Dashboard" },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });

    // unavatar returns 200 with an image for valid accounts, 404 or redirects to a generic
    // placeholder for invalid ones. We check Content-Type.
    const ct = res.headers.get("content-type") ?? "";
    const valid = res.ok && ct.startsWith("image/") && !ct.includes("svg");

    return NextResponse.json({ valid, avatarUrl, username });
  } catch {
    // On timeout / network error, we can't confirm — let the user proceed with a warning
    return NextResponse.json({ valid: null, avatarUrl: null, error: "No se pudo verificar" });
  }
}
