"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  RefreshCw, Plus, Trash2, Heart, MessageCircle, Eye,
  Users, Zap, BarChart2, Clock, Instagram, Twitter, Youtube,
  CheckCircle2, Circle, ExternalLink, ChevronDown, ChevronUp,
  AlertCircle, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/competitors";
import { Sparkline } from "@/components/competitors/sparkline";
import { toast } from "@/lib/toast";

/* ─── Apify / localStorage types ─── */
const STORAGE_KEY = "nemef_own_accounts";
type Platform = "instagram" | "twitter" | "youtube";

interface RecentPost { id: string; caption: string; date: string; likes: number; comments: number }
interface OwnHandle {
  platform: Platform; handle: string; followers: number;
  followersHistory: number[]; engagementRate: number; postsPerWeek: number;
  recentPosts: RecentPost[]; syncedAt?: string;
}

const PLATFORM_LABELS: Record<Platform, string> = { instagram: "Instagram", twitter: "Twitter / X", youtube: "YouTube" };
const PLATFORM_ICON: Record<Platform, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram, twitter: Twitter, youtube: Youtube,
};
const PLATFORM_COLOR: Record<Platform, string> = {
  instagram: "text-pink-400", twitter: "text-sky-400", youtube: "text-red-400",
};

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "recién";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}
function loadLS(): OwnHandle[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; } }
function saveLS(d: OwnHandle[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

/* ─── Meta oficial types ─── */
interface MetaStatus { configured: boolean; valid?: boolean; username?: string; followers?: number; error?: string }
interface MetaProfile { username: string; followers: number; mediaCount: number; bio: string }
interface MetaStats { avgLikes: number; avgComments: number; avgReach: number; avgEngagement: number }
interface MetaMedia {
  id: string; caption?: string; media_type: string; timestamp: string;
  like_count: number; comments_count: number; reach: number; impressions: number;
}

/* ══════════════════════════════════════════════════════════════ */
export function MyAccount() {
  /* ── Meta section state ── */
  const [metaStatus, setMetaStatus] = useState<MetaStatus | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaProfile, setMetaProfile] = useState<MetaProfile | null>(null);
  const [metaStats, setMetaStats] = useState<MetaStats | null>(null);
  const [metaMedia, setMetaMedia] = useState<MetaMedia[]>([]);
  const [metaDataLoading, setMetaDataLoading] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  /* ── Apify section state ── */
  const [accounts, setAccounts] = useState<OwnHandle[]>([]);
  const [syncingHandle, setSyncingHandle] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newPlatform, setNewPlatform] = useState<Platform>("instagram");
  const [newHandle, setNewHandle] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  /* ── Init ── */
  useEffect(() => {
    setAccounts(loadLS());
    fetch("/api/meta-status").then((r) => r.json()).then((d) => {
      setMetaStatus(d);
      setMetaLoading(false);
      if (d.configured && d.valid) loadMetaData();
    }).catch(() => setMetaLoading(false));
  }, []);

  const loadMetaData = async () => {
    setMetaDataLoading(true);
    try {
      const res = await fetch("/api/instagram-metrics");
      const d = await res.json();
      if (res.ok) { setMetaProfile(d.profile); setMetaStats(d.stats); setMetaMedia(d.recentMedia ?? []); }
    } finally { setMetaDataLoading(false); }
  };

  /* ── Apify handlers ── */
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const h = newHandle.trim().replace(/^@/, "");
    if (!h) return;
    const key = `${newPlatform}:${h}`;
    if (accounts.some((a) => `${a.platform}:${a.handle.replace(/^@/, "")}` === key)) {
      toast("Esa cuenta ya está agregada", "error"); return;
    }
    const updated = [...accounts, { platform: newPlatform, handle: `@${h}`, followers: 0, followersHistory: [], engagementRate: 0, postsPerWeek: 0, recentPosts: [] }];
    setAccounts(updated); saveLS(updated);
    setNewHandle(""); setAdding(false);
    toast(`@${h} agregado — hacé clic en ↻ para sincronizar`);
  };

  const handleRemove = (handle: string) => {
    const updated = accounts.filter((a) => a.handle !== handle);
    setAccounts(updated); saveLS(updated); toast("Cuenta eliminada");
  };

  const handleSync = async (account: OwnHandle) => {
    setSyncingHandle(account.handle);
    try {
      const res = await fetch("/api/sync-own-account", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: account.handle, platform: account.platform, currentHistory: account.followersHistory }),
      });
      const json = await res.json();
      if (!res.ok) { toast(json.error ?? "Error al sincronizar", "error"); return; }
      const updated = accounts.map((a) =>
        a.handle === account.handle ? { ...a, ...json, recentPosts: json.recentPosts ?? [] } : a
      );
      setAccounts(updated); saveLS(updated);
      toast(`✓ ${account.handle} — ${formatCount(json.followers)} seguidores`);
    } catch { toast("No se pudo conectar con el servidor", "error"); }
    finally { setSyncingHandle(null); }
  };

  return (
    <div className="space-y-6">

      {/* ══ SECCIÓN META OFICIAL ══ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Instagram oficial (Meta)</h3>
          {!metaLoading && metaStatus?.configured && metaStatus.valid && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5">
              <CheckCircle2 className="h-2.5 w-2.5" /> Conectado
            </span>
          )}
        </div>

        {metaLoading ? (
          <Card><CardContent className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Verificando conexión…
          </CardContent></Card>
        ) : metaStatus?.configured && metaStatus.valid ? (
          /* ─── Meta conectado: mostrar datos ─── */
          <div className="space-y-3">
            {metaDataLoading ? (
              <Card><CardContent className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Cargando métricas…
              </CardContent></Card>
            ) : metaProfile && metaStats ? (
              <>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0">
                          <Instagram className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">@{metaProfile.username}</span>
                            <span title="Datos oficiales de Meta"><Shield className="h-3.5 w-3.5 text-emerald-400" /></span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{metaProfile.mediaCount} publicaciones · datos oficiales</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={loadMetaData}>
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      <MetricChip icon={Users}       label="Seguidores"      value={formatCount(metaProfile.followers)} color="text-primary" />
                      <MetricChip icon={Eye}         label="Reach promedio"  value={formatCount(metaStats.avgReach)}    color="text-blue-400" />
                      <MetricChip icon={Heart}       label="Likes promedio"  value={formatCount(metaStats.avgLikes)}    color="text-pink-400" />
                      <MetricChip icon={Zap}         label="Engagement"      value={`${metaStats.avgEngagement}%`}      color="text-emerald-400" />
                    </div>
                  </CardContent>
                </Card>
                {metaMedia.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Últimas publicaciones</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {metaMedia.slice(0, 6).map((p) => (
                        <div key={p.id} className="flex items-center gap-3 rounded-md border bg-background/40 p-2.5 text-xs">
                          <div className="flex-1 min-w-0">
                            <p className="truncate">{p.caption?.slice(0, 80) ?? "(sin caption)"}{(p.caption?.length ?? 0) > 80 ? "…" : ""}</p>
                            <p className="text-muted-foreground mt-0.5">
                              {new Date(p.timestamp).toLocaleDateString("es-AR", { day: "numeric", month: "short" })} · {p.media_type}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-muted-foreground shrink-0 tabular-nums">
                            <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{formatCount(p.like_count)}</span>
                            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{formatCount(p.comments_count)}</span>
                            {p.reach > 0 && <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatCount(p.reach)}</span>}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : null}
          </div>
        ) : (
          /* ─── Meta no conectado: guía ─── */
          <Card className={cn("border-amber-500/30", metaStatus?.configured && !metaStatus.valid && "border-red-500/30")}>
            <CardContent className="p-5">
              {metaStatus?.configured && !metaStatus.valid && (
                <div className="flex items-center gap-2 mb-4 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Token inválido o expirado: {metaStatus.error}
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Instagram className="h-5 w-5 text-pink-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Conectá tu Instagram oficial</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Con la API de Meta obtenés reach, impresiones y engagement real — datos que Apify no puede traer.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setGuideOpen((v) => !v)}
                  className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
                >
                  {guideOpen ? <><ChevronUp className="h-3 w-3" /> Cerrar</> : <><ChevronDown className="h-3 w-3" /> Cómo configurar</>}
                </button>
              </div>

              {guideOpen && (
                <div className="mt-5 space-y-4 border-t pt-4">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Guía de configuración</p>

                  <SetupStep n={1} title="Convertí tu Instagram a cuenta Business o Creator">
                    <p>En la app de Instagram: <strong>Perfil → ☰ → Configuración → Cuenta → Cambiar a cuenta profesional</strong></p>
                    <p className="mt-1">Elegí <em>Creador</em> o <em>Empresa</em> — cualquiera sirve.</p>
                  </SetupStep>

                  <SetupStep n={2} title="Creá una Página de Facebook (si no tenés una)">
                    <p>Entrá a <a href="https://www.facebook.com/pages/create" target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-0.5">facebook.com/pages/create <ExternalLink className="h-2.5 w-2.5" /></a> y creá una página con el nombre de tu marca. No necesita ser pública.</p>
                  </SetupStep>

                  <SetupStep n={3} title="Vinculá tu Instagram con esa Página">
                    <p>En Instagram: <strong>Perfil → Editar perfil → Página de Facebook vinculada</strong> → seleccioná tu página.</p>
                  </SetupStep>

                  <SetupStep n={4} title="Conseguí tu token de acceso">
                    <p>Entrá al <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-0.5">Graph API Explorer <ExternalLink className="h-2.5 w-2.5" /></a>.</p>
                    <ol className="mt-2 space-y-1.5 list-decimal list-inside">
                      <li>Hacé clic en <strong>"Add a Permission"</strong> y agregá: <code className="bg-muted px-1 rounded">instagram_basic</code>, <code className="bg-muted px-1 rounded">instagram_manage_insights</code>, <code className="bg-muted px-1 rounded">pages_read_engagement</code>, <code className="bg-muted px-1 rounded">pages_show_list</code></li>
                      <li>Clic en <strong>"Generate Access Token"</strong> → aceptá los permisos.</li>
                      <li>Copiá el token generado.</li>
                    </ol>
                  </SetupStep>

                  <SetupStep n={5} title="Conseguí tu Instagram Business Account ID">
                    <p>En el mismo Graph API Explorer, pegá esto en el campo de consulta y ejecutá:</p>
                    <code className="block mt-2 bg-muted p-2 rounded text-[11px] break-all">/me/accounts?fields=instagram_business_account</code>
                    <p className="mt-2">Vas a ver algo como: <code className="bg-muted px-1 rounded text-[11px]">{'"instagram_business_account": {"id": "123456789"}'}</code> — copiá ese ID numérico.</p>
                  </SetupStep>

                  <SetupStep n={6} title="Agregá los valores a Vercel">
                    <p>En tu dashboard de Vercel → <strong>Settings → Environment Variables</strong>, agregá:</p>
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-2 bg-muted rounded p-2 text-[11px]">
                        <code className="font-bold">META_ACCESS_TOKEN</code>
                        <span className="text-muted-foreground">= el token del paso 4</span>
                      </div>
                      <div className="flex items-center gap-2 bg-muted rounded p-2 text-[11px]">
                        <code className="font-bold">META_IG_ACCOUNT_ID</code>
                        <span className="text-muted-foreground">= el ID del paso 5</span>
                      </div>
                    </div>
                    <p className="mt-2">Hacé un <strong>Redeploy</strong> en Vercel y volvé a esta página.</p>
                    <p className="mt-1 text-muted-foreground">ⓘ El token dura 60 días. Cuando expire, repetí solo los pasos 4 y 6.</p>
                  </SetupStep>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ══ SECCIÓN APIFY (otros handles / plataformas) ══ */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Otras cuentas (Twitter, YouTube…)
        </h3>

        {accounts.length === 0 && !adding ? (
          <Card className="border-dashed">
            <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-muted-foreground">Agregá tus otras redes para seguir seguidores y crecimiento.</p>
              <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-4 w-4 mr-1" /> Agregar cuenta</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => {
              const PIcon = PLATFORM_ICON[account.platform];
              const isSyncing = syncingHandle === account.handle;
              const isSynced = account.followers > 0;
              const isExpanded = expanded === account.handle;
              const growth = account.followersHistory.length >= 2
                ? ((account.followersHistory.at(-1)! - account.followersHistory[0]) / account.followersHistory[0]) * 100 : 0;
              return (
                <Card key={account.handle} className={cn(isSyncing && "opacity-80")}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <PIcon className={cn("h-4 w-4", PLATFORM_COLOR[account.platform])} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{account.handle}</span>
                          <span className="text-xs text-muted-foreground">{PLATFORM_LABELS[account.platform]}</span>
                          {!isSynced && (
                            <span className="text-[10px] border border-amber-500/40 text-amber-400 rounded px-1 py-0.5 leading-none">sin datos</span>
                          )}
                        </div>
                        {account.syncedAt && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {timeAgo(account.syncedAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon"
                          className={cn("h-8 w-8", isSyncing ? "text-primary" : "text-muted-foreground hover:text-primary")}
                          onClick={() => handleSync(account)} disabled={syncingHandle !== null} title="Sincronizar">
                          <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-400"
                          onClick={() => handleRemove(account.handle)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {isSynced && (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                          <MetricChip icon={Users}    label="Seguidores"  value={formatCount(account.followers)} color="text-primary" />
                          {account.engagementRate > 0 && <MetricChip icon={Zap}      label="Engagement"  value={`${account.engagementRate.toFixed(1)}%`} color="text-emerald-400" />}
                          {account.postsPerWeek > 0  && <MetricChip icon={BarChart2} label="Posts / sem" value={account.postsPerWeek.toFixed(1)} color="text-blue-400" />}
                          {account.followersHistory.length >= 2 && (
                            <div className="rounded-lg border bg-background/40 p-3 flex items-center gap-3">
                              <Sparkline data={account.followersHistory} positive={growth >= 0} />
                              <div>
                                <p className="text-[10px] text-muted-foreground">Crecimiento</p>
                                <p className={cn("text-sm font-semibold tabular-nums", growth >= 0 ? "text-emerald-400" : "text-red-400")}>
                                  {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        {account.recentPosts.length > 0 && (
                          <div className="mt-3">
                            <button onClick={() => setExpanded(isExpanded ? null : account.handle)}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                              {isExpanded ? "▾" : "▸"} {account.recentPosts.length} posts recientes
                            </button>
                            {isExpanded && (
                              <div className="mt-2 space-y-1.5">
                                {account.recentPosts.map((p) => (
                                  <div key={p.id} className="flex items-center gap-3 rounded-md border bg-background/40 p-2.5 text-xs">
                                    <div className="flex-1 min-w-0">
                                      <p className="truncate">{p.caption || "(sin caption)"}</p>
                                      <p className="text-muted-foreground mt-0.5">{new Date(p.date).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground shrink-0 tabular-nums">
                                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{formatCount(p.likes)}</span>
                                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{formatCount(p.comments)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {adding ? (
              <Card className="border-primary/40">
                <CardContent className="p-4">
                  <form onSubmit={handleAdd} className="space-y-3">
                    <p className="text-sm font-medium">Nueva cuenta</p>
                    <div className="grid grid-cols-[140px_1fr] gap-2">
                      <Select value={newPlatform} onChange={(e) => setNewPlatform(e.target.value as Platform)}>
                        <option value="instagram">Instagram</option>
                        <option value="twitter">Twitter / X</option>
                        <option value="youtube">YouTube</option>
                      </Select>
                      <Input value={newHandle} onChange={(e) => setNewHandle(e.target.value)} placeholder="@usuario" autoFocus required />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" className="flex-1">Agregar</Button>
                      <Button type="button" size="sm" variant="outline" className="flex-1" onClick={() => { setAdding(false); setNewHandle(""); }}>Cancelar</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <button onClick={() => setAdding(true)}
                className="w-full rounded-lg border border-dashed p-3 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2">
                <Plus className="h-3.5 w-3.5" /> Agregar otra cuenta
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricChip({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string;
}) {
  return (
    <div className="rounded-lg border bg-background/40 p-3">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-semibold mt-0.5 tabular-nums", color)}>{value}</p>
    </div>
  );
}

function SetupStep({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <div className="text-xs text-muted-foreground mt-1 leading-relaxed space-y-1">{children}</div>
      </div>
    </div>
  );
}
