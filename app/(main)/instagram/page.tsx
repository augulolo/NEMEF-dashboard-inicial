"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { NewPostForm } from "@/components/instagram/new-post-form";
import { PostColumn } from "@/components/instagram/post-column";
import { PostList } from "@/components/instagram/post-list";
import { Calendar, FileText, CheckCircle2, Inbox, AlertCircle, Search, X, LayoutGrid, List } from "lucide-react";
import { POST_STATUSES, POST_TYPES, TYPE_LABELS, SEED_POSTS, type Post, type PostStatus, type PostType } from "@/lib/posts";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

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
    return posts.filter((p) =>
      (typeFilter === "all" || p.type === typeFilter) &&
      (!q || p.caption.toLowerCase().includes(q))
    );
  }, [posts, typeFilter, search]);

  const grouped = useMemo(() => {
    const g: Record<PostStatus, Post[]> = { scheduled: [], draft: [], published: [], backlog: [] };
    for (const p of filteredPosts) g[p.status].push(p);
    g.scheduled.sort((a, b) => (a.scheduledDate ?? "").localeCompare(b.scheduledDate ?? ""));
    g.published.sort((a, b) => (b.scheduledDate ?? "").localeCompare(a.scheduledDate ?? ""));
    return g;
  }, [filteredPosts]);

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

        {/* Toggle vista */}
        <div className="flex items-center gap-1 rounded-md border p-1 shrink-0">
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

      <div className="mb-6">
        <NewPostForm onCreate={handleCreate} />
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Cargando posts…</div>
      ) : view === "kanban" ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          {POST_STATUSES.map((status) => (
            <PostColumn key={status} status={status} posts={grouped[status]} onDelete={handleDelete} onEdit={handleEdit} />
          ))}
        </div>
      ) : (
        <PostList posts={filteredPosts} onDelete={handleDelete} onEdit={handleEdit} />
      )}
    </>
  );
}
