"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import {
  POST_TYPES,
  POST_STATUSES,
  TYPE_LABELS,
  STATUS_LABELS,
  type Post,
  type PostStatus,
  type PostType,
} from "@/lib/posts";

export function NewPostForm({ onCreate }: { onCreate: (post: Post) => void }) {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [type, setType] = useState<PostType>("photo");
  const [status, setStatus] = useState<PostStatus>("draft");
  const [scheduledDate, setScheduledDate] = useState("");

  const reset = () => {
    setCaption("");
    setType("photo");
    setStatus("draft");
    setScheduledDate("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) return;
    onCreate({
      id: crypto.randomUUID(),
      caption: caption.trim(),
      type,
      status,
      scheduledDate: scheduledDate || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    reset();
    setOpen(false);
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Nueva idea
      </Button>
    );
  }

  return (
    <Card className="border-primary/40">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">Nueva idea de post</CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Cerrar">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Copy / Descripción</label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="¿De qué trata este post?"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tipo</label>
              <Select value={type} onChange={(e) => setType(e.target.value as PostType)}>
                {POST_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Estado</label>
              <Select value={status} onChange={(e) => setStatus(e.target.value as PostStatus)}>
                {POST_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Fecha programada</label>
              <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Crear post</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
