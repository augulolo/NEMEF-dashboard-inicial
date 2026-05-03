"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy, Check, Film, Layers, Image as ImageIcon, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import type { PostType } from "@/lib/posts";

type Idea = {
  hook: string;
  format: string;
  caption: string;
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

export default function IdeasPage() {
  const [topic, setTopic] = useState("");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

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

  return (
    <>
      <PageHeader
        title="Generador de ideas"
        description="Escribí un tema y Claude te genera 5 ideas de posts con distintos ángulos y formatos."
      />

      {/* Input principal */}
      <Card className="mb-8">
        <CardContent className="p-5">
          <div className="flex gap-3">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="ej: dólar MEP, plazo fijo, cómo ahorrar el 20%..."
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && generate()}
            />
            <Button onClick={() => generate()} disabled={loading || !topic.trim()}>
              {loading ? (
                <Sparkles className="h-4 w-4 animate-pulse mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {loading ? "Generando…" : "Generar ideas"}
            </Button>
          </div>

          {/* Sugerencias */}
          <div className="flex flex-wrap gap-2 mt-3">
            {SUGGESTED_TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => generate(t)}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40"
              >
                {t}
                <ArrowRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-red-400 mb-6">{error}</p>
      )}

      {/* Ideas generadas */}
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
  );
}
