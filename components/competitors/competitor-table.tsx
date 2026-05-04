"use client";

import { Fragment, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Sparkline } from "./sparkline";
import { CompetitorAvatar } from "./competitor-avatar";
import {
  ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronRight,
  Trash2, Pencil, TrendingUp, TrendingDown, RefreshCw, ExternalLink, Sparkles,
} from "lucide-react";

interface AnalysisResult {
  mainTopics?: string[];
  communicationStyle?: string;
  strengths: string[];
  weaknesses: string[];
  contentStrategy: string;
  opportunities: string[];
  verdict: string;
}
import { PLATFORM_LABELS, PLATFORM_STYLES } from "@/lib/calendar";
import { formatCount, growthPct, REGION_LABELS, type Competitor } from "@/lib/competitors";
import type { Platform } from "@/lib/calendar";

function getProfileUrl(platform: Platform, handle: string): string {
  const username = handle.replace(/^@/, "");
  switch (platform) {
    case "instagram": return `https://instagram.com/${username}`;
    case "twitter":   return `https://x.com/${username}`;
    case "youtube":   return `https://youtube.com/@${username}`;
    case "tiktok":    return `https://tiktok.com/@${username}`;
    default:          return `https://instagram.com/${username}`;
  }
}

type SortKey = "name" | "platform" | "region" | "followers" | "engagementRate" | "postsPerWeek" | "growth";
type SortDir = "asc" | "desc";

const columns: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "name", label: "Creador" },
  { key: "platform", label: "Plataforma" },
  { key: "region", label: "Región" },
  { key: "followers", label: "Seguidores", align: "right" },
  { key: "engagementRate", label: "Engagement", align: "right" },
  { key: "postsPerWeek", label: "Posts / sem", align: "right" },
  { key: "growth", label: "Crecim. (8 sem)", align: "right" },
];

function EditCompetitorDialog({
  competitor,
  onClose,
  onSave,
}: {
  competitor: Competitor;
  onClose: () => void;
  onSave: (updated: Competitor) => void;
}) {
  const [name, setName] = useState(competitor.name);
  const [handle, setHandle] = useState(competitor.handle);

  return (
    <Dialog open title="Editar creador" onClose={onClose}>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Nombre</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Handle (usuario)</label>
          <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@usuario" />
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            className="flex-1"
            onClick={() => onSave({ ...competitor, name, handle })}
            disabled={!name.trim() || !handle.trim()}
          >
            Guardar
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export function CompetitorTable({
  competitors,
  onDelete,
  onEdit,
  onSync,
}: {
  competitors: Competitor[];
  onDelete: (id: string) => void;
  onEdit: (updated: Competitor) => void;
  onSync?: (competitor: Competitor) => Promise<void>;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("followers");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<Competitor | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, AnalysisResult>>({});

  const handleAnalyze = async (c: Competitor) => {
    if (analyzingId) return;
    setAnalyzingId(c.id);
    try {
      const res = await fetch("/api/analyze-competitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitor: {
            name: c.name,
            handle: c.handle,
            platform: c.platform,
            followers: c.followers,
            engagementRate: c.engagementRate,
            postsPerWeek: c.postsPerWeek,
            followersHistory: c.followersHistory,
            recentPosts: c.recentPosts,
            bio: c.bio,
          },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAiAnalysis((prev) => ({ ...prev, [c.id]: data }));
    } catch (e) {
      console.error("Error al analizar:", e);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleSync = async (c: Competitor) => {
    if (!onSync || syncingId) return;
    setSyncingId(c.id);
    try {
      await onSync(c);
    } finally {
      setSyncingId(null);
    }
  };

  const sorted = useMemo(() => {
    const list = [...competitors];
    list.sort((a, b) => {
      const av =
        sortKey === "growth"
          ? growthPct(a.followersHistory)
          : (a[sortKey as keyof Competitor] as number | string);
      const bv =
        sortKey === "growth"
          ? growthPct(b.followersHistory)
          : (b[sortKey as keyof Competitor] as number | string);
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return list;
  }, [competitors, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "name" || k === "platform" || k === "region" ? "asc" : "desc");
    }
  };

  const sortIcon = (k: SortKey) => {
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  return (
    <>
    {editing && (
      <EditCompetitorDialog
        competitor={editing}
        onClose={() => setEditing(null)}
        onSave={(updated) => { onEdit(updated); setEditing(null); }}
      />
    )}
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-background/50 border-b">
            <tr>
              <th className="w-8" />
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide",
                    c.align === "right" ? "text-right" : "text-left"
                  )}
                >
                  <button
                    onClick={() => toggleSort(c.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 hover:text-foreground transition-colors",
                      c.align === "right" && "flex-row-reverse"
                    )}
                  >
                    {c.label}
                    {sortIcon(c.key)}
                  </button>
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="text-center text-muted-foreground py-12 text-sm">
                  Todavía no seguís a nadie. Agregá un creador arriba.
                </td>
              </tr>
            )}
            {sorted.map((c) => {
              const growth = growthPct(c.followersHistory);
              const isOpen = expanded === c.id;
              const style = PLATFORM_STYLES[c.platform];
              const profileUrl = getProfileUrl(c.platform, c.handle);
              return (
                <Fragment key={c.id}>
                  <tr
                    className={cn(
                      "border-b last:border-b-0 hover:bg-accent/20 transition-colors",
                      isOpen && "bg-accent/20"
                    )}
                  >
                    <td className="pl-3">
                      <button
                        onClick={() => setExpanded(isOpen ? null : c.id)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                        aria-label="Expandir"
                      >
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <CompetitorAvatar competitor={c} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">{c.name}</span>
                            {c.followersHistory.length <= 8 && c.followers > 0 && (
                              <span className="text-[10px] border border-amber-500/40 text-amber-400 rounded px-1 py-0.5 leading-none">
                                estimado
                              </span>
                            )}
                          </div>
                          <a
                            href={profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            {c.handle}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", style.dot)} />
                        <span className="text-muted-foreground">{PLATFORM_LABELS[c.platform]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{REGION_LABELS[c.region]}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCount(c.followers)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.engagementRate.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.postsPerWeek.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <Sparkline data={c.followersHistory} positive={growth >= 0} />
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 tabular-nums text-xs font-medium min-w-[60px] justify-end",
                            growth >= 0 ? "text-emerald-400" : "text-red-400"
                          )}
                        >
                          {growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {growth >= 0 ? "+" : ""}
                          {growth.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="pr-3">
                      <div className="flex items-center gap-1">
                        {onSync && c.platform !== "tiktok" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-7 w-7 transition-colors",
                              syncingId === c.id
                                ? "text-primary"
                                : "text-muted-foreground hover:text-primary"
                            )}
                            onClick={() => handleSync(c)}
                            disabled={syncingId !== null}
                            aria-label="Sincronizar datos reales"
                            title="Obtener seguidores y métricas reales"
                          >
                            <RefreshCw className={cn("h-3.5 w-3.5", syncingId === c.id && "animate-spin")} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditing(c)}
                          aria-label="Editar creador"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-400"
                          onClick={() => onDelete(c.id)}
                          aria-label="Quitar creador"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b last:border-b-0 bg-background/30">
                      <td />
                      <td colSpan={columns.length + 1} className="px-4 py-4">
                        {c.bio && (
                          <p className="text-xs text-muted-foreground mb-2 italic">
                            &ldquo;{c.bio.slice(0, 150)}{c.bio.length > 150 ? "…" : ""}&rdquo;
                          </p>
                        )}
                        {c.syncedAt && (
                          <p className="text-[11px] text-muted-foreground/60 mb-3">
                            Datos actualizados {(() => {
                              const diff = Date.now() - new Date(c.syncedAt).getTime();
                              const mins = Math.floor(diff / 60000);
                              if (mins < 1) return "recién";
                              if (mins < 60) return `hace ${mins}m`;
                              const hrs = Math.floor(mins / 60);
                              if (hrs < 24) return `hace ${hrs}h`;
                              const days = Math.floor(hrs / 24);
                              return `hace ${days}d`;
                            })()}
                          </p>
                        )}

                        {/* Botón de análisis IA */}
                        <div className="mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAnalyze(c)}
                            disabled={analyzingId !== null}
                            className="h-8 gap-2 text-xs border-primary/40 text-primary hover:bg-primary/10"
                          >
                            {analyzingId === c.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5" />
                            )}
                            {analyzingId === c.id ? "Analizando…" : "Analizar con IA"}
                          </Button>
                        </div>

                        {/* Panel de análisis IA */}
                        {aiAnalysis[c.id] && (
                          <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2 flex items-center gap-1.5">
                              <Sparkles className="h-3 w-3" />
                              Análisis IA
                            </p>

                            {/* Temas principales */}
                            {aiAnalysis[c.id].mainTopics && aiAnalysis[c.id].mainTopics!.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Temas principales</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {aiAnalysis[c.id].mainTopics!.map((t, i) => (
                                    <span key={i} className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs text-primary font-medium">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Estilo de comunicación */}
                            {aiAnalysis[c.id].communicationStyle && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Estilo de comunicación</p>
                                <p className="text-sm text-foreground/90 leading-relaxed italic">{aiAnalysis[c.id].communicationStyle}</p>
                              </div>
                            )}

                            {/* Estrategia */}
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Estrategia de contenido</p>
                              <p className="text-sm text-foreground/90 leading-relaxed">{aiAnalysis[c.id].contentStrategy}</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-3">
                              {/* Fortalezas */}
                              <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Fortalezas</p>
                                <ul className="space-y-1">
                                  {aiAnalysis[c.id].strengths.map((s, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                                      <span>{s}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Debilidades */}
                              <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Debilidades</p>
                                <ul className="space-y-1">
                                  {aiAnalysis[c.id].weaknesses.map((w, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                      <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                                      <span>{w}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Oportunidades */}
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Oportunidades para NEMEF</p>
                              <ul className="space-y-1">
                                {aiAnalysis[c.id].opportunities.map((o, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                                    <span>{o}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Veredicto */}
                            <div className="rounded-md bg-primary/10 border border-primary/30 px-3 py-2">
                              <p className="text-xs font-medium text-primary mb-0.5">Veredicto</p>
                              <p className="text-sm font-medium">{aiAnalysis[c.id].verdict}</p>
                            </div>
                          </div>
                        )}

                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                          Posts recientes
                        </p>
                        {c.recentPosts.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Sin posts capturados.</p>
                        ) : (
                          <div className="grid gap-2">
                            {c.recentPosts.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center justify-between gap-4 rounded-md border bg-background/40 p-3"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm truncate">{p.caption}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {new Date(p.date).toLocaleDateString("es-AR", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                                  <Badge variant="outline">{formatCount(p.likes)} likes</Badge>
                                  <Badge variant="outline">{formatCount(p.comments)} coment.</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}
