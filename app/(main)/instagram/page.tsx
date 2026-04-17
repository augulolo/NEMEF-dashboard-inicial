"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { NewPostForm } from "@/components/instagram/new-post-form";
import { PostColumn } from "@/components/instagram/post-column";
import { Calendar, FileText, CheckCircle2, Inbox } from "lucide-react";
import { POST_STATUSES, SEED_POSTS, type Post, type PostStatus } from "@/lib/posts";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";

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

  const grouped = useMemo(() => {
    const g: Record<PostStatus, Post[]> = { scheduled: [], draft: [], published: [], backlog: [] };
    for (const p of posts) g[p.status].push(p);
    g.scheduled.sort((a, b) => (a.scheduledDate ?? "").localeCompare(b.scheduledDate ?? ""));
    g.published.sort((a, b) => (b.scheduledDate ?? "").localeCompare(a.scheduledDate ?? ""));
    return g;
  }, [posts]);

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

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-8">
        <PageHeader
          title="Gestor de Instagram"
          description="Planificá, redactá y programá tu contenido financiero."
        />
      </div>

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

      <div className="mb-6">
        <NewPostForm onCreate={handleCreate} />
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Cargando posts…</div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          {POST_STATUSES.map((status) => (
            <PostColumn key={status} status={status} posts={grouped[status]} onDelete={handleDelete} onEdit={handleEdit} />
          ))}
        </div>
      )}
    </>
  );
}
