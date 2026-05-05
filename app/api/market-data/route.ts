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
const INDICES_AMERICAS = [
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

const INDICES_EUROPE = [
  { symbol: "^FTSE",     name: "FTSE 100" },
  { symbol: "^GDAXI",    name: "DAX" },
  { symbol: "^FCHI",     name: "CAC 40" },
  { symbol: "^IBEX",     name: "IBEX 35" },
  { symbol: "^AEX",      name: "AEX" },
  { symbol: "^STOXX50E", name: "Euro Stoxx 50" },
  { symbol: "^SSMI",     name: "SMI" },
];

const INDICES_ASIA = [
  { symbol: "^N225",     name: "Nikkei 225" },
  { symbol: "^HSI",      name: "Hang Seng" },
  { symbol: "000001.SS", name: "Shanghai" },
  { symbol: "^AXJO",     name: "ASX 200" },
  { symbol: "^KS11",     name: "KOSPI" },
];

const COMMODITIES = [
  { symbol: "GC=F", name: "Oro" },
  { symbol: "SI=F", name: "Plata" },
  { symbol: "CL=F", name: "Petróleo WTI" },
  { symbol: "BZ=F", name: "Brent" },
  { symbol: "NG=F", name: "Gas Natural" },
  { symbol: "HG=F", name: "Cobre" },
  { symbol: "ZC=F", name: "Maíz" },
  { symbol: "ZW=F", name: "Trigo" },
  { symbol: "ZS=F", name: "Soja" },
  { symbol: "PL=F", name: "Platino" },
];

const FUTURES = [
  { symbol: "ES=F",  name: "S&P 500 Futuro" },
  { symbol: "NQ=F",  name: "Nasdaq 100 Futuro" },
  { symbol: "YM=F",  name: "Dow Futuro" },
  { symbol: "RTY=F", name: "Russell 2000 Futuro" },
  { symbol: "ZB=F",  name: "T-Bond 30Y" },
  { symbol: "ZN=F",  name: "T-Note 10Y" },
  { symbol: "6E=F",  name: "Euro Futuro" },
  { symbol: "6J=F",  name: "Yen Futuro" },
];

const FOREX = [
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
const CACHE_MS = 120_000; // 2 minutos

// ── Yahoo Finance ─────────────────────────────────────────────────────────────
async function fetchYahooQuotes(
  items: { symbol: string; name: string }[]
): Promise<MarketQuote[]> {
  const syms = items.map((i) => i.symbol).join(",");
  try {
    const res = await fetch(
      `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(syms)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) throw new Error(`Yahoo ${res.status}`);

    const json = await res.json() as {
      quoteResponse?: {
        result?: {
          symbol: string;
          shortName?: string;
          regularMarketPrice?: number;
          regularMarketChange?: number;
          regularMarketChangePercent?: number;
          currency?: string;
          marketState?: string;
        }[];
      };
    };

    const map = new Map((json.quoteResponse?.result ?? []).map((r) => [r.symbol, r]));

    return items.map((item) => {
      const r = map.get(item.symbol);
      return {
        symbol: item.symbol,
        name: r?.shortName ?? item.name,
        price: r?.regularMarketPrice ?? null,
        change: r?.regularMarketChange ?? null,
        changePct: r?.regularMarketChangePercent ?? null,
        currency: r?.currency ?? "USD",
        marketState: r?.marketState,
      };
    });
  } catch {
    return items.map((i) => ({ symbol: i.symbol, name: i.name, price: null, change: null, changePct: null, currency: "USD" }));
  }
}

// ── CoinGecko ────────────────────────────────────────────────────────────────
async function fetchCrypto(): Promise<MarketQuote[]> {
  const COINS: Record<string, string> = {
    bitcoin: "Bitcoin", ethereum: "Ethereum", binancecoin: "BNB",
    solana: "Solana", ripple: "XRP", cardano: "Cardano",
    dogecoin: "Dogecoin", polkadot: "Polkadot",
  };
  try {
    const ids = Object.keys(COINS).join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return [];
    const data = await res.json() as Record<string, { usd: number; usd_24h_change: number }>;
    return Object.entries(data).map(([id, v]) => ({
      symbol: id.toUpperCase(),
      name: COINS[id] ?? id,
      price: v.usd ?? null,
      change: null,
      changePct: v.usd_24h_change ?? null,
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
      blue_euro?: { value_buy: number; value_sell: number };
    };
  } catch { return null; }
}

// ── dolarapi.com — MEP y CCL ──────────────────────────────────────────────────
async function fetchDolarApi() {
  try {
    const [mepRes, cclRes] = await Promise.all([
      fetch("https://dolarapi.com/v1/dolares/bolsa",             { signal: AbortSignal.timeout(5000) }),
      fetch("https://dolarapi.com/v1/dolares/contadoconliqui",   { signal: AbortSignal.timeout(5000) }),
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
      tasa: vars.find((v) => v.idVariable === 7)?.valor ?? null,
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
      inflacionMensual: bcra.inflacion,
      tasaPoliticaMonetaria: bcra.tasa,
    },
    updatedAt: new Date().toISOString(),
  };

  _cache = { data: result, ts: Date.now() };
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=30" },
  });
}
