"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Plus, X, RefreshCw, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { PLATFORMS, PLATFORM_LABELS, type Platform } from "@/lib/calendar";
import { REGION_LABELS, PRESET_CREATORS, type Competitor, type Region } from "@/lib/competitors";
import { cn } from "@/lib/utils";

type ValidState = "idle" | "checking" | "ok" | "warn" | "error";

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

  const [validState, setValidState] = useState<ValidState>("idle");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [validMessage, setValidMessage] = useState("");
  const [showPresets, setShowPresets] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-validate handle after user stops typing (500ms debounce)
  useEffect(() => {
    const h = handle.trim().replace(/^@/, "");
    if (!h || h.length < 2) {
      setValidState("idle");
      setAvatarPreview(null);
      setValidMessage("");
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => validateHandle(h, platform), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, platform]);

  const validateHandle = async (h: string, plat: string) => {
    setValidState("checking");
    setAvatarPreview(null);
    try {
      const res = await fetch("/api/validate-handle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: h, platform: plat }),
      });
      const data = await res.json() as { valid: boolean | null; avatarUrl: string | null; error?: string };
      if (data.valid === true) {
        setValidState("ok");
        setAvatarPreview(data.avatarUrl);
        setValidMessage("Cuenta verificada ✓");
      } else if (data.valid === false) {
        setValidState("error");
        setAvatarPreview(null);
        setValidMessage(`No se encontró @${h} en ${plat}. ¿Es el handle correcto?`);
      } else {
        // null = couldn't check
        setValidState("warn");
        setAvatarPreview(null);
        setValidMessage("No se pudo verificar. Revisá el handle antes de agregar.");
      }
    } catch {
      setValidState("warn");
      setValidMessage("No se pudo verificar.");
    }
  };

  const applyPreset = (preset: typeof PRESET_CREATORS[0]) => {
    setHandle(preset.handle);
    setName(preset.name);
    setPlatform(preset.platform as Platform);
    setRegion(preset.region as Region);
    setShowPresets(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validState === "error") return; // block if explicitly invalid
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
      profilePicUrl: avatarPreview ?? "",
    });
    setHandle("");
    setName("");
    setAvatarPreview(null);
    setValidState("idle");
    setValidMessage("");
    setOpen(false);
  };

  const presetsByPlatform = PRESET_CREATORS.filter(
    (p) => p.platform === platform && p.region === region
  );

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
      <CardContent className="space-y-4">
        {/* Presets rápidos */}
        <div>
          <button
            type="button"
            onClick={() => setShowPresets((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs text-primary border border-primary/30 rounded-md px-3 py-1.5 hover:bg-primary/10 transition-colors"
          >
            {showPresets ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Creadores sugeridos
          </button>
          {showPresets && (
            <div className="mt-2 rounded-lg border bg-background/50 p-3">
              <div className="flex gap-2 mb-2">
                <Select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                  className="text-xs h-7"
                >
                  {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}
                </Select>
                <Select
                  value={region}
                  onChange={(e) => setRegion(e.target.value as Region)}
                  className="text-xs h-7"
                >
                  <option value="argentina">{REGION_LABELS.argentina}</option>
                  <option value="mundo">{REGION_LABELS.mundo}</option>
                </Select>
              </div>
              {presetsByPlatform.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin sugerencias para esta combinación.</p>
              ) : (
                <div className="space-y-1.5">
                  {presetsByPlatform.map((p) => (
                    <button
                      key={p.handle}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="w-full flex items-center gap-3 rounded-md border px-3 py-2 hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
                    >
                      <img
                        src={`https://unavatar.io/${p.platform}/${p.handle.replace(/^@/, "")}`}
                        alt={p.name}
                        className="h-8 w-8 rounded-full object-cover bg-muted border border-border shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{p.handle} · {p.topics}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Handle + validation */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Handle (@usuario)</label>
            <div className="flex items-center gap-2">
              {/* Avatar preview */}
              <div className="shrink-0 h-10 w-10 rounded-full border border-border bg-muted overflow-hidden flex items-center justify-center">
                {validState === "checking" ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="preview"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-[10px] text-muted-foreground">@</span>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="relative">
                  <Input
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="@usuario"
                    required
                    disabled={loading}
                    className={cn(
                      validState === "ok" && "border-emerald-500/60",
                      validState === "error" && "border-red-500/60",
                      validState === "warn" && "border-amber-500/60"
                    )}
                  />
                  {validState === "ok" && (
                    <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400 pointer-events-none" />
                  )}
                  {validState === "error" && (
                    <AlertCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400 pointer-events-none" />
                  )}
                  {validState === "warn" && (
                    <AlertCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400 pointer-events-none" />
                  )}
                </div>
                {validMessage && (
                  <p className={cn(
                    "text-[11px]",
                    validState === "ok" ? "text-emerald-400" :
                    validState === "error" ? "text-red-400" : "text-amber-400"
                  )}>
                    {validMessage}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                  <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
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
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || validState === "error"}>
              {loading ? (
                <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Sincronizando…</>
              ) : (
                <><Plus className="h-3.5 w-3.5 mr-1.5" /> Agregar y sincronizar</>
              )}
            </Button>
          </div>
          {validState === "error" && (
            <p className="text-xs text-red-400">Verificá el handle antes de agregar. Si el handle es correcto, puede ser que la cuenta no esté disponible en {platform}.</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
