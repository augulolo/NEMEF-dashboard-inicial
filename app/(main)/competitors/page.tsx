"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddCompetitor } from "@/components/competitors/add-competitor";
import { CompetitorTable } from "@/components/competitors/competitor-table";
import { Users, TrendingUp, Zap, BarChart3, RefreshCw, Download, Plus } from "lucide-react";
import { PLATFORMS, PLATFORM_LABELS, type Platform } from "@/lib/calendar";
import {
  formatCount,
  growthPct,
  REGION_LABELS,
  type Competitor,
  type Region,
} from "@/lib/competitors";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

function exportCSV(competitors: Competitor[]) {
  const headers = ["Nombre", "Handle", "Plataforma", "Región", "Seguidores", "Engagement %", "Posts/semana"];
  const rows = competitors.map((c) => [
    c.name, c.handle, PLATFORM_LABELS[c.platform], REGION_LABELS[c.region],
    c.followers, c.engagementRate.toFixed(1), c.postsPerWeek.toFixed(1),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `creadores-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Mapeo snake_case (DB) → camelCase (app)
function fromDB(row: Record<string, unknown>): Competitor {
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
  };
}

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingAdd, setSyncingAdd] = useState(false);
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ updated: number; syncedAt: string; platform: string } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [regionFilter, setRegionFilter] = useState<Region | "all">("all");
  const [showAddForm, setShowAddForm] = useState(false);

  // Carga inicial desde Supabase
  useEffect(() => {
    supabase
      .from("competitors")
      .select("*")
      .order("followers", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          setLoading(false);
          return;
        }
        setCompetitors((data ?? []).map(fromDB));
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(
    () =>
      competitors.filter(
        (c) =>
          (platformFilter === "all" || c.platform === platformFilter) &&
          (regionFilter === "all" || c.region === regionFilter)
      ),
    [competitors, platformFilter, regionFilter]
  );

  const totals = useMemo(() => {
    const total = filtered.reduce((s, c) => s + c.followers, 0);
    const avgEng =
      filtered.length === 0 ? 0 : filtered.reduce((s, c) => s + c.engagementRate, 0) / filtered.length;
    const avgFreq =
      filtered.length === 0 ? 0 : filtered.reduce((s, c) => s + c.postsPerWeek, 0) / filtered.length;
    const avgGrowth =
      filtered.length === 0
        ? 0
        : filtered.reduce((s, c) => s + growthPct(c.followersHistory), 0) / filtered.length;
    return { total, avgEng, avgFreq, avgGrowth };
  }, [filtered]);

  const reloadFromDB = () => {
    supabase
      .from("competitors")
      .select("*")
      .order("followers", { ascending: false })
      .then(({ data }) => {
        if (data?.length) setCompetitors(data.map(fromDB));
      });
  };

  const handleAdd = async (c: Omit<Competitor, "id">) => {
    const { data, error } = await supabase
      .from("competitors")
      .insert({
        handle: c.handle,
        name: c.name,
        platform: c.platform,
        region: c.region,
        followers: c.followers,
        followers_history: c.followersHistory,
        engagement_rate: c.engagementRate,
        posts_per_week: c.postsPerWeek,
        recent_posts: c.recentPosts,
      })
      .select()
      .single();

    if (error || !data) {
      toast("Error al agregar creador", "error");
      return;
    }

    const newCompetitor = fromDB(data);
    setCompetitors((prev) => [newCompetitor, ...prev]);
    setShowAddForm(false);

    // Auto-sync after adding (only for supported platforms)
    if (["instagram", "twitter", "youtube"].includes(c.platform)) {
      setSyncingAdd(true);
      toast("Sincronizando…");
      try {
        const res = await fetch("/api/sync-competitor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: data.id, handle: c.handle, platform: c.platform }),
        });
        const json = await res.json();
        if (res.ok) {
          // Re-fetch this competitor from DB to get all updated fields
          const { data: updated } = await supabase
            .from("competitors")
            .select("*")
            .eq("id", data.id)
            .single();
          if (updated) {
            setCompetitors((prev) =>
              prev.map((comp) => (comp.id === data.id ? fromDB(updated) : comp))
            );
          }
          toast(`✓ ${c.name || c.handle} sincronizado`);
        } else {
          toast(json.error ?? "No se pudo sincronizar automáticamente", "error");
        }
      } catch {
        toast("No se pudo sincronizar automáticamente", "error");
      } finally {
        setSyncingAdd(false);
      }
    } else {
      toast("Creador agregado");
    }
  };

  const handleEdit = async (updated: Competitor) => {
    const { error } = await supabase
      .from("competitors")
      .update({ name: updated.name, handle: updated.handle })
      .eq("id", updated.id);
    if (!error) {
      setCompetitors((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast("Creador actualizado");
    } else {
      toast("Error al guardar cambios", "error");
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("competitors").delete().eq("id", id);
    if (!error) {
      setCompetitors((prev) => prev.filter((c) => c.id !== id));
      toast("Creador eliminado");
    } else {
      toast("Error al eliminar", "error");
    }
  };

  const handleSyncCompetitor = async (competitor: Competitor) => {
    const { platform, id, handle, name } = competitor;
    if (!["instagram", "twitter", "youtube"].includes(platform)) {
      toast(`Sincronización no disponible para ${platform}`, "error");
      return;
    }
    try {
      const res = await fetch("/api/sync-competitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, handle, platform }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error ?? "Error al sincronizar", "error");
      } else {
        const { data } = await supabase.from("competitors").select("*").eq("id", id).single();
        if (data) {
          setCompetitors((prev) => prev.map((c) => (c.id === id ? fromDB(data) : c)));
        }
        toast(`✓ ${name} actualizado (${json.followers?.toLocaleString("es-AR")} seguidores)`);
      }
    } catch {
      toast("No se pudo conectar con el servidor", "error");
    }
  };

  const handleSyncWithToast = async (platform: "instagram" | "youtube" | "twitter") => {
    setSyncingPlatform(platform);
    setSyncError(null);
    setSyncResult(null);
    try {
      const res = await fetch(`/api/sync-${platform}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setSyncError(json.error ?? "Error al sincronizar");
        toast(`Error al sincronizar ${platform}`, "error");
      } else {
        setSyncResult({ updated: json.updated, syncedAt: json.syncedAt, platform });
        toast(`${json.updated} perfil${json.updated !== 1 ? "es" : ""} de ${platform} actualizados`);
        reloadFromDB();
      }
    } catch {
      setSyncError("No se pudo conectar con el servidor");
      toast("No se pudo conectar con el servidor", "error");
    } finally {
      setSyncingPlatform(null);
    }
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <PageHeader
          title="Creadores de finanzas"
          description="Seguí referentes de finanzas de Argentina y del mundo con métricas de engagement y crecimiento."
        />
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {(["instagram", "youtube", "twitter"] as const).map((p) => {
              const isSyncing = syncingPlatform === p;
              const labels: Record<string, string> = { instagram: "Instagram", youtube: "YouTube", twitter: "Twitter / X" };
              return (
                <button
                  key={p}
                  onClick={() => handleSyncWithToast(p)}
                  disabled={syncingPlatform !== null}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                    syncingPlatform !== null
                      ? "border-border text-muted-foreground cursor-not-allowed opacity-60"
                      : "border-primary text-primary hover:bg-primary/10"
                  )}
                >
                  <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
                  {isSyncing ? "Sincronizando…" : labels[p]}
                </button>
              );
            })}
          </div>
          {syncResult && !syncingPlatform && (
            <p className="text-xs text-muted-foreground">
              ✓ {syncResult.updated} perfil{syncResult.updated !== 1 ? "es" : ""} de{" "}
              {syncResult.platform} actualizados ·{" "}
              {new Date(syncResult.syncedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          {syncError && <p className="text-xs text-red-400">{syncError}</p>}
          <button
            onClick={() => exportCSV(filtered)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            <Download className="h-3 w-3" />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard label="Seguidos" value={loading ? "—" : String(filtered.length)} icon={Users} />
        <StatCard label="Total seguidores" value={loading ? "—" : formatCount(totals.total)} icon={BarChart3} />
        <StatCard label="Engagement prom." value={loading ? "—" : `${totals.avgEng.toFixed(1)}%`} icon={Zap} />
        <StatCard
          label="Crecim. 8 sem prom."
          value={loading ? "—" : `${totals.avgGrowth >= 0 ? "+" : ""}${totals.avgGrowth.toFixed(1)}%`}
          icon={TrendingUp}
          accent={totals.avgGrowth >= 0 ? "text-emerald-400" : "text-red-400"}
        />
      </div>

      <div className="mb-6">
        {showAddForm ? (
          <AddCompetitor onAdd={handleAdd} loading={syncingAdd} />
        ) : (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4" />
            Agregar creador
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Región:</span>
          <FilterPill active={regionFilter === "all"} onClick={() => setRegionFilter("all")}>Todas</FilterPill>
          <FilterPill active={regionFilter === "argentina"} onClick={() => setRegionFilter("argentina")}>{REGION_LABELS.argentina}</FilterPill>
          <FilterPill active={regionFilter === "mundo"} onClick={() => setRegionFilter("mundo")}>{REGION_LABELS.mundo}</FilterPill>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Plataforma:</span>
          <FilterPill active={platformFilter === "all"} onClick={() => setPlatformFilter("all")}>Todas</FilterPill>
          {PLATFORMS.map((p) => (
            <FilterPill key={p} active={platformFilter === p} onClick={() => setPlatformFilter(p)}>
              {PLATFORM_LABELS[p]}
            </FilterPill>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Cargando creadores…</div>
      ) : !loading && competitors.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 flex flex-col items-center justify-center gap-4 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-foreground">Todavía no seguís a ningún creador.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Agregá un creador para ver sus métricas reales.
              </p>
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4" />
              Agregar creador
            </Button>
          </CardContent>
        </Card>
      ) : (
        <CompetitorTable
          competitors={filtered}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onSync={handleSyncCompetitor}
        />
      )}
    </>
  );
}

function StatCard({
  label, value, icon: Icon, accent,
}: {
  label: string; value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={cn("text-2xl font-semibold mt-1 tabular-nums", accent)}>{value}</p>
        </div>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function FilterPill({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"
      )}
    >
      {children}
    </button>
  );
}
