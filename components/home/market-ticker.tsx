"use client";

import { useEffect, useState } from "react";
import { TrendingUp, RefreshCw, DollarSign, Bitcoin, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketData {
  dolarOficial: number | null;
  dolarBlue: number | null;
  dolarMep: number | null;
  dolarCcl: number | null;
  btcUsd: number | null;
  ethUsd: number | null;
  inflacionMensual: number | null;
  tasaPoliticaMonetaria: number | null;
  fetchedAt: string;
}

function fmtArs(val: number | null): string {
  if (val === null) return "—";
  return `$ ${val.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtUsd(val: number | null): string {
  if (val === null) return "—";
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1000).toFixed(1)}K`;
  return `$${val.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtPct(val: number | null): string {
  if (val === null) return "—";
  return `${val.toFixed(1)}%`;
}

interface CardItem {
  key: string;
  label: string;           // Título principal destacado
  description: string;     // Subtítulo aclaratorio
  value: string;
  badge?: string;          // Chip pequeño (ej: "venta", "TNA", "USD")
  accent: string;          // Color de acento
}

interface Group {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;           // Color del header del grupo
  items: CardItem[];
}

function buildGroups(data: MarketData): Group[] {
  const groups: Group[] = [];

  // ── Dólar ──────────────────────────────────────────────────
  const dolarItems: CardItem[] = [];
  if (data.dolarOficial !== null)
    dolarItems.push({
      key: "oficial",
      label: "OFICIAL",
      description: "Tipo de cambio regulado (BCRA)",
      value: fmtArs(data.dolarOficial),
      badge: "venta",
      accent: "text-emerald-400",
    });
  if (data.dolarBlue !== null)
    dolarItems.push({
      key: "blue",
      label: "BLUE",
      description: "Mercado informal / paralelo",
      value: fmtArs(data.dolarBlue),
      badge: "venta",
      accent: "text-sky-400",
    });
  if (data.dolarMep !== null)
    dolarItems.push({
      key: "mep",
      label: "MEP",
      description: "Dólar bolsa — vía bonos locales",
      value: fmtArs(data.dolarMep),
      badge: "venta",
      accent: "text-violet-400",
    });
  if (data.dolarCcl !== null)
    dolarItems.push({
      key: "ccl",
      label: "CCL",
      description: "Contado con liquidación",
      value: fmtArs(data.dolarCcl),
      badge: "venta",
      accent: "text-fuchsia-400",
    });

  if (dolarItems.length > 0)
    groups.push({
      id: "dolar",
      title: "Dólar",
      icon: DollarSign,
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
      items: dolarItems,
    });

  // ── Cripto ─────────────────────────────────────────────────
  const criptoItems: CardItem[] = [];
  if (data.btcUsd !== null)
    criptoItems.push({
      key: "btc",
      label: "BITCOIN",
      description: "BTC — precio spot",
      value: fmtUsd(data.btcUsd),
      badge: "USD",
      accent: "text-orange-400",
    });
  if (data.ethUsd !== null)
    criptoItems.push({
      key: "eth",
      label: "ETHEREUM",
      description: "ETH — precio spot",
      value: fmtUsd(data.ethUsd),
      badge: "USD",
      accent: "text-indigo-400",
    });

  if (criptoItems.length > 0)
    groups.push({
      id: "cripto",
      title: "Cripto",
      icon: Bitcoin,
      color: "text-orange-400 border-orange-500/30 bg-orange-500/5",
      items: criptoItems,
    });

  // ── BCRA / Macro ───────────────────────────────────────────
  const macroItems: CardItem[] = [];
  if (data.inflacionMensual !== null)
    macroItems.push({
      key: "inflacion",
      label: "INFLACIÓN",
      description: "Variación mensual (IPC)",
      value: fmtPct(data.inflacionMensual),
      badge: "BCRA",
      accent: "text-red-400",
    });
  if (data.tasaPoliticaMonetaria !== null)
    macroItems.push({
      key: "tpm",
      label: "TASA POLÍTICA",
      description: "Tasa de política monetaria",
      value: fmtPct(data.tasaPoliticaMonetaria),
      badge: "TNA",
      accent: "text-amber-400",
    });

  if (macroItems.length > 0)
    groups.push({
      id: "macro",
      title: "Macro",
      icon: BarChart2,
      color: "text-amber-400 border-amber-500/30 bg-amber-500/5",
      items: macroItems,
    });

  return groups;
}

export function MarketTicker() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch("/api/market-data");
      if (res.ok) setData(await res.json());
    } catch { /* silencioso */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    load();
    const iv = setInterval(() => load(), 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  const groups = data ? buildGroups(data) : [];

  const updatedAt = data?.fetchedAt
    ? new Date(data.fetchedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold tracking-tight">Mercado en tiempo real</span>
          <span className="text-[10px] text-muted-foreground border rounded px-1.5 py-0.5 ml-1">AR</span>
        </div>
        <div className="flex items-center gap-3">
          {updatedAt && (
            <span className="text-[11px] text-muted-foreground hidden sm:block">
              Actualizado {updatedAt}
            </span>
          )}
          <button
            onClick={() => load(true)}
            disabled={refreshing || loading}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            aria-label="Actualizar"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-muted/30 animate-pulse h-20" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No se pudieron obtener los datos de mercado.
        </p>
      ) : (
        <div className="divide-y">
          {groups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.id} className="p-4">
                {/* Group label */}
                <div className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest mb-3",
                  group.color
                )}>
                  <Icon className="h-3 w-3" />
                  {group.title}
                </div>

                {/* Cards */}
                <div className={cn(
                  "grid gap-3",
                  group.items.length <= 2 ? "grid-cols-2" :
                  group.items.length === 3 ? "grid-cols-3" :
                  "grid-cols-2 sm:grid-cols-4"
                )}>
                  {group.items.map((item) => (
                    <div
                      key={item.key}
                      className="rounded-lg border bg-muted/10 hover:bg-muted/20 transition-colors p-3.5 flex flex-col gap-1.5"
                    >
                      {/* Label destacado */}
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn(
                          "text-[11px] font-black uppercase tracking-widest leading-none",
                          item.accent
                        )}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] font-semibold text-muted-foreground border rounded px-1 py-0.5 leading-none shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {/* Valor — número grande */}
                      <span className="text-2xl font-bold tabular-nums leading-none tracking-tight">
                        {item.value}
                      </span>

                      {/* Descripción */}
                      <span className="text-[10px] text-muted-foreground leading-tight">
                        {item.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
