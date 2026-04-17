"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Image as ImageIcon, Film, Circle, Layers, Calendar, Trash2, Pencil, Check, X } from "lucide-react";
import type { Post, PostType, PostStatus } from "@/lib/posts";
import { TYPE_LABELS, STATUS_LABELS, POST_TYPES, POST_STATUSES } from "@/lib/posts";

const typeIcon = {
  photo: ImageIcon,
  reel: Film,
  story: Circle,
  carousel: Layers,
};

export function PostCard({
  post,
  onDelete,
  onEdit,
}: {
  post: Post;
  onDelete: (id: string) => void;
  onEdit: (updated: Post) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(post.caption);
  const [type, setType] = useState<PostType>(post.type);
  const [status, setStatus] = useState<PostStatus>(post.status);
  const [scheduledDate, setScheduledDate] = useState(post.scheduledDate ?? "");

  const handleSave = () => {
    onEdit({ ...post, caption, type, status, scheduledDate: scheduledDate || undefined });
    setEditing(false);
  };

  const handleCancel = () => {
    setCaption(post.caption);
    setType(post.type);
    setStatus(post.status);
    setScheduledDate(post.scheduledDate ?? "");
    setEditing(false);
  };

  const Icon = typeIcon[post.type];

  if (editing) {
    return (
      <Card className="border-primary/50">
        <CardContent className="p-4 space-y-3">
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="text-sm resize-none"
            rows={3}
            autoFocus
          />
          <div className="grid grid-cols-2 gap-2">
            <Select value={type} onChange={(e) => setType(e.target.value as PostType)}>
              {POST_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value as PostStatus)}>
              {POST_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </Select>
          </div>
          <Input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="text-xs"
          />
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSave} className="flex-1">
              <Check className="h-3.5 w-3.5 mr-1" /> Guardar
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1">
              <X className="h-3.5 w-3.5 mr-1" /> Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:border-primary/50 transition-colors">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
            <span>{TYPE_LABELS[post.type]}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setEditing(true)}
              aria-label="Editar post"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:text-red-400"
              onClick={() => onDelete(post.id)}
              aria-label="Eliminar post"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <p className="text-sm leading-relaxed line-clamp-4">{post.caption}</p>
        <div className="flex items-center justify-between pt-2 border-t">
          {post.scheduledDate ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(post.scheduledDate + "T12:00:00").toLocaleDateString("es-AR", {
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
