"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { POST_TEMPLATES, type PostTemplate } from "@/lib/post-templates";
import { TYPE_LABELS } from "@/lib/posts";
import { cn } from "@/lib/utils";

export function TemplateSelector({
  onSelect,
  onClose,
}: {
  onSelect: (t: PostTemplate) => void;
  onClose: () => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <Dialog open title="Elegí una plantilla" onClose={onClose}>
      <p className="text-xs text-muted-foreground mb-4">
        Seleccioná una estructura para arrancar más rápido. Podés editarla libremente.
      </p>
      <div className="grid gap-2">
        {POST_TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => { onSelect(t); onClose(); }}
            onMouseEnter={() => setHovered(t.id)}
            onMouseLeave={() => setHovered(null)}
            className={cn(
              "text-left rounded-lg border p-3 transition-colors",
              hovered === t.id ? "border-primary/60 bg-primary/5" : "border-border hover:border-primary/40"
            )}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl leading-none">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t.label}</span>
                  <span className="text-[10px] border rounded px-1 py-0.5 text-muted-foreground leading-none">
                    {TYPE_LABELS[t.type]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </Dialog>
  );
}
