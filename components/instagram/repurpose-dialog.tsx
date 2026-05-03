"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Film, Layers, Mail, Twitter, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type Format = "twitter_thread" | "linkedin" | "reel_script" | "story" | "email";

interface FormatOption {
  key: Format;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    key: "twitter_thread",
    label: "Hilo Twitter",
    icon: Twitter,
    description: "5-7 tweets con hook y CTA",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: Briefcase,
    description: "Tono profesional, máx 1300 car.",
  },
  {
    key: "reel_script",
    label: "Guión Reel",
    icon: Film,
    description: "Script para Reel de 30-45 seg.",
  },
  {
    key: "story",
    label: "Stories",
    icon: Layers,
    description: "Secuencia de 4-5 Stories",
  },
  {
    key: "email",
    label: "Newsletter",
    icon: Mail,
    description: "Intro de newsletter financiero",
  },
];

export function RepurposeDialog({
  caption,
  onClose,
  onSaveDraft,
}: {
  caption: string;
  onClose: () => void;
  onSaveDraft: (text: string) => void;
}) {
  const [selectedFormat, setSelectedFormat] = useState<Format | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!selectedFormat) return;
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, target: selectedFormat }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Error al generar");
      } else {
        setResult(json.result ?? "");
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormatSelect = (fmt: Format) => {
    setSelectedFormat(fmt);
    // Clear previous result when switching formats
    if (fmt !== selectedFormat) {
      setResult("");
      setError("");
    }
  };

  const previewCaption = caption.length > 120 ? caption.slice(0, 120) + "…" : caption;

  return (
    <Dialog
      open
      onClose={onClose}
      title="Repurpose del post"
      className="max-w-xl"
    >
      <div className="space-y-4">
        {/* Original caption preview */}
        <div className="rounded-md bg-background/60 border px-3 py-2">
          <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wide">Caption original</p>
          <p className="text-xs text-foreground/80 leading-relaxed">{previewCaption}</p>
        </div>

        {/* Format selector */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Elegí el formato de destino:</p>
          <div className="grid grid-cols-5 gap-2">
            {FORMAT_OPTIONS.map((fmt) => {
              const Icon = fmt.icon;
              const active = selectedFormat === fmt.key;
              return (
                <button
                  key={fmt.key}
                  onClick={() => handleFormatSelect(fmt.key)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-center transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                  title={fmt.description}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] font-medium leading-tight">{fmt.label}</span>
                </button>
              );
            })}
          </div>
          {selectedFormat && (
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {FORMAT_OPTIONS.find((f) => f.key === selectedFormat)?.description}
            </p>
          )}
        </div>

        {/* Generate button */}
        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={!selectedFormat || loading}
        >
          {loading ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Generando…
            </>
          ) : (
            "Generar"
          )}
        </Button>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2">
            {error}
          </p>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-2">
            <Textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="text-sm resize-none min-h-[160px] font-mono"
              rows={8}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                    Copiado
                  </>
                ) : (
                  "Copiar"
                )}
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onSaveDraft(result)}
              >
                Guardar borrador
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
