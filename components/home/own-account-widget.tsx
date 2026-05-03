"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Zap, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/competitors";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const STORAGE_KEY = "nemef_own_accounts";

interface OwnHandle {
  platform: string;
  handle: string;
  followers: number;
  engagementRate: number;
  postsPerWeek: number;
  syncedAt?: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "text-pink-400",
  twitter: "text-sky-400",
  youtube: "text-red-400",
};

export function OwnAccountWidget() {
  const [accounts, setAccounts] = useState<OwnHandle[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      setAccounts(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
    } catch { /**/ }
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Solo mostrar cuentas ya sincronizadas
  const synced = accounts.filter((a) => a.followers > 0);
  if (synced.length === 0) return null;

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
      </CardContent>
    </Card>
  );
}
