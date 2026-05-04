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
  Trash2, Pencil, Check, X, Copy, CheckCircle2, Repeat2, Star, RefreshCw, Sparkles,
} from "lucide-react";
import type { Post, PostType, PostStatus } from "@/lib/posts";
import { TYPE_LABELS, STATUS_LABELS, POST_TYPES, POST_STATUSES } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { RepurposeDialog } from "./repurpose-dialog";

const typeIcon = {
  photo: ImageIcon,
  reel: Film,
  story: Circle,
  carousel: Layers,
};

const TODAY = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

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
  const [copied, setCopied] = useState(false);
  const [repurposing, setRepurposing] = useState(false);
  const [score, setScore] = useState<{ value: number; tip: string } | null>(null);
  const [scoring, setScoring] = useState(false);
  const [improving, setImproving] = useState(false);

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
    <>
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
          <p className="text-sm leading-relaxed line-clamp-4">{post.caption}</p>

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

            <div className="flex items-center gap-2">
              {post.status === "scheduled" && (
                <button
                  onClick={handlePublish}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 border border-emerald-500/30 rounded px-2 py-0.5 hover:bg-emerald-500/10 transition-colors"
                  title="Marcar como publicado"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Publicado
                </button>
              )}
              <Badge variant={post.status}>{STATUS_LABELS[post.status]}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
