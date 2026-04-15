"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Film, Circle, Layers, Calendar, Trash2 } from "lucide-react";
import type { Post } from "@/lib/posts";
import { TYPE_LABELS, STATUS_LABELS } from "@/lib/posts";

const typeIcon = {
  photo: ImageIcon,
  reel: Film,
  story: Circle,
  carousel: Layers,
};

export function PostCard({ post, onDelete }: { post: Post; onDelete: (id: string) => void }) {
  const Icon = typeIcon[post.type];
  return (
    <Card className="group hover:border-primary/50 transition-colors">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
            <span>{TYPE_LABELS[post.type]}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete(post.id)}
            aria-label="Eliminar post"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-sm leading-relaxed line-clamp-4">{post.caption}</p>
        <div className="flex items-center justify-between pt-2 border-t">
          {post.scheduledDate ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(post.scheduledDate).toLocaleDateString("es-AR", {
                month: "short",
                day: "numeric",
              })}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Sin fecha</span>
          )}
          <Badge variant={post.status}>{STATUS_LABELS[post.status]}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
