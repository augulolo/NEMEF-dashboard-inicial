"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Plus, X, RefreshCw } from "lucide-react";
import { PLATFORMS, PLATFORM_LABELS, type Platform } from "@/lib/calendar";
import { REGION_LABELS, type Competitor, type Region } from "@/lib/competitors";

export function AddCompetitor({
  onAdd,
  loading,
}: {
  onAdd: (c: Omit<Competitor, "id">) => void;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [region, setRegion] = useState<Region>("argentina");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = handle.trim();
    if (!h) return;
    onAdd({
      handle: h.startsWith("@") ? h : `@${h}`,
      name: name.trim() || h,
      platform,
      region,
      followers: 0,
      followersHistory: [],
      engagementRate: 0,
      postsPerWeek: 0,
      recentPosts: [],
    });
    setHandle("");
    setName("");
    setOpen(false);
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Agregar creador
      </Button>
    );
  }

  return (
    <Card className="border-primary/40">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">Seguir nuevo creador</CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Cerrar">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Handle (@usuario)</label>
            <Input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@usuario"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nombre (opcional)</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del creador"
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Plataforma</label>
            <Select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              disabled={loading}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABELS[p]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Región</label>
            <Select
              value={region}
              onChange={(e) => setRegion(e.target.value as Region)}
              disabled={loading}
            >
              <option value="argentina">{REGION_LABELS.argentina}</option>
              <option value="mundo">{REGION_LABELS.mundo}</option>
            </Select>
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Sincronizando…
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Agregar y sincronizar
                </>
              )}
            </Button>
          </div>
        </form>
        <p className="text-[11px] text-muted-foreground mt-3">
          Los datos reales se sincronizarán automáticamente al agregar.
        </p>
      </CardContent>
    </Card>
  );
}
