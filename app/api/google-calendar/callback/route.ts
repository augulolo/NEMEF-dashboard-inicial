import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * GET /api/google-calendar/callback?code=...
 *
 * Callback de OAuth2 de Google. Intercambia el code por tokens y guarda
 * el refresh_token en Supabase tabla `settings`.
 *
 * Redirige a /settings con ?google=connected o ?google=error
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/settings?google=error", req.url));
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? "",
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL("/settings?google=error", req.url));
    }

    const tokens = await tokenRes.json() as {
      access_token?: string;
      refresh_token?: string;
    };

    if (!tokens.refresh_token) {
      return NextResponse.redirect(new URL("/settings?google=no_refresh_token", req.url));
    }

    // Guardar refresh_token en Supabase tabla settings
    const supabase = await createServerSupabaseClient();
    await supabase.from("settings").upsert({
      key: "google_refresh_token",
      value: tokens.refresh_token,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

    return NextResponse.redirect(new URL("/settings?google=connected", req.url));
  } catch {
    return NextResponse.redirect(new URL("/settings?google=error", req.url));
  }
}
