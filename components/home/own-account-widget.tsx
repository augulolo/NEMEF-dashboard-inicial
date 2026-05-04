"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Zap, BarChart2, Heart, Eye, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/competitors";
import Link from "next/link";
import { ChevronRight, Instagram } from "lucide-react";

const STORAGE_KEY = "nemef_own_accounts";

interface OwnHandle {
  platform: string;
  handle: string;
  followers: number;
  engagementRate: number;
  postsPerWeek: number;
  syncedAt?: string;
}

interface MetaProfile {
  username: string;
  followers: number;
  mediaCount: number;
}

interface MetaStats {
  avgLikes: number;
  avgComments: number;
  avgReach: number;
  avgEngagement: number;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "text-pink-400",
  twitter: "text-sky-400",
  youtube: "text-red-400",
};

export function OwnAccountWidget() {
  const [accounts, setAccounts] = useState<OwnHandle[]>([]);
  const [mounted, setMounted] = useState(false);
  const [metaProfile, setMetaProfile] = useState<MetaProfile | null>(null);
  const [metaStats, setMetaStats] = useState<MetaStats | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);

  useEffect(() => {
    try {
      setAccounts(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
    } catch { /**/ }
    setMounted(true);

    // Fetch Meta API data
    fetch("/api/instagram-metrics")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.profile) setMetaProfile(d.profile);
        if (d?.stats) setMetaStats(d.stats);
      })
      .catch(() => {})
      .finally(() => setMetaLoading(false));
  }, []);

  if (!mounted) return null;

  const synced = accounts.filter((a) => a.followers > 0);
  const hasData = synced.length > 0 || metaProfile;
  if (!hasData && !metaLoading) return null;

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Mis cuentas NEMEF
        </CardTitle>
        <Link href="/analytics" className="text-xs text-primary hover:underline flex items-center gap-1">
          Ver analíticas <ChevronRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Meta API account (primary, real data) */}
        {metaProfile && metaStats && (
          <div className="flex items-center gap-3 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0">
              <Instagram className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold truncate">@{metaProfile.username}</span>
                <Shield className="h-3 w-3 text-emerald-400 shrink-0" aria-label="Datos oficiales de Meta" />
              </div>
              <p className="text-xs text-muted-foreground">{metaProfile.mediaCount} publicaciones</p>
            </div>
            <div className="flex items-center gap-3 text-xs shrink-0 tabular-nums">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="font-semibold text-foreground">{formatCount(metaProfile.followers)}</span>
              </span>
              {metaStats.avgEngagement > 0 && (
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-muted-foreground" />
                  <span className="font-semibold text-emerald-400">{metaStats.avgEngagement.toFixed(1)}%</span>
                </span>
              )}
              {metaStats.avgReach > 0 && (
                <span className="items-center gap-1 hidden sm:flex">
                  <Eye className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{formatCount(metaStats.avgReach)}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* localStorage accounts (Twitter, YouTube, etc.) */}
        {synced.map((a) => (
          <div key={a.handle} className="flex items-center gap-3 rounded-md border p-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-medium", PLATFORM_COLORS[a.platform] ?? "text-foreground")}>
                  {a.platform.charAt(0).toUpperCase() + a.platform.slice(1)}
                </span>
                <span className="text-sm font-semibold truncate">{a.handle}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0 tabular-nums">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span className="font-semibold text-foreground">{formatCount(a.followers)}</span>
              </span>
              {a.engagementRate > 0 && (
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span className="font-semibold text-emerald-400">{a.engagementRate.toFixed(1)}%</span>
                </span>
              )}
              {a.postsPerWeek > 0 && (
                <span className="flex items-center gap-1 hidden sm:flex">
                  <BarChart2 className="h-3 w-3" />
                  <span>{a.postsPerWeek.toFixed(1)}/sem</span>
                </span>
              )}
            </div>
          </div>
        ))}

        {metaLoading && !metaProfile && synced.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-pulse" />
            Cargando…
          </div>
        )}
      </CardContent>
    </Card>
  );
}
