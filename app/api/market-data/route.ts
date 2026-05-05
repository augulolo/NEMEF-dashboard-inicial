import { NextResponse } from "next/server";

export const maxDuration = 30;

// ── Types ─────────────────────────────────────────────────────────────────────
export interface MarketQuote {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  currency: string;
  marketState?: string;
}

export interface DollarPair {
  buy: number;
  sell: number;
}

export interface FullMarketData {
  indices: {
    americas: MarketQuote[];
    europe: MarketQuote[];
    asia: MarketQuote[];
  };
  commodities: MarketQuote[];
  futures: MarketQuote[];
  forex: MarketQuote[];
  crypto: MarketQuote[];
  argentina: {
    dolarOficial: DollarPair | null;
    dolarBlue: DollarPair | null;
    dolarMep: DollarPair | null;
    dolarCcl: DollarPair | null;
    inflacionMensual: number | null;
    tasaPoliticaMonetaria: number | null;
  };
  updatedAt: string;
}

// ── Symbol lists ──────────────────────────────────────────────────────────────
const INDICES_AMERICAS: { symbol: string; name: string }[] = [
  { symbol: "^GSPC",   name: "S&P 500" },
  { symbol: "^DJI",    name: "Dow Jones" },
  { symbol: "^IXIC",   name: "Nasdaq" },
  { symbol: "^RUT",    name: "Russell 2000" },
  { symbol: "^VIX",    name: "VIX" },
  { symbol: "^BVSP",   name: "Bovespa" },
  { symbol: "^MERV",   name: "MERVAL" },
  { symbol: "^GSPTSE", name: "S&P/TSX" },
  { symbol: "^MXX",    name: "IPC México" },
];

const INDICES_EUROPE: { symbol: string; name: string }[] = [
  { symbol: "^FTSE",     name: "FTSE 100" },
  { symbol: "^GDAXI",    name: "DAX" },
  { symbol: "^FCHI",     name: "CAC 40" },
  { symbol: "^IBEX",     name: "IBEX 35" },
  { symbol: "^AEX",      name: "AEX" },
  { symbol: "^STOXX50E", name: "Euro Stoxx 50" },
  { symbol: "^SSMI",     name: "SMI" },
];

const INDICES_ASIA: { symbol: string; name: string }[] = [
  { symbol: "^N225",     name: "Nikkei 225" },
  { symbol: "^HSI",      name: "Hang Seng" },
  { symbol: "000001.SS", name: "Shanghai Comp." },
  { symbol: "^AXJO",     name: "ASX 200" },
  { symbol: "^KS11",     name: "KOSPI" },
];

const COMMODITIES: { symbol: string; name: string }[] = [
  { symbol: "GC=F", name: "Oro" },
  { symbol: "SI=F", name: "Plata" },
  { symbol: "CL=F", name: "Petróleo WTI" },
  { symbol: "BZ=F", name: "Petróleo Brent" },
  { symbol: "NG=F", name: "Gas Natural" },
  { symbol: "HG=F", name: "Cobre" },
  { symbol: "ZC=F", name: "Maíz" },
  { symbol: "ZW=F", name: "Trigo" },
  { symbol: "ZS=F", name: "Soja" },
  { symbol: "PL=F", name: "Platino" },
];

const FUTURES: { symbol: string; name: string }[] = [
  { symbol: "ES=F",  name: "S&P 500 Futuro" },
  { symbol: "NQ=F",  name: "Nasdaq 100 Futuro" },
  { symbol: "YM=F",  name: "Dow Jones Futuro" },
  { symbol: "RTY=F", name: "Russell 2000 Futuro" },
  { symbol: "ZB=F",  name: "T-Bond 30Y EEUU" },
  { symbol: "ZN=F",  name: "T-Note 10Y EEUU" },
  { symbol: "6E=F",  name: "Euro Futuro" },
  { symbol: "6J=F",  name: "Yen Futuro" },
];

const FOREX: { symbol: string; name: string }[] = [
  { symbol: "EURUSD=X",  name: "EUR/USD" },
  { symbol: "GBPUSD=X",  name: "GBP/USD" },
  { symbol: "JPY=X",     name: "USD/JPY" },
  { symbol: "USDCNY=X",  name: "USD/CNY" },
  { symbol: "USDBRL=X",  name: "USD/BRL" },
  { symbol: "USDCLP=X",  name: "USD/CLP" },
  { symbol: "USDCHF=X",  name: "USD/CHF" },
  { symbol: "DX-Y.NYB",  name: "Índice Dólar (DXY)" },
];

// ── In-memory cache ───────────────────────────────────────────────────────────
let _cache: { data: FullMarketData; ts: number } | null = null;
const CACHE_MS = 120_000; // 2 min

// ── Yahoo Finance v8/chart — ONE request per symbol, all in parallel ──────────
type YahooMeta = {
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  currency?: string;
  marketState?: string;
};

async function fetchOneYahoo(symbol: string, fallbackName: string): Promise<MarketQuote> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return { symbol, name: fallbackName, price: null, change: null, changePct: null, currency: "USD" };

    const json = await res.json() as { chart?: { result?: [{ meta?: YahooMeta }]; error?: unknown } };
    const meta = json.chart?.result?.[0]?.meta;
    if (!meta) return { symbol, name: fallbackName, price: null, change: null, changePct: null, currency: "USD" };

    const price    = meta.regularMarketPrice  ?? null;
    const prevClose = meta.chartPreviousClose ?? null;
    const change   = price !== null && prevClose !== null ? +(price - prevClose).toFixed(4) : null;
    const changePct = change !== null && prevClose ? +((change / prevClose) * 100).toFixed(3) : null;

    return {
      symbol,
      name: meta.shortName ?? meta.longName ?? fallbackName,
      price,
      change,
      changePct,
      currency: meta.currency ?? "USD",
      marketState: meta.marketState,
    };
  } catch {
    return { symbol, name: fallbackName, price: null, change: null, changePct: null, currency: "USD" };
  }
}

async function fetchYahooQuotes(items: { symbol: string; name: string }[]): Promise<MarketQuote[]> {
  return Promise.all(items.map(({ symbol, name }) => fetchOneYahoo(symbol, name)));
}

// ── CoinGecko ────────────────────────────────────────────────────────────────
const COINS: Record<string, string> = {
  bitcoin: "Bitcoin", ethereum: "Ethereum", binancecoin: "BNB",
  solana: "Solana", ripple: "XRP", cardano: "Cardano",
  dogecoin: "Dogecoin", "matic-network": "Polygon",
};

async function fetchCrypto(): Promise<MarketQuote[]> {
  try {
    const ids = Object.keys(COINS).join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return [];
    const data = await res.json() as Record<string, { usd: number; usd_24h_change: number }>;
    return Object.entries(data).map(([id, v]) => ({
      symbol: id === "matic-network" ? "MATIC" : id.toUpperCase(),
      name: COINS[id] ?? id,
      price: v.usd ?? null,
      change: null,
      changePct: v.usd_24h_change != null ? +v.usd_24h_change.toFixed(3) : null,
      currency: "USD",
    }));
  } catch { return []; }
}

// ── Bluelytics ────────────────────────────────────────────────────────────────
async function fetchBluelytics() {
  try {
    const res = await fetch("https://api.bluelytics.com.ar/v2/latest", {
      headers: { "User-Agent": "NEMEF-Dashboard/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return await res.json() as {
      oficial?: { value_buy: number; value_sell: number };
      blue?: { value_buy: number; value_sell: number };
    };
  } catch { return null; }
}

// ── dolarapi.com — MEP y CCL ─────────────────────────────────────────────────
async function fetchDolarApi() {
  try {
    const [mepRes, cclRes] = await Promise.all([
      fetch("https://dolarapi.com/v1/dolares/bolsa",           { signal: AbortSignal.timeout(5000) }),
      fetch("https://dolarapi.com/v1/dolares/contadoconliqui", { signal: AbortSignal.timeout(5000) }),
    ]);
    const mep = mepRes.ok ? await mepRes.json() as { compra?: number; venta?: number } : null;
    const ccl = cclRes.ok ? await cclRes.json() as { compra?: number; venta?: number } : null;
    return { mep, ccl };
  } catch { return { mep: null, ccl: null }; }
}

// ── BCRA ──────────────────────────────────────────────────────────────────────
async function fetchBCRA() {
  try {
    const res = await fetch("https://api.bcra.gob.ar/estadisticas/v2.0/principalesvariables", {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return { inflacion: null, tasa: null };
    const json = await res.json() as { results?: { idVariable: number; valor: number }[] };
    const vars = json.results ?? [];
    return {
      inflacion: vars.find((v) => v.idVariable === 27)?.valor ?? null,
      tasa:      vars.find((v) => v.idVariable === 7)?.valor  ?? null,
    };
  } catch { return { inflacion: null, tasa: null }; }
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {
  if (_cache && Date.now() - _cache.ts < CACHE_MS) {
    return NextResponse.json(_cache.data);
  }

  const [
    indicesAm, indicesEu, indicesAs,
    comms, futs, forex,
    crypto, blue, dolarApi, bcra,
  ] = await Promise.all([
    fetchYahooQuotes(INDICES_AMERICAS),
    fetchYahooQuotes(INDICES_EUROPE),
    fetchYahooQuotes(INDICES_ASIA),
    fetchYahooQuotes(COMMODITIES),
    fetchYahooQuotes(FUTURES),
    fetchYahooQuotes(FOREX),
    fetchCrypto(),
    fetchBluelytics(),
    fetchDolarApi(),
    fetchBCRA(),
  ]);

  const result: FullMarketData = {
    indices: { americas: indicesAm, europe: indicesEu, asia: indicesAs },
    commodities: comms,
    futures: futs,
    forex,
    crypto,
    argentina: {
      dolarOficial: blue?.oficial ? { buy: blue.oficial.value_buy, sell: blue.oficial.value_sell } : null,
      dolarBlue:    blue?.blue    ? { buy: blue.blue.value_buy,    sell: blue.blue.value_sell    } : null,
      dolarMep:     dolarApi.mep  ? { buy: dolarApi.mep.compra ?? 0, sell: dolarApi.mep.venta ?? 0 } : null,
      dolarCcl:     dolarApi.ccl  ? { buy: dolarApi.ccl.compra ?? 0, sell: dolarApi.ccl.venta ?? 0 } : null,
      inflacionMensual:      bcra.inflacion,
      tasaPoliticaMonetaria: bcra.tasa,
    },
    updatedAt: new Date().toISOString(),
  };

  _cache = { data: result, ts: Date.now() };
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=30" },
  });
}
