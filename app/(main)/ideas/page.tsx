"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Copy, Check, Film, Layers, Image as ImageIcon, Circle, ArrowRight,
  BookOpen, Lightbulb, Hash, Tag, Calendar, BarChart2, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import type { PostType } from "@/lib/posts";

type Idea = {
  hook: string;
  format: string;
  caption: string;
};

type BriefResult = {
  topic: string;
  angle: string;
  format: string;
  hooks: string[];
  keyPoints: string[];
  caption: string;
  hashtags: string[];
  cta: string;
  bestDay: string;
  difficulty: string;
  estimatedReach: string;
};

const FORMAT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Reel: Film,
  Carrusel: Layers,
  Post: ImageIcon,
  Historia: Circle,
};

const FORMAT_TO_TYPE: Record<string, PostType> = {
  Reel: "reel",
  Carrusel: "carousel",
  Post: "photo",
  Historia: "story",
};

const SUGGESTED_TOPICS = [
  "dólar MEP", "plazo fijo", "CEDEARs", "inflación", "presupuesto personal",
  "fondo de emergencia", "bitcoin", "jubilación", "acciones argentinas", "FCI",
];

const DIFFICULTY_COLORS: Record<string, string> = {
  "fácil": "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
  "media": "text-amber-400 border-amber-400/40 bg-amber-400/10",
  "difícil": "text-red-400 border-red-400/40 bg-red-400/10",
};

const REACH_COLORS: Record<string, string> = {
  "bajo": "text-slate-400 border-slate-400/40 bg-slate-400/10",
  "medio": "text-blue-400 border-blue-400/40 bg-blue-400/10",
  "alto": "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
};

export default function IdeasPage() {
  const [mode, setMode] = useState<"ideas" | "brief">("ideas");
  const [topic, setTopic] = useState("");

  // Ideas rápidas state
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

  // Brief completo state
  const [brief, setBrief] = useState<BriefResult | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [briefCaptionValue, setBriefCaptionValue] = useState("");
  const [copiedHook, setCopiedHook] = useState<number | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [activeHashtags, setActiveHashtags] = useState<string[]>([]);
  const [savingBrief, setSavingBrief] = useState(false);

  const generate = async (t?: string) => {
    const q = (t ?? topic).trim();
    if (!q) return;
    setTopic(q);
    setLoading(true);
    setError(null);
    setIdeas([]);

    try {
      const res = await fetch("/api/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: q }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Error al generar ideas");
      else setIdeas(data.ideas ?? []);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const generateBrief = async (t?: string) => {
    const q = (t ?? topic).trim();
    if (!q) return;
    setTopic(q);
    setBriefLoading(true);
    setBriefError(null);
    setBrief(null);

    try {
      const res = await fetch("/api/content-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBriefError(data.error ?? "Error al generar el brief");
      } else {
        const b: BriefResult = data.brief;
        setBrief(b);
        setBriefCaptionValue(b.caption);
        setActiveHashtags(b.hashtags ?? []);
      }
    } catch {
      setBriefError("No se pudo conectar con el servidor");
    } finally {
      setBriefLoading(false);
    }
  };

  const handleCopy = (caption: string, idx: number) => {
    navigator.clipboard.writeText(caption);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = async (idea: Idea, idx: number) => {
    setSaving(idx);
    const type: PostType = FORMAT_TO_TYPE[idea.format] ?? "photo";
    const { error } = await supabase.from("posts").insert({
      caption: idea.caption,
      type,
      status: "draft",
      scheduled_date: null,
    });
    setSaving(null);
    if (!error) toast("Borrador guardado en Instagram ✓");
    else toast("Error al guardar borrador", "error");
  };

  const handleCopyHook = (hook: string, idx: number) => {
    navigator.clipboard.writeText(hook);
    setCopiedHook(idx);
    setTimeout(() => setCopiedHook(null), 2000);
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(briefCaptionValue);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleCopyHashtags = () => {
    navigator.clipboard.writeText(activeHashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" "));
    setCopiedHashtags(true);
    setTimeout(() => setCopiedHashtags(false), 2000);
  };

  const handleRemoveHashtag = (tag: string) => {
    setActiveHashtags((prev) => prev.filter((h) => h !== tag));
  };

  const handleSaveBrief = async () => {
    if (!brief) return;
    setSavingBrief(true);
    const type: PostType = FORMAT_TO_TYPE[brief.format] ?? "photo";
    const { error } = await supabase.from("posts").insert({
      caption: briefCaptionValue,
      type,
      status: "draft",
      scheduled_date: null,
    });
    setSavingBrief(false);
    if (!error) toast("Borrador guardado en Instagram ✓");
    else toast("Error al guardar borrador", "error");
  };

  const handleTopicSelect = (t: string) => {
    setTopic(t);
    if (mode === "ideas") generate(t);
    else generateBrief(t);
  };

  return (
    <>
      <PageHeader
        title="Generador de ideas"
        description="Escribí un tema y Claude te genera ideas o un brief completo de contenido."
      />

      {/* Tab toggle */}
      <div className="flex gap-1 mb-6 rounded-lg bg-muted/50 border border-border p-1 w-fit">
        <button
          onClick={() => setMode("ideas")}
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            mode === "ideas"
              ? "bg-background text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Lightbulb className="h-3.5 w-3.5" />
          Ideas rápidas
        </button>
        <button
          onClick={() => setMode("brief")}
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            mode === "brief"
              ? "bg-background text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Brief completo
        </button>
      </div>

      {/* Input principal */}
      <Card className="mb-8">
        <CardContent className="p-5">
          <div className="flex gap-3">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="ej: dólar MEP, plazo fijo, cómo ahorrar el 20%..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (mode === "ideas") generate();
                  else generateBrief();
                }
              }}
            />
            {mode === "ideas" ? (
              <Button onClick={() => generate()} disabled={loading || !topic.trim()}>
                {loading ? (
                  <Sparkles className="h-4 w-4 animate-pulse mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {loading ? "Generando…" : "Generar ideas"}
              </Button>
            ) : (
              <Button onClick={() => generateBrief()} disabled={briefLoading || !topic.trim()}>
                {briefLoading ? (
                  <BookOpen className="h-4 w-4 animate-pulse mr-2" />
                ) : (
                  <BookOpen className="h-4 w-4 mr-2" />
                )}
                {briefLoading ? "Generando…" : "Generar brief completo"}
              </Button>
            )}
          </div>

          {/* Sugerencias */}
          <div className="flex flex-wrap gap-2 mt-3">
            {SUGGESTED_TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => handleTopicSelect(t)}
                disabled={loading || briefLoading}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40"
              >
                {t}
                <ArrowRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── IDEAS RÁPIDAS ── */}
      {mode === "ideas" && (
        <>
          {error && <p className="text-sm text-red-400 mb-6">{error}</p>}

          {ideas.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                5 ideas para "{topic}"
              </p>
              {ideas.map((idea, idx) => {
                const Icon = FORMAT_ICONS[idea.format] ?? ImageIcon;
                return (
                  <Card key={idx} className="hover:border-primary/40 transition-colors">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                          <h3 className="font-semibold leading-snug">{idea.hook}</h3>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
                          <Icon className="h-3 w-3" />
                          {idea.format}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {idea.caption}
                      </p>

                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => handleSave(idea, idx)}
                          disabled={saving === idx}
                          className="flex-1"
                        >
                          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                          {saving === idx ? "Guardando…" : "Guardar como borrador"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(idea.caption, idx)}
                        >
                          {copied === idx ? (
                            <><Check className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />Copiado</>
                          ) : (
                            <><Copy className="h-3.5 w-3.5 mr-1.5" />Copiar</>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {!loading && ideas.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
              <Sparkles className="h-10 w-10 mb-4 opacity-30" />
              <p className="text-sm">Escribí un tema o elegí una sugerencia para empezar</p>
            </div>
          )}
        </>
      )}

      {/* ── BRIEF COMPLETO ── */}
      {mode === "brief" && (
        <>
          {briefError && <p className="text-sm text-red-400 mb-6">{briefError}</p>}

          {briefLoading && (
            <Card className="animate-pulse">
              <CardContent className="p-6 space-y-4">
                <div className="h-5 w-1/3 bg-muted rounded" />
                <div className="h-4 w-2/3 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded" />
                <div className="h-24 w-full bg-muted rounded" />
                <div className="flex gap-2">
                  <div className="h-7 w-20 bg-muted rounded-full" />
                  <div className="h-7 w-20 bg-muted rounded-full" />
                  <div className="h-7 w-20 bg-muted rounded-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {brief && !briefLoading && (
            <div className="space-y-4">
              {/* Header del brief */}
              <Card className="border-primary/30">
                <CardContent className="p-6 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{brief.topic}</h2>
                    <div className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                      {(() => {
                        const Icon = FORMAT_ICONS[brief.format] ?? ImageIcon;
                        return <Icon className="h-3 w-3" />;
                      })()}
                      {brief.format}
                    </div>
                    <span className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      DIFFICULTY_COLORS[brief.difficulty] ?? "text-muted-foreground border-border"
                    )}>
                      {brief.difficulty}
                    </span>
                    <span className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      REACH_COLORS[brief.estimatedReach] ?? "text-muted-foreground border-border"
                    )}>
                      Alcance {brief.estimatedReach}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">Ángulo: </span>{brief.angle}
                  </p>
                </CardContent>
              </Card>

              {/* Hooks */}
              <Card>
                <CardContent className="p-5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    3 opciones de hook
                  </p>
                  <ol className="space-y-2">
                    {brief.hooks.map((hook, i) => (
                      <li key={i} className="flex items-start justify-between gap-3 rounded-lg border bg-background/40 px-4 py-2.5">
                        <div className="flex items-start gap-2.5">
                          <span className="h-5 w-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-sm leading-snug">{hook}</span>
                        </div>
                        <button
                          onClick={() => handleCopyHook(hook, i)}
                          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copiedHook === i
                            ? <Check className="h-4 w-4 text-emerald-400" />
                            : <Copy className="h-4 w-4" />
                          }
                        </button>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              {/* Puntos clave */}
              <Card>
                <CardContent className="p-5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Puntos clave
                  </p>
                  <ol className="space-y-2">
                    {brief.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="h-5 w-5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-sm text-muted-foreground leading-snug">{point}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              {/* Caption editable */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Caption listo para publicar
                    </p>
                    <button
                      onClick={handleCopyCaption}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copiedCaption
                        ? <><Check className="h-3.5 w-3.5 text-emerald-400" /> Copiado</>
                        : <><Copy className="h-3.5 w-3.5" /> Copiar</>
                      }
                    </button>
                  </div>
                  <textarea
                    value={briefCaptionValue}
                    onChange={(e) => setBriefCaptionValue(e.target.value)}
                    rows={8}
                    className={cn(
                      "w-full rounded-lg border bg-background/40 px-3 py-2.5 text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground",
                      briefCaptionValue.length > 2200 && "border-red-500/60"
                    )}
                  />
                  <div className="flex items-center justify-end gap-2 mt-1.5">
                    {briefCaptionValue.length > 125 && briefCaptionValue.length <= 2200 && (
                      <span className="text-[11px] text-amber-400/80">corta en 125</span>
                    )}
                    <span className={cn(
                      "text-[11px] tabular-nums",
                      briefCaptionValue.length > 2200 ? "text-red-400 font-semibold" : briefCaptionValue.length > 1980 ? "text-amber-400" : "text-muted-foreground"
                    )}>
                      {briefCaptionValue.length}/2200
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Hashtags */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5" />
                      Hashtags ({activeHashtags.length})
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          const tags = "\n\n" + activeHashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ");
                          setBriefCaptionValue((prev) => prev + tags);
                          setActiveHashtags([]);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                        title="Agregar hashtags al final del caption"
                      >
                        <ArrowRight className="h-3.5 w-3.5" /> Al caption
                      </button>
                      <button
                        onClick={handleCopyHashtags}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copiedHashtags
                          ? <><Check className="h-3.5 w-3.5 text-emerald-400" /> Copiados</>
                          : <><Copy className="h-3.5 w-3.5" /> Copiar</>
                        }
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeHashtags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleRemoveHashtag(tag)}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-red-400/60 hover:text-red-400 hover:bg-red-400/5 transition-colors group"
                      >
                        #{tag.replace(/^#/, "")}
                        <Trash2 className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">Clic en un hashtag para eliminarlo</p>
                </CardContent>
              </Card>

              {/* Footer: CTA + bestDay + reach + guardar */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">CTA:</span>
                        <span className="text-xs font-medium rounded-full border border-primary/40 bg-primary/10 text-primary px-2.5 py-0.5">
                          {brief.cta}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Mejor día:</span>
                        <span className="text-xs font-semibold">{brief.bestDay}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BarChart2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Alcance:</span>
                        <span className={cn(
                          "text-xs font-medium rounded-full border px-2.5 py-0.5",
                          REACH_COLORS[brief.estimatedReach] ?? "text-muted-foreground border-border"
                        )}>
                          {brief.estimatedReach}
                        </span>
                      </div>
                    </div>
                    <Button onClick={handleSaveBrief} disabled={savingBrief}>
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      {savingBrief ? "Guardando…" : "Guardar como borrador"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!briefLoading && !brief && !briefError && (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
              <BookOpen className="h-10 w-10 mb-4 opacity-30" />
              <p className="text-sm">Escribí un tema para generar un brief completo de contenido</p>
              <p className="text-xs mt-1 opacity-60">Incluye hooks, puntos clave, caption editable, hashtags y CTA</p>
            </div>
          )}
        </>
      )}
    </>
  );
}
