"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, Trash2, Pencil, CheckCircle2, Copy, Check, ArrowRight, Files } from "lucide-react";
import { Image as ImageIcon, Film, Circle, Layers } from "lucide-react";
import type { Post, PostStatus } from "@/lib/posts";
import { TYPE_LABELS, STATUS_LABELS, POST_STATUSES } from "@/lib/posts";

const typeIcon = { photo: ImageIcon, reel: Film, story: Circle, carousel: Layers };
const TODAY = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

const STATUS_NEXT: Record<PostStatus, PostStatus | null> = {
  backlog: "draft",
  draft: "scheduled",
  scheduled: "published",
  published: null,
};
const STATUS_NEXT_LABEL: Record<PostStatus, string> = {
  backlog: "→ Borrador",
  draft: "→ Programar",
  scheduled: "✓ Publicado",
  published: "",
};

export function PostList({
  posts,
  onDelete,
  onEdit,
  onDuplicate,
}: {
  posts: Post[];
  onDelete: (id: string) => void;
  onEdit: (updated: Post) => void;
  onDuplicate?: (post: Post) => void;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const sorted = [...posts].sort((a, b) => {
    const da = a.scheduledDate ?? a.createdAt ?? "";
    const db = b.scheduledDate ?? b.createdAt ?? "";
    return da.localeCompare(db);
  });

  const handleCopy = (p: Post) => {
    navigator.clipboard.writeText(p.caption).catch(() => {});
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAdvance = (p: Post) => {
    const next = STATUS_NEXT[p.status];
    if (!next) return;
    onEdit({ ...p, status: next });
  };

  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        No hay posts que coincidan con los filtros.
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-background/50 border-b">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Caption</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide w-24">Tipo</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide w-28">Estado</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide w-28">Fecha</th>
              <th className="w-36" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const Icon = typeIcon[p.type];
              const isOverdue = p.status === "scheduled" && p.scheduledDate && p.scheduledDate < TODAY;
              const next = STATUS_NEXT[p.status];
              return (
                <tr
                  key={p.id}
                  className={cn(
                    "border-b last:border-b-0 hover:bg-accent/20 transition-colors group",
                    isOverdue && "bg-amber-500/5"
                  )}
                >
                  {/* Caption */}
                  <td className="px-4 py-3">
                    <p className="line-clamp-2 text-sm leading-snug">{p.caption}</p>
                  </td>
                  {/* Tipo */}
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      {TYPE_LABELS[p.type]}
                    </span>
                  </td>
                  {/* Estado */}
                  <td className="px-3 py-3">
                    <Badge variant={p.status}>{STATUS_LABELS[p.status]}</Badge>
                    {isOverdue && (
                      <span className="ml-1.5 text-[10px] text-amber-400 border border-amber-500/40 rounded px-1 py-0.5 leading-none">
                        atrasado
                      </span>
                    )}
                  </td>
                  {/* Fecha */}
                  <td className="px-3 py-3">
                    {p.scheduledDate ? (
                      <span className={cn("inline-flex items-center gap-1 text-xs", isOverdue ? "text-amber-400" : "text-muted-foreground")}>
                        <Calendar className="h-3 w-3" />
                        {new Date(p.scheduledDate + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "2-digit" })}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  {/* Acciones */}
                  <td className="pr-3 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {next && (
                        <button
                          onClick={() => handleAdvance(p)}
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-medium rounded border px-2 py-0.5 transition-colors whitespace-nowrap",
                            p.status === "scheduled"
                              ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                              : "border-primary/40 text-primary hover:bg-primary/10"
                          )}
                          title={STATUS_NEXT_LABEL[p.status]}
                        >
                          {p.status === "scheduled" ? <CheckCircle2 className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
                          {STATUS_NEXT_LABEL[p.status]}
                        </button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy(p)} title="Copiar caption">
                        {copiedId === p.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                      {onDuplicate && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => onDuplicate(p)} title="Duplicar como borrador">
                          <Files className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-400"
                        onClick={() => onDelete(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
