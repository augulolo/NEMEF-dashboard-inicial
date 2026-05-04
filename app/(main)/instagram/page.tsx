"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { NewPostForm } from "@/components/instagram/new-post-form";
import { PostColumn } from "@/components/instagram/post-column";
import { PostList } from "@/components/instagram/post-list";
import { Calendar, FileText, CheckCircle2, Inbox, AlertCircle, Search, X, LayoutGrid, List, Download, CheckSquare, Trash2, ChevronDown, Instagram, Sparkles } from "lucide-react";
import { POST_STATUSES, POST_TYPES, TYPE_LABELS, STATUS_LABELS, SEED_POSTS, type Post, type PostStatus, type PostType } from "@/lib/posts";

import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { getAllUniqueTags, loadAllTags } from "@/lib/tags";
import { Tag } from "lucide-react";

const stats: { status: PostStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { status: "scheduled", label: "Programados", icon: Calendar },
  { status: "draft", label: "Borradores", icon: FileText },
  { status: "published", label: "Publicados", icon: CheckCircle2 },
  { status: "backlog", label: "Ideas", icon: Inbox },
];

// Mapeo snake_case (DB) → camelCase (app)
function fromDB(row: Record<string, unknown>): Post {
  return {
    id: row.id as string,
    caption: row.caption as string,
    type: row.type as Post["type"],
    status: row.status as PostStatus,
    scheduledDate: (row.scheduled_date as string) ?? undefined,
    createdAt: (row.created_at as string).slice(0, 10),
  };
}

export default function InstagramPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<PostType | "all">("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<PostStatus | "">("");
  const [activeTagFilters, setActiveTagFilters] = useState<Set<string>>(new Set());
  const [allTags, setAllTags] = useState<string[]>(() => getAllUniqueTags());

  // Carga inicial desde Supabase
  useEffect(() => {
    supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          // Fallback a seeds si hay error de conexión
          setPosts(SEED_POSTS);
        } else if (data && data.length > 0) {
          setPosts(data.map(fromDB));
        } else {
          // Primera vez: cargar seeds en la DB
          const seedRows = SEED_POSTS.map((p) => ({
            caption: p.caption,
            type: p.type,
            status: p.status,
            scheduled_date: p.scheduledDate ?? null,
          }));
          supabase
            .from("posts")
            .insert(seedRows)
            .then(() => setPosts(SEED_POSTS));
        }
        setLoading(false);
      });
  }, []);

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const tagMap = loadAllTags();
    return posts.filter((p) => {
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (q && !p.caption.toLowerCase().includes(q)) return false;
      if (activeTagFilters.size > 0) {
        const postTags = tagMap[p.id] ?? [];
        for (const requiredTag of activeTagFilters) {
          if (!postTags.includes(requiredTag)) return false;
        }
      }
      return true;
    });
  }, [posts, typeFilter, search, activeTagFilters]);

  const grouped = useMemo(() => {
    const g: Record<PostStatus, Post[]> = { scheduled: [], draft: [], published: [], backlog: [] };
    for (const p of filteredPosts) g[p.status].push(p);
    g.scheduled.sort((a, b) => (a.scheduledDate ?? "").localeCompare(b.scheduledDate ?? ""));
    g.published.sort((a, b) => (b.scheduledDate ?? "").localeCompare(a.scheduledDate ?? ""));
    return g;
  }, [filteredPosts]);

  const refreshAllTags = () => setAllTags(getAllUniqueTags());

  const handleCreate = async (post: Post) => {
    const { data, error } = await supabase
      .from("posts")
      .insert({
        caption: post.caption,
        type: post.type,
        status: post.status,
        scheduled_date: post.scheduledDate ?? null,
      })
      .select()
      .single();
    if (!error && data) {
      setPosts((prev) => [fromDB(data), ...prev]);
      refreshAllTags();
      toast("Post creado");
    } else if (error) {
      toast("Error al crear el post", "error");
    }
  };

  const handleEdit = async (updated: Post) => {
    const { error } = await supabase
      .from("posts")
      .update({
        caption: updated.caption,
        type: updated.type,
        status: updated.status,
        scheduled_date: updated.scheduledDate ?? null,
      })
      .eq("id", updated.id);
    if (!error) {
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      refreshAllTags();
      toast("Post actualizado");
    } else {
      toast("Error al guardar cambios", "error");
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (!error) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast("Post eliminado");
    } else {
      toast("Error al eliminar el post", "error");
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!selected.size || !confirm(`¿Eliminar ${selected.size} posts? Esta acción no se puede deshacer.`)) return;
    const ids = [...selected];
    await Promise.all(ids.map((id) => supabase.from("posts").delete().eq("id", id)));
    setPosts((prev) => prev.filter((p) => !ids.includes(p.id)));
    setSelected(new Set());
    toast(`${ids.length} posts eliminados`);
  };

  const handleBulkStatus = async (newStatus: PostStatus) => {
    if (!selected.size) return;
    const ids = [...selected];
    await Promise.all(ids.map((id) => supabase.from("posts").update({ status: newStatus }).eq("id", id)));
    setPosts((prev) => prev.map((p) => ids.includes(p.id) ? { ...p, status: newStatus } : p));
    setSelected(new Set());
    setBulkStatus("");
    toast(`${ids.length} posts actualizados`);
  };

  const handleDrop = async (postId: string, targetStatus: PostStatus) => {
    const post = posts.find((p) => p.id === postId);
    if (!post || post.status === targetStatus) return;
    await handleEdit({ ...post, status: targetStatus });
  };

  const handleDuplicate = async (post: Post) => {
    const { data, error } = await supabase
      .from("posts")
      .insert({
        caption: post.caption,
        type: post.type,
        status: "draft",
        scheduled_date: null,
      })
      .select()
      .single();
    if (!error && data) {
      setPosts((prev) => [fromDB(data), ...prev]);
      toast("Post duplicado como borrador");
    } else {
      toast("Error al duplicar el post", "error");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Estado", "Tipo", "Caption", "Fecha programada", "Creado"];
    const { STATUS_LABELS: SL, TYPE_LABELS: TL } = { STATUS_LABELS: { scheduled: "Programado", draft: "Borrador", published: "Publicado", backlog: "Idea" }, TYPE_LABELS: { reel: "Reel", carousel: "Carrusel", photo: "Foto", story: "Historia" } };
    const rows = filteredPosts.map((p) => [
      SL[p.status] ?? p.status,
      TL[p.type as keyof typeof TL] ?? p.type,
      `"${(p.caption ?? "").replace(/"/g, '""')}"`,
      p.scheduledDate ?? "",
      p.createdAt ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nemef-posts-${new Date().toLocaleDateString("en-CA")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const TODAY = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
  const overdue = posts.filter(
    (p) => p.status === "scheduled" && p.scheduledDate && p.scheduledDate < TODAY
  );

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-8">
        <PageHeader
          title="Gestor de Instagram"
          description="Planificá, redactá y programá tu contenido financiero."
        />
      </div>

      {!loading && overdue.length > 0 && (
        <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-300">
              {overdue.length} post{overdue.length > 1 ? "s" : ""} programado{overdue.length > 1 ? "s" : ""} sin publicar
            </p>
            <div className="mt-2 space-y-1">
              {overdue.map((p) => (
                <p key={p.id} className="text-xs text-amber-300/80 truncate">
                  · {new Date(p.scheduledDate! + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                  {" — "}{p.caption.slice(0, 60)}{p.caption.length > 60 ? "…" : ""}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {stats.map(({ status, label, icon: Icon }) => (
          <Card key={status}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-semibold mt-1">
                  {loading ? "—" : grouped[status].length}
                </p>
              </div>
              <Icon className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Buscador */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar en captions…"
          className="w-full rounded-md border bg-background pl-9 pr-8 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Formato:</span>
        <button
          onClick={() => setTypeFilter("all")}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            typeFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"
          )}
        >
          Todos ({posts.length})
        </button>
        {POST_TYPES.map((t) => {
          const count = posts.filter((p) => p.type === t).length;
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                typeFilter === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              {TYPE_LABELS[t]} ({count})
            </button>
          );
        })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Modo selección */}
          <button
            onClick={() => { setSelecting((v) => !v); setSelected(new Set()); }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              selecting ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent"
            )}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            {selecting ? `Seleccionando (${selected.size})` : "Seleccionar"}
          </button>
          {/* Exportar CSV */}
          <button
            onClick={handleExportCSV}
            disabled={filteredPosts.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Exportar posts como CSV"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>

          {/* Toggle vista */}
          <div className="flex items-center gap-1 rounded-md border p-1">
            <button
              onClick={() => setView("kanban")}
              className={cn("p-1.5 rounded transition-colors", view === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              title="Vista Kanban"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("p-1.5 rounded transition-colors", view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              title="Vista Lista"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tag filter row */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Tag className="h-3 w-3" /> Etiquetas:
          </span>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() =>
                setActiveTagFilters((prev) => {
                  const next = new Set(prev);
                  if (next.has(tag)) next.delete(tag); else next.add(tag);
                  return next;
                })
              }
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                activeTagFilters.has(tag)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              {tag}
            </button>
          ))}
          {activeTagFilters.size > 0 && (
            <button
              onClick={() => setActiveTagFilters(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {selecting && selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <span className="text-sm font-medium">{selected.size} seleccionados</span>
          <span className="text-muted-foreground">·</span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Mover a:</span>
            {(["scheduled", "draft", "published", "backlog"] as PostStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => handleBulkStatus(s)}
                className="text-xs rounded-md border border-border px-2.5 py-1 hover:bg-accent transition-colors capitalize"
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <button
            onClick={handleBulkDelete}
            className="ml-auto flex items-center gap-1.5 text-xs text-red-400 border border-red-500/30 rounded-md px-2.5 py-1 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </button>
        </div>
      )}

      <div className="mb-6">
        <NewPostForm onCreate={handleCreate} />
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Cargando posts…</div>
      ) : !loading && posts.length === 0 ? (
        /* ── Empty state de bienvenida ── */
        <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-violet-500/20 border border-pink-500/30 flex items-center justify-center">
            <Instagram className="h-8 w-8 text-pink-400" />
          </div>
          <div className="max-w-sm">
            <h2 className="text-lg font-semibold">Todavía no hay posts</h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              Empezá a construir tu calendario de contenido. Creá tu primer post y organizalo en el kanban.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <span className="text-base leading-none">+</span>
              Crear primer post
            </button>
            <a
              href="/ideas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent transition-colors"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              Buscar ideas con IA
            </a>
          </div>
          <p className="text-[11px] text-muted-foreground/60">
            Tip: usá el botón <strong>+</strong> de arriba o la columna <em>Backlog</em> para empezar.
          </p>
        </div>
      ) : view === "kanban" ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          {POST_STATUSES.map((status) => (
            <PostColumn
              key={status}
              status={status}
              posts={grouped[status]}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDrop={handleDrop}
              selecting={selecting}
              selected={selected}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      ) : (
        <PostList posts={filteredPosts} onDelete={handleDelete} onEdit={handleEdit} onDuplicate={handleDuplicate} />
      )}
    </>
  );
}
