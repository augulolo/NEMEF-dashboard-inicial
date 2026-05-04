"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Clock, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { supabase } from "@/lib/supabase";

type Note = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "nemef_notes";

function loadNotes(): Note[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
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

export default function NotasPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const loaded = loadNotes();
    setNotes(loaded);
    if (loaded.length > 0) {
      setActiveId(loaded[0].id);
      setContent(loaded[0].content);
    }
  }, []);

  const activeNote = notes.find((n) => n.id === activeId);

  const handleSelect = (note: Note) => {
    // Auto-save current before switching
    if (activeId && content !== activeNote?.content) {
      const updated = notes.map((n) =>
        n.id === activeId ? { ...n, content, updatedAt: new Date().toISOString() } : n
      );
      setNotes(updated);
      saveNotes(updated);
    }
    setActiveId(note.id);
    setContent(note.content);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleNew = () => {
    // Save current first
    if (activeId) {
      const updated = notes.map((n) =>
        n.id === activeId ? { ...n, content, updatedAt: new Date().toISOString() } : n
      );
      setNotes(updated);
      saveNotes(updated);
    }
    const now = new Date().toISOString();
    const note: Note = { id: crypto.randomUUID(), content: "", createdAt: now, updatedAt: now };
    const newNotes = [note, ...notes];
    setNotes(newNotes);
    saveNotes(newNotes);
    setActiveId(note.id);
    setContent("");
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleChange = (val: string) => {
    setContent(val);
    if (!activeId) return;
    const updated = notes.map((n) =>
      n.id === activeId ? { ...n, content: val, updatedAt: new Date().toISOString() } : n
    );
    setNotes(updated);
    saveNotes(updated);
  };

  const handleDelete = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
    if (id === activeId) {
      if (updated.length > 0) {
        setActiveId(updated[0].id);
        setContent(updated[0].content);
      } else {
        setActiveId(null);
        setContent("");
      }
    }
    toast("Nota eliminada");
  };

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
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-1" />
          Nueva nota
        </Button>
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
                <p className="text-sm font-medium truncate leading-snug">
                  {preview(note.id === activeId ? content : note.content)}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo(note.updatedAt)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                    aria-label="Eliminar nota"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
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
                  {activeNote && (
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
