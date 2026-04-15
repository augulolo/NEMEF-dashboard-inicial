"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AddCompetitor } from "@/components/competitors/add-competitor";
import { CompetitorTable } from "@/components/competitors/competitor-table";
import { Users, TrendingUp, Zap, BarChart3 } from "lucide-react";
import { PLATFORMS, PLATFORM_LABELS, type Platform } from "@/lib/calendar";
import {
  SEED_COMPETITORS,
  formatCount,
  growthPct,
  REGION_LABELS,
  type Competitor,
  type Region,
} from "@/lib/competitors";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useLocalStorage<Competitor[]>("nemef.competitors", SEED_COMPETITORS);
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [regionFilter, setRegionFilter] = useState<Region | "all">("all");

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

  const handleAdd = (c: Competitor) => setCompetitors((prev) => [c, ...prev]);
  const handleDelete = (id: string) => setCompetitors((prev) => prev.filter((c) => c.id !== id));

  return (
    <>
      <PageHeader
        title="Creadores de finanzas"
        description="Seguí referentes de finanzas de Argentina y del mundo con métricas de engagement y crecimiento."
      />

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard label="Seguidos" value={String(filtered.length)} icon={Users} />
        <StatCard label="Total seguidores" value={formatCount(totals.total)} icon={BarChart3} />
        <StatCard label="Engagement prom." value={`${totals.avgEng.toFixed(1)}%`} icon={Zap} />
        <StatCard
          label="Crecim. 8 sem prom."
          value={`${totals.avgGrowth >= 0 ? "+" : ""}${totals.avgGrowth.toFixed(1)}%`}
          icon={TrendingUp}
          accent={totals.avgGrowth >= 0 ? "text-emerald-400" : "text-red-400"}
        />
      </div>

      <div className="mb-6">
        <AddCompetitor onAdd={handleAdd} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Región:</span>
          <FilterPill active={regionFilter === "all"} onClick={() => setRegionFilter("all")}>
            Todas
          </FilterPill>
          <FilterPill active={regionFilter === "argentina"} onClick={() => setRegionFilter("argentina")}>
            {REGION_LABELS.argentina}
          </FilterPill>
          <FilterPill active={regionFilter === "mundo"} onClick={() => setRegionFilter("mundo")}>
            {REGION_LABELS.mundo}
          </FilterPill>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Plataforma:</span>
          <FilterPill active={platformFilter === "all"} onClick={() => setPlatformFilter("all")}>
            Todas
          </FilterPill>
          {PLATFORMS.map((p) => (
            <FilterPill key={p} active={platformFilter === p} onClick={() => setPlatformFilter(p)}>
              {PLATFORM_LABELS[p]}
            </FilterPill>
          ))}
        </div>
      </div>

      <CompetitorTable competitors={filtered} onDelete={handleDelete} />
    </>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
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

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "border-border text-muted-foreground hover:bg-accent"
      )}
    >
      {children}
    </button>
  );
}
