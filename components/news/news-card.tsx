"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ExternalLink, Sparkles, Bookmark, BookmarkCheck, FileText, Check } from "lucide-react";
import { TOPIC_LABELS, TOPIC_STYLES, type NewsItem } from "@/lib/news";
import { CaptionDialog } from "./caption-dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";

function timeAgo(iso: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "recién";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `hace ${days}d`;
  return new Date(iso).toLocaleDateString("es-AR", { month: "short", day: "numeric" });
}

const FAV_KEY = "nemef_news_favs_v1";
function loadFavs(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]")); } catch { return new Set(); }
}
function saveFavs(favs: Set<string>) {
  localStorage.setItem(FAV_KEY, JSON.stringify([...favs]));
}

export function NewsCard({
  item,
  onCreatePost,
  isFavorite: isFavProp,
  onFavoriteChange,
}: {
  item: NewsItem;
  onCreatePost?: (caption: string) => void;
  isFavorite?: boolean;
  onFavoriteChange?: (id: string, fav: boolean) => void;
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [isFav, setIsFav] = useState(() => {
    if (isFavProp !== undefined) return isFavProp;
    if (typeof window === "undefined") return false;
    return loadFavs().has(item.id);
  });

  const handleSaveDraft = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (savingDraft || draftSaved) return;
    setSavingDraft(true);
    const caption = `📰 ${item.title}${item.summary ? `\n\n${item.summary}` : ""}\n\nFuente: ${item.source}`;
    const { error } = await supabase.from("posts").insert({
      caption,
      type: "photo",
      status: "draft",
      scheduled_date: null,
    });
    setSavingDraft(false);
    if (!error) {
      setDraftSaved(true);
      toast("Borrador creado en el gestor de Instagram ✓");
      setTimeout(() => setDraftSaved(false), 4000);
    } else {
      toast("Error al guardar borrador", "error");
    }
  };

  const toggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    const favs = loadFavs();
    const next = !isFav;
    if (next) favs.add(item.id); else favs.delete(item.id);
    saveFavs(favs);
    setIsFav(next);
    onFavoriteChange?.(item.id, next);
  };

  return (
    <>
    {showDialog && onCreatePost && (
      <CaptionDialog
        item={item}
        onClose={() => setShowDialog(false)}
        onUse={(caption) => {
          onCreatePost(caption);
          setShowDialog(false);
        }}
      />
    )}
    <Card className="hover:border-primary/50 transition-colors group">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
            <span className="font-medium text-foreground/80 truncate">{item.source}</span>
            <span>·</span>
            <span>{timeAgo(item.publishedAt)}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-wrap gap-1">
              {item.topics.map((t) => (
                <span
                  key={t}
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                    TOPIC_STYLES[t]
                  )}
                >
                  {TOPIC_LABELS[t]}
                </span>
              ))}
            </div>
            <button
              onClick={toggleFav}
              className={cn(
                "transition-colors shrink-0",
                isFav ? "text-amber-400 hover:text-amber-300" : "text-muted-foreground hover:text-amber-400 opacity-0 group-hover:opacity-100"
              )}
              title={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
            >
              {isFav ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block group-hover:text-primary transition-colors"
        >
          <h3 className="text-base font-semibold leading-snug flex items-start gap-1.5">
            <span>{item.title}</span>
            <ExternalLink className="h-3.5 w-3.5 mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
        </a>
        {item.summary && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{item.summary}</p>
        )}
        <div className="pt-1 flex items-center gap-3 flex-wrap">
          {onCreatePost && (
            <button
              onClick={() => setShowDialog(true)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Crear post con IA
            </button>
          )}
          <button
            onClick={handleSaveDraft}
            disabled={savingDraft || draftSaved}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium transition-colors",
              draftSaved
                ? "text-emerald-400"
                : "text-muted-foreground hover:text-amber-400 disabled:opacity-50"
            )}
            title="Guardar como borrador de post con el título y resumen de la noticia"
          >
            {draftSaved
              ? <><Check className="h-3.5 w-3.5" /> Borrador guardado</>
              : savingDraft
              ? <><FileText className="h-3.5 w-3.5 animate-pulse" /> Guardando…</>
              : <><FileText className="h-3.5 w-3.5" /> Guardar borrador</>
            }
          </button>
        </div>
      </CardContent>
    </Card>
    </>
  );
}
