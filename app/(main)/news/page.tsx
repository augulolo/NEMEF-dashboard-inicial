"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { NewsCard } from "@/components/news/news-card";
import { TopicFilter } from "@/components/news/topic-filter";
import { CaptionDialog } from "@/components/news/caption-dialog";
import { RefreshCw, Search, Newspaper, ExternalLink, Sparkles, TrendingUp, X, Film, Layers, Image as ImageIcon, Circle, Bookmark, Rss } from "lucide-react";
import { type NewsItem, type NewsTopic, TOPIC_LABELS, TOPIC_STYLES } from "@/lib/news";
import { FeedManager, loadCustomFeeds } from "@/components/news/feed-manager";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";

const FINANCE_KEYWORDS = [
  "dólar", "inflación", "reservas", "tasas", "inversión", "acciones",
  "mercado", "deuda", "cepo", "bcra", "bitcoin", "cripto",
  "plazo fijo", "cedear", "bono", "tarjeta",
];

const FORMAT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Reel: Film,
  Carrusel: Layers,
  Post: ImageIcon,
  Historia: Circle,
};

type TodayIdea = {
  hook: string;
  format: string;
  caption: string;
};

function timeAgo(iso: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "recién";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `hace ${days}d`;
  return new Date(iso).toLocaleDateString("es-AR", { month: "short", day: "numeric" });
}

function FeaturedNewsCard({
  item,
  onCreatePost,
}: {
  item: NewsItem;
  onCreatePost?: (caption: string) => void;
}) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      {showDialog && onCreatePost && (
        <CaptionDialog
          item={item}
          onClose={() => setShowDialog(false)}
          onUse={(caption) => {
            onCreatePost(caption);
            setShowDialog(false);
          }}
        />
      )}
      <Card className="border-primary/30 bg-primary/5 hover:border-primary/60 transition-colors">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
              <span className="font-medium text-foreground/80 truncate">{item.source}</span>
              <span>·</span>
              <span>{timeAgo(item.publishedAt)}</span>
            </div>
            <div className="flex flex-wrap gap-1 shrink-0">
              {item.topics.map((t) => (
                <span
                  key={t}
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                    TOPIC_STYLES[t]
                  )}
                >
                  {TOPIC_LABELS[t]}
                </span>
              ))}
            </div>
          </div>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <h2 className="text-lg font-semibold leading-snug flex items-start gap-1.5 group-hover:text-primary transition-colors">
              <span>{item.title}</span>
              <ExternalLink className="h-4 w-4 mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h2>
          </a>
          {item.summary && (
            <p className="text-sm text-muted-foreground leading-relaxed">{item.summary}</p>
          )}
          {onCreatePost && (
            <div className="pt-1">
              <button
                onClick={() => setShowDialog(true)}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium border border-primary/30 rounded-md px-3 py-1.5 bg-primary/10 hover:bg-primary/20"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Compartir en IG — Generar caption con IA
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function getTrendingKeywords(items: NewsItem[]): { keyword: string; count: number }[] {
  const now = Date.now();
  const h24 = 24 * 60 * 60 * 1000;
  const recent = items.filter((it) => {
    if (!it.publishedAt) return true;
    return now - new Date(it.publishedAt).getTime() < h24;
  });

  const pool = recent.length > 0 ? recent : items;

  const counts: Record<string, number> = {};
  for (const kw of FINANCE_KEYWORDS) counts[kw] = 0;

  for (const item of pool) {
    const text = `${item.title} ${item.summary}`.toLowerCase();
    for (const kw of FINANCE_KEYWORDS) {
      if (text.includes(kw.toLowerCase())) {
        counts[kw]++;
      }
    }
  }

  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([keyword, count]) => ({ keyword, count }));
}

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [topic, setTopic] = useState<NewsTopic | "all">("all");
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string | "all">("all");
  const [showFavsOnly, setShowFavsOnly] = useState(false);
  const [favIds, setFavIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try { return new Set(JSON.parse(localStorage.getItem("nemef_news_favs_v1") ?? "[]")); } catch { return new Set(); }
  });
  const [showFeedManager, setShowFeedManager] = useState(false);

  // "¿Qué publicar hoy?" state
  const [todayIdea, setTodayIdea] = useState<TodayIdea | null>(null);
  const [loadingTodayIdea, setLoadingTodayIdea] = useState(false);
  const [savingTodayIdea, setSavingTodayIdea] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      let disabledUrls: string[] = [];
      let customFeeds: { name: string; url: string }[] = [];
      if (typeof window !== "undefined") {
        try { disabledUrls = JSON.parse(localStorage.getItem("nemef_disabled_feeds_v1") ?? "[]"); } catch { /* */ }
        customFeeds = loadCustomFeeds();
      }
      const hasCustom = disabledUrls.length > 0 || customFeeds.length > 0;
      const res = hasCustom
        ? await fetch("/api/news", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ disabledUrls, customFeeds }),
          })
        : await fetch("/api/news", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setFetchedAt(data.fetchedAt ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const c: Record<NewsTopic | "all", number> = { all: items.length, mercados: 0, macro: 0, empresas: 0 };
    for (const it of items) for (const t of it.topics) c[t]++;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (showFavsOnly && !favIds.has(it.id)) return false;
      if (topic !== "all" && !it.topics.includes(topic)) return false;
      if (sourceFilter !== "all" && it.source !== sourceFilter) return false;
      if (q && !(it.title.toLowerCase().includes(q) || it.summary.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [items, topic, query, showFavsOnly, favIds]);

  const sources = useMemo(() => Array.from(new Set(items.map((i) => i.source))).sort(), [items]);

  const trending = useMemo(() => getTrendingKeywords(items), [items]);

  const handleCreatePost = async (caption: string) => {
    const { error } = await supabase.from("posts").insert({
      caption,
      type: "reel",
      status: "draft",
      scheduled_date: null,
    });
    if (!error) {
      toast("Borrador creado en Instagram ✓");
    } else {
      toast("Error al crear el borrador", "error");
    }
  };

  const handleQuePubHoy = async () => {
    const topKeyword = trending.length > 0 ? trending[0].keyword : "finanzas personales";
    setLoadingTodayIdea(true);
    setTodayIdea(null);
    try {
      const res = await fetch("/api/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topKeyword }),
      });
      const data = await res.json();
      if (res.ok && data.ideas?.[0]) {
        setTodayIdea(data.ideas[0]);
      } else {
        toast(data.error ?? "Error al generar idea", "error");
      }
    } catch {
      toast("No se pudo conectar con el servidor", "error");
    } finally {
      setLoadingTodayIdea(false);
    }
  };

  const handleSaveTodayIdea = async () => {
    if (!todayIdea) return;
    setSavingTodayIdea(true);
    const { error } = await supabase.from("posts").insert({
      caption: todayIdea.caption,
      type: "reel",
      status: "draft",
      scheduled_date: null,
    });
    setSavingTodayIdea(false);
    if (!error) {
      toast("Borrador guardado en Instagram ✓");
      setTodayIdea(null);
    } else {
      toast("Error al guardar borrador", "error");
    }
  };

  return (
    <>
      {showFeedManager && (
        <FeedManager
          onClose={() => setShowFeedManager(false)}
          onSave={() => { setShowFeedManager(false); load(); }}
        />
      )}

      <div className="flex items-start justify-between gap-4 mb-8">
        <PageHeader
          title="Noticias"
          description="Últimas noticias de economía y finanzas argentinas — agregadas desde feeds RSS públicos."
        />
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={handleQuePubHoy}
            disabled={loadingTodayIdea || loading}
            className="border-primary/40 text-primary hover:bg-primary/10"
          >
            {loadingTodayIdea ? (
              <Sparkles className="h-4 w-4 animate-pulse mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {loadingTodayIdea ? "Generando…" : "¿Qué publicar hoy?"}
          </Button>
          <Button variant="outline" onClick={() => setShowFeedManager(true)}>
            <Rss className="h-4 w-4 mr-2" />
            Fuentes RSS
          </Button>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Idea del día — inline card */}
      {loadingTodayIdea && (
        <Card className="mb-6 animate-pulse border-primary/20">
          <CardContent className="p-5 space-y-3">
            <div className="h-4 w-1/4 bg-muted rounded" />
            <div className="h-5 w-2/3 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-5/6 bg-muted rounded" />
          </CardContent>
        </Card>
      )}

      {todayIdea && !loadingTodayIdea && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Idea para publicar hoy
              </p>
              <button
                onClick={() => setTodayIdea(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-start gap-2">
              <div className="flex items-center gap-1.5 shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                {(() => {
                  const Icon = FORMAT_ICONS[todayIdea.format] ?? ImageIcon;
                  return <Icon className="h-3 w-3" />;
                })()}
                {todayIdea.format}
              </div>
              <h3 className="font-semibold leading-snug">{todayIdea.hook}</h3>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-4">
              {todayIdea.caption}
            </p>

            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSaveTodayIdea} disabled={savingTodayIdea}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                {savingTodayIdea ? "Guardando…" : "Guardar borrador"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setTodayIdea(null)}>
                Descartar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Artículos" value={String(items.length)} />
        <Stat label="Fuentes" value={String(sources.length)} />
        <Stat label="Mercados" value={String(counts.mercados)} />
        <Stat label="Macro" value={String(counts.macro)} />
      </div>

      {/* Temas calientes esta semana */}
      {trending.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            Temas calientes esta semana
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {trending.map(({ keyword, count }) => (
              <button
                key={keyword}
                onClick={() => setQuery(keyword)}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                  query.toLowerCase() === keyword.toLowerCase()
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-primary/5"
                )}
              >
                <TrendingUp className="h-3 w-3" />
                {keyword}
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">{count}</span>
              </button>
            ))}
            {query && trending.some((t) => t.keyword.toLowerCase() === query.toLowerCase()) && (
              <button
                onClick={() => setQuery("")}
                className="shrink-0 inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar titulares y resúmenes…"
            className="pl-9"
          />
        </div>
        <TopicFilter active={topic} onChange={setTopic} counts={counts} />
        <button
          onClick={() => setShowFavsOnly((v) => !v)}
          className={cn(
            "shrink-0 inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors h-10",
            showFavsOnly
              ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
              : "border-border text-muted-foreground hover:bg-accent"
          )}
        >
          <Bookmark className="h-3.5 w-3.5" />
          Guardadas{favIds.size > 0 && ` (${favIds.size})`}
        </button>
        {sources.length > 1 && (
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary h-10 shrink-0"
          >
            <option value="all">Todas las fuentes</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
      </div>

      {fetchedAt && (
        <p className="text-xs text-muted-foreground mb-4">
          Última actualización: {new Date(fetchedAt).toLocaleString("es-AR")}
          {" · "}{filtered.length} noticias{sourceFilter !== "all" || topic !== "all" || query ? ` (filtradas de ${items.length})` : ""}
        </p>
      )}

      {error && (
        <Card className="border-red-500/40 mb-6">
          <CardContent className="p-4 text-sm text-red-300">Error al cargar noticias: {error}</CardContent>
        </Card>
      )}

      {loading && items.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5 space-y-3">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-5 w-full bg-muted rounded" />
                <div className="h-4 w-5/6 bg-muted rounded" />
                <div className="h-4 w-2/3 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Newspaper className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {items.length === 0 ? "No se encontraron artículos." : "No hay resultados para tu búsqueda."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Artículo destacado */}
          {filtered.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Destacada</p>
              <FeaturedNewsCard item={filtered[0]} onCreatePost={handleCreatePost} />
            </div>
          )}

          {/* Grilla de noticias restantes */}
          {filtered.length > 1 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.slice(1).map((it) => (
                <NewsCard
                  key={it.id}
                  item={it}
                  onCreatePost={handleCreatePost}
                  isFavorite={favIds.has(it.id)}
                  onFavoriteChange={(id, fav) => setFavIds((prev) => {
                    const next = new Set(prev);
                    if (fav) next.add(id); else next.delete(id);
                    return next;
                  })}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold mt-1 tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
