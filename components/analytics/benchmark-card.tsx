"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/competitors";
import type { Competitor } from "@/lib/competitors";

interface MetaStatus {
  configured: boolean;
  valid?: boolean;
  username?: string;
  followers?: number;
}

interface MetricsStats {
  avgEngagement: number;
  avgLikes: number;
  avgComments: number;
  avgReach: number;
}

interface BenchmarkCardProps {
  competitors: Competitor[];
}

const MY_FOLLOWERS_FALLBACK = 369;
const MY_ENGAGEMENT_FALLBACK = 0.36;

export function BenchmarkCard({ competitors }: BenchmarkCardProps) {
  const [meta, setMeta] = useState<MetaStatus | null>(null);
  const [metrics, setMetrics] = useState<MetricsStats | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);

  useEffect(() => {
    // Fetch meta-status and instagram-metrics in parallel
    Promise.all([
      fetch("/api/meta-status").then((r) => r.json()).catch(() => ({ configured: false })),
      fetch("/api/instagram-metrics").then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([metaData, metricsData]) => {
      setMeta(metaData);
      if (metricsData?.stats) setMetrics(metricsData.stats);
      if (metricsData?.profile?.followers && metaData) {
        setMeta({ ...metaData, followers: metricsData.profile.followers });
      }
    }).finally(() => setMetaLoading(false));
  }, []);

  if (competitors.length === 0 && !metaLoading) return null;

  const withEngagement = competitors.filter((c) => c.engagementRate > 0);
  const avgEngagement =
    withEngagement.length > 0
      ? withEngagement.reduce((s, c) => s + c.engagementRate, 0) / withEngagement.length
      : 0;

  const topEngagement =
    withEngagement.length > 0
      ? withEngagement.reduce((a, b) => (b.engagementRate > a.engagementRate ? b : a), withEngagement[0])
      : null;

  const avgFollowers =
    competitors.length > 0
      ? competitors.reduce((s, c) => s + c.followers, 0) / competitors.length
      : 0;

  const topFollowers =
    competitors.length > 0
      ? competitors.reduce((a, b) => (b.followers > a.followers ? b : a), competitors[0])
      : null;

  const myFollowers = meta?.followers ?? MY_FOLLOWERS_FALLBACK;
  const myEngagement = metrics?.avgEngagement ?? MY_ENGAGEMENT_FALLBACK;

  const rows = [
    {
      metric: "Seguidores",
      mine: formatCount(myFollowers),
      avg: formatCount(Math.round(avgFollowers)),
      top: topFollowers ? `${formatCount(topFollowers.followers)} (${topFollowers.name || topFollowers.handle})` : "—",
      aboveAvg: myFollowers >= avgFollowers,
    },
    {
      metric: "Engagement",
      mine: `${myEngagement.toFixed(2)}%`,
      avg: avgEngagement > 0 ? `${avgEngagement.toFixed(1)}%` : "—",
      top: topEngagement
        ? `${topEngagement.engagementRate.toFixed(1)}% (${topEngagement.name || topEngagement.handle})`
        : "—",
      aboveAvg: myEngagement >= avgEngagement,
    },
  ];

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <BarChart2 className="h-3.5 w-3.5 text-primary" />
          Tu cuenta vs el mercado
        </CardTitle>
      </CardHeader>
      <CardContent>
        {metaLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="grid grid-cols-4 gap-3">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-2 text-xs font-medium text-muted-foreground w-28">Métrica</th>
                  <th className="text-right pb-2 text-xs font-medium text-muted-foreground pr-4">Tu cuenta</th>
                  <th className="text-right pb-2 text-xs font-medium text-muted-foreground pr-4">Avg creadores</th>
                  <th className="text-right pb-2 text-xs font-medium text-muted-foreground">Mejor referente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {rows.map((row) => (
                  <tr key={row.metric}>
                    <td className="py-2.5 text-xs text-muted-foreground">{row.metric}</td>
                    <td className="py-2.5 text-right pr-4 tabular-nums">
                      <span className={cn(
                        "font-semibold text-sm",
                        row.aboveAvg ? "text-emerald-400" : "text-red-400"
                      )}>
                        {row.mine}
                      </span>
                    </td>
                    <td className="py-2.5 text-right pr-4 text-xs text-muted-foreground tabular-nums">
                      {row.avg}
                    </td>
                    <td className="py-2.5 text-right text-xs text-muted-foreground tabular-nums">
                      {row.top}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {metrics && meta?.username && (
              <p className="text-[11px] text-muted-foreground mt-3">
                Datos reales de @{meta.username} · {metrics.avgLikes} likes prom · {metrics.avgComments} comentarios prom · alcance {formatCount(metrics.avgReach)} prom
              </p>
            )}
            {!metrics && (
              <p className="text-[11px] text-muted-foreground mt-3">
                Engagement calculado con datos conocidos. Conectá Meta API para datos en tiempo real.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
