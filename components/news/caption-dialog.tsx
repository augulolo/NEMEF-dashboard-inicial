"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NewsItem } from "@/lib/news";

export function CaptionDialog({
  item,
  onClose,
  onUse,
}: {
  item: NewsItem;
  onClose: () => void;
  onUse: (caption: string) => void;
}) {
  const [captions, setCaptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/generate-caption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: item.title,
        summary: item.summary,
        topics: item.topics,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setCaptions(d.captions ?? []);
      })
      .catch(() => setError("No se pudo conectar con el servidor"))
      .finally(() => setLoading(false));
  }, [item]);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Generar caption con IA"
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Noticia origen */}
        <div className="rounded-lg bg-muted/50 border px-4 py-3 text-sm">
          <p className="font-medium leading-snug">{item.title}</p>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-1 transition-colors"
          >
            {item.source} <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
            <Sparkles className="h-6 w-6 animate-pulse text-primary" />
            <p className="text-sm">Generando 3 variantes…</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 text-center py-4">{error}</p>
        )}

        {!loading && captions.map((caption, idx) => (
          <div key={idx} className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Variante {idx + 1}
              </span>
              <button
                onClick={() => handleCopy(caption, idx)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied === idx ? (
                  <><Check className="h-3 w-3 text-emerald-400" /> Copiado</>
                ) : (
                  <><Copy className="h-3 w-3" /> Copiar</>
                )}
              </button>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{caption}</p>
            <Button
              size="sm"
              className="w-full"
              onClick={() => onUse(caption)}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Usar como borrador en Instagram
            </Button>
          </div>
        ))}
      </div>
    </Dialog>
  );
}
