"use client";

import { useState, useRef } from "react";
import { PostCard } from "./post-card";
import { Badge } from "@/components/ui/badge";
import type { Post, PostStatus } from "@/lib/posts";
import { STATUS_LABELS } from "@/lib/posts";
import { cn } from "@/lib/utils";

export function PostColumn({
  status,
  posts,
  onDelete,
  onEdit,
  onDuplicate,
  onDrop,
  selecting,
  selected,
  onToggleSelect,
}: {
  status: PostStatus;
  posts: Post[];
  onDelete: (id: string) => void;
  onEdit: (updated: Post) => void;
  onDuplicate?: (post: Post) => void;
  onDrop?: (postId: string, targetStatus: PostStatus) => void;
  selecting?: boolean;
  selected?: Set<string>;
  onToggleSelect?: (id: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setDragOver(true);
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOver(false);
    const postId = e.dataTransfer.getData("text/plain");
    if (postId && onDrop) onDrop(postId, status);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 min-w-0 rounded-lg transition-colors",
        dragOver && "ring-2 ring-primary/40 bg-primary/5"
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur py-2 z-10">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          {STATUS_LABELS[status]}
        </h2>
        <Badge variant={status}>{posts.length}</Badge>
      </div>
      <div className="flex flex-col gap-3">
        {posts.length === 0 ? (
          <div className={cn(
            "rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground transition-colors",
            dragOver && "border-primary/50 text-primary/60"
          )}>
            {dragOver ? "Soltar acá" : "Todavía no hay nada acá"}
          </div>
        ) : (
          posts.map((p) => (
            <div key={p.id} className="relative">
              {selecting && (
                <button
                  onClick={() => onToggleSelect?.(p.id)}
                  className={cn(
                    "absolute top-2 left-2 z-10 h-5 w-5 rounded border-2 transition-colors flex items-center justify-center",
                    selected?.has(p.id)
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-card border-border hover:border-primary"
                  )}
                >
                  {selected?.has(p.id) && <span className="text-[10px] font-bold">✓</span>}
                </button>
              )}
              <DraggablePostCard
                post={p}
                onDelete={onDelete}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                dimmed={selecting && !selected?.has(p.id)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DraggablePostCard({
  post,
  onDelete,
  onEdit,
  onDuplicate,
  dimmed,
}: {
  post: Post;
  onDelete: (id: string) => void;
  onEdit: (updated: Post) => void;
  onDuplicate?: (post: Post) => void;
  dimmed?: boolean;
}) {
  const [dragging, setDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", post.id);
    e.dataTransfer.effectAllowed = "move";
    setDragging(true);
  };

  const handleDragEnd = () => setDragging(false);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        "cursor-grab active:cursor-grabbing transition-opacity",
        dragging && "opacity-40",
        dimmed && "opacity-40 pointer-events-none"
      )}
    >
      <PostCard
        post={post}
        onDelete={onDelete}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
      />
    </div>
  );
}
