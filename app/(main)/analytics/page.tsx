"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { POST_STATUSES, STATUS_LABELS, POST_TYPES, TYPE_LABELS, type Post } from "@/lib/posts";
import { PLATFORMS, PLATFORM_LABELS, PLATFORM_STYLES } from "@/lib/calendar";
import type { CalendarItem } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import { FileText, CheckCircle2, Clock, Lightbulb, TrendingUp, TrendingDown, Sparkles, RefreshCw, Copy, Check } from "lucide-react";
import { growthPct, formatCount } from "@/lib/competitors";
import type { Competitor } from "@/lib/competitors";
import { Sparkline } from "@/components/competitors/sparkline";
import { MyAccount } from "@/components/analytics/my-account";
import { BenchmarkCard } from "@/components/analytics/benchmark-card";
import { CompetitorAvatar } from "@/components/competitors/competitor-avatar";
import { GrowthChart, type Series } from "@/components/analytics/growth-chart";
import { loadPillars, getPillarDistribution } from "@/lib/pillars";

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

function HashtagsCard({ hashtags }: { hashtags: { tag: string; count: number }[] }) {
  const [copied, setCopied] = useState(false);
  const handleCopyAll = () => {
    navigator.clipboard.writeText(hashtags.map((h) => h.tag).join(" ")).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Hashtags más usados
        </CardTitle>
        <button
          onClick={handleCopyAll}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied
            ? <><Check className="h-3 w-3 text-emerald-400" /> Copiados</>
            : <><Copy className="h-3 w-3" /> Copiar todos</>
          }
        </button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {hashtags.map(({ tag, count }) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background/40 px-2.5 py-1 text-xs"
            >
              <span className="font-medium">{tag}</span>
              <span className="text-muted-foreground tabular-nums text-[10px]">×{count}</span>
            </span>
          ))}
        </div>
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
  const [growthSeries, setGrowthSeries] = useState<Series[]>([]);
  const [insights, setInsights] = useState<InsightBullet[] | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState<number>(3);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("3");

  // Load weekly goal from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("nemef_weekly_goal");
      if (stored) { const n = parseInt(stored, 10); if (n > 0) { setWeeklyGoal(n); setGoalInput(String(n)); } }
    } catch { /**/ }
  }, []);

  useEffect(() => {
    Promise.all([
      supabase.from("posts").select("*"),
      supabase.from("calendar_items").select("*"),
      supabase.from("competitors")
        .select("id, handle, name, platform, region, followers, followers_history, engagement_rate, posts_per_week, recent_posts, profile_pic_url, synced_at")
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
          profilePicUrl: r.profile_pic_url ?? "",
          syncedAt: r.synced_at ?? undefined,
        })));
      }
      setLoading(false);
    });
  }, []);

  // Load growth comparison data
  useEffect(() => {
    const COMP_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#ec4899"];
    Promise.all([
      supabase.from("own_accounts").select("followers_history, handle, platform").limit(1),
      supabase.from("competitors").select("name, handle, followers_history").order("followers", { ascending: false }).limit(5),
    ]).then(([ownRes, compRes]) => {
      const ownAccount = ownRes.data?.[0];
      const compList = compRes.data ?? [];

      const allHistories: number[][] = [];
      if (ownAccount?.followers_history && Array.isArray(ownAccount.followers_history)) {
        allHistories.push(ownAccount.followers_history as number[]);
      }
      for (const c of compList) {
        if (c.followers_history && Array.isArray(c.followers_history)) {
          allHistories.push(c.followers_history as number[]);
        }
      }

      const nonEmptyLengths = allHistories
        .filter((h) => h.length >= 2)
        .map((h) => h.length);
      if (nonEmptyLengths.length === 0) return;
      const minLen = Math.min(...nonEmptyLengths);

      const normalize = (h: number[]): number[] => {
        if (h.length <= minLen) return h;
        return h.slice(h.length - minLen);
      };

      const series: Series[] = [];

      if (ownAccount?.followers_history && Array.isArray(ownAccount.followers_history)) {
        const data = normalize(ownAccount.followers_history as number[]);
        if (data.length >= 2) {
          series.push({
            label: ownAccount.handle ?? "Yo",
            color: "#8b5cf6",
            data,
            isOwn: true,
          });
        }
      }

      compList.forEach((c, i) => {
        if (!c.followers_history || !Array.isArray(c.followers_history)) return;
        const data = normalize(c.followers_history as number[]);
        if (data.length >= 2) {
          series.push({
            label: c.name ?? c.handle,
            color: COMP_COLORS[i] ?? "#94a3b8",
            data,
          });
        }
      });

      setGrowthSeries(series);
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

  // Consistency score: % of weeks with at least 1 post (last 8 weeks)
  const weeksWithPost = weeklyData.filter((w) => w.count > 0).length;
  const consistencyScore = Math.round((weeksWithPost / weeklyData.length) * 100);

  // Publicaciones por día de la semana
  const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const byDayOfWeek = DAYS_ES.map((label, idx) => ({
    label,
    count: posts.filter((p) => {
      if (p.status !== "published" || !p.scheduledDate) return false;
      return new Date(p.scheduledDate + "T12:00:00").getDay() === idx;
    }).length,
  }));
  const maxByDay = Math.max(...byDayOfWeek.map((d) => d.count), 1);
  const bestDay = byDayOfWeek.reduce((a, b) => (b.count > a.count ? b : a), byDayOfWeek[0]);

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

  // ── Month-over-month comparison ────────────────────────────
  const thisMonthKey = today.slice(0, 7); // "yyyy-mm"
  const lastMonthDate = new Date(today + "T00:00:00");
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthKey = lastMonthDate.toLocaleDateString("en-CA").slice(0, 7);

  const publishedThisMonth = posts.filter(
    (p) => p.status === "published" && p.scheduledDate?.startsWith(thisMonthKey)
  ).length;
  const publishedLastMonth = posts.filter(
    (p) => p.status === "published" && p.scheduledDate?.startsWith(lastMonthKey)
  ).length;
  const momChange = publishedLastMonth > 0
    ? Math.round(((publishedThisMonth - publishedLastMonth) / publishedLastMonth) * 100)
    : null;

  // ── Content gap: types not published in last 14 days ──────
  const cutoff14 = new Date(today + "T00:00:00");
  cutoff14.setDate(cutoff14.getDate() - 14);
  const cutoff14Str = cutoff14.toLocaleDateString("en-CA");
  const recentTypes = new Set(
    posts
      .filter((p) => p.status === "published" && p.scheduledDate && p.scheduledDate >= cutoff14Str)
      .map((p) => p.type)
  );
  const gapTypes = POST_TYPES.filter((t) => !recentTypes.has(t));

  // Content production totals
  const publishedPosts = posts.filter((p) => p.status === "published");
  const totalChars = publishedPosts.reduce((s, p) => s + p.caption.length, 0);
  const totalWords = publishedPosts.reduce((s, p) => s + p.caption.trim().split(/\s+/).filter(Boolean).length, 0);
  const avgWords = published > 0 ? Math.round(totalWords / published) : 0;

  // ── Caption length distribution ────────────────────────────
  const lengthBuckets = [
    { label: "0–125", min: 0, max: 125 },
    { label: "126–300", min: 126, max: 300 },
    { label: "301–800", min: 301, max: 800 },
    { label: "801–2200", min: 801, max: 2200 },
  ];
  const lengthDist = lengthBuckets.map((b) => ({
    ...b,
    count: publishedPosts.filter((p) => p.caption.length >= b.min && p.caption.length <= b.max).length,
  }));
  const maxLengthCount = Math.max(...lengthDist.map((b) => b.count), 1);

  const postsByType   = POST_TYPES.map((t) => ({
    key: t, label: TYPE_LABELS[t],
    count: posts.filter((p) => p.type === t).length,
    color: TYPE_COLORS[t],
  }));

  // Distribución por pilar de contenido
  const pillars = loadPillars();
  const pillarDist = getPillarDistribution(posts.map((p) => p.id));
  const totalWithPillar = Object.values(pillarDist).reduce((a, b) => a + b, 0);

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

  // Top hashtags from all published posts
  const topHashtags = (() => {
    const freq: Record<string, number> = {};
    for (const p of posts.filter((p) => p.status === "published")) {
      const matches = p.caption.match(/#[\wáéíóúüñÁÉÍÓÚÜÑ]+/g) ?? [];
      for (const tag of matches) {
        const key = tag.toLowerCase();
        freq[key] = (freq[key] ?? 0) + 1;
      }
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag, count]) => ({ tag, count }));
  })();

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
        <MyAccount />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4 mb-4">
        <KpiCard icon={FileText}      label="Posts totales"        value={totalPosts} color="text-primary" />
        <KpiCard icon={CheckCircle2}  label="Publicados"           value={published}  color="text-emerald-400" />
        <KpiCard icon={Clock}         label="Programados"          value={scheduled}  color="text-blue-400" />
        <KpiCard icon={Lightbulb}     label="Ideas y borradores"   value={ideas}      color="text-amber-400" />
      </div>

      {/* Comparación mes a mes */}
      {(publishedThisMonth > 0 || publishedLastMonth > 0) && (
        <div className="rounded-lg border bg-card px-5 py-3 mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="text-muted-foreground text-xs uppercase tracking-wide font-medium">Mes a mes</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Este mes:</span>
            <span className="font-bold tabular-nums text-foreground">{publishedThisMonth}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Mes anterior:</span>
            <span className="font-bold tabular-nums text-foreground">{publishedLastMonth}</span>
          </div>
          {momChange !== null && (
            <span className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border",
              momChange >= 0
                ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                : "text-red-400 border-red-500/30 bg-red-500/10"
            )}>
              {momChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {momChange >= 0 ? "+" : ""}{momChange}% vs mes anterior
            </span>
          )}
        </div>
      )}

      {/* Content gap */}
      {gapTypes.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-5 py-3 mb-4 flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">Sin publicar en 14 días</span>
          {gapTypes.map((t) => (
            <span key={t} className="text-xs border border-amber-500/30 rounded-full px-2.5 py-0.5 text-amber-300/80">
              {TYPE_LABELS[t]}
            </span>
          ))}
          <span className="text-xs text-muted-foreground ml-auto">Considerá incluir estos formatos en tu próximo post.</span>
        </div>
      )}

      {/* Content production summary */}
      {published > 0 && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-1 mb-6 text-xs text-muted-foreground">
          <span><span className="font-semibold text-foreground tabular-nums">{totalWords.toLocaleString("es-AR")}</span> palabras publicadas</span>
          <span className="opacity-40">·</span>
          <span><span className="font-semibold text-foreground tabular-nums">{totalChars.toLocaleString("es-AR")}</span> caracteres</span>
          <span className="opacity-40">·</span>
          <span><span className="font-semibold text-foreground tabular-nums">{avgWords}</span> palabras promedio / post</span>
        </div>
      )}

      {/* Meta semanal */}
      {!loading && (() => {
        const thisWeekCount = weeklyData[weeklyData.length - 1]?.count ?? 0;
        const pct = Math.min(Math.round((thisWeekCount / weeklyGoal) * 100), 100);
        const done = thisWeekCount >= weeklyGoal;
        return (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Meta semanal</span>
                  {done && <span className="text-[10px] font-semibold text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5">✓ Cumplida</span>}
                </div>
                {editingGoal ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1" max="21"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      className="w-16 rounded border bg-background text-center text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        const n = parseInt(goalInput, 10);
                        if (n > 0) {
                          setWeeklyGoal(n);
                          try { localStorage.setItem("nemef_weekly_goal", String(n)); } catch { /**/ }
                        }
                        setEditingGoal(false);
                      }}
                      className="text-xs text-primary hover:underline font-medium"
                    >Guardar</button>
                    <button onClick={() => setEditingGoal(false)} className="text-xs text-muted-foreground hover:underline">Cancelar</button>
                  </div>
                ) : (
                  <button onClick={() => setEditingGoal(true)} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    Cambiar meta
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", done ? "bg-emerald-500" : "bg-primary")}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={cn("text-sm font-semibold tabular-nums shrink-0", done ? "text-emerald-400" : "text-foreground")}>
                  {thisWeekCount}/{weeklyGoal}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {done
                  ? `¡Excelente! Cumpliste tu meta de ${weeklyGoal} posts esta semana.`
                  : `${weeklyGoal - thisWeekCount} post${weeklyGoal - thisWeekCount !== 1 ? "s" : ""} más para alcanzar tu meta de esta semana.`
                }
              </p>
            </CardContent>
          </Card>
        );
      })()}

      {/* Tendencia semanal de publicación */}
      <Card className="mb-6">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Posts publicados por semana (últimas 8 semanas)
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs shrink-0">
            <span className="text-muted-foreground">Consistencia:</span>
            <span className={cn(
              "font-semibold tabular-nums",
              consistencyScore >= 75 ? "text-emerald-400" : consistencyScore >= 50 ? "text-amber-400" : "text-muted-foreground"
            )}>
              {consistencyScore}%
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {/* Línea de meta */}
          <div className="relative">
            <div className="flex items-end gap-2 h-24">
              {weeklyData.map((w, i) => {
                const atGoal = w.count >= weeklyGoal;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs tabular-nums text-muted-foreground">{w.count || ""}</span>
                    <div className="w-full rounded-sm bg-muted overflow-hidden" style={{ height: "64px" }}>
                      <div
                        className={cn("w-full rounded-sm transition-all duration-500", atGoal ? "bg-emerald-500" : "bg-primary")}
                        style={{ height: `${(w.count / Math.max(maxWeekly, weeklyGoal)) * 100}%`, marginTop: `${100 - (w.count / Math.max(maxWeekly, weeklyGoal)) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate w-full text-center">{w.label}</span>
                  </div>
                );
              })}
            </div>
            {/* Goal line overlay */}
            <div
              className="absolute left-0 right-0 border-t border-dashed border-amber-400/60 pointer-events-none"
              style={{ bottom: `${(weeklyGoal / Math.max(maxWeekly, weeklyGoal)) * 64 + 16}px` }}
            >
              <span className="absolute right-0 -top-4 text-[9px] text-amber-400/80 font-medium">meta {weeklyGoal}</span>
            </div>
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

      {/* Benchmark vs creadores */}
      <BenchmarkCard competitors={competitors} />

      {/* Mejor día para publicar */}
      {posts.filter((p) => p.status === "published").length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Publicaciones por día de la semana
              </CardTitle>
              {bestDay.count > 0 && (
                <span className="text-xs text-muted-foreground">
                  Mejor día: <span className="font-semibold text-primary">{bestDay.label}</span> ({bestDay.count} posts)
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-24">
              {byDayOfWeek.map((d) => (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs tabular-nums text-muted-foreground">{d.count || ""}</span>
                  <div className="w-full rounded-sm bg-muted overflow-hidden" style={{ height: "64px" }}>
                    <div
                      className={cn(
                        "w-full rounded-sm transition-all duration-500",
                        d.label === bestDay.label && bestDay.count > 0 ? "bg-primary" : "bg-primary/40"
                      )}
                      style={{ height: `${(d.count / maxByDay) * 100}%`, marginTop: `${100 - (d.count / maxByDay) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{d.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribución de longitud de captions */}
      {published > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Longitud de captions publicados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lengthDist.map((b) => (
                <div key={b.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span>{b.label} chars</span>
                    <span className="text-muted-foreground tabular-nums">{b.count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all duration-500"
                      style={{ width: `${(b.count / maxLengthCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">
              El texto visible antes del "ver más" de Instagram es de aprox. 125 caracteres.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Distribución de posts */}
      <div className={cn("grid gap-4 mb-6", topHashtags.length > 0 ? "md:grid-cols-3" : "md:grid-cols-2")}>
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

        {topHashtags.length > 0 && (
          <HashtagsCard hashtags={topHashtags} />
        )}
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

      {/* Comparativa de crecimiento */}
      {growthSeries.length >= 1 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Comparativa de crecimiento — vos vs. creadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GrowthChart series={growthSeries} height={220} />
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
                <div key={c.id} className="flex items-center gap-2.5">
                  <CompetitorAvatar competitor={c} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="truncate font-medium">{c.name || c.handle}</span>
                      <span className="text-muted-foreground tabular-nums shrink-0 ml-2">{c.engagementRate.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${(c.engagementRate / maxEngagement) * 100}%` }}
                      />
                    </div>
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
                    <div key={c.id} className="flex items-center gap-2.5">
                      <CompetitorAvatar competitor={c} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs truncate font-medium">{c.name || c.handle}</span>
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

      {/* Distribución por pilar de contenido */}
      {totalWithPillar > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <span>Mix de pilares de contenido</span>
              <span className="text-[10px] normal-case font-normal border rounded px-1.5 py-0.5">{totalWithPillar} posts etiquetados</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pillars
                .map((p) => ({ pillar: p, count: pillarDist[p.id] ?? 0 }))
                .filter((x) => x.count > 0)
                .sort((a, b) => b.count - a.count)
                .map(({ pillar, count }) => {
                  const pct = Math.round((count / totalWithPillar) * 100);
                  return (
                    <div key={pillar.id} className={cn("rounded-lg border p-3", pillar.color, pillar.borderColor)}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base leading-none">{pillar.emoji}</span>
                        <span className={cn("text-xs font-semibold", pillar.textColor)}>{pillar.name}</span>
                        <span className="ml-auto text-xs font-bold tabular-nums text-foreground">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-700", pillar.textColor.replace("text-", "bg-"))}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5">{count} post{count !== 1 ? "s" : ""}</p>
                    </div>
                  );
                })}
            </div>
            {totalWithPillar < posts.length && (
              <p className="text-[11px] text-muted-foreground mt-3">
                {posts.length - totalWithPillar} posts sin pilar asignado — etiquetálos desde el gestor de Instagram.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
