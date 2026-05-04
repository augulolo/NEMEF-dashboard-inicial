"use client";

import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, X, BookmarkPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";

const STORAGE_KEY = "nemef_weekly_brief_v1";

const STOP_WORDS = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas",
  "de", "del", "al", "a", "en", "y", "e", "o", "que", "con",
  "por", "para", "se", "su", "sus", "es", "son", "fue", "han",
  "hay", "más", "pero", "como", "este", "esta", "estos", "estas",
  "the", "a", "an", "of", "in", "is", "are", "and", "or", "to",
  "for", "on", "at", "by", "from", "with", "was", "has", "be",
]);

interface ContentIdea {
  hook: string;
  format: "Reel" | "Carrusel" | "Post" | "Historia";
  topic: string;
  whyNow: string;
}

interface WeeklyBriefData {
  weekGoal: string;
  ideas: ContentIdea[];
  generatedAt: string;
}

function extractKeywords(titles: string[]): string[] {
  const freq: Record<string, number> = {};
  for (const title of titles) {
    const words = title
      .toLowerCase()
      .replace(/[^a-záéíóúüñ\s]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
    for (const word of words) {
      freq[word] = (freq[word] ?? 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);
}

const FORMAT_COLORS: Record<string, string> = {
  Reel:     "bg-pink-500/15 text-pink-300 border-pink-500/30",
  Carrusel: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  Post:     "bg-blue-500/15 text-blue-300 border-blue-500/30",
  Historia: "bg-amber-500/15 text-amber-300 border-amber-500/30",
};

const FORMAT_TO_TYPE: Record<string, string> = {
  Reel:     "reel",
  Carrusel: "carousel",
  Post:     "photo",
  Historia: "story",
};

export function WeeklyBrief() {
  const [brief, setBrief] = useState<WeeklyBriefData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setBrief(JSON.parse(stored) as WeeklyBriefData);
      }
    } catch { /**/ }
  }, []);

  const generate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch news titles (5 most recent)
      const newsRes = await supabase
        .from("news_cache")
        .select("title")
        .order("published_at", { ascending: false })
        .limit(5);
      const newsTitles = (newsRes.data ?? []).map((n) => n.title as string);
      const newsTopics = extractKeywords(newsTitles);

      // Count own posts this week
      const today = new Date().toLocaleDateString("en-CA", {
        timeZone: "America/Argentina/Buenos_Aires",
      });
      const todayDate = new Date(today + "T00:00:00");
      const weekStart = new Date(todayDate);
      weekStart.setDate(todayDate.getDate() - ((todayDate.getDay() + 6) % 7));
      const weekStartStr = weekStart.toLocaleDateString("en-CA");

      const postsRes = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .gte("scheduled_date", weekStartStr)
        .lte("scheduled_date", today);
      const ownPostCount = postsRes.count ?? 0;

      const res = await fetch("/api/weekly-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newsTopics,
          competitorTopics: [],
          ownPostCount,
          topType: "Reel",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Error al generar el brief.");
        return;
      }

      const newBrief: WeeklyBriefData = {
        ...json,
        generatedAt: new Date().toISOString(),
      };
      setBrief(newBrief);
      setDismissed(false);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newBrief));
      } catch { /**/ }
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async (idea: ContentIdea, idx: number) => {
    setSavingIdx(idx);
    try {
      const caption = `${idea.hook}\n\n${idea.topic}`;
      const type = FORMAT_TO_TYPE[idea.format] ?? "photo";
      const { error: dbError } = await supabase
        .from("posts")
        .insert({ caption, type, status: "draft" });
      if (dbError) {
        toast("No se pudo guardar el borrador.", "error");
      } else {
        toast("Borrador guardado en Instagram →", "success");
      }
    } catch {
      toast("Error al guardar el borrador.", "error");
    } finally {
      setSavingIdx(null);
    }
  };

  if (dismissed) return null;

  return (
    <div className="mb-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Brief semanal IA
          </CardTitle>
          <div className="flex items-center gap-2">
            {brief && (
              <button
                onClick={generate}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs rounded-md border border-primary/40 text-primary px-3 py-1.5 font-medium transition-colors hover:bg-primary/10 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
                Regenerar
              </button>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Initial state — no brief yet */}
          {!brief && !loading && !error && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Sparkles className="h-8 w-8 text-primary/40" />
              <p className="text-sm text-muted-foreground max-w-xs">
                Generá el plan editorial de la semana con IA — basado en las noticias trending y tu historial de contenido.
              </p>
              <Button
                onClick={generate}
                size="sm"
                className="gap-2"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generar brief de la semana
              </Button>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-3 py-2">
              <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
              <div className="grid gap-3 md:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-lg border bg-background/40 p-4 space-y-2">
                    <div className="h-3 w-full rounded bg-muted animate-pulse" />
                    <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                    <div className="h-6 w-20 rounded bg-muted animate-pulse mt-2" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <p className="text-sm text-red-400">{error}</p>
              <Button onClick={generate} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-3 w-3" />
                Reintentar
              </Button>
            </div>
          )}

          {/* Result */}
          {brief && !loading && (
            <div className="space-y-4">
              {/* Week goal */}
              <div className="flex items-start gap-2">
                <span className="text-xs text-muted-foreground shrink-0 pt-0.5">Objetivo:</span>
                <p className="text-sm font-semibold leading-snug">{brief.weekGoal}</p>
              </div>

              {/* Idea cards */}
              <div className="grid gap-3 md:grid-cols-3">
                {brief.ideas.map((idea, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border bg-background/60 p-4 flex flex-col gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-semibold border rounded-full px-2 py-0.5 shrink-0",
                          FORMAT_COLORS[idea.format] ?? "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        {idea.format}
                      </span>
                    </div>

                    <p className="text-sm font-medium leading-snug">
                      {idea.hook}
                    </p>

                    <p className="text-xs text-foreground/80">{idea.topic}</p>

                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                      {idea.whyNow}
                    </p>

                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-auto gap-1.5 text-xs h-7"
                      onClick={() => saveDraft(idea, i)}
                      disabled={savingIdx === i}
                    >
                      <BookmarkPlus className="h-3 w-3" />
                      {savingIdx === i ? "Guardando…" : "Guardar borrador"}
                    </Button>
                  </div>
                ))}
              </div>

              {brief.generatedAt && (
                <p className="text-[10px] text-muted-foreground/50 text-right">
                  Generado el{" "}
                  {new Date(brief.generatedAt).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
