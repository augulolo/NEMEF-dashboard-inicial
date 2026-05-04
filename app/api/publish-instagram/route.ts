import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/publish-instagram
 *
 * Publica un post en Instagram Business vía Meta Graph API.
 * Requiere:
 *   NEXT_PUBLIC_META_ACCESS_TOKEN  — token de usuario de larga duración
 *   NEXT_PUBLIC_META_ACCOUNT_ID    — Instagram Business Account ID (sin "ig:" prefix)
 *
 * Body:
 *   { caption: string; imageUrl?: string; type: "photo" | "reel" | "carousel" | "story" }
 *
 * Flujo para foto/story:
 *   1. POST /v19.0/{ig-user-id}/media   → media container
 *   2. POST /v19.0/{ig-user-id}/media_publish → publicación
 *
 * Para reels necesita video_url en lugar de image_url.
 * Para carousels se requieren múltiples containers (no implementado aquí aún).
 */

const META_API = "https://graph.facebook.com/v19.0";

function getConfig() {
  return {
    token: process.env.NEXT_PUBLIC_META_ACCESS_TOKEN ?? "",
    accountId: process.env.NEXT_PUBLIC_META_ACCOUNT_ID ?? "",
  };
}

export async function POST(req: NextRequest) {
  const { token, accountId } = getConfig();

  if (!token || !accountId) {
    return NextResponse.json(
      {
        ok: false,
        error: "not_configured",
        message:
          "Configurá NEXT_PUBLIC_META_ACCESS_TOKEN y NEXT_PUBLIC_META_ACCOUNT_ID en tus variables de entorno (Settings → Configuración).",
      },
      { status: 200 } // 200 para que el cliente pueda leer el error sin throw
    );
  }

  const body = await req.json() as {
    caption: string;
    imageUrl?: string;
    videoUrl?: string;
    type: "photo" | "reel" | "carousel" | "story";
  };

  const { caption, imageUrl, videoUrl, type } = body;

  if (!caption?.trim()) {
    return NextResponse.json({ ok: false, error: "no_caption", message: "El caption no puede estar vacío." }, { status: 400 });
  }

  try {
    // ── 1. Crear container de media ──────────────────────────────────────────
    const containerParams: Record<string, string> = {
      caption,
      access_token: token,
    };

    if (type === "reel" && videoUrl) {
      containerParams.media_type = "REELS";
      containerParams.video_url = videoUrl;
    } else if (type === "story" && imageUrl) {
      containerParams.media_type = "IMAGE";
      containerParams.image_url = imageUrl;
      containerParams.is_story = "true";
    } else if (imageUrl) {
      containerParams.image_url = imageUrl;
    } else {
      // Sin media adjunta — solo caption en un post de texto (no soportado en IG)
      return NextResponse.json(
        {
          ok: false,
          error: "no_media",
          message:
            "Instagram requiere al menos una imagen o video. Cargá la URL de tu imagen en el campo correspondiente.",
        },
        { status: 200 }
      );
    }

    const containerRes = await fetch(`${META_API}/${accountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(containerParams),
    });

    const containerJson = await containerRes.json() as { id?: string; error?: { message: string } };

    if (!containerJson.id) {
      return NextResponse.json(
        {
          ok: false,
          error: "container_failed",
          message: containerJson.error?.message ?? "No se pudo crear el container de media en Meta.",
        },
        { status: 200 }
      );
    }

    const containerId = containerJson.id;

    // ── 2. Publicar el container ──────────────────────────────────────────────
    const publishRes = await fetch(`${META_API}/${accountId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: token,
      }),
    });

    const publishJson = await publishRes.json() as { id?: string; error?: { message: string } };

    if (!publishJson.id) {
      return NextResponse.json(
        {
          ok: false,
          error: "publish_failed",
          message: publishJson.error?.message ?? "El container se creó pero no se pudo publicar.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      ok: true,
      postId: publishJson.id,
      message: "¡Post publicado en Instagram exitosamente!",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error inesperado al conectar con Meta API.";
    return NextResponse.json({ ok: false, error: "network_error", message }, { status: 200 });
  }
}
