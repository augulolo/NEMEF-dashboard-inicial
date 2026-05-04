"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, Plus, Trash2 } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";

type Tab = "hooks" | "ctas" | "saved";

const PRESET_HOOKS: string[] = [
  "¿Sabías que el 90% de los argentinos nunca invirtió su primer peso?",
  "Lo que los ricos hacen con su plata que nadie te enseña en la escuela:",
  "Si tenés menos de 30 años, prestá atención:",
  "El error financiero más caro que cometen los argentinos:",
  "Esto cambió mi forma de ver el dinero para siempre:",
  "3 cosas que hacen diferente los que se jubilan ricos:",
  "Nadie te va a contar esto sobre el dólar:",
  "La diferencia entre ahorro e inversión que pocos entienden:",
  "¿Por qué tu plata en el banco te está haciendo perder dinero?",
  "El dato de inflación que el gobierno no quiere que veas:",
  "Cometí este error con mis inversiones y me costó caro:",
  "Si empezás a invertir hoy con $10.000 pesos, en 10 años tenés:",
  "La estrategia que usan los fondos de inversión y vos podés copiar:",
  "¿Qué es el interés compuesto y por qué Einstein lo llamó la octava maravilla?",
  "El plazo fijo te está comiendo por la inflación. Alternativas reales:",
  "Todo lo que creías saber sobre el riesgo financiero está mal:",
  "Cómo pasé de no saber nada de finanzas a tener mi primera cartera:",
  "La regla del 50/30/20 que simplifica tus finanzas personales:",
  "¿Cedear o acción local? Esto deberías saber antes de elegir:",
  "El único gráfico que necesitás ver para entender la economía argentina:",
];

const PRESET_CTAS: string[] = [
  "¿Lo sabías? Comentá abajo 👇",
  "Guardá esto para no olvidarlo 📌",
  "Mandáselo a alguien que lo necesita 📲",
  "¿Cuál aplicás vos? Contame en comentarios",
  "Seguime para más contenido como este 💰",
  "¿Querés que profundice en algún punto? Comentá",
  "Compartí si te pareció útil 🔁",
  "¿Estás aplicando esto? Sí / No en los comentarios",
  "Guardá este post y volvé a leerlo en una semana",
  "Etiquetá a alguien que necesita escuchar esto",
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "shrink-0 p-1.5 rounded-md border transition-colors text-xs",
        copied
          ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
          : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
      title="Copiar"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function ItemCard({ text, onDelete, onSave, saved }: { text: string; onDelete?: () => void; onSave?: () => void; saved?: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3 group">
      <p className="flex-1 text-sm leading-relaxed">{text}</p>
      <div className="flex items-center gap-1 shrink-0">
        <CopyButton text={text} />
        {onSave && (
          <button
            onClick={onSave}
            disabled={saved}
            className={cn(
              "p-1.5 rounded-md border transition-colors text-xs",
              saved
                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 cursor-default"
                : "border-border text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 opacity-0 group-hover:opacity-100"
            )}
            title={saved ? "Ya guardado" : "Guardar en Mis guardados"}
          >
            {saved ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
            title="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function HooksPage() {
  const [activeTab, setActiveTab] = useState<Tab>("hooks");
  const [customHooks, setCustomHooks, hydrated] = useLocalStorage<string[]>("nemef_hooks", []);
  const [newHook, setNewHook] = useState("");

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newHook.trim();
    if (!text) return;
    setCustomHooks((prev) => [text, ...prev]);
    setNewHook("");
  };

  const handleDeleteCustom = (idx: number) => {
    setCustomHooks((prev) => prev.filter((_, i) => i !== idx));
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "hooks", label: "Hooks de apertura", count: PRESET_HOOKS.length },
    { key: "ctas", label: "CTAs", count: PRESET_CTAS.length },
    { key: "saved", label: "Mis guardados", count: hydrated ? customHooks.length : undefined },
  ];

  return (
    <>
      <PageHeader
        title="Banco de hooks y CTAs"
        description="Frases de apertura y llamados a la acción listos para usar en tu contenido de finanzas."
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "text-[10px] rounded-full px-1.5 py-0.5 font-medium",
                activeTab === tab.key
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Hooks tab */}
      {activeTab === "hooks" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-4">
            Frases diseñadas para captar atención en los primeros 3 segundos. Adaptálas a tu voz.
          </p>
          {PRESET_HOOKS.map((hook, i) => (
            <ItemCard
              key={i}
              text={hook}
              saved={customHooks.includes(hook)}
              onSave={() => {
                if (!customHooks.includes(hook))
                  setCustomHooks((prev) => [hook, ...prev]);
              }}
            />
          ))}
        </div>
      )}

      {/* CTAs tab */}
      {activeTab === "ctas" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-4">
            Llamados a la acción para cerrar tus posts y aumentar la interacción.
          </p>
          {PRESET_CTAS.map((cta, i) => (
            <ItemCard
              key={i}
              text={cta}
              saved={customHooks.includes(cta)}
              onSave={() => {
                if (!customHooks.includes(cta))
                  setCustomHooks((prev) => [cta, ...prev]);
              }}
            />
          ))}
        </div>
      )}

      {/* Saved tab */}
      {activeTab === "saved" && (
        <div className="space-y-4">
          <Card className="border-primary/30">
            <CardContent className="p-4">
              <form onSubmit={handleAddCustom} className="flex gap-2">
                <Input
                  value={newHook}
                  onChange={(e) => setNewHook(e.target.value)}
                  placeholder="Escribí tu propio hook o CTA…"
                  className="flex-1"
                />
                <Button type="submit" disabled={!newHook.trim()}>
                  <Plus className="h-4 w-4" />
                  Agregar
                </Button>
              </form>
            </CardContent>
          </Card>

          {!hydrated ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : customHooks.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="font-medium">Todavía no guardaste ninguno.</p>
              <p className="text-sm mt-1">Usá el campo de arriba para agregar tus propios hooks y CTAs.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {customHooks.map((hook, i) => (
                <ItemCard key={i} text={hook} onDelete={() => handleDeleteCustom(i)} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
