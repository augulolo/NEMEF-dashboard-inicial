"use client";

import { Fragment, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "./sparkline";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronRight, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { PLATFORM_LABELS, PLATFORM_STYLES } from "@/lib/calendar";
import { formatCount, growthPct, REGION_LABELS, type Competitor } from "@/lib/competitors";

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

export function CompetitorTable({
  competitors,
  onDelete,
}: {
  competitors: Competitor[];
  onDelete: (id: string) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("followers");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState<string | null>(null);

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
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.handle}</div>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-400"
                        onClick={() => onDelete(c.id)}
                        aria-label="Quitar creador"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b last:border-b-0 bg-background/30">
                      <td />
                      <td colSpan={columns.length + 1} className="px-4 py-4">
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
  );
}
