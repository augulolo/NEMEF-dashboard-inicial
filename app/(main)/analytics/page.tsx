"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { POST_STATUSES, STATUS_LABELS, POST_TYPES, TYPE_LABELS, type Post } from "@/lib/posts";
import { PLATFORMS, PLATFORM_LABELS, PLATFORM_STYLES } from "@/lib/calendar";
import type { CalendarItem } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import { FileText, CheckCircle2, Clock, Lightbulb, TrendingUp, TrendingDown, Sparkles, RefreshCw } from "lucide-react";
import { growthPct, formatCount } from "@/lib/competitors";
import type { Competitor } from "@/lib/competitors";
import { Sparkline } from "@/components/competitors/sparkline";
import { InstagramAccount } from "@/components/analytics/instagram-account";

const STATUS_COLORS: Record<string, string> = {
  published: "bg-emerald-500",
  scheduled: "bg-primary",
  draft:     "bg-amber-500",
  backlog:   "bg-slate-500",
};

const TYPE_COLORS: Record<string, string> = {
  reel:     "bg-violet-500",
  carousel: "bg-blue-500",
  photo:    "bg-pink-500",
  story:    "bg-amber-500",
};

function BarRow({ label, count, total, color }: {
  label: string; count: number; total: number; color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span>{label}</span>
        <span className="text-muted-foreground tabular-nums">{count}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: number; color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={cn("text-2xl font-semibold mt-1 tabular-nums", color)}>{value}</p>
        </div>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

interface InsightBullet { title: string; text: string }

export default function AnalyticsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<InsightBullet[] | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("posts").select("*"),
      supabase.from("calendar_items").select("*"),
      supabase.from("competitors")
        .select("id, handle, name, platform, region, followers, followers_history, engagement_rate, posts_per_week, recent_posts")
        .order("engagement_rate", { ascending: false })
        .limit(10),
    ]).then(([postsRes, calRes, compRes]) => {
      if (postsRes.data) {
        setPosts(postsRes.data.map((r) => ({
          id: r.id,
          caption: r.caption,
          type: r.type,
          status: r.status,
          scheduledDate: r.scheduled_date ?? undefined,
          createdAt: r.created_at,
        })));
      }
      if (calRes.data) setCalendarItems(calRes.data as CalendarItem[]);
      if (compRes.data) {
        setCompetitors(compRes.data.map((r) => ({
          id: r.id,
          handle: r.handle,
          name: r.name,
          platform: r.platform,
          region: r.region,
          followers: r.followers,
          followersHistory: r.followers_history ?? [],
          engagementRate: r.engagement_rate,
          postsPerWeek: r.posts_per_week,
          recentPosts: r.recent_posts ?? [],
        })));
      }
      setLoading(false);
    });
  }, []);

  // Publicaciones por semana — últimas 8 semanas
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const end = new Date(today + "T00:00:00");
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const ws = start.toLocaleDateString("en-CA");
    const we = end.toLocaleDateString("en-CA");
    const label = start.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
    const count = posts.filter(
      (p) => p.status === "published" && p.scheduledDate && p.scheduledDate >= ws && p.scheduledDate <= we
    ).length;
    return { label, count };
  }).reverse();

  const maxWeekly = Math.max(...weeklyData.map((w) => w.count), 1);

  const generateInsights = async () => {
    if (posts.length === 0) return;
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const publishedThisWeek = weeklyData[weeklyData.length - 1]?.count ?? 0;
      const publishedLastWeek = weeklyData[weeklyData.length - 2]?.count ?? 0;
      const totalPublished = posts.filter((p) => p.status === "published").length;
      const totalScheduled = posts.filter((p) => p.status === "scheduled").length;
      const avgWeeklyPosts = weeklyData.reduce((s, w) => s + w.count, 0) / Math.max(weeklyData.filter((w) => w.count > 0).length, 1);
      const typeCounts = POST_TYPES.map((t) => ({ t, n: posts.filter((p) => p.type === t).length }));
      const topType = TYPE_LABELS[typeCounts.sort((a, b) => b.n - a.n)[0].t];
      const topCompetitors = competitors.slice(0, 4).map((c) => ({
        name: c.name, platform: c.platform, engagementRate: c.engagementRate, postsPerWeek: c.postsPerWeek,
      }));
      const res = await fetch("/api/weekly-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats: { publishedThisWeek, publishedLastWeek, totalPublished, totalScheduled, avgWeeklyPosts, topType, topCompetitors } }),
      });
      const json = await res.json();
      if (!res.ok) { setInsightsError(json.error ?? "Error al generar insights"); return; }
      setInsights(json.bullets);
    } catch {
      setInsightsError("No se pudo conectar con el servidor");
    } finally {
      setInsightsLoading(false);
    }
  };

  const totalPosts  = posts.length;
  const published   = posts.filter((p) => p.status === "published").length;
  const scheduled   = posts.filter((p) => p.status === "scheduled").length;
  const ideas       = posts.filter((p) => p.status === "backlog" || p.status === "draft").length;

  const postsByType   = POST_TYPES.map((t) => ({
    key: t, label: TYPE_LABELS[t],
    count: posts.filter((p) => p.type === t).length,
    color: TYPE_COLORS[t],
  }));

  const postsByStatus = POST_STATUSES.map((s) => ({
    key: s, label: STATUS_LABELS[s],
    count: posts.filter((p) => p.status === s).length,
    color: STATUS_COLORS[s],
  }));

  const calByPlatform = PLATFORMS
    .map((p) => ({
      key: p,
      label: PLATFORM_LABELS[p],
      count: calendarItems.filter((c) => c.platform === p).length,
    }))
    .filter((p) => p.count > 0);

  const maxEngagement = Math.max(...competitors.map((c) => c.engagementRate), 1);

  if (loading) {
    return (
      <>
        <PageHeader title="Analíticas" description="Métricas de tu contenido y creadores." />
        <div className="text-sm text-muted-foreground">Cargando datos…</div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Analíticas" description="Métricas de tu contenido y creadores." />

      {/* Métricas reales de Instagram */}
      <div className="mb-6">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Tu cuenta</h2>
        <InstagramAccount />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <KpiCard icon={FileText}      label="Posts totales"        value={totalPosts} color="text-primary" />
        <KpiCard icon={CheckCircle2}  label="Publicados"           value={published}  color="text-emerald-400" />
        <KpiCard icon={Clock}         label="Programados"          value={scheduled}  color="text-blue-400" />
        <KpiCard icon={Lightbulb}     label="Ideas y borradores"   value={ideas}      color="text-amber-400" />
      </div>

      {/* Tendencia semanal de publicación */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Posts publicados por semana (últimas 8 semanas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-24">
            {weeklyData.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs tabular-nums text-muted-foreground">{w.count || ""}</span>
                <div className="w-full rounded-sm bg-muted overflow-hidden" style={{ height: "64px" }}>
                  <div
                    className="w-full bg-primary rounded-sm transition-all duration-500"
                    style={{ height: `${(w.count / maxWeekly) * 100}%`, marginTop: `${100 - (w.count / maxWeekly) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">{w.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insight semanal con IA */}
      <Card className="mb-6">
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Insight semanal con IA
          </CardTitle>
          <button
            onClick={generateInsights}
            disabled={insightsLoading || posts.length === 0}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs rounded-md border px-3 py-1.5 font-medium transition-colors",
              insightsLoading || posts.length === 0
                ? "border-border text-muted-foreground cursor-not-allowed opacity-60"
                : "border-primary text-primary hover:bg-primary/10"
            )}
          >
            <RefreshCw className={cn("h-3 w-3", insightsLoading && "animate-spin")} />
            {insightsLoading ? "Analizando…" : insights ? "Actualizar" : "Analizar"}
          </button>
        </CardHeader>
        <CardContent>
          {insightsError && (
            <p className="text-xs text-red-400">{insightsError}</p>
          )}
          {!insights && !insightsLoading && !insightsError && (
            <p className="text-sm text-muted-foreground">
              Hacé clic en "Analizar" para que la IA revise tus métricas y te dé 3 recomendaciones concretas.
            </p>
          )}
          {insightsLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Analizando tu desempeño…
            </div>
          )}
          {insights && !insightsLoading && (
            <div className="grid gap-3 md:grid-cols-3">
              {insights.map((b, i) => (
                <div key={i} className="rounded-lg border bg-background/40 p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-sm font-semibold leading-snug">{b.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{b.text}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribución de posts */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tipo de contenido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {postsByType.map(({ key, label, count, color }) => (
              <BarRow key={key} label={label} count={count} total={totalPosts} color={color} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Estado del pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {postsByStatus.map(({ key, label, count, color }) => (
              <BarRow key={key} label={label} count={count} total={totalPosts} color={color} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Actividad por plataforma */}
      {calByPlatform.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Actividad por plataforma (calendario)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {calByPlatform.map(({ key, label, count }) => {
                const style = PLATFORM_STYLES[key];
                return (
                  <div key={key} className="flex items-center gap-3 rounded-lg border p-3">
                    <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", style.dot)} />
                    <span className="text-sm flex-1">{label}</span>
                    <span className="text-sm font-semibold tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top creadores por engagement */}
        {competitors.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Top creadores por engagement rate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {competitors.map((c) => (
                <div key={c.id}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span>{c.name}</span>
                    <span className="text-muted-foreground tabular-nums">{c.engagementRate.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${(c.engagementRate / maxEngagement) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tendencia de seguidores */}
        {competitors.filter((c) => c.followersHistory.length >= 2).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tendencia de seguidores (8 semanas)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {competitors
                .filter((c) => c.followersHistory.length >= 2)
                .sort((a, b) => Math.abs(growthPct(b.followersHistory)) - Math.abs(growthPct(a.followersHistory)))
                .map((c) => {
                  const growth = growthPct(c.followersHistory);
                  return (
                    <div key={c.id} className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs truncate">{c.name}</span>
                          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                            {formatCount(c.followers)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sparkline data={c.followersHistory} positive={growth >= 0} className="shrink-0" />
                          <span className={cn(
                            "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
                            growth >= 0 ? "text-emerald-400" : "text-red-400"
                          )}>
                            {growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
