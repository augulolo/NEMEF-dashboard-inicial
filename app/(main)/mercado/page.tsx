"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { RefreshCw, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FullMarketData, MarketQuote } from "@/app/api/market-data/route";

// ── Quote card ─────────────────────────────────────────────────────────────────
function QuoteCard({ q }: { q: MarketQuote }) {
  const pct = q.changePct;
  const positive = pct !== null && pct > 0;
  const negative = pct !== null && pct < 0;
  const neutral  = pct === null || pct === 0;

  const fmtPrice = (v: number | null, cur: string): string => {
    if (v === null) return "—";
    if (cur === "USD" || cur === "EUR" || cur === "GBP") {
      return v >= 10000
        ? v.toLocaleString("en-US", { maximumFractionDigits: 0 })
        : v >= 100
          ? v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    }
    return v.toLocaleString("es-AR", { maximumFractionDigits: 2 });
  };

  return (
    <div className={cn(
      "rounded-lg border bg-card px-4 py-3 flex items-center justify-between gap-3 transition-colors hover:bg-accent/30",
      positive && "border-emerald-500/20",
      negative && "border-red-500/20",
    )}>
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{q.name}</p>
        <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">{q.symbol}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold tabular-nums text-foreground">
          {q.currency !== "USD" && q.currency !== "%" ? (
            <span className="text-[10px] text-muted-foreground mr-0.5">{q.currency}</span>
          ) : null}
          {fmtPrice(q.price, q.currency)}
        </p>
        <div className={cn(
          "flex items-center justify-end gap-0.5 text-xs font-semibold tabular-nums mt-0.5",
          positive ? "text-emerald-400" : negative ? "text-red-400" : "text-muted-foreground"
        )}>
          {positive && <TrendingUp className="h-3 w-3" />}
          {negative && <TrendingDown className="h-3 w-3" />}
          {neutral  && <Minus className="h-3 w-3" />}
          {pct !== null ? `${pct > 0 ? "+" : ""}${pct.toFixed(2)}%` : "—"}
        </div>
      </div>
    </div>
  );
}

// ── Argentine dollar card ──────────────────────────────────────────────────────
function DollarCard({ label, buy, sell }: { label: string; buy: number | null; sell: number | null }) {
  if (!buy && !sell) return null;
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-xs font-medium text-foreground mb-2">{label}</p>
      <div className="flex items-center gap-4 text-sm">
        {buy && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Compra</p>
            <p className="font-bold tabular-nums text-foreground">${buy.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</p>
          </div>
        )}
        {sell && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Venta</p>
            <p className="font-bold tabular-nums text-foreground">${sell.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</p>
          </div>
        )}
        {buy && sell && (
          <div className="ml-auto">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Spread</p>
            <p className="font-semibold tabular-nums text-muted-foreground text-xs">${(sell - buy).toLocaleString("es-AR", { maximumFractionDigits: 0 })}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 mt-1">{children}</h3>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "americas", label: "Américas" },
  { key: "europe_asia", label: "Europa & Asia" },
  { key: "commodities", label: "Commodities" },
  { key: "futures", label: "Futuros" },
  { key: "forex", label: "Divisas" },
  { key: "crypto", label: "Cripto" },
  { key: "argentina", label: "🇦🇷 Argentina" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const AUTO_REFRESH_S = 120; // 2 min

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MercadoPage() {
  const [data, setData]       = useState<FullMarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<TabKey>("americas");
  const [countdown, setCountdown] = useState(AUTO_REFRESH_S);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/market-data");
      const d = await res.json() as FullMarketData;
      setData(d);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdown(AUTO_REFRESH_S);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // countdown + auto-refresh
  useEffect(() => {
    const iv = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { load(); return AUTO_REFRESH_S; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [load]);

  const updatedStr = data?.updatedAt
    ? new Date(data.updatedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <>
      <PageHeader
        title="Mercado Global"
        description="Precios en tiempo real: índices, commodities, futuros, divisas, cripto y Argentina."
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >{t.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {updatedStr && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {updatedStr}
              <span className="text-muted-foreground/50">· {countdown}s</span>
            </span>
          )}
          <button
            onClick={load}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-12">
          <RefreshCw className="h-4 w-4 animate-spin" /> Cargando datos de mercado…
        </div>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">No se pudieron cargar los datos.</p>
      ) : (
        <>
          {/* AMÉRICAS */}
          {tab === "americas" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {data.indices.americas.map((q) => <QuoteCard key={q.symbol} q={q} />)}
            </div>
          )}

          {/* EUROPA & ASIA */}
          {tab === "europe_asia" && (
            <div className="space-y-6">
              <div>
                <SectionTitle>Europa</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {data.indices.europe.map((q) => <QuoteCard key={q.symbol} q={q} />)}
                </div>
              </div>
              <div>
                <SectionTitle>Asia & Pacífico</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {data.indices.asia.map((q) => <QuoteCard key={q.symbol} q={q} />)}
                </div>
              </div>
            </div>
          )}

          {/* COMMODITIES */}
          {tab === "commodities" && (
            <div className="space-y-6">
              <div>
                <SectionTitle>Metales preciosos</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {data.commodities.filter((q) => ["GC=F","SI=F","PL=F"].includes(q.symbol)).map((q) => <QuoteCard key={q.symbol} q={q} />)}
                </div>
              </div>
              <div>
                <SectionTitle>Energía</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {data.commodities.filter((q) => ["CL=F","BZ=F","NG=F"].includes(q.symbol)).map((q) => <QuoteCard key={q.symbol} q={q} />)}
                </div>
              </div>
              <div>
                <SectionTitle>Granos y metales industriales</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {data.commodities.filter((q) => ["HG=F","ZC=F","ZW=F","ZS=F"].includes(q.symbol)).map((q) => <QuoteCard key={q.symbol} q={q} />)}
                </div>
              </div>
            </div>
          )}

          {/* FUTUROS */}
          {tab === "futures" && (
            <div className="space-y-6">
              <div>
                <SectionTitle>Futuros de índices</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {data.futures.filter((q) => ["ES=F","NQ=F","YM=F","RTY=F"].includes(q.symbol)).map((q) => <QuoteCard key={q.symbol} q={q} />)}
                </div>
              </div>
              <div>
                <SectionTitle>Bonos del Tesoro EEUU</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {data.futures.filter((q) => ["ZB=F","ZN=F"].includes(q.symbol)).map((q) => <QuoteCard key={q.symbol} q={q} />)}
                </div>
              </div>
              <div>
                <SectionTitle>Futuros de divisas</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {data.futures.filter((q) => ["6E=F","6J=F"].includes(q.symbol)).map((q) => <QuoteCard key={q.symbol} q={q} />)}
                </div>
              </div>
            </div>
          )}

          {/* FOREX */}
          {tab === "forex" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {data.forex.map((q) => <QuoteCard key={q.symbol} q={q} />)}
            </div>
          )}

          {/* CRIPTO */}
          {tab === "crypto" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {data.crypto.map((q) => <QuoteCard key={q.symbol} q={q} />)}
            </div>
          )}

          {/* ARGENTINA */}
          {tab === "argentina" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <SectionTitle>Tipos de cambio</SectionTitle>
                <div className="space-y-2.5">
                  <DollarCard label="Dólar Oficial" buy={data.argentina.dolarOficial?.buy ?? null} sell={data.argentina.dolarOficial?.sell ?? null} />
                  <DollarCard label="Dólar Blue" buy={data.argentina.dolarBlue?.buy ?? null} sell={data.argentina.dolarBlue?.sell ?? null} />
                  <DollarCard label="Dólar MEP (Bolsa)" buy={data.argentina.dolarMep?.buy ?? null} sell={data.argentina.dolarMep?.sell ?? null} />
                  <DollarCard label="Dólar CCL (Contado con Liquidación)" buy={data.argentina.dolarCcl?.buy ?? null} sell={data.argentina.dolarCcl?.sell ?? null} />
                </div>
                {data.argentina.dolarBlue && data.argentina.dolarOficial && (
                  <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                    <p className="text-xs text-amber-400 font-medium">
                      Brecha cambiaria (Blue vs Oficial): <strong>
                        {(((data.argentina.dolarBlue.sell - data.argentina.dolarOficial.sell) / data.argentina.dolarOficial.sell) * 100).toFixed(1)}%
                      </strong>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <SectionTitle>MERVAL</SectionTitle>
                {(() => {
                  const merv = data.indices.americas.find((q) => q.symbol === "^MERV");
                  return merv ? (
                    <div className="max-w-xs">
                      <QuoteCard q={merv} />
                    </div>
                  ) : <p className="text-xs text-muted-foreground">Sin datos</p>;
                })()}
              </div>

              {(data.argentina.inflacionMensual !== null || data.argentina.tasaPoliticaMonetaria !== null) && (
                <div>
                  <SectionTitle>Indicadores BCRA</SectionTitle>
                  <div className="grid grid-cols-2 gap-3 max-w-sm">
                    {data.argentina.inflacionMensual !== null && (
                      <div className="rounded-lg border bg-card px-4 py-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">IPC mensual</p>
                        <p className="text-xl font-bold text-foreground">{data.argentina.inflacionMensual}%</p>
                      </div>
                    )}
                    {data.argentina.tasaPoliticaMonetaria !== null && (
                      <div className="rounded-lg border bg-card px-4 py-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Tasa BCRA</p>
                        <p className="text-xl font-bold text-foreground">{data.argentina.tasaPoliticaMonetaria}%</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
