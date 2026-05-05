"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { loadPillars, getPostPillar, setPostPillar, type ContentPillar } from "@/lib/pillars";
import { Layers2, X } from "lucide-react";

export function PillarSelector({
  postId,
  onChange,
}: {
  postId: string;
  onChange?: (pillarId: string | null) => void;
}) {
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setPillars(loadPillars());
    setSelected(getPostPillar(postId));
  }, [postId]);

  const handleSelect = (pillarId: string | null) => {
    setSelected(pillarId);
    setPostPillar(postId, pillarId);
    onChange?.(pillarId);
    setOpen(false);
  };

  const activePillar = pillars.find((p) => p.id === selected);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
          activePillar
            ? `${activePillar.color} ${activePillar.textColor} ${activePillar.borderColor}`
            : "border-border text-muted-foreground hover:bg-accent"
        )}
        title="Asignar pilar de contenido"
      >
        {activePillar ? (
          <>
            <span>{activePillar.emoji}</span>
            <span>{activePillar.name}</span>
          </>
        ) : (
          <>
            <Layers2 className="h-3 w-3" />
            <span>Pilar</span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 rounded-xl border bg-card shadow-xl overflow-hidden min-w-[200px]">
          <div className="px-3 py-2 border-b flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pilar de contenido</span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="py-1">
            {activePillar && (
              <button
                onClick={() => handleSelect(null)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-accent/50 transition-colors"
              >
                <X className="h-3 w-3" />
                Quitar pilar
              </button>
            )}
            {pillars.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-[12px] transition-colors hover:bg-accent/50",
                  selected === p.id && "bg-accent"
                )}
              >
                <span className={cn("inline-flex items-center justify-center h-5 w-5 rounded-md text-[11px]", p.color)}>
                  {p.emoji}
                </span>
                <div className="flex-1 text-left">
                  <span className={cn("font-medium", p.textColor)}>{p.name}</span>
                  <p className="text-muted-foreground text-[10px] leading-tight truncate max-w-[140px]">{p.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
