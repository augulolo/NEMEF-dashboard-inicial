"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { NewsCard } from "@/components/news/news-card";
import { TopicFilter } from "@/components/news/topic-filter";
import { RefreshCw, Search, Newspaper } from "lucide-react";
import { type NewsItem, type NewsTopic } from "@/lib/news";

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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((it) => (
            <NewsCard key={it.id} item={it} />
          ))}
        </div>
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
