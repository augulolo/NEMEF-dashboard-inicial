"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Clock, Send, Pin, Download, Cloud, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { supabase } from "@/lib/supabase";

type Note = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
};

// ── localStorage helpers (fallback + migración) ───────────────────────────────
const LS_KEY = "nemef_notes";
const LS_MIGRATED_KEY = "nemef_notes_migrated_v1";

function lsLoad(): Note[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "recién";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function dbLoad(): Promise<Note[] | null> {
  const { data, error } = await supabase
    .from("notes")
    .select("id, content, pinned, created_at, updated_at")
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) return null;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    content: r.content as string,
    pinned: r.pinned as boolean,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }));
}

async function dbInsert(note: Note): Promise<boolean> {
  const { error } = await supabase.from("notes").insert({
    id: note.id,
    content: note.content,
    pinned: note.pinned,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  });
  return !error;
}

async function dbUpdate(id: string, patch: Partial<{ content: string; pinned: boolean }>): Promise<boolean> {
  const { error } = await supabase.from("notes").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  return !error;
}

async function dbDelete(id: string): Promise<boolean> {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  return !error;
}

export default function NotasPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [useDB, setUseDB] = useState(false); // true when Supabase is reachable
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const dbNotes = await dbLoad();

      if (dbNotes !== null) {
        // Supabase accesible
        setUseDB(true);

        // ── Migración one-shot desde localStorage ──────────────────────────
        const alreadyMigrated = localStorage.getItem(LS_MIGRATED_KEY);
        if (!alreadyMigrated) {
          const lsNotes = lsLoad();
          if (lsNotes.length > 0 && dbNotes.length === 0) {
            // Insertar todas en Supabase
            await Promise.all(lsNotes.map(dbInsert));
            localStorage.setItem(LS_MIGRATED_KEY, "1");
            const migrated = await dbLoad();
            const sorted = sortNotes(migrated ?? []);
            setNotes(sorted);
            if (sorted.length > 0) { setActiveId(sorted[0].id); setContent(sorted[0].content); }
            toast(`${lsNotes.length} notas migradas a Supabase ✓`);
            return;
          }
          localStorage.setItem(LS_MIGRATED_KEY, "1");
        }

        const sorted = sortNotes(dbNotes);
        setNotes(sorted);
        if (sorted.length > 0) { setActiveId(sorted[0].id); setContent(sorted[0].content); }
      } else {
        // Supabase no disponible — usar localStorage
        setUseDB(false);
        const lsNotes = sortNotes(lsLoad());
        setNotes(lsNotes);
        if (lsNotes.length > 0) { setActiveId(lsNotes[0].id); setContent(lsNotes[0].content); }
      }
    })();
  }, []);

  const activeNote = notes.find((n) => n.id === activeId);

  // ── Persistencia ───────────────────────────────────────────────────────────
  const persist = useCallback((updated: Note[]) => {
    if (!useDB) {
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
    }
    setNotes(sortNotes(updated));
  }, [useDB]);

  // ── Guardar contenido (debounced) ──────────────────────────────────────────
  const scheduleContentSave = useCallback((id: string, text: string) => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      if (useDB) {
        await dbUpdate(id, { content: text });
      } else {
        // localStorage update is already done inline
      }
      setSaving(false);
    }, 800);
  }, [useDB]);

  const handleChange = (val: string) => {
    setContent(val);
    if (!activeId) return;
    const now = new Date().toISOString();
    const updated = notes.map((n) =>
      n.id === activeId ? { ...n, content: val, updatedAt: now } : n
    );
    persist(updated);
    scheduleContentSave(activeId, val);
  };

  // ── Seleccionar nota ───────────────────────────────────────────────────────
  const handleSelect = (note: Note) => {
    setActiveId(note.id);
    setContent(note.content);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  // ── Nueva nota ─────────────────────────────────────────────────────────────
  const handleNew = async () => {
    const now = new Date().toISOString();
    const note: Note = { id: crypto.randomUUID(), content: "", createdAt: now, updatedAt: now, pinned: false };
    if (useDB) {
      const ok = await dbInsert(note);
      if (!ok) { toast("Error al crear nota", "error"); return; }
    }
    persist([note, ...notes]);
    setActiveId(note.id);
    setContent("");
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  // ── Eliminar nota ──────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (useDB) {
      const ok = await dbDelete(id);
      if (!ok) { toast("Error al eliminar nota", "error"); return; }
    }
    const updated = notes.filter((n) => n.id !== id);
    persist(updated);
    if (id === activeId) {
      const next = updated[0] ?? null;
      setActiveId(next?.id ?? null);
      setContent(next?.content ?? "");
    }
    toast("Nota eliminada");
  };

  // ── Anclar / desanclar ─────────────────────────────────────────────────────
  const handlePin = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const newPinned = !note.pinned;
    if (useDB) await dbUpdate(id, { pinned: newPinned });
    persist(notes.map((n) => n.id === id ? { ...n, pinned: newPinned } : n));
  };

  // ── Convertir a borrador ───────────────────────────────────────────────────
  const handleConvertToPost = async () => {
    if (!content.trim()) return;
    const { error } = await supabase.from("posts").insert({
      caption: content.trim(),
      type: "photo",
      status: "draft",
      scheduled_date: null,
    });
    if (!error) toast("Borrador creado en Gestor de Instagram ✓");
    else toast("Error al crear borrador", "error");
  };

  // ── Exportar todas ─────────────────────────────────────────────────────────
  const handleExportAll = () => {
    if (notes.length === 0) return;
    const exportContent = notes
      .map((n, i) => {
        const date = new Date(n.updatedAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
        const pin = n.pinned ? " 📌" : "";
        return `# Nota ${i + 1}${pin}\n_${date}_\n\n${n.content}`;
      })
      .join("\n\n---\n\n");
    const blob = new Blob([exportContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notas-nemef-${new Date().toLocaleDateString("en-CA")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const preview = (c: string) => {
    const first = c.trim().split("\n")[0] || "Nota vacía";
    return first.slice(0, 40) + (first.length > 40 ? "…" : "");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between gap-4 mb-6">
        <PageHeader
          title="Notas rápidas"
          description="Ideas, borradores y apuntes antes de convertirlos en posts."
        />
        <div className="flex items-center gap-2">
          {/* Indicador de persistencia */}
          <span className={cn(
            "inline-flex items-center gap-1 text-[11px] border rounded-full px-2 py-0.5",
            useDB
              ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
              : "text-amber-400 border-amber-500/30 bg-amber-500/5"
          )}>
            {useDB
              ? <><Cloud className="h-3 w-3" /> Supabase</>
              : <><HardDrive className="h-3 w-3" /> Local</>
            }
          </span>
          {notes.length > 0 && (
            <button
              onClick={handleExportAll}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Exportar todas las notas como Markdown"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar .md
            </button>
          )}
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva nota
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-20 text-muted-foreground text-center">
          <p className="text-sm mb-3">No tenés notas todavía.</p>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-1" />
            Crear primera nota
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-[260px_1fr] flex-1 min-h-0">
          {/* Lista */}
          <div className="flex flex-col gap-1 overflow-y-auto">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => handleSelect(note)}
                className={cn(
                  "group relative rounded-lg border p-3 cursor-pointer transition-colors",
                  activeId === note.id
                    ? "bg-primary/10 border-primary/50"
                    : "hover:bg-accent border-transparent"
                )}
              >
                <div className="flex items-start gap-1.5">
                  {note.pinned && (
                    <Pin className="h-3 w-3 text-primary shrink-0 mt-0.5 rotate-45" />
                  )}
                  <p className="text-sm font-medium truncate leading-snug flex-1 min-w-0">
                    {preview(note.id === activeId ? content : note.content)}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo(note.updatedAt)}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePin(note.id); }}
                      className={cn(
                        "text-muted-foreground hover:text-primary transition-colors",
                        note.pinned && "text-primary opacity-100"
                      )}
                      aria-label={note.pinned ? "Desanclar nota" : "Anclar nota"}
                      title={note.pinned ? "Desanclar" : "Anclar arriba"}
                    >
                      <Pin className="h-3.5 w-3.5 rotate-45" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                      className="text-muted-foreground hover:text-red-400 transition-colors"
                      aria-label="Eliminar nota"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Editor */}
          {activeId && (
            <div className="flex flex-col rounded-lg border bg-card overflow-hidden">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Empezá a escribir tu idea…"
                className="flex-1 w-full resize-none bg-transparent p-5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground min-h-[400px]"
                autoFocus
              />
              <div className="border-t px-5 py-2 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {content.length} caracteres · {content.trim().split(/\s+/).filter(Boolean).length} palabras
                </span>
                <div className="flex items-center gap-3">
                  {saving && (
                    <span className="text-[11px] text-muted-foreground animate-pulse">Guardando…</span>
                  )}
                  {!saving && activeNote && (
                    <span className="text-xs text-muted-foreground">
                      Guardado {timeAgo(activeNote.updatedAt)}
                    </span>
                  )}
                  <button
                    onClick={handleConvertToPost}
                    disabled={!content.trim()}
                    className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Guardar como borrador en Gestor de Instagram"
                  >
                    <Send className="h-3 w-3" />
                    Convertir a borrador
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
