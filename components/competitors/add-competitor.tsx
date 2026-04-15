"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { PLATFORMS, PLATFORM_LABELS, type Platform } from "@/lib/calendar";
import { REGION_LABELS, type Competitor, type Region } from "@/lib/competitors";

function mockScrape(): Pick<
  Competitor,
  "followers" | "followersHistory" | "engagementRate" | "postsPerWeek" | "recentPosts"
> {
  const base = Math.floor(5000 + Math.random() * 200000);
  const drift = () => Math.floor((Math.random() - 0.3) * base * 0.03);
  const history: number[] = [];
  let cur = base - 8 * Math.floor(base * 0.01);
  for (let i = 0; i < 8; i++) {
    cur += drift();
    history.push(Math.max(0, cur));
  }
  return {
    followers: history[history.length - 1],
    followersHistory: history,
    engagementRate: +(1 + Math.random() * 7).toFixed(1),
    postsPerWeek: +(0.5 + Math.random() * 15).toFixed(1),
    recentPosts: [],
  };
}

export function AddCompetitor({ onAdd }: { onAdd: (c: Competitor) => void }) {
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
      id: crypto.randomUUID(),
      handle: h.startsWith("@") ? h : `@${h}`,
      name: name.trim() || h,
      platform,
      region,
      ...mockScrape(),
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
            <label className="text-xs font-medium text-muted-foreground">Usuario / Handle</label>
            <Input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@usuario"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nombre</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del creador" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Plataforma</label>
            <Select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABELS[p]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Región</label>
            <Select value={region} onChange={(e) => setRegion(e.target.value as Region)}>
              <option value="argentina">{REGION_LABELS.argentina}</option>
              <option value="mundo">{REGION_LABELS.mundo}</option>
            </Select>
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Agregar</Button>
          </div>
        </form>
        <p className="text-[11px] text-muted-foreground mt-3">
          Los datos iniciales son simulados. Conectá un scraper o API pública para datos reales.
        </p>
      </CardContent>
    </Card>
  );
}
