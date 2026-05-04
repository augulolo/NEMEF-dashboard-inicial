"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, FileText, StickyNote, BookOpen, Instagram, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface SearchResult {
  id: string;
  type: "post" | "nota" | "proyecto" | "capitulo";
  title: string;
  subtitle?: string;
  href: string;
}

const TYPE_ICONS = {
  post: Instagram,
  nota: StickyNote,
  proyecto: BookOpen,
  capitulo: FileText,
};

const TYPE_LABELS = {
  post: "Post",
  nota: "Nota",
  proyecto: "Proyecto",
  capitulo: "Capítulo",
};

function loadLocalResults(query: string): SearchResult[] {
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  // Notas (localStorage)
  try {
    const notes: { id: string; content: string }[] = JSON.parse(localStorage.getItem("nemef_notes") ?? "[]");
    for (const n of notes) {
      if (n.content.toLowerCase().includes(q)) {
        results.push({
          id: n.id,
          type: "nota",
          title: n.content.slice(0, 60) + (n.content.length > 60 ? "…" : ""),
          href: "/notas",
        });
      }
    }
  } catch { /* ignore */ }

  // Proyectos y capítulos (localStorage)
  try {
    const projects: {
      id: string;
      title: string;
      topic: string;
      chapters: { id: string; title: string; summary: string }[];
    }[] = JSON.parse(localStorage.getItem("nemef_projects_v1") ?? "[]");

    for (const p of projects) {
      if (p.title.toLowerCase().includes(q) || p.topic.toLowerCase().includes(q)) {
        results.push({
          id: p.id,
          type: "proyecto",
          title: p.title,
          subtitle: p.topic,
          href: `/projects/${p.id}`,
        });
      }
      for (const ch of p.chapters ?? []) {
        if (ch.title.toLowerCase().includes(q) || ch.summary?.toLowerCase().includes(q)) {
          results.push({
            id: ch.id,
            type: "capitulo",
            title: ch.title || "Sin título",
            subtitle: p.title,
            href: `/projects/${p.id}`,
          });
        }
      }
    }
  } catch { /* ignore */ }

  return results;
}

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      // Posts de Supabase
      const { data: posts } = await supabase
        .from("posts")
        .select("id, caption, type, status")
        .ilike("caption", `%${q}%`)
        .limit(5);

      const postResults: SearchResult[] = (posts ?? []).map((p) => ({
        id: p.id,
        type: "post" as const,
        title: (p.caption as string).slice(0, 70) + ((p.caption as string).length > 70 ? "…" : ""),
        subtitle: `${p.type} · ${p.status}`,
        href: "/instagram",
      }));

      const localResults = loadLocalResults(q);
      setResults([...postResults, ...localResults].slice(0, 10));
      setSelected(0);
    } catch {
      setResults(loadLocalResults(q).slice(0, 10));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.href);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[selected]) handleSelect(results[selected]);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[15vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-xl border bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          {loading ? (
            <Loader2 className="h-4 w-4 text-muted-foreground shrink-0 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar posts, notas, proyectos…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] text-muted-foreground border rounded px-1.5 py-0.5">
            Esc
          </kbd>
        </div>

        {/* Resultados */}
        {results.length > 0 ? (
          <ul className="py-2 max-h-[50vh] overflow-y-auto">
            {results.map((r, i) => {
              const Icon = TYPE_ICONS[r.type];
              return (
                <li key={r.id + r.type}>
                  <button
                    onClick={() => handleSelect(r)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      i === selected ? "bg-accent" : "hover:bg-accent/50"
                    )}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{r.title}</p>
                      {r.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground border rounded px-1.5 py-0.5 shrink-0">
                      {TYPE_LABELS[r.type]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : query && !loading ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No se encontraron resultados para &ldquo;{query}&rdquo;
          </div>
        ) : !query ? (
          <div className="px-4 py-6 text-center text-xs text-muted-foreground">
            Buscá en posts, notas y proyectos · ↑↓ para navegar · Enter para abrir
          </div>
        ) : null}
      </div>
    </div>
  );
}
