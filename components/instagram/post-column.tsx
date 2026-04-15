"use client";

import { PostCard } from "./post-card";
import { Badge } from "@/components/ui/badge";
import type { Post, PostStatus } from "@/lib/posts";
import { STATUS_LABELS } from "@/lib/posts";

export function PostColumn({
  status,
  posts,
  onDelete,
}: {
  status: PostStatus;
  posts: Post[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur py-2 z-10">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          {STATUS_LABELS[status]}
        </h2>
        <Badge variant={status}>{posts.length}</Badge>
      </div>
      <div className="flex flex-col gap-3">
        {posts.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
            Todavía no hay nada acá
          </div>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} onDelete={onDelete} />)
        )}
      </div>
    </div>
  );
}
