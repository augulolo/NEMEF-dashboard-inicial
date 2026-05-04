"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, Plus, Trash2, Search, X } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";

type Tab = "hooks" | "ctas" | "saved";

const PRESET_HOOKS: string[] = [
  "¿Qué porcentaje de tu ingreso estás ahorrando hoy? Esto es lo que dicen los datos:",
  "La diferencia entre ahorro e inversión que cambia todo en tus finanzas:",
  "Interés compuesto: el concepto más subestimado de las finanzas personales.",
  "¿Por qué los depósitos a plazo fijo no alcanzan para proteger tu capital?",
  "El primer paso para armar una cartera de inversión desde cero:",
  "Inflación, tipo de cambio y tasa de interés: cómo se relacionan en Argentina:",
  "¿Qué es un fondo de emergencia y cuánto deberías tener en el tuyo?",
  "Cedears: qué son, cómo funcionan y qué riesgos hay que considerar.",
  "La regla del 50/30/20 aplicada a la economía argentina actual:",
  "¿Cuánto cuesta realmente no tener un plan financiero?",
  "Riesgo y rendimiento: la relación que todo inversor necesita entender.",
  "¿Qué pasa con tu dinero si no lo invertís? Los números concretos:",
  "Diversificación de cartera: por qué no conviene concentrar todo en un solo activo.",
  "¿Qué es el dólar MEP y cómo se diferencia del tipo de cambio oficial?",
  "Tres conceptos que cambian la forma de leer la economía argentina:",
  "El error más común al empezar a invertir — y cómo evitarlo:",
  "¿Qué información financiera deberías revisar cada mes?",
  "Plazo fijo vs. bono CER: análisis comparativo en contexto inflacionario.",
  "Presupuesto personal: por qué no funciona la mayoría de las veces.",
  "Cómo pensar el largo plazo cuando la economía cambia cada semana:",
  "Bitcoin y criptomonedas: qué lugar ocupan en una cartera equilibrada.",
  "¿Qué significa realmente 'liquidez' y por qué importa en tus finanzas?",
  "El impacto de las decisiones financieras chicas sobre el resultado final:",
  "Jubilación en Argentina: qué alternativas existen más allá del sistema público.",
  "¿Cuándo conviene refinanciar una deuda y cuándo no?",
  "Finanzas personales para jóvenes: por dónde empezar con poco capital.",
  "Cómo leer un balance de empresa antes de invertir en acciones:",
  "El costo de oportunidad: el concepto que define cada decisión financiera.",
];

const PRESET_CTAS: string[] = [
  "¿Qué piensan sobre esto? Leo sus comentarios 👇",
  "Guardá este post para consultarlo cuando lo necesites 📌",
  "¿Hay algo que no quedó claro? Preguntá en comentarios",
  "Si te resultó útil, compartilo con alguien que esté empezando 🔁",
  "¿Cuál de estos puntos ya estás aplicando? Contame",
  "¿Qué tema financiero querés que desarrollemos la semana que viene?",
  "Si tenés dudas sobre cómo aplicarlo en tu caso, comentá",
  "Guardá esto y revisalo en 3 meses para ver cuánto avanzaste",
  "¿Coincidís con este análisis? ¿Agregarías algo?",
  "Seguí la cuenta para ver el próximo capítulo de este tema 📈",
  "¿Ya sabías esto? Contame en qué punto estás vos",
  "¿Qué te falta para empezar? Escribilo abajo y buscamos juntos la respuesta",
  "Etiquetá a alguien con quien estés planeando sus finanzas",
  "¿De 1 a 10, qué tan aplicable es esto en tu situación actual?",
  "Activá las notificaciones para no perderte el próximo análisis 🔔",
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
  const [search, setSearch] = useState("");

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
      <div className="flex gap-1 mb-0 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSearch(""); }}
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

      {/* Search bar (hooks + ctas tabs only) */}
      {activeTab !== "saved" && (
        <div className="relative my-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === "hooks" ? "Buscar hooks…" : "Buscar CTAs…"}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Hooks tab */}
      {activeTab === "hooks" && (() => {
        const filtered = search.trim()
          ? PRESET_HOOKS.filter((h) => h.toLowerCase().includes(search.toLowerCase()))
          : PRESET_HOOKS;
        return (
          <div className="space-y-2">
            {search.trim() && (
              <p className="text-xs text-muted-foreground mb-3">
                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para "{search}"
              </p>
            )}
            {!search.trim() && (
              <p className="text-xs text-muted-foreground mb-4">
                Frases diseñadas para captar atención en los primeros 3 segundos. Adaptálas a tu voz.
              </p>
            )}
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin resultados.</p>
            ) : (
              filtered.map((hook, i) => (
                <ItemCard
                  key={i}
                  text={hook}
                  saved={customHooks.includes(hook)}
                  onSave={() => {
                    if (!customHooks.includes(hook))
                      setCustomHooks((prev) => [hook, ...prev]);
                  }}
                />
              ))
            )}
          </div>
        );
      })()}

      {/* CTAs tab */}
      {activeTab === "ctas" && (() => {
        const filtered = search.trim()
          ? PRESET_CTAS.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
          : PRESET_CTAS;
        return (
          <div className="space-y-2">
            {search.trim() && (
              <p className="text-xs text-muted-foreground mb-3">
                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para "{search}"
              </p>
            )}
            {!search.trim() && (
              <p className="text-xs text-muted-foreground mb-4">
                Llamados a la acción para cerrar tus posts y aumentar la interacción.
              </p>
            )}
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin resultados.</p>
            ) : (
              filtered.map((cta, i) => (
                <ItemCard
                  key={i}
                  text={cta}
                  saved={customHooks.includes(cta)}
                  onSave={() => {
                    if (!customHooks.includes(cta))
                      setCustomHooks((prev) => [cta, ...prev]);
                  }}
                />
              ))
            )}
          </div>
        );
      })()}

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
