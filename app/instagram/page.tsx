"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { NewPostForm } from "@/components/instagram/new-post-form";
import { PostColumn } from "@/components/instagram/post-column";
import { Calendar, FileText, CheckCircle2, Inbox } from "lucide-react";
import { POST_STATUSES, SEED_POSTS, type Post, type PostStatus } from "@/lib/posts";
import { useLocalStorage } from "@/hooks/use-local-storage";

const stats: { status: PostStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { status: "scheduled", label: "Programados", icon: Calendar },
  { status: "draft", label: "Borradores", icon: FileText },
  { status: "published", label: "Publicados", icon: CheckCircle2 },
  { status: "backlog", label: "Ideas", icon: Inbox },
];

export default function InstagramPage() {
  const [posts, setPosts] = useLocalStorage<Post[]>("nemef.posts", SEED_POSTS);

  const grouped = useMemo(() => {
    const g: Record<PostStatus, Post[]> = { scheduled: [], draft: [], published: [], backlog: [] };
    for (const p of posts) g[p.status].push(p);
    g.scheduled.sort((a, b) => (a.scheduledDate ?? "").localeCompare(b.scheduledDate ?? ""));
    g.published.sort((a, b) => (b.scheduledDate ?? "").localeCompare(a.scheduledDate ?? ""));
    return g;
  }, [posts]);

  const handleCreate = (post: Post) => setPosts((prev) => [post, ...prev]);
  const handleDelete = (id: string) => setPosts((prev) => prev.filter((p) => p.id !== id));

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
                <p className="text-2xl font-semibold mt-1">{grouped[status].length}</p>
              </div>
              <Icon className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6">
        <NewPostForm onCreate={handleCreate} />
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {POST_STATUSES.map((status) => (
          <PostColumn key={status} status={status} posts={grouped[status]} onDelete={handleDelete} />
        ))}
      </div>
    </>
  );
}
