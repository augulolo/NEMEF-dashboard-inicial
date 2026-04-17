"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Users, Heart, MessageCircle, Eye, Instagram } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/competitors";

type Profile = {
  username: string;
  followers: number;
  mediaCount: number;
  avatar: string;
  bio: string;
};

type Stats = {
  avgLikes: number;
  avgComments: number;
  avgReach: number;
  avgEngagement: number;
};

type MediaItem = {
  id: string;
  caption: string;
  media_type: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  reach: number;
  impressions: number;
  media_url: string;
  thumbnail_url: string;
};

export function InstagramAccount() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/instagram-metrics");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al cargar métricas");
      } else {
        setProfile(data.profile);
        setStats(data.stats);
        setMedia(data.recentMedia ?? []);
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center gap-3 text-muted-foreground text-sm">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Cargando métricas de Instagram…
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-amber-500/30">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Instagram className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Conectá tu cuenta de Instagram</p>
              <p className="text-xs text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground">
                Configurá <code className="bg-muted px-1 rounded text-[11px]">META_ACCESS_TOKEN</code> y{" "}
                <code className="bg-muted px-1 rounded text-[11px]">META_IG_ACCOUNT_ID</code> en las variables de entorno.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile || !stats) return null;

  const statItems = [
    { label: "Seguidores", value: formatCount(profile.followers), icon: Users, color: "text-primary" },
    { label: "Reach promedio", value: formatCount(stats.avgReach), icon: Eye, color: "text-blue-400" },
    { label: "Likes promedio", value: formatCount(stats.avgLikes), icon: Heart, color: "text-pink-400" },
    { label: "Engagement", value: `${stats.avgEngagement}%`, icon: MessageCircle, color: "text-emerald-400" },
  ];

  return (
    <div className="space-y-4">
      {/* Header perfil */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.username}
                  className="h-14 w-14 rounded-full object-cover border-2 border-primary/30"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <Instagram className="h-7 w-7 text-primary" />
                </div>
              )}
              <div>
                <p className="font-semibold text-lg">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-xs line-clamp-2">{profile.bio}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{profile.mediaCount} publicaciones</p>
              </div>
            </div>
            <button
              onClick={load}
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
              aria-label="Actualizar"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statItems.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn("text-xl font-semibold mt-1 tabular-nums", color)}>{value}</p>
              </div>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Posts recientes */}
      {media.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Últimas publicaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {media.slice(0, 8).map((post) => (
                <div key={post.id} className="flex items-center gap-4 rounded-lg border bg-background/40 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs truncate text-muted-foreground">
                      {post.caption?.slice(0, 80) ?? "(sin caption)"}
                      {(post.caption?.length ?? 0) > 80 ? "…" : ""}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                      {new Date(post.timestamp).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}{post.media_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 tabular-nums">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />{formatCount(post.like_count)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />{formatCount(post.comments_count)}
                    </span>
                    {post.reach > 0 && (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />{formatCount(post.reach)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
