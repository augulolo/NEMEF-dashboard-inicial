"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Image as ImageIcon, Film, Circle, Layers, Calendar,
  Trash2, Pencil, Check, X, Copy, CheckCircle2, Repeat2, Star, RefreshCw, Sparkles, Files, Expand, History, RotateCcw, Tag, Send, Loader2, AlertCircle,
} from "lucide-react";
import type { Post, PostType, PostStatus } from "@/lib/posts";
import { TYPE_LABELS, STATUS_LABELS, POST_TYPES, POST_STATUSES } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { RepurposeDialog } from "./repurpose-dialog";
import { loadTags, saveTags } from "@/lib/tags";

const typeIcon = {
  photo: ImageIcon,
  reel: Film,
  story: Circle,
  carousel: Layers,
};

const TODAY = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

const HISTORY_KEY = "nemef_post_history_v1";

interface HistoryEntry {
  savedAt: string;
  caption: string;
  type: Post["type"];
  status: PostStatus;
  scheduledDate?: string;
}

function loadHistory(postId: string): HistoryEntry[] {
  try {
    const all = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "{}");
    return all[postId] ?? [];
  } catch { return []; }
}

function pushHistory(postId: string, snapshot: HistoryEntry) {
  try {
    const all = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "{}");
    const prev: HistoryEntry[] = all[postId] ?? [];
    all[postId] = [...prev, snapshot].slice(-10); // keep last 10
    localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
  } catch { /* */ }
}

export function PostCard({
  post,
  onDelete,
  onEdit,
  onDuplicate,
}: {
  post: Post;
  onDelete: (id: string) => void;
  onEdit: (updated: Post) => void;
  onDuplicate?: (post: Post) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(post.caption);
  const [type, setType] = useState<PostType>(post.type);
  const [status, setStatus] = useState<PostStatus>(post.status);
  const [scheduledDate, setScheduledDate] = useState(post.scheduledDate ?? "");
  const [copied, setCopied] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [repurposing, setRepurposing] = useState(false);
  const [score, setScore] = useState<{ value: number; tip: string } | null>(null);
  const [scoring, setScoring] = useState(false);
  const [improving, setImproving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [tags, setTags] = useState<string[]>(() => loadTags(post.id));
  const [tagInput, setTagInput] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ ok: boolean; message: string } | null>(null);

  const isToday = post.scheduledDate === TODAY;
  const canPublish = post.status === "scheduled" && isToday;

  const handleInstagramPublish = async () => {
    if (!canPublish || publishing) return;
    setPublishing(true);
    setPublishResult(null);
    try {
      const res = await fetch("/api/publish-instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: post.caption, type: post.type }),
      });
      const data = await res.json() as { ok: boolean; message: string; postId?: string };
      setPublishResult({ ok: data.ok, message: data.message });
      if (data.ok) {
        onEdit({ ...post, status: "published" });
      }
    } catch {
      setPublishResult({ ok: false, message: "Error de red al conectar con Meta API." });
    } finally {
      setPublishing(false);
    }
  };

  const handleScore = async () => {
    if (scoring) return;
    setScoring(true);
    try {
      const res = await fetch("/api/score-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: post.caption, type: post.type }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setScore({ value: data.score, tip: data.tip });
    } catch (e) {
      console.error("Error al puntuar:", e);
    } finally {
      setScoring(false);
    }
  };

  const handleImprove = async () => {
    if (improving || !caption.trim()) return;
    setImproving(true);
    try {
      const res = await fetch("/api/improve-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, type }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.improved) setCaption(data.improved);
    } catch (e) {
      console.error("Error al mejorar caption:", e);
    } finally {
      setImproving(false);
    }
  };

  const scoreColor = score
    ? score.value >= 8
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
      : score.value >= 5
      ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
      : "bg-red-500/20 text-red-400 border-red-500/40"
    : "";

  const isOverdue = post.status === "scheduled" && post.scheduledDate && post.scheduledDate < TODAY;

  // "due soon": scheduled for today or tomorrow but not yet overdue
  const TOMORROW = (() => {
    const d = new Date(TODAY + "T00:00:00");
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString("en-CA");
  })();
  const isDueToday = post.status === "scheduled" && post.scheduledDate === TODAY;
  const isDueTomorrow = post.status === "scheduled" && post.scheduledDate === TOMORROW;

  const handleSave = () => {
    // Save snapshot of current version before overwriting
    pushHistory(post.id, {
      savedAt: new Date().toISOString(),
      caption: post.caption,
      type: post.type,
      status: post.status,
      scheduledDate: post.scheduledDate,
    });
    saveTags(post.id, tags);
    onEdit({ ...post, caption, type, status, scheduledDate: scheduledDate || undefined });
    setEditing(false);
  };

  const openHistory = () => {
    setHistory(loadHistory(post.id));
    setShowHistory(true);
    setEditing(false);
  };

  const restoreVersion = (entry: HistoryEntry) => {
    setCaption(entry.caption);
    setType(entry.type);
    setStatus(entry.status);
    setScheduledDate(entry.scheduledDate ?? "");
    setShowHistory(false);
    setEditing(true);
  };

  const handleCancel = () => {
    setCaption(post.caption);
    setType(post.type);
    setStatus(post.status);
    setScheduledDate(post.scheduledDate ?? "");
    setTags(loadTags(post.id));
    setTagInput("");
    setEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(post.caption).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePublish = () => {
    onEdit({ ...post, status: "published" });
  };

  const Icon = typeIcon[post.type];

  const IG_MAX = 2200;
  const IG_PREVIEW = 125;

  if (editing) {
    const charCount = caption.length;
    const overLimit = charCount > IG_MAX;
    const nearLimit = charCount > IG_MAX * 0.9;

    return (
      <Card className="border-primary/50">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className={cn("text-sm resize-none pb-6", overLimit && "border-red-500/60 focus-visible:ring-red-500/30")}
              rows={4}
              autoFocus
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              {charCount > IG_PREVIEW && charCount <= IG_MAX && (
                <span className="text-[10px] text-amber-400 opacity-80">corta en {IG_PREVIEW}</span>
              )}
              <span className={cn(
                "text-[10px] tabular-nums font-medium",
                overLimit ? "text-red-400" : nearLimit ? "text-amber-400" : "text-muted-foreground"
              )}>
                {charCount}/{IG_MAX}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleImprove}
            disabled={improving || !caption.trim()}
            className="w-full h-8 gap-2 text-xs border-primary/40 text-primary hover:bg-primary/10"
          >
            {improving
              ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Mejorando con IA…</>
              : <><Sparkles className="h-3.5 w-3.5" /> Mejorar caption con IA</>
            }
          </Button>
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
          {/* Tag editor */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              <Tag className="h-3 w-3" />
              <span>Etiquetas</span>
              <span className="ml-auto">{tags.length}/5</span>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-0.5 rounded-full border border-primary/40 bg-primary/10 text-primary px-2 py-0.5 text-[10px]"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                      className="ml-0.5 hover:text-red-400 transition-colors"
                      aria-label={`Eliminar etiqueta ${tag}`}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {tags.length < 5 && (
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    const val = tagInput.trim().replace(/,/g, "");
                    if (val && !tags.includes(val) && tags.length < 5) {
                      setTags((prev) => [...prev, val]);
                    }
                    setTagInput("");
                  }
                }}
                placeholder="+ etiqueta"
                className="w-full rounded-md border bg-background px-2.5 py-1 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSave} className="flex-1">
              <Check className="h-3.5 w-3.5 mr-1" /> Guardar
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1">
              <X className="h-3.5 w-3.5 mr-1" /> Cancelar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={openHistory}
              title="Ver historial de versiones"
              className="shrink-0 px-2 text-muted-foreground hover:text-foreground"
            >
              <History className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Modal de lectura completa */}
      {previewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewing(false)}>
          <div className="w-full max-w-lg rounded-xl border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="h-4 w-4" />
                <span>{TYPE_LABELS[post.type]}</span>
                {post.scheduledDate && (
                  <>
                    <span>·</span>
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(post.scheduledDate + "T12:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground tabular-nums">{post.caption.length}/2200</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(post.caption).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Copiar"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
                <button onClick={() => setPreviewing(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-5 max-h-[70vh] overflow-y-auto">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.caption}</p>
            </div>
            <div className="p-4 border-t flex items-center justify-between gap-2">
              <span className={cn("text-xs font-medium px-2 py-1 rounded-full border",
                isOverdue ? "text-amber-400 border-amber-500/30 bg-amber-500/10" :
                isDueToday ? "text-blue-400 border-blue-500/30 bg-blue-500/10" :
                "text-muted-foreground border-border"
              )}>
                {isOverdue ? "Atrasado" : isDueToday ? "Para hoy" : isDueTomorrow ? "Para mañana" : STATUS_LABELS[post.status]}
              </span>
              <div className="flex gap-2">
                <button onClick={() => { setPreviewing(false); setEditing(true); }} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>
                {post.status === "scheduled" && (
                  <button onClick={() => { handlePublish(); setPreviewing(false); }} className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Marcar publicado
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowHistory(false)}>
          <div className="w-full max-w-md rounded-xl border bg-card shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Historial de versiones</h3>
              </div>
              <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            {history.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Todavía no hay versiones guardadas para este post.
              </div>
            ) : (
              <ul className="divide-y max-h-96 overflow-y-auto">
                {[...history].reverse().map((entry, i) => (
                  <li key={i} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(entry.savedAt).toLocaleString("es-AR", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                      <button
                        onClick={() => restoreVersion(entry)}
                        className="inline-flex items-center gap-1 text-xs text-primary border border-primary/30 rounded px-2 py-0.5 hover:bg-primary/10 transition-colors"
                      >
                        <RotateCcw className="h-3 w-3" /> Restaurar
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                      {entry.caption}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      {repurposing && (
        <RepurposeDialog
          caption={post.caption}
          onClose={() => setRepurposing(false)}
          onSaveDraft={(text) => {
            onEdit({ ...post, caption: text, status: "draft" });
            setRepurposing(false);
          }}
        />
      )}
      <Card className={cn(
        "group hover:border-primary/50 transition-colors",
        isOverdue && "border-amber-500/40",
        isDueToday && !isOverdue && "border-blue-500/40"
      )}>
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
              <span>{TYPE_LABELS[post.type]}</span>
              {isOverdue && (
                <span className="text-[10px] font-medium text-amber-400 border border-amber-500/40 rounded px-1 py-0.5 leading-none">
                  atrasado
                </span>
              )}
              {isDueToday && !isOverdue && (
                <span className="text-[10px] font-medium text-blue-400 border border-blue-500/40 rounded px-1 py-0.5 leading-none animate-pulse">
                  hoy
                </span>
              )}
              {isDueTomorrow && (
                <span className="text-[10px] font-medium text-primary/80 border border-primary/30 rounded px-1 py-0.5 leading-none">
                  mañana
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-amber-400"
                onClick={handleScore}
                disabled={scoring}
                aria-label="Puntuar caption con IA"
                title="Puntuar caption con IA"
              >
                {scoring
                  ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  : <Star className="h-3.5 w-3.5" />
                }
              </Button>
              {score && (
                <span className={`inline-flex items-center justify-center h-5 min-w-[20px] rounded-full border text-[10px] font-bold tabular-nums px-1 ${scoreColor}`}>
                  {score.value}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
                aria-label="Copiar caption"
                title="Copiar caption"
              >
                {copied
                  ? <Check className="h-3.5 w-3.5 text-emerald-400" />
                  : <Copy className="h-3.5 w-3.5" />
                }
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={() => setRepurposing(true)}
                aria-label="Repurpose"
                title="Adaptar a otro formato"
              >
                <Repeat2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setEditing(true)}
                aria-label="Editar post"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {onDuplicate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onDuplicate(post)}
                  aria-label="Duplicar post"
                  title="Duplicar como borrador"
                >
                  <Files className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-red-400"
                onClick={() => onDelete(post.id)}
                aria-label="Eliminar post"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Caption */}
          <button
            onClick={() => setPreviewing(true)}
            className="text-left w-full group/caption"
            title="Clic para leer completo"
          >
            <p className="text-sm leading-relaxed line-clamp-4 group-hover/caption:text-foreground transition-colors">
              {post.caption}
            </p>
            {post.caption.length > 200 && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                <Expand className="h-3 w-3" /> Leer completo
              </span>
            )}
          </button>

          {/* Tags (read-only) */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-primary/30 px-2 py-0.5 text-[10px] text-primary/80"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Score tip */}
          {score && (
            <div className={`rounded-md border px-3 py-2 text-xs ${scoreColor}`}>
              <span className="font-semibold">Consejo IA:</span>{" "}{score.tip}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t gap-2">
            {post.scheduledDate ? (
              <div className={cn(
                "flex items-center gap-1.5 text-xs shrink-0",
                isOverdue ? "text-amber-400" : "text-muted-foreground"
              )}>
                <Calendar className="h-3 w-3" />
                {new Date(post.scheduledDate + "T12:00:00").toLocaleDateString("es-AR", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Sin fecha</span>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {/* Publicar directo en Instagram (solo posts programados para hoy) */}
              {canPublish && (
                <button
                  onClick={handleInstagramPublish}
                  disabled={publishing}
                  className="inline-flex items-center gap-1 text-xs font-medium text-pink-400 border border-pink-500/30 rounded px-2 py-0.5 hover:bg-pink-500/10 transition-colors disabled:opacity-50"
                  title="Publicar ahora en Instagram vía Meta API"
                >
                  {publishing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  {publishing ? "Publicando…" : "Publicar en IG"}
                </button>
              )}
              {/* Marcar como publicado manualmente */}
              {post.status === "scheduled" && (
                <button
                  onClick={handlePublish}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 border border-emerald-500/30 rounded px-2 py-0.5 hover:bg-emerald-500/10 transition-colors"
                  title="Marcar como publicado manualmente"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Publicado
                </button>
              )}
              <Badge variant={post.status}>{STATUS_LABELS[post.status]}</Badge>
            </div>
          </div>

          {/* Resultado de la publicación en IG */}
          {publishResult && (
            <div className={cn(
              "rounded-md border px-3 py-2 text-xs flex items-start gap-2",
              publishResult.ok
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                : "border-amber-500/30 bg-amber-500/5 text-amber-400"
            )}>
              {publishResult.ok
                ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                : <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              }
              <span>{publishResult.message}</span>
              <button onClick={() => setPublishResult(null)} className="ml-auto shrink-0 opacity-60 hover:opacity-100">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
