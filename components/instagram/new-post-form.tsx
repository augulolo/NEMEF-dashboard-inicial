"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Plus, X, Sparkles, Hash, RefreshCw, Copy, Check, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  POST_TYPES, POST_STATUSES, TYPE_LABELS, STATUS_LABELS,
  type Post, type PostStatus, type PostType,
} from "@/lib/posts";
import { TemplateSelector } from "./template-selector";
import type { PostTemplate } from "@/lib/post-templates";

export function NewPostForm({ onCreate }: { onCreate: (post: Post) => void }) {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [type, setType] = useState<PostType>("photo");
  const [status, setStatus] = useState<PostStatus>("draft");
  const [scheduledDate, setScheduledDate] = useState("");

  const [showTemplates, setShowTemplates] = useState(false);

  const applyTemplate = (t: PostTemplate) => {
    setCaption(t.caption);
    setType(t.type);
  };

  // Hashtags
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagsLoading, setHashtagsLoading] = useState(false);
  const [hashtagsCopied, setHashtagsCopied] = useState(false);

  const reset = () => {
    setCaption(""); setType("photo"); setStatus("draft");
    setScheduledDate(""); setHashtags([]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) return;
    onCreate({
      id: crypto.randomUUID(),
      caption: caption.trim(),
      type, status,
      scheduledDate: scheduledDate || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    reset();
    setOpen(false);
  };

  const generateHashtags = async () => {
    if (!caption.trim() || hashtagsLoading) return;
    setHashtagsLoading(true);
    try {
      const res = await fetch("/api/generate-hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, type }),
      });
      const json = await res.json();
      if (res.ok) setHashtags(json.hashtags ?? []);
    } finally {
      setHashtagsLoading(false);
    }
  };

  const copyHashtags = () => {
    const text = hashtags.map((h) => `#${h}`).join(" ");
    navigator.clipboard.writeText(text).catch(() => {});
    setHashtagsCopied(true);
    setTimeout(() => setHashtagsCopied(false), 2000);
  };

  const appendHashtags = () => {
    const text = "\n\n" + hashtags.map((h) => `#${h}`).join(" ");
    setCaption((prev) => prev + text);
    setHashtags([]);
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
    <>
    {showTemplates && (
      <TemplateSelector onSelect={applyTemplate} onClose={() => setShowTemplates(false)} />
    )}
    <Card className="border-primary/40">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">Nueva idea de post</CardTitle>
        <div className="flex items-center gap-1">
          <Button
            type="button" variant="ghost" size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            onClick={() => setShowTemplates(true)}
          >
            <LayoutTemplate className="h-3.5 w-3.5" /> Plantillas
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { reset(); setOpen(false); }} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {/* Caption */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Copy / Descripción</label>
              <div className="flex items-center gap-2">
                {caption.length > 125 && caption.length <= 2200 && (
                  <span className="text-[10px] text-amber-400/80">corta en 125</span>
                )}
                <span className={cn(
                  "text-xs tabular-nums font-medium",
                  caption.length > 2200 ? "text-red-400" : caption.length > 1980 ? "text-amber-400" : "text-muted-foreground"
                )}>
                  {caption.length}/2200
                </span>
              </div>
            </div>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="¿De qué trata este post?"
              required
              rows={4}
              className={caption.length > 2200 ? "border-red-500/60" : ""}
            />
          </div>

          {/* Selects */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tipo</label>
              <Select value={type} onChange={(e) => setType(e.target.value as PostType)}>
                {POST_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Estado</label>
              <Select value={status} onChange={(e) => setStatus(e.target.value as PostStatus)}>
                {POST_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Fecha programada</label>
              <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
            </div>
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Hash className="h-3 w-3" /> Hashtags
              </label>
              <button
                type="button"
                onClick={generateHashtags}
                disabled={!caption.trim() || hashtagsLoading}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs rounded-md border px-2.5 py-1 font-medium transition-colors",
                  !caption.trim() || hashtagsLoading
                    ? "border-border text-muted-foreground cursor-not-allowed opacity-60"
                    : "border-primary/50 text-primary hover:bg-primary/10"
                )}
              >
                {hashtagsLoading
                  ? <><RefreshCw className="h-3 w-3 animate-spin" /> Generando…</>
                  : <><Sparkles className="h-3 w-3" /> Generar con IA</>}
              </button>
            </div>

            {hashtags.length > 0 && (
              <div className="rounded-lg border bg-background/40 p-3 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {hashtags.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHashtags((prev) => prev.filter((x) => x !== h))}
                      className="inline-flex items-center gap-0.5 text-xs rounded-full border border-primary/30 bg-primary/10 text-primary px-2 py-0.5 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      title="Clic para eliminar"
                    >
                      #{h} <X className="h-2.5 w-2.5" />
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1 border-t">
                  <button
                    type="button"
                    onClick={copyHashtags}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {hashtagsCopied ? <><Check className="h-3 w-3 text-emerald-400" /> Copiados</> : <><Copy className="h-3 w-3" /> Copiar</>}
                  </button>
                  <span className="text-muted-foreground">·</span>
                  <button
                    type="button"
                    onClick={appendHashtags}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Agregar al caption
                  </button>
                  <span className="text-muted-foreground">·</span>
                  <button
                    type="button"
                    onClick={generateHashtags}
                    disabled={hashtagsLoading}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={cn("h-3 w-3", hashtagsLoading && "animate-spin")} /> Regenerar
                  </button>
                  <span className="text-muted-foreground ml-auto text-[10px]">{hashtags.length} hashtags</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { reset(); setOpen(false); }}>Cancelar</Button>
            <Button type="submit">Crear post</Button>
          </div>
        </form>
      </CardContent>
    </Card>
    </>
  );
}
