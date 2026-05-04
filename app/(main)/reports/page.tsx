"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText, Calendar, CheckCircle2, Inbox, TrendingUp, TrendingDown,
  Minus, Sparkles, RefreshCw, Download, ChevronLeft, ChevronRight,
  AlertCircle, Target, Zap, BarChart3, Clock, Copy, Check, Mail,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { TYPE_LABELS, type Post, type PostType } from "@/lib/posts";
import { type Competitor } from "@/lib/competitors";

// ─── helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function postsInMonth(posts: Post[], year: number, month: number) {
  const key = monthKey(year, month);
  return posts.filter(
    (p) =>
      p.status === "published" &&
      (p.scheduledDate?.startsWith(key) || p.createdAt?.startsWith(key))
  );
}

function fromDBPost(row: Record<string, unknown>): Post {
  return {
    id: row.id as string,
    caption: row.caption as string,
    type: row.type as Post["type"],
    status: row.status as Post["status"],
    scheduledDate: (row.scheduled_date as string) ?? undefined,
    createdAt: (row.created_at as string)?.slice(0, 10),
  };
}

function fromDBCompetitor(row: Record<string, unknown>): Competitor {
  return {
    id: row.id as string,
    handle: row.handle as string,
    name: row.name as string,
    platform: row.platform as Competitor["platform"],
    region: row.region as Competitor["region"],
    followers: (row.followers as number) ?? 0,
    followersHistory: (row.followers_history as number[]) ?? [],
    engagementRate: (row.engagement_rate as number) ?? 0,
    postsPerWeek: (row.posts_per_week as number) ?? 0,
    recentPosts: (row.recent_posts as Competitor["recentPosts"]) ?? [],
    profilePicUrl: (row.profile_pic_url as string) ?? "",
    bio: (row.bio as string) ?? "",
    syncedAt: (row.synced_at as string) ?? undefined,
  };
}

// ─── types ────────────────────────────────────────────────────────────────────

interface AIReport {
  headline: string;
  summary: string;
  highlights: { icon: string; label: string; value: string }[];
  insights: { title: string; text: string; type: "positive" | "neutral" | "warning" }[];
  recommendations: string[];
  nextMonthGoal: string;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed

  const [posts, setPosts] = useState<Post[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);

  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load all data once
  useEffect(() => {
    Promise.all([
      supabase.from("posts").select("*"),
      supabase.from("competitors").select("*").order("followers", { ascending: false }),
    ]).then(([postsRes, compRes]) => {
      if (postsRes.data) setPosts(postsRes.data.map(fromDBPost));
      if (compRes.data) setCompetitors(compRes.data.map(fromDBCompetitor));
      setLoading(false);
    });
  }, []);

  // Reset AI report when month changes
  useEffect(() => {
    setAiReport(null);
    setAiError(null);
  }, [selectedYear, selectedMonth]);

  // ── derived stats ────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;

    const thisMonthPosts = postsInMonth(posts, selectedYear, selectedMonth);
    const lastMonthPosts = postsInMonth(posts, prevYear, prevMonth);

    const key = monthKey(selectedYear, selectedMonth);
    const allThisMonth = posts.filter(
      (p) => p.scheduledDate?.startsWith(key) || p.createdAt?.startsWith(key)
    );

    // By type
    const byType: Record<PostType, number> = { photo: 0, reel: 0, story: 0, carousel: 0 };
    for (const p of thisMonthPosts) byType[p.type] = (byType[p.type] ?? 0) + 1;
    const topTypeEntry = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
    const typeBreakdown = Object.entries(byType)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${TYPE_LABELS[k as PostType]}: ${v}`)
      .join(", ") || "Sin datos";

    // Overdue
    const TODAY = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
    const overdueCount = posts.filter(
      (p) => p.status === "scheduled" && p.scheduledDate && p.scheduledDate < TODAY
    ).length;

    // avg per week (4.33 weeks/month)
    const avgPerWeek = thisMonthPosts.length / 4.33;

    // scheduled/drafts/backlog (all time, current)
    const scheduled = posts.filter((p) => p.status === "scheduled").length;
    const drafts = posts.filter((p) => p.status === "draft").length;
    const backlog = posts.filter((p) => p.status === "backlog").length;

    return {
      published: thisMonthPosts.length,
      publishedLastMonth: lastMonthPosts.length,
      publishedAll: allThisMonth.length,
      byType,
      topType: topTypeEntry ? TYPE_LABELS[topTypeEntry[0] as PostType] : "—",
      topTypeCount: topTypeEntry ? topTypeEntry[1] : 0,
      typeBreakdown,
      overdueCount,
      avgPerWeek,
      scheduled,
      drafts,
      backlog,
    };
  }, [posts, selectedYear, selectedMonth]);

  const delta = stats.published - stats.publishedLastMonth;
  const deltaPct = stats.publishedLastMonth > 0
    ? Math.round((delta / stats.publishedLastMonth) * 100)
    : null;

  const navigateMonth = (dir: -1 | 1) => {
    let m = selectedMonth + dir;
    let y = selectedYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    setAiError(null);
    try {
      const res = await fetch("/api/monthly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stats: {
            month: MONTH_NAMES[selectedMonth],
            year: selectedYear,
            published: stats.published,
            publishedLastMonth: stats.publishedLastMonth,
            scheduled: stats.scheduled,
            drafts: stats.drafts,
            backlog: stats.backlog,
            topType: stats.topType,
            topTypeCount: stats.topTypeCount,
            typeBreakdown: stats.typeBreakdown,
            overdueCount: stats.overdueCount,
            avgPerWeek: stats.avgPerWeek,
            competitors,
          },
        }),
      });
      const json = await res.json();
      if (res.ok && json.report) {
        setAiReport(json.report);
      } else {
        setAiError(json.error ?? "Error al generar el reporte");
      }
    } catch {
      setAiError("No se pudo conectar con el servidor");
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = (format: "txt" | "md" = "txt") => {
    if (!aiReport) return;
    const monthStr = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

    if (format === "md") {
      const lines = [
        `# Reporte mensual NEMEF — ${monthStr}`,
        "",
        `## ${aiReport.headline}`,
        "",
        aiReport.summary,
        "",
        "## Métricas clave",
        "",
        ...aiReport.highlights.map((h) => `- **${h.label}:** ${h.value} ${h.icon}`),
        "",
        "## Análisis",
        "",
        ...aiReport.insights.flatMap((ins) => [`### ${ins.title}`, "", ins.text, ""]),
        "## Recomendaciones",
        "",
        ...aiReport.recommendations.map((r, i) => `${i + 1}. ${r}`),
        "",
        "## Objetivo del próximo mes",
        "",
        aiReport.nextMonthGoal,
        "",
        `---`,
        `*Generado por NEMEF Dashboard · ${new Date().toLocaleDateString("es-AR")}*`,
      ];
      const content = lines.join("\n");
      const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-nemef-${monthKey(selectedYear, selectedMonth)}.md`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const lines = [
      `REPORTE MENSUAL NEMEF — ${monthStr.toUpperCase()}`,
      "═".repeat(60),
      "",
      `📌 ${aiReport.headline}`,
      "",
      "RESUMEN EJECUTIVO",
      "─".repeat(40),
      aiReport.summary,
      "",
      "MÉTRICAS CLAVE",
      "─".repeat(40),
      ...aiReport.highlights.map((h) => `${h.icon} ${h.label}: ${h.value}`),
      "",
      "ANÁLISIS",
      "─".repeat(40),
      ...aiReport.insights.map((i) => `• ${i.title}\n  ${i.text}`),
      "",
      "RECOMENDACIONES PARA EL PRÓXIMO MES",
      "─".repeat(40),
      ...aiReport.recommendations.map((r, i) => `${i + 1}. ${r}`),
      "",
      "OBJETIVO DEL PRÓXIMO MES",
      "─".repeat(40),
      aiReport.nextMonthGoal,
      "",
      "─".repeat(60),
      `Generado por NEMEF Dashboard · ${new Date().toLocaleDateString("es-AR")}`,
    ];

    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-nemef-${monthKey(selectedYear, selectedMonth)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildPlainText = () => {
    if (!aiReport) return "";
    const monthStr = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
    return [
      `REPORTE MENSUAL NEMEF — ${monthStr.toUpperCase()}`,
      "═".repeat(60),
      "",
      `📌 ${aiReport.headline}`,
      "",
      "RESUMEN EJECUTIVO",
      "─".repeat(40),
      aiReport.summary,
      "",
      "MÉTRICAS CLAVE",
      "─".repeat(40),
      ...aiReport.highlights.map((h) => `${h.icon} ${h.label}: ${h.value}`),
      "",
      "ANÁLISIS",
      "─".repeat(40),
      ...aiReport.insights.map((i) => `• ${i.title}\n  ${i.text}`),
      "",
      "RECOMENDACIONES PARA EL PRÓXIMO MES",
      "─".repeat(40),
      ...aiReport.recommendations.map((r, i) => `${i + 1}. ${r}`),
      "",
      "OBJETIVO DEL PRÓXIMO MES",
      "─".repeat(40),
      aiReport.nextMonthGoal,
      "",
      "─".repeat(60),
      `Generado por NEMEF Dashboard · ${new Date().toLocaleDateString("es-AR")}`,
    ].join("\n");
  };

  const handleCopy = async () => {
    const text = buildPlainText();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMailto = () => {
    const monthStr = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
    const subject = encodeURIComponent(`Reporte NEMEF — ${monthStr}`);
    const body = encodeURIComponent(buildPlainText());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // ── render ───────────────────────────────────────────────────────────────────

  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth();
  const isFutureMonth = selectedYear > now.getFullYear() ||
    (selectedYear === now.getFullYear() && selectedMonth > now.getMonth());

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <PageHeader
          title="Reporte mensual"
          description="Resumen de actividad, análisis de contenido y recomendaciones estratégicas."
        />
        {aiReport && (
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleMailto}>
              <Mail className="h-3.5 w-3.5" />
              Email
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("txt")}>
              <Download className="h-3.5 w-3.5" />
              .txt
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("md")}>
              <Download className="h-3.5 w-3.5" />
              .md
            </Button>
          </div>
        )}
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-1.5 rounded-md border hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="min-w-[180px] text-center">
          <span className="text-lg font-semibold">{MONTH_NAMES[selectedMonth]}</span>
          <span className="text-muted-foreground ml-2">{selectedYear}</span>
          {isCurrentMonth && (
            <span className="ml-2 text-[10px] font-medium text-primary border border-primary/40 rounded px-1.5 py-0.5">
              mes actual
            </span>
          )}
        </div>
        <button
          onClick={() => navigateMonth(1)}
          disabled={isFutureMonth}
          className="p-1.5 rounded-md border hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Cargando datos…</div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard
              icon={CheckCircle2}
              label="Posts publicados"
              value={String(stats.published)}
              sub={
                stats.publishedLastMonth > 0 ? (
                  <span className={cn(
                    "flex items-center gap-1 text-xs",
                    delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-muted-foreground"
                  )}>
                    {delta > 0 ? <TrendingUp className="h-3 w-3" /> : delta < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {delta > 0 ? "+" : ""}{delta} vs mes anterior
                    {deltaPct !== null && ` (${deltaPct > 0 ? "+" : ""}${deltaPct}%)`}
                  </span>
                ) : <span className="text-xs text-muted-foreground">primer mes con datos</span>
              }
            />
            <StatCard
              icon={FileText}
              label="Formato líder"
              value={stats.topType}
              sub={<span className="text-xs text-muted-foreground">{stats.topTypeCount} posts este mes</span>}
            />
            <StatCard
              icon={Clock}
              label="Ritmo semanal"
              value={`${stats.avgPerWeek.toFixed(1)}/sem`}
              sub={<span className="text-xs text-muted-foreground">promedio estimado</span>}
            />
            <StatCard
              icon={Target}
              label="Pipeline activo"
              value={String(stats.scheduled + stats.drafts)}
              sub={<span className="text-xs text-muted-foreground">{stats.scheduled} prog. · {stats.drafts} borradores</span>}
            />
          </div>

          {/* Type breakdown */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  Desglose por formato
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.published === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin posts publicados este mes.</p>
                ) : (
                  <div className="space-y-3">
                    {(Object.entries(stats.byType) as [PostType, number][])
                      .filter(([, v]) => v > 0)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => {
                        const pct = Math.round((count / stats.published) * 100);
                        return (
                          <div key={type}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">{TYPE_LABELS[type]}</span>
                              <span className="font-medium tabular-nums">{count} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-border">
                              <div
                                className="h-1.5 rounded-full bg-primary transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  Estado del pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "Publicados (mes)", value: stats.published, color: "bg-emerald-500" },
                    { label: "Programados", value: stats.scheduled, color: "bg-blue-500" },
                    { label: "Borradores", value: stats.drafts, color: "bg-amber-500" },
                    { label: "Ideas (backlog)", value: stats.backlog, color: "bg-muted-foreground" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", color)} />
                        <span className="text-xs text-muted-foreground">{label}</span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">{value}</span>
                    </div>
                  ))}
                  {stats.overdueCount > 0 && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-500/20">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="text-xs text-amber-400">
                        {stats.overdueCount} post{stats.overdueCount > 1 ? "s" : ""} atrasado{stats.overdueCount > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Competitor overview */}
          {competitors.length > 0 && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  Top creadores de referencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Creador</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Seguidores</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Engagement</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Posts/sem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {competitors.slice(0, 8).map((c) => (
                        <tr key={c.id} className="border-b last:border-0 hover:bg-accent/10">
                          <td className="py-2 pr-4">
                            <div className="font-medium">{c.name || c.handle}</div>
                            <div className="text-muted-foreground">@{c.handle}</div>
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums">
                            {c.followers >= 1_000_000
                              ? `${(c.followers / 1_000_000).toFixed(1)}M`
                              : c.followers >= 1_000
                              ? `${(c.followers / 1_000).toFixed(0)}K`
                              : c.followers}
                          </td>
                          <td className={cn(
                            "py-2 px-3 text-right tabular-nums font-medium",
                            c.engagementRate >= 3 ? "text-emerald-400" : c.engagementRate >= 1 ? "text-amber-400" : "text-muted-foreground"
                          )}>
                            {c.engagementRate.toFixed(1)}%
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                            {c.postsPerWeek.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Report section */}
          <Card className={cn("border-primary/20", generating && "border-primary/50")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Análisis IA del mes
                </CardTitle>
                <button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                    generating
                      ? "border-border text-muted-foreground cursor-not-allowed opacity-60"
                      : "border-primary text-primary hover:bg-primary/10"
                  )}
                >
                  {generating ? (
                    <><RefreshCw className="h-3 w-3 animate-spin" /> Analizando…</>
                  ) : aiReport ? (
                    <><RefreshCw className="h-3 w-3" /> Actualizar</>
                  ) : (
                    <><Sparkles className="h-3 w-3" /> Generar reporte IA</>
                  )}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {aiError && (
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> {aiError}
                </p>
              )}

              {!aiReport && !generating && !aiError && (
                <p className="text-sm text-muted-foreground">
                  Generá un análisis inteligente del mes con recomendaciones estratégicas para tu contenido de finanzas.
                </p>
              )}

              {generating && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground py-4">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  Analizando métricas y generando reporte…
                </div>
              )}

              {aiReport && !generating && (
                <div className="space-y-6">
                  {/* Headline */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{aiReport.headline}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{aiReport.summary}</p>
                  </div>

                  {/* Highlights */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {aiReport.highlights.map((h, i) => (
                      <div key={i} className="rounded-lg border bg-background/40 p-3 text-center">
                        <div className="text-2xl mb-1">{h.icon}</div>
                        <div className="text-xs text-muted-foreground mb-1">{h.label}</div>
                        <div className="text-sm font-semibold">{h.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Insights */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Análisis</h4>
                    {aiReport.insights.map((ins, i) => (
                      <div key={i} className={cn(
                        "rounded-lg border p-3",
                        ins.type === "positive" && "border-emerald-500/20 bg-emerald-500/5",
                        ins.type === "warning" && "border-amber-500/20 bg-amber-500/5",
                        ins.type === "neutral" && "border-border bg-background/40",
                      )}>
                        <p className={cn(
                          "text-xs font-semibold mb-1",
                          ins.type === "positive" && "text-emerald-400",
                          ins.type === "warning" && "text-amber-400",
                          ins.type === "neutral" && "text-foreground",
                        )}>{ins.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{ins.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Recomendaciones para {MONTH_NAMES[selectedMonth === 11 ? 0 : selectedMonth + 1]}
                    </h4>
                    <ul className="space-y-2">
                      {aiReport.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-muted-foreground leading-relaxed">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Goal */}
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5" />
                      Objetivo del próximo mes
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{aiReport.nextMonthGoal}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
        <p className="text-2xl font-semibold mt-2 tabular-nums">{value}</p>
        {sub && <div className="mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}
