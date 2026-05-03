"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Plus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PLATFORM_LABELS, PLATFORM_STYLES, STATUS_LABELS_CAL,
  PLATFORMS, type Platform, type CalendarStatus, type CalendarItem,
} from "@/lib/calendar";

export function DayDetail({
  date,
  items,
  onAdd,
}: {
  date: string;
  items: CalendarItem[];
  onAdd?: (item: Omit<CalendarItem, "id">) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [status, setStatus] = useState<CalendarStatus>("scheduled");
  const [saving, setSaving] = useState(false);

  const pretty = new Date(date + "T00:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !onAdd) return;
    setSaving(true);
    try {
      await onAdd({ title: title.trim(), platform, status, date });
      setTitle("");
      setPlatform("instagram");
      setStatus("scheduled");
      setAdding(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base capitalize">{pretty}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {items.length === 0 ? "Sin contenido este día" : `${items.length} ${items.length === 1 ? "ítem" : "ítems"}`}
            </p>
          </div>
          {onAdd && !adding && (
            <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="shrink-0">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Agregar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Form para agregar */}
        {adding && (
          <form onSubmit={handleAdd} className="rounded-lg border border-primary/40 bg-background/40 p-3 space-y-2 mb-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título del contenido…"
              className="text-sm h-8"
              autoFocus
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <Select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                ))}
              </Select>
              <Select value={status} onChange={(e) => setStatus(e.target.value as CalendarStatus)}>
                <option value="scheduled">Programado</option>
                <option value="published">Publicado</option>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="flex-1" disabled={saving}>
                <Check className="h-3.5 w-3.5 mr-1" />
                {saving ? "Guardando…" : "Guardar"}
              </Button>
              <Button type="button" size="sm" variant="outline" className="flex-1" onClick={() => { setAdding(false); setTitle(""); }}>
                <X className="h-3.5 w-3.5 mr-1" />
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {items.map((it) => {
          const style = PLATFORM_STYLES[it.platform];
          return (
            <div
              key={it.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-md border p-2.5 text-sm",
                "bg-background/40"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn("h-2 w-2 rounded-full shrink-0", style.dot)} />
                <div className="min-w-0">
                  <p className="truncate">{it.title}</p>
                  <p className="text-xs text-muted-foreground">{PLATFORM_LABELS[it.platform]}</p>
                </div>
              </div>
              <Badge variant={it.status === "published" ? "published" : "scheduled"}>
                {STATUS_LABELS_CAL[it.status]}
              </Badge>
            </div>
          );
        })}

        {items.length === 0 && !adding && (
          <p className="text-xs text-muted-foreground text-center py-4">
            {onAdd ? "Sin contenido — hacé clic en Agregar para planificar." : "Sin contenido este día."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
