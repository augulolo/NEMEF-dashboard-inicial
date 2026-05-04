"use client";

import { useEffect, useState } from "react";
import { TrendingUp, RefreshCw } from "lucide-react";
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

function fmt(val: number | null, prefix = "$", decimals = 0): string {
  if (val === null) return "—";
  return `${prefix}${val.toLocaleString("es-AR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

function fmtUsd(val: number | null): string {
  if (val === null) return "—";
  if (val >= 1_000) return `$${(val / 1000).toFixed(1)}K`;
  return `$${val.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

interface TickerItem {
  label: string;
  value: string;
  sub?: string;
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
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => load(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const items: TickerItem[] = data
    ? [
        { label: "Dólar oficial", value: fmt(data.dolarOficial), sub: "venta" },
        { label: "Dólar blue", value: fmt(data.dolarBlue), sub: "venta" },
        ...(data.dolarMep !== null ? [{ label: "Dólar MEP", value: fmt(data.dolarMep), sub: "venta" }] : []),
        ...(data.dolarCcl !== null ? [{ label: "Contado c/liq", value: fmt(data.dolarCcl), sub: "venta" }] : []),
        { label: "Bitcoin", value: fmtUsd(data.btcUsd), sub: "USD" },
        { label: "Ethereum", value: fmtUsd(data.ethUsd), sub: "USD" },
        ...(data.inflacionMensual !== null
          ? [{ label: "Inflación mensual", value: `${data.inflacionMensual}%`, sub: "BCRA" }]
          : []),
        ...(data.tasaPoliticaMonetaria !== null
          ? [{ label: "Tasa política mon.", value: `${data.tasaPoliticaMonetaria}%`, sub: "BCRA TNA" }]
          : []),
      ]
    : [];

  const updatedAt = data?.fetchedAt
    ? new Date(data.fetchedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          Mercado en tiempo real
        </h2>
        <div className="flex items-center gap-2">
          {updatedAt && (
            <span className="text-[10px] text-muted-foreground">Actualizado {updatedAt}</span>
          )}
          <button
            onClick={() => load(true)}
            disabled={refreshing || loading}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            aria-label="Actualizar datos de mercado"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-muted/30 p-3 animate-pulse h-16" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          No se pudieron obtener los datos de mercado.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {items.map((item) => (
            <div key={item.label} className="rounded-lg border bg-muted/20 p-3">
              <p className="text-[10px] text-muted-foreground mb-1 leading-none">{item.label}</p>
              <p className="text-lg font-semibold tabular-nums leading-none">{item.value}</p>
              {item.sub && (
                <p className="text-[10px] text-muted-foreground mt-1">{item.sub}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
