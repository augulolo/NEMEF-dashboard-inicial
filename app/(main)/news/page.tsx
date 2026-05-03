"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { NewsCard } from "@/components/news/news-card";
import { TopicFilter } from "@/components/news/topic-filter";
import { CaptionDialog } from "@/components/news/caption-dialog";
import { RefreshCw, Search, Newspaper, ExternalLink, Sparkles } from "lucide-react";
import { type NewsItem, type NewsTopic, TOPIC_LABELS, TOPIC_STYLES } from "@/lib/news";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";

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

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [topic, setTopic] = useState<NewsTopic | "all">("all");
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/news", { cache: "no-store" });
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
      if (topic !== "all" && !it.topics.includes(topic)) return false;
      if (q && !(it.title.toLowerCase().includes(q) || it.summary.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [items, topic, query]);

  const sources = useMemo(() => Array.from(new Set(items.map((i) => i.source))).sort(), [items]);

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

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-8">
        <PageHeader
          title="Noticias"
          description="Últimas noticias de economía y finanzas argentinas — agregadas desde feeds RSS públicos."
        />
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Artículos" value={String(items.length)} />
        <Stat label="Fuentes" value={String(sources.length)} />
        <Stat label="Mercados" value={String(counts.mercados)} />
        <Stat label="Macro" value={String(counts.macro)} />
      </div>

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
      </div>

      {fetchedAt && (
        <p className="text-xs text-muted-foreground mb-4">
          Última actualización: {new Date(fetchedAt).toLocaleString("es-AR")}
          {sources.length > 0 && <> · Fuentes: {sources.join(", ")}</>}
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
                <NewsCard key={it.id} item={it} onCreatePost={handleCreatePost} />
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
