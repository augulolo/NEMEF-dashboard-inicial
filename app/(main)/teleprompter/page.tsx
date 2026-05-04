"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Maximize2,
  FlipHorizontal2,
  X,
  Save,
} from "lucide-react";

const SCRIPT_KEY = "nemef_teleprompter_script";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

export default function TeleprompterPage() {
  const [script, setScript] = useState("");
  const [wpm, setWpm] = useState(130);
  const [fontSize, setFontSize] = useState(40);
  const [presenting, setPresenting] = useState(false);
  const [running, setRunning] = useState(false);
  const [mirrored, setMirrored] = useState(false);
  const [saved, setSaved] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SCRIPT_KEY);
      if (stored) setScript(stored);
    } catch {
      // ignore
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(SCRIPT_KEY, script);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    }
  };

  // Pixel scroll speed: at 130 wpm, ~5 avg chars/word, scroll should feel natural
  // We scroll continuously; speed in px/ms derived from wpm
  const startScroll = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    // pixels per second = wpm * avg_word_height_ratio (empirical ~0.6px per word/min)
    const pxPerSecond = wpm * 0.55;
    const TICK_MS = 50;
    const pxPerTick = (pxPerSecond * TICK_MS) / 1000;

    intervalRef.current = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop += pxPerTick;
    }, TICK_MS);
  }, [wpm]);

  const stopScroll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Manage running state
  useEffect(() => {
    if (presenting && running) {
      startScroll();
    } else {
      stopScroll();
    }
    return stopScroll;
  }, [presenting, running, startScroll, stopScroll]);

  // Keyboard handler for presentation mode
  useEffect(() => {
    if (!presenting) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setRunning((r) => !r);
      }
      if (e.key === "Escape") {
        exitPresentation();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [presenting]);

  const enterPresentation = () => {
    setPresenting(true);
    setRunning(false);
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, 50);
  };

  const exitPresentation = () => {
    setPresenting(false);
    setRunning(false);
    stopScroll();
  };

  const words = countWords(script);
  const readingSeconds = wpm > 0 ? (words / wpm) * 60 : 0;

  // ── Presentation overlay ─────────────────────────────────────────────────
  if (presenting) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black flex flex-col"
        onClick={() => setRunning((r) => !r)}
      >
        {/* Controls bar */}
        <div
          className="flex items-center justify-between px-6 py-3 bg-black/80 border-b border-white/10 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={() => setRunning((r) => !r)}
            >
              {running ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {running ? "Pausar" : "Reproducir"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={() => setMirrored((m) => !m)}
            >
              <FlipHorizontal2 className="w-4 h-4 mr-1" />
              {mirrored ? "Normal" : "Espejo"}
            </Button>
            <span className="text-white/40 text-xs ml-2">
              Espacio para pausar · ESC para salir
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={exitPresentation}
          >
            <X className="w-4 h-4 mr-1" />
            Salir
          </Button>
        </div>

        {/* Scrolling text area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-hidden px-16 py-12"
          style={{
            transform: mirrored ? "scaleX(-1)" : undefined,
            cursor: "pointer",
          }}
        >
          <p
            className="text-white leading-relaxed whitespace-pre-wrap max-w-4xl mx-auto"
            style={{ fontSize: `${fontSize}px` }}
          >
            {script || "Sin guión cargado."}
          </p>
          {/* Extra padding so last lines scroll fully into view */}
          <div style={{ height: "60vh" }} />
        </div>
      </div>
    );
  }

  // ── Editor ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Teleprompter"
          description="Escribí tu guión y presentalo sin perder el hilo."
        />
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 mt-1"
          onClick={handleSave}
        >
          <Save className="w-4 h-4 mr-2" />
          {saved ? "¡Guardado!" : "Guardar guión"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Script textarea */}
        <div className="lg:col-span-2 space-y-2">
          <label className="text-sm font-medium text-foreground">Guión</label>
          <Textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Escribí tu guión acá..."
            className="min-h-[400px] resize-y font-mono text-sm leading-relaxed"
          />
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{words} palabras</span>
            <span>·</span>
            <span>Tiempo estimado: {formatTime(readingSeconds)}</span>
          </div>
        </div>

        {/* Controls panel */}
        <div className="space-y-6">
          {/* WPM slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Velocidad de lectura</label>
              <span className="text-sm font-mono text-muted-foreground">{wpm} ppm</span>
            </div>
            <input
              type="range"
              min={50}
              max={300}
              step={5}
              value={wpm}
              onChange={(e) => setWpm(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50</span>
              <span>300</span>
            </div>
          </div>

          {/* Font size slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Tamaño de fuente</label>
              <span className="text-sm font-mono text-muted-foreground">{fontSize}px</span>
            </div>
            <input
              type="range"
              min={24}
              max={72}
              step={2}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>24px</span>
              <span>72px</span>
            </div>
          </div>

          {/* Preview font size */}
          <div
            className="rounded-md border border-border bg-black text-white p-4 overflow-hidden"
            style={{ minHeight: 80 }}
          >
            <p
              className="leading-snug line-clamp-2"
              style={{ fontSize: `${Math.min(fontSize, 32)}px` }}
            >
              {script.trim().split(/\s+/).slice(0, 12).join(" ") || "Vista previa del texto..."}
            </p>
          </div>

          {/* Mirror toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={mirrored}
              onClick={() => setMirrored((m) => !m)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                mirrored ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  mirrored ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <FlipHorizontal2 className="w-3.5 h-3.5" />
              Modo espejo horizontal
            </span>
          </div>

          {/* Start button */}
          <Button
            className="w-full h-11 text-base"
            onClick={enterPresentation}
            disabled={!script.trim()}
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            Modo presentación
          </Button>

          {!script.trim() && (
            <p className="text-xs text-muted-foreground text-center">
              Escribí tu guión para activar la presentación.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
