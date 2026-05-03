"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw, Plus, Trash2, Heart, MessageCircle,
  Users, Zap, BarChart2, Clock, Instagram, Twitter, Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/competitors";
import { Sparkline } from "@/components/competitors/sparkline";
import { toast } from "@/lib/toast";

const STORAGE_KEY = "nemef_own_accounts";

type Platform = "instagram" | "twitter" | "youtube";

interface RecentPost {
  id: string;
  caption: string;
  date: string;
  likes: number;
  comments: number;
}

interface OwnHandle {
  platform: Platform;
  handle: string;
  followers: number;
  followersHistory: number[];
  engagementRate: number;
  postsPerWeek: number;
  recentPosts: RecentPost[];
  syncedAt?: string;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  twitter: "Twitter / X",
  youtube: "YouTube",
};

const PLATFORM_ICON: Record<Platform, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
};

const PLATFORM_COLOR: Record<Platform, string> = {
  instagram: "text-pink-400",
  twitter: "text-sky-400",
  youtube: "text-red-400",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "recién";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

function load(): OwnHandle[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}
function save(data: OwnHandle[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function MyAccount() {
  const [accounts, setAccounts] = useState<OwnHandle[]>([]);
  const [syncingHandle, setSyncingHandle] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newPlatform, setNewPlatform] = useState<Platform>("instagram");
  const [newHandle, setNewHandle] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setAccounts(load());
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const handle = newHandle.trim().replace(/^@/, "");
    if (!handle) return;
    const key = `${newPlatform}:${handle}`;
    if (accounts.some((a) => `${a.platform}:${a.handle.replace(/^@/, "")}` === key)) {
      toast("Esa cuenta ya está agregada", "error");
      return;
    }
    const updated = [
      ...accounts,
      {
        platform: newPlatform,
        handle: `@${handle}`,
        followers: 0,
        followersHistory: [],
        engagementRate: 0,
        postsPerWeek: 0,
        recentPosts: [],
      },
    ];
    setAccounts(updated);
    save(updated);
    setNewHandle("");
    setAdding(false);
    toast(`@${handle} agregado — hacé clic en ↻ para sincronizar`);
  };

  const handleRemove = (handle: string) => {
    const updated = accounts.filter((a) => a.handle !== handle);
    setAccounts(updated);
    save(updated);
    toast("Cuenta eliminada");
  };

  const handleSync = async (account: OwnHandle) => {
    const key = account.handle;
    setSyncingHandle(key);
    try {
      const res = await fetch("/api/sync-own-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: account.handle,
          platform: account.platform,
          currentHistory: account.followersHistory,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error ?? "Error al sincronizar", "error");
        return;
      }
      const updated = accounts.map((a) =>
        a.handle === key
          ? {
              ...a,
              followers: json.followers,
              followersHistory: json.followersHistory,
              engagementRate: json.engagementRate,
              postsPerWeek: json.postsPerWeek,
              recentPosts: json.recentPosts ?? [],
              syncedAt: json.syncedAt,
            }
          : a
      );
      setAccounts(updated);
      save(updated);
      toast(`✓ ${account.handle} — ${formatCount(json.followers)} seguidores`);
    } catch {
      toast("No se pudo conectar con el servidor", "error");
    } finally {
      setSyncingHandle(null);
    }
  };

  if (accounts.length === 0 && !adding) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">Agregá tus cuentas de NEMEF</p>
            <p className="text-sm text-muted-foreground mt-1">
              Conectá tus redes para ver seguidores, engagement y posts recientes reales.
            </p>
          </div>
          <Button onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1" /> Agregar cuenta
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Cuentas configuradas */}
      {accounts.map((account) => {
        const PIcon = PLATFORM_ICON[account.platform];
        const isSyncing = syncingHandle === account.handle;
        const isSynced = account.followers > 0;
        const isExpanded = expanded === account.handle;
        const growth = account.followersHistory.length >= 2
          ? ((account.followersHistory.at(-1)! - account.followersHistory[0]) / account.followersHistory[0]) * 100
          : 0;

        return (
          <Card key={account.handle} className={cn(isSyncing && "opacity-80")}>
            <CardContent className="p-4">
              {/* Fila principal */}
              <div className="flex items-center gap-3">
                <div className={cn("h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0")}>
                  <PIcon className={cn("h-4 w-4", PLATFORM_COLOR[account.platform])} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{account.handle}</span>
                    <span className="text-xs text-muted-foreground">{PLATFORM_LABELS[account.platform]}</span>
                    {!isSynced && (
                      <span className="text-[10px] border border-amber-500/40 text-amber-400 rounded px-1 py-0.5 leading-none">
                        sin datos
                      </span>
                    )}
                  </div>
                  {account.syncedAt && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Actualizado {timeAgo(account.syncedAt)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost" size="icon"
                    className={cn("h-8 w-8", isSyncing ? "text-primary" : "text-muted-foreground hover:text-primary")}
                    onClick={() => handleSync(account)}
                    disabled={syncingHandle !== null}
                    title="Obtener datos reales"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-400"
                    onClick={() => handleRemove(account.handle)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Métricas (si tiene datos) */}
              {isSynced && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <MetricChip
                      icon={Users}
                      label="Seguidores"
                      value={formatCount(account.followers)}
                      color="text-primary"
                    />
                    {account.engagementRate > 0 && (
                      <MetricChip
                        icon={Zap}
                        label="Engagement"
                        value={`${account.engagementRate.toFixed(1)}%`}
                        color="text-emerald-400"
                      />
                    )}
                    {account.postsPerWeek > 0 && (
                      <MetricChip
                        icon={BarChart2}
                        label="Posts / sem"
                        value={account.postsPerWeek.toFixed(1)}
                        color="text-blue-400"
                      />
                    )}
                    {account.followersHistory.length >= 2 && (
                      <div className="rounded-lg border bg-background/40 p-3 flex items-center gap-3">
                        <Sparkline data={account.followersHistory} positive={growth >= 0} />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Crecimiento</p>
                          <p className={cn(
                            "text-sm font-semibold tabular-nums",
                            growth >= 0 ? "text-emerald-400" : "text-red-400"
                          )}>
                            {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Posts recientes — expandible */}
                  {account.recentPosts.length > 0 && (
                    <div className="mt-3">
                      <button
                        onClick={() => setExpanded(isExpanded ? null : account.handle)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        {isExpanded ? "▾" : "▸"} {account.recentPosts.length} posts recientes
                      </button>
                      {isExpanded && (
                        <div className="mt-2 space-y-1.5">
                          {account.recentPosts.map((p) => (
                            <div key={p.id} className="flex items-center gap-3 rounded-md border bg-background/40 p-2.5 text-xs">
                              <div className="flex-1 min-w-0">
                                <p className="truncate">{p.caption || "(sin caption)"}</p>
                                <p className="text-muted-foreground mt-0.5">
                                  {new Date(p.date).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 text-muted-foreground shrink-0 tabular-nums">
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />{formatCount(p.likes)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageCircle className="h-3 w-3" />{formatCount(p.comments)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Form para agregar nueva cuenta */}
      {adding ? (
        <Card className="border-primary/40">
          <CardContent className="p-4">
            <form onSubmit={handleAdd} className="space-y-3">
              <p className="text-sm font-medium">Nueva cuenta</p>
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <Select
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value as Platform)}
                >
                  <option value="instagram">Instagram</option>
                  <option value="twitter">Twitter / X</option>
                  <option value="youtube">YouTube</option>
                </Select>
                <Input
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  placeholder="@usuario"
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1">Agregar</Button>
                <Button type="button" size="sm" variant="outline" className="flex-1"
                  onClick={() => { setAdding(false); setNewHandle(""); }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full rounded-lg border border-dashed p-3 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-3.5 w-3.5" /> Agregar otra cuenta
        </button>
      )}
    </div>
  );
}

function MetricChip({
  icon: Icon, label, value, color,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border bg-background/40 p-3">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-semibold mt-0.5 tabular-nums", color)}>{value}</p>
    </div>
  );
}
