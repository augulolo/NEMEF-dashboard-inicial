"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";

// Dispara NEMEF Autopilot (GitHub Actions) y la pieza vuelve sola al tablero.
export function GenerateButton() {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [video, setVideo] = useState(false);
  const [investigar, setInvestigar] = useState(true);
  const [loading, setLoading] = useState(false);

  async function lanzar() {
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic || "radar", video, investigar }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("Generando en la nube — la pieza va a aparecer en Borradores en unos minutos.");
        setOpen(false);
        setTopic("");
      } else {
        toast(data.error || "No se pudo lanzar", "error");
      }
    } catch {
      toast("Error de red al lanzar el pipeline", "error");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Sparkles className="h-4 w-4" /> Generar contenido
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center">
      <Input
        autoFocus
        placeholder='Tema (o vacío = "radar" del día)'
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && lanzar()}
        className="sm:w-80"
      />
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={investigar} onChange={(e) => setInvestigar(e.target.checked)} />
        Investigar
      </label>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={video} onChange={(e) => setVideo(e.target.checked)} />
        Reel
      </label>
      <div className="flex gap-2">
        <Button onClick={lanzar} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Lanzar
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
