"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ExternalLink, CheckCircle2, AlertCircle, Bell, BellOff } from "lucide-react";

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

  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIF_KEY);
      setNotifEnabled(stored === "true");
    } catch { /**/ }
    setNotifLoaded(true);
  }, []);

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
