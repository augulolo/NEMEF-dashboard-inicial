"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Plus, X, Sparkles, Hash, RefreshCw, Copy, Check, LayoutTemplate, ChevronDown, ChevronUp } from "lucide-react";
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

  // AI caption generator
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiIdeas, setAiIdeas] = useState<{ hook: string; format: string; caption: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const generateAiIdeas = async () => {
    if (!aiTopic.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError("");
    setAiIdeas([]);
    try {
      const res = await fetch("/api/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.ideas?.length) {
        setAiIdeas(json.ideas);
      } else {
        setAiError(json.error ?? "No se pudo generar ideas");
      }
    } catch {
      setAiError("Error de conexión");
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiIdea = (idea: { hook: string; format: string; caption: string }) => {
    setCaption(idea.caption);
    const fmt = idea.format.toLowerCase();
    if (fmt.includes("reel")) setType("reel");
    else if (fmt.includes("carr")) setType("carousel");
    else if (fmt.includes("hist")) setType("story");
    else setType("photo");
    setShowAiPanel(false);
    setAiIdeas([]);
    setAiTopic("");
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
                <button
                  type="button"
                  onClick={() => { setShowAiPanel((v) => !v); setAiIdeas([]); setAiError(""); }}
                  className={cn(
                    "inline-flex items-center gap-1 text-xs rounded-md border px-2 py-0.5 font-medium transition-colors",
                    showAiPanel
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-primary/40 text-primary hover:bg-primary/10"
                  )}
                >
                  <Sparkles className="h-3 w-3" />
                  IA
                  {showAiPanel ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>
            </div>

            {/* AI generator panel */}
            {showAiPanel && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                <p className="text-[11px] text-muted-foreground font-medium">Generá ideas con IA — escribí un tema y elegí la que más te guste</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), generateAiIdeas())}
                    placeholder="Ej: inflación, plazo fijo, inversión en dólares…"
                    className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={generateAiIdeas}
                    disabled={!aiTopic.trim() || aiLoading}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs rounded-md border px-3 py-1.5 font-medium transition-colors shrink-0",
                      !aiTopic.trim() || aiLoading
                        ? "border-border text-muted-foreground cursor-not-allowed opacity-60"
                        : "border-primary/50 text-primary hover:bg-primary/10"
                    )}
                  >
                    {aiLoading
                      ? <><RefreshCw className="h-3 w-3 animate-spin" /> Generando…</>
                      : <><Sparkles className="h-3 w-3" /> Generar</>}
                  </button>
                </div>
                {aiError && <p className="text-xs text-red-400">{aiError}</p>}
                {aiIdeas.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {aiIdeas.map((idea, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applyAiIdea(idea)}
                        className="w-full text-left rounded-lg border border-border hover:border-primary/50 bg-card hover:bg-primary/5 p-3 transition-colors space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold rounded-full border border-border px-1.5 py-0.5 text-muted-foreground shrink-0">{idea.format}</span>
                          <p className="text-xs font-semibold text-foreground leading-snug line-clamp-1">{idea.hook}</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{idea.caption}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

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
