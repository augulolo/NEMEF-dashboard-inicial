"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ExternalLink, CheckCircle2, AlertCircle, Bell, BellOff, RefreshCw, Calendar } from "lucide-react";

const NOTIF_KEY = "nemef_notif_competitors_enabled";

interface EnvSection {
  title: string;
  description: string;
  vars: { name: string; hint: string }[];
  docsUrl: string;
  docsLabel: string;
  statusEnv: string | undefined;
}

const ENV_SECTIONS: EnvSection[] = [
  {
    title: "Meta Business API",
    description: "Conecta tu cuenta de Instagram para obtener métricas reales (seguidores, alcance, impresiones). Requiere una app aprobada en Meta for Developers.",
    vars: [
      { name: "NEXT_PUBLIC_META_ACCESS_TOKEN", hint: "Token de acceso de usuario de larga duración" },
      { name: "NEXT_PUBLIC_META_ACCOUNT_ID", hint: "ID de tu cuenta de Instagram Business" },
    ],
    docsUrl: "https://developers.facebook.com/docs/instagram-api/getting-started",
    docsLabel: "Documentación de Meta for Developers →",
    statusEnv: process.env.NEXT_PUBLIC_META_ACCESS_TOKEN,
  },
  {
    title: "Apify",
    description: "Plataforma de web scraping usada para sincronizar datos de competidores (seguidores, posts recientes) desde Instagram y YouTube.",
    vars: [
      { name: "APIFY_TOKEN", hint: "Token de API de tu cuenta Apify" },
    ],
    docsUrl: "https://docs.apify.com/api/v2",
    docsLabel: "Documentación de Apify API →",
    statusEnv: process.env.APIFY_TOKEN,
  },
  {
    title: "Anthropic AI",
    description: "Potencia las funciones de IA del dashboard: brief semanal, insights, generación de ideas, mejora de captions y más.",
    vars: [
      { name: "ANTHROPIC_API_KEY", hint: "Clave de API de tu cuenta Anthropic" },
    ],
    docsUrl: "https://docs.anthropic.com/es/api/getting-started",
    docsLabel: "Documentación de la API de Anthropic →",
    statusEnv: process.env.ANTHROPIC_API_KEY,
  },
];

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium border rounded-full px-2.5 py-0.5",
        connected
          ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
          : "text-amber-400 border-amber-500/30 bg-amber-500/10"
      )}
    >
      {connected
        ? <><CheckCircle2 className="h-3 w-3" /> Conectado</>
        : <><AlertCircle className="h-3 w-3" /> No configurado</>
      }
    </span>
  );
}

export default function SettingsPage() {
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifLoaded, setNotifLoaded] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<{ configured: boolean; connected: boolean } | null>(null);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [googleMsg, setGoogleMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIF_KEY);
      setNotifEnabled(stored === "true");
    } catch { /**/ }
    setNotifLoaded(true);

    // Check Google Calendar status
    fetch("/api/google-calendar")
      .then((r) => r.json())
      .then((d: { configured: boolean; connected: boolean }) => setGoogleStatus(d))
      .catch(() => {});
  }, []);

  // Handle redirect back from Google OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gStatus = params.get("google");
    if (gStatus === "connected") {
      setGoogleMsg({ ok: true, text: "Google Calendar conectado exitosamente ✓" });
      setGoogleStatus((s) => s ? { ...s, connected: true } : null);
      window.history.replaceState({}, "", "/settings");
    } else if (gStatus) {
      setGoogleMsg({ ok: false, text: "Error al conectar Google Calendar. Intentá de nuevo." });
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

  const handleGoogleConnect = async () => {
    setGoogleSyncing(true);
    try {
      const res = await fetch("/api/google-calendar?action=auth-url");
      const { url } = await res.json() as { url?: string };
      if (url) window.location.href = url;
      else setGoogleMsg({ ok: false, text: "No se pudo obtener la URL de autorización." });
    } catch {
      setGoogleMsg({ ok: false, text: "Error al conectar con Google." });
    } finally {
      setGoogleSyncing(false);
    }
  };

  const handleGoogleSync = async () => {
    setGoogleSyncing(true);
    setGoogleMsg(null);
    try {
      const res = await fetch("/api/google-calendar", { method: "POST" });
      const data = await res.json() as { ok: boolean; message: string };
      setGoogleMsg({ ok: data.ok, text: data.message });
    } catch {
      setGoogleMsg({ ok: false, text: "Error de red al sincronizar." });
    } finally {
      setGoogleSyncing(false);
    }
  };

  const toggleNotif = () => {
    const next = !notifEnabled;
    setNotifEnabled(next);
    try {
      localStorage.setItem(NOTIF_KEY, String(next));
    } catch { /**/ }
  };

  return (
    <>
      <PageHeader
        title="Configuración"
        description="Variables de entorno y preferencias del dashboard."
      />

      <div className="space-y-6 max-w-3xl">
        {/* Instrucción general */}
        <div className="rounded-lg border border-border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
          <p>
            Las variables de entorno no pueden modificarse desde la interfaz del dashboard.
            Configurá cada variable en tu archivo{" "}
            <code className="text-xs bg-background border rounded px-1.5 py-0.5 font-mono">.env.local</code>{" "}
            en la raíz del proyecto y reiniciá el servidor de desarrollo.
          </p>
          <p className="mt-2 text-xs opacity-70">
            Para producción en Vercel o similar, agregá las variables desde el panel de tu plataforma (Settings → Environment Variables).
          </p>
        </div>

        {/* Secciones de APIs */}
        {ENV_SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold">{section.title}</CardTitle>
              <StatusBadge connected={!!section.statusEnv} />
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {section.description}
              </p>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Variables requeridas
                </p>
                {section.vars.map((v) => (
                  <div
                    key={v.name}
                    className="rounded-md border bg-background/60 px-3 py-2.5 flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <code className="text-xs font-mono text-foreground/90 break-all">
                        {v.name}
                      </code>
                      <p className="text-xs text-muted-foreground mt-0.5">{v.hint}</p>
                    </div>
                  </div>
                ))}
              </div>

              <a
                href={section.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {section.docsLabel}
              </a>
            </CardContent>
          </Card>
        ))}

        {/* Google Calendar */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Google Calendar
            </CardTitle>
            {googleStatus !== null && (
              <StatusBadge connected={googleStatus.configured && googleStatus.connected} />
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sincronizá tus posts programados directamente con Google Calendar. Los eventos se crean o actualizan automáticamente para los próximos 3 meses.
            </p>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Variables requeridas
              </p>
              {[
                { name: "GOOGLE_CLIENT_ID", hint: "Client ID de tu app OAuth2 en Google Cloud Console" },
                { name: "GOOGLE_CLIENT_SECRET", hint: "Client Secret de tu app OAuth2" },
                { name: "GOOGLE_REDIRECT_URI", hint: "ej: http://localhost:3000/api/google-calendar/callback" },
                { name: "GOOGLE_CALENDAR_ID", hint: "ID del calendario (ej: primary)" },
              ].map((v) => (
                <div key={v.name} className="rounded-md border bg-background/60 px-3 py-2.5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <code className="text-xs font-mono text-foreground/90 break-all">{v.name}</code>
                    <p className="text-xs text-muted-foreground mt-0.5">{v.hint}</p>
                  </div>
                </div>
              ))}
            </div>

            {googleMsg && (
              <div className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-xs",
                googleMsg.ok
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                  : "border-amber-500/30 bg-amber-500/5 text-amber-400"
              )}>
                {googleMsg.ok
                  ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  : <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                }
                <span className="flex-1">{googleMsg.text}</span>
                <button onClick={() => setGoogleMsg(null)} className="opacity-60 hover:opacity-100">✕</button>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              {googleStatus?.configured && !googleStatus.connected && (
                <button
                  onClick={handleGoogleConnect}
                  disabled={googleSyncing}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Conectar con Google
                </button>
              )}
              {googleStatus?.configured && googleStatus.connected && (
                <>
                  <button
                    onClick={handleGoogleSync}
                    disabled={googleSyncing}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", googleSyncing && "animate-spin")} />
                    {googleSyncing ? "Sincronizando…" : "Sincronizar ahora"}
                  </button>
                  <button
                    onClick={handleGoogleConnect}
                    disabled={googleSyncing}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reconectar
                  </button>
                </>
              )}
              {!googleStatus?.configured && (
                <p className="text-xs text-muted-foreground">
                  Configurá las variables de entorno para habilitar la conexión.
                </p>
              )}
            </div>

            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Google Cloud Console — Credenciales →
            </a>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Notificaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Alertas de crecimiento de competidores</p>
                <p className="text-xs text-muted-foreground">
                  Recibí una notificación en el dashboard cuando un creador de tu lista supere un crecimiento semanal significativo.
                </p>
              </div>
              {notifLoaded && (
                <button
                  onClick={toggleNotif}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors focus:outline-none",
                    notifEnabled
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30 bg-muted"
                  )}
                  role="switch"
                  aria-checked={notifEnabled}
                  aria-label="Activar alertas de competidores"
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                      notifEnabled ? "translate-x-5" : "translate-x-0.5"
                    )}
                    style={{ marginTop: 2 }}
                  />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
              {notifLoaded && (
                <>
                  {notifEnabled
                    ? <Bell className="h-3.5 w-3.5 text-primary shrink-0" />
                    : <BellOff className="h-3.5 w-3.5 shrink-0" />
                  }
                  <span>
                    {notifEnabled
                      ? "Las alertas están activadas. Se muestran en el ícono de campana del sidebar."
                      : "Las alertas están desactivadas."
                    }
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
