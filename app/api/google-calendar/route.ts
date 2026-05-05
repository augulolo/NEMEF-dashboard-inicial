import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * Google Calendar API — sincronización de posts programados
 *
 * Requiere en .env.local:
 *   GOOGLE_CLIENT_ID      — OAuth2 client ID
 *   GOOGLE_CLIENT_SECRET  — OAuth2 client secret
 *   GOOGLE_REDIRECT_URI   — ej: http://localhost:3000/api/google-calendar/callback
 *   GOOGLE_CALENDAR_ID    — ID del calendario (ej: "primary" o el ID específico)
 *
 * Endpoints:
 *   GET  /api/google-calendar?action=auth-url   → devuelve la URL de autorización OAuth
 *   POST /api/google-calendar                   → sincroniza posts → Google Calendar
 *
 * El refresh_token se almacena en Supabase tabla `settings` (key: google_refresh_token).
 */

const SCOPES = "https://www.googleapis.com/auth/calendar.events";

function getOAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? "",
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function getAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { access_token?: string };
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

async function upsertCalendarEvent(
  accessToken: string,
  calendarId: string,
  post: { id: string; caption: string; type: string; status: string; scheduled_date: string }
): Promise<{ ok: boolean; eventId?: string; error?: string }> {
  const typeEmoji: Record<string, string> = {
    reel: "🎬", carousel: "📊", photo: "🖼", story: "⚡",
  };
  const emoji = typeEmoji[post.type] ?? "📱";
  const summary = `${emoji} ${post.caption.slice(0, 60)}${post.caption.length > 60 ? "…" : ""}`;
  const date = post.scheduled_date; // YYYY-MM-DD

  const event = {
    summary,
    description: post.caption,
    start: { date },
    end: { date },
    colorId: post.type === "reel" ? "6" : post.type === "carousel" ? "7" : "1",
    extendedProperties: {
      private: {
        nemefPostId: post.id,
        nemefType: post.type,
        nemefStatus: post.status,
      },
    },
  };

  // Intentar buscar evento existente por extendedProperties
  const searchRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?privateExtendedProperty=nemefPostId=${post.id}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (searchRes.ok) {
    const searchData = await searchRes.json() as { items?: { id: string }[] };
    const existing = searchData.items?.[0];

    if (existing?.id) {
      // Update
      const updateRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${existing.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(event),
        }
      );
      if (!updateRes.ok) return { ok: false, error: `Update failed: ${updateRes.status}` };
      const updated = await updateRes.json() as { id: string };
      return { ok: true, eventId: updated.id };
    }
  }

  // Insert nuevo
  const insertRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(event),
    }
  );
  if (!insertRes.ok) return { ok: false, error: `Insert failed: ${insertRes.status}` };
  const inserted = await insertRes.json() as { id: string };
  return { ok: true, eventId: inserted.id };
}

// ── GET — devuelve URL de auth o estado de conexión ───────────────────────────
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json({
      configured: false,
      message: "Configurá GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env.local",
    });
  }

  if (action === "auth-url") {
    return NextResponse.json({ url: getOAuthUrl() });
  }

  // Estado de conexión
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "google_refresh_token")
    .single();

  return NextResponse.json({
    configured: true,
    connected: !!data?.value,
    calendarId: process.env.GOOGLE_CALENDAR_ID ?? "primary",
  });
}

// ── POST — sincroniza posts → Google Calendar ─────────────────────────────────
export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json({
      ok: false,
      error: "not_configured",
      message: "Configurá las variables de entorno de Google Calendar.",
    });
  }

  const supabase = await createServerSupabaseClient();

  // Recuperar refresh token de Supabase
  const { data: tokenRow } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "google_refresh_token")
    .single();

  if (!tokenRow?.value) {
    return NextResponse.json({
      ok: false,
      error: "not_connected",
      message: "Primero conectá tu cuenta de Google desde la página de Configuración.",
    });
  }

  const accessToken = await getAccessToken(tokenRow.value as string);
  if (!accessToken) {
    return NextResponse.json({
      ok: false,
      error: "token_expired",
      message: "El token de Google expiró. Reconectá tu cuenta desde Configuración.",
    });
  }

  const calendarId = process.env.GOOGLE_CALENDAR_ID ?? "primary";

  // Cargar posts programados con fecha (próximos 3 meses)
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
  const future = new Date(today + "T00:00:00");
  future.setMonth(future.getMonth() + 3);
  const futureStr = future.toLocaleDateString("en-CA");

  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id, caption, type, status, scheduled_date")
    .not("scheduled_date", "is", null)
    .gte("scheduled_date", today)
    .lte("scheduled_date", futureStr);

  if (postsError) {
    return NextResponse.json({ ok: false, error: "db_error", message: postsError.message });
  }

  const results = await Promise.allSettled(
    (posts ?? []).map((p) =>
      upsertCalendarEvent(accessToken, calendarId, {
        id: p.id as string,
        caption: p.caption as string,
        type: p.type as string,
        status: p.status as string,
        scheduled_date: p.scheduled_date as string,
      })
    )
  );

  const synced = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
  const failed = results.length - synced;

  return NextResponse.json({
    ok: true,
    synced,
    failed,
    total: results.length,
    message: `${synced} posts sincronizados con Google Calendar${failed > 0 ? ` (${failed} fallaron)` : ""}.`,
  });
}
