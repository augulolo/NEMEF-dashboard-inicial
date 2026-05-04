"use client";

import { useState } from "react";
import { X, Plus, Rss, RotateCcw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FEEDS } from "@/lib/news";
import { cn } from "@/lib/utils";

const CUSTOM_FEEDS_KEY = "nemef_custom_feeds_v1";

export interface CustomFeed { name: string; url: string }

export function loadCustomFeeds(): CustomFeed[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(CUSTOM_FEEDS_KEY) ?? "[]"); } catch { return []; }
}
export function saveCustomFeeds(feeds: CustomFeed[]) {
  localStorage.setItem(CUSTOM_FEEDS_KEY, JSON.stringify(feeds));
}

export function FeedManager({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [customFeeds, setCustomFeeds] = useState<CustomFeed[]>(() => loadCustomFeeds());
  const [disabledDefaults, setDisabledDefaults] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("nemef_disabled_feeds_v1") ?? "[]")); } catch { return new Set(); }
  });
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState("");

  const toggleDefault = (url: string) => {
    setDisabledDefaults((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url); else next.add(url);
      return next;
    });
  };

  const addCustom = () => {
    setError("");
    if (!newName.trim() || !newUrl.trim()) { setError("Completá nombre y URL"); return; }
    if (!newUrl.startsWith("http")) { setError("La URL debe comenzar con http:// o https://"); return; }
    if (customFeeds.some((f) => f.url === newUrl.trim())) { setError("Esta URL ya está agregada"); return; }
    setCustomFeeds((prev) => [...prev, { name: newName.trim(), url: newUrl.trim() }]);
    setNewName("");
    setNewUrl("");
  };

  const removeCustom = (url: string) => {
    setCustomFeeds((prev) => prev.filter((f) => f.url !== url));
  };

  const handleSave = () => {
    saveCustomFeeds(customFeeds);
    localStorage.setItem("nemef_disabled_feeds_v1", JSON.stringify([...disabledDefaults]));
    onSave();
    onClose();
  };

  const handleReset = () => {
    setCustomFeeds([]);
    setDisabledDefaults(new Set());
  };

  const totalActive = FEEDS.filter((f) => !disabledDefaults.has(f.url)).length + customFeeds.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-xl border bg-card shadow-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Rss className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Gestionar fuentes RSS</h2>
            <span className="text-xs text-muted-foreground border rounded px-1.5 py-0.5">{totalActive} activas</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Fuentes por defecto */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Fuentes predeterminadas
            </h3>
            <div className="space-y-1.5">
              {FEEDS.map((feed) => {
                const active = !disabledDefaults.has(feed.url);
                return (
                  <div key={feed.url} className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                    active ? "bg-card" : "bg-muted/20 opacity-60"
                  )}>
                    <button
                      onClick={() => toggleDefault(feed.url)}
                      className={cn(
                        "h-4 w-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
                        active ? "bg-primary border-primary" : "border-border"
                      )}
                    >
                      {active && <span className="text-[9px] text-primary-foreground font-bold">✓</span>}
                    </button>
                    <span className="text-sm font-medium flex-1">{feed.name}</span>
                    <a href={feed.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fuentes personalizadas */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Fuentes personalizadas ({customFeeds.length})
            </h3>
            {customFeeds.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Todavía no agregaste fuentes personalizadas.</p>
            ) : (
              <div className="space-y-1.5 mb-3">
                {customFeeds.map((feed) => (
                  <div key={feed.url} className="flex items-center gap-3 rounded-lg border px-3 py-2 bg-card">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{feed.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{feed.url}</p>
                    </div>
                    <a href={feed.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => removeCustom(feed.url)}
                      className="text-muted-foreground hover:text-red-400 transition-colors shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* Agregar nueva */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground">Agregar fuente RSS</p>
              <div className="flex gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nombre (ej: Clarín Economía)"
                  className="flex-1"
                />
                <Input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="URL del feed RSS"
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && addCustom()}
                />
                <Button type="button" size="sm" onClick={addCustom} className="shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between shrink-0">
          <button
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restaurar por defecto
          </button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar cambios</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
