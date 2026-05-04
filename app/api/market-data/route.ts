import { NextResponse } from "next/server";

export const revalidate = 300; // cache 5 min

interface MarketData {
  // Dólar (Bluelytics)
  dolarOficial: number | null;
  dolarBlue: number | null;
  dolarMep: number | null;
  dolarCcl: number | null;
  // Cripto (CoinGecko)
  btcUsd: number | null;
  ethUsd: number | null;
  // BCRA
  inflacionMensual: number | null;
  tasaPoliticaMonetaria: number | null;
  // Metadatos
  fetchedAt: string;
}

async function fetchBluelytics(): Promise<Partial<MarketData>> {
  try {
    const res = await fetch("https://api.bluelytics.com.ar/v2/latest", {
      next: { revalidate: 300 },
    });
    if (!res.ok) return {};
    const data = await res.json();
    return {
      dolarOficial: data?.oficial?.value_sell ?? null,
      dolarBlue: data?.blue?.value_sell ?? null,
      dolarMep: data?.blue_euro?.value_sell ?? null, // Bluelytics expone blue_euro pero no MEP/CCL directamente
      dolarCcl: null,
    };
  } catch {
    return {};
  }
}

async function fetchDolarApi(): Promise<Partial<MarketData>> {
  // dolarapi.com — endpoint público sin clave para MEP y CCL
  try {
    const [mepRes, cclRes] = await Promise.all([
      fetch("https://dolarapi.com/v1/dolares/bolsa", { next: { revalidate: 300 } }),
      fetch("https://dolarapi.com/v1/dolares/contadoconliqui", { next: { revalidate: 300 } }),
    ]);
    const mep = mepRes.ok ? await mepRes.json() : null;
    const ccl = cclRes.ok ? await cclRes.json() : null;
    return {
      dolarMep: mep?.venta ?? null,
      dolarCcl: ccl?.venta ?? null,
    };
  } catch {
    return {};
  }
}

async function fetchCoinGecko(): Promise<Partial<MarketData>> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd",
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return {};
    const data = await res.json();
    return {
      btcUsd: data?.bitcoin?.usd ?? null,
      ethUsd: data?.ethereum?.usd ?? null,
    };
  } catch {
    return {};
  }
}

async function fetchBCRA(): Promise<Partial<MarketData>> {
  // BCRA API pública: https://api.bcra.gob.ar/estadisticas/v2.0/principalesvariables
  // Variable 27 = Inflación mensual, Variable 7 = Tasa de Política Monetaria
  try {
    const res = await fetch("https://api.bcra.gob.ar/estadisticas/v2.0/principalesvariables", {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return {};
    const json = await res.json();
    const variables: { idVariable: number; valor: number }[] = json?.results ?? [];

    const inflacion = variables.find((v) => v.idVariable === 27)?.valor ?? null;
    const tasa = variables.find((v) => v.idVariable === 7)?.valor ?? null;

    return {
      inflacionMensual: inflacion,
      tasaPoliticaMonetaria: tasa,
    };
  } catch {
    return {};
  }
}

export async function GET() {
  const [bluelytics, dolarApi, coingecko, bcra] = await Promise.all([
    fetchBluelytics(),
    fetchDolarApi(),
    fetchCoinGecko(),
    fetchBCRA(),
  ]);

  const data: MarketData = {
    dolarOficial: bluelytics.dolarOficial ?? null,
    dolarBlue: bluelytics.dolarBlue ?? null,
    dolarMep: dolarApi.dolarMep ?? bluelytics.dolarMep ?? null,
    dolarCcl: dolarApi.dolarCcl ?? null,
    btcUsd: coingecko.btcUsd ?? null,
    ethUsd: coingecko.ethUsd ?? null,
    inflacionMensual: bcra.inflacionMensual ?? null,
    tasaPoliticaMonetaria: bcra.tasaPoliticaMonetaria ?? null,
    fetchedAt: new Date().toISOString(),
  };

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  });
}
