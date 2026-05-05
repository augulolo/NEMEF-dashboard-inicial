// ─────────────────────────────────────────────────────────────────────────────
// NEMEF — Calendario Económico 2026 (datos estáticos + curados)
// ─────────────────────────────────────────────────────────────────────────────

export type EventImportance = "high" | "medium" | "low";
export type EventCountry = "US" | "EU" | "UK" | "JP" | "CN" | "AR" | "DE" | "CA" | "AU" | "BR";

export interface EconomicEvent {
  id: string;
  date: string;       // YYYY-MM-DD
  time?: string;      // HH:MM (hora local del evento, ET para EEUU)
  country: EventCountry;
  name: string;
  description?: string;
  period?: string;
  importance: EventImportance;
  previous?: string;
  forecast?: string;
  actual?: string;    // undefined = aún no disponible
  category: "rates" | "employment" | "inflation" | "growth" | "trade" | "sentiment" | "housing" | "other";
}

// ── Bandera por país ──────────────────────────────────────────────────────────
export const COUNTRY_FLAGS: Record<EventCountry, string> = {
  US: "🇺🇸", EU: "🇪🇺", UK: "🇬🇧", JP: "🇯🇵",
  CN: "🇨🇳", AR: "🇦🇷", DE: "🇩🇪", CA: "🇨🇦",
  AU: "🇦🇺", BR: "🇧🇷",
};

export const COUNTRY_NAMES: Record<EventCountry, string> = {
  US: "EEUU", EU: "Eurozona", UK: "Reino Unido", JP: "Japón",
  CN: "China", AR: "Argentina", DE: "Alemania", CA: "Canadá",
  AU: "Australia", BR: "Brasil",
};

// ── Calendario 2026 ───────────────────────────────────────────────────────────
export const ECONOMIC_CALENDAR: EconomicEvent[] = [

  // ── ENERO 2026 ─────────────────────────────────────────────────────────────
  { id: "us-nfp-jan", date: "2026-01-09", time: "08:30", country: "US", name: "Nóminas no Agrícolas (NFP)", period: "Dic 2025", importance: "high", category: "employment", previous: "227K", forecast: "200K" },
  { id: "us-umich-jan", date: "2026-01-17", time: "10:00", country: "US", name: "Sent. Consumidor Michigan (prel.)", period: "Enero 2026", importance: "medium", category: "sentiment" },
  { id: "us-cpi-jan", date: "2026-01-15", time: "08:30", country: "US", name: "IPC (CPI) EEUU", period: "Dic 2025", importance: "high", category: "inflation", description: "Consumer Price Index — dato mensual de inflación de EEUU" },
  { id: "us-ppi-jan", date: "2026-01-14", time: "08:30", country: "US", name: "IPP (PPI) EEUU", period: "Dic 2025", importance: "medium", category: "inflation" },
  { id: "us-retail-jan", date: "2026-01-16", time: "08:30", country: "US", name: "Ventas Minoristas", period: "Dic 2025", importance: "medium", category: "growth" },
  { id: "us-gdp-q4-adv", date: "2026-01-30", time: "08:30", country: "US", name: "PIB EEUU — Avance (Q4 2025)", period: "Q4 2025", importance: "high", category: "growth" },
  { id: "us-fomc-jan", date: "2026-01-28", time: "14:00", country: "US", name: "Decisión de Tasa — FOMC", period: "Enero 2026", importance: "high", category: "rates", description: "Reunión del FOMC. Se anuncia la tasa de fondos federales y comunicado." },
  { id: "us-pce-jan", date: "2026-01-30", time: "08:30", country: "US", name: "PCE Subyacente (Core PCE)", period: "Dic 2025", importance: "high", category: "inflation", description: "Medida de inflación preferida por la Fed" },
  { id: "eu-ecb-jan", date: "2026-01-30", time: "13:45", country: "EU", name: "Decisión de Tasa — BCE", period: "Enero 2026", importance: "high", category: "rates" },
  { id: "eu-cpi-flash-jan", date: "2026-01-30", time: "10:00", country: "EU", name: "IPC Eurozona (flash)", period: "Enero 2026", importance: "high", category: "inflation" },
  { id: "de-cpi-jan", date: "2026-01-29", time: "07:00", country: "DE", name: "IPC Alemania (prel.)", period: "Enero 2026", importance: "medium", category: "inflation" },
  { id: "ar-ipc-jan", date: "2026-01-14", time: "12:00", country: "AR", name: "IPC Argentina (INDEC)", period: "Dic 2025", importance: "high", category: "inflation", description: "Índice de Precios al Consumidor — INDEC" },
  { id: "jp-boj-jan", date: "2026-01-24", time: "03:00", country: "JP", name: "Decisión de Tasa — BoJ", period: "Enero 2026", importance: "high", category: "rates" },
  { id: "us-ism-mfg-jan", date: "2026-01-02", time: "10:00", country: "US", name: "ISM Manufactura PMI", period: "Dic 2025", importance: "medium", category: "growth" },
  { id: "ar-emae-jan", date: "2026-01-25", time: "12:00", country: "AR", name: "EMAE (Actividad Económica)", period: "Nov 2025", importance: "medium", category: "growth", description: "Estimador Mensual de Actividad Económica — INDEC" },

  // ── FEBRERO 2026 ───────────────────────────────────────────────────────────
  { id: "us-nfp-feb", date: "2026-02-06", time: "08:30", country: "US", name: "Nóminas no Agrícolas (NFP)", period: "Ene 2026", importance: "high", category: "employment" },
  { id: "us-cpi-feb", date: "2026-02-12", time: "08:30", country: "US", name: "IPC (CPI) EEUU", period: "Ene 2026", importance: "high", category: "inflation" },
  { id: "us-ppi-feb", date: "2026-02-13", time: "08:30", country: "US", name: "IPP (PPI) EEUU", period: "Ene 2026", importance: "medium", category: "inflation" },
  { id: "us-retail-feb", date: "2026-02-14", time: "08:30", country: "US", name: "Ventas Minoristas", period: "Ene 2026", importance: "medium", category: "growth" },
  { id: "us-gdp-q4-prel", date: "2026-02-26", time: "08:30", country: "US", name: "PIB EEUU — Preliminar (Q4 2025)", period: "Q4 2025", importance: "high", category: "growth" },
  { id: "us-pce-feb", date: "2026-02-27", time: "08:30", country: "US", name: "PCE Subyacente (Core PCE)", period: "Ene 2026", importance: "high", category: "inflation" },
  { id: "uk-boe-feb", date: "2026-02-05", time: "12:00", country: "UK", name: "Decisión de Tasa — BoE", period: "Feb 2026", importance: "high", category: "rates" },
  { id: "uk-cpi-feb", date: "2026-02-19", time: "07:00", country: "UK", name: "IPC Reino Unido", period: "Ene 2026", importance: "high", category: "inflation" },
  { id: "ar-ipc-feb", date: "2026-02-11", time: "12:00", country: "AR", name: "IPC Argentina (INDEC)", period: "Ene 2026", importance: "high", category: "inflation" },
  { id: "us-conf-board-feb", date: "2026-02-25", time: "10:00", country: "US", name: "Confianza del Consumidor (CB)", period: "Feb 2026", importance: "medium", category: "sentiment" },
  { id: "eu-cpi-flash-feb", date: "2026-02-28", time: "10:00", country: "EU", name: "IPC Eurozona (flash)", period: "Feb 2026", importance: "high", category: "inflation" },
  { id: "ar-emae-feb", date: "2026-02-27", time: "12:00", country: "AR", name: "EMAE (Actividad Económica)", period: "Dic 2025", importance: "medium", category: "growth" },

  // ── MARZO 2026 ─────────────────────────────────────────────────────────────
  { id: "us-nfp-mar", date: "2026-03-06", time: "08:30", country: "US", name: "Nóminas no Agrícolas (NFP)", period: "Feb 2026", importance: "high", category: "employment" },
  { id: "us-cpi-mar", date: "2026-03-12", time: "08:30", country: "US", name: "IPC (CPI) EEUU", period: "Feb 2026", importance: "high", category: "inflation" },
  { id: "us-ppi-mar", date: "2026-03-13", time: "08:30", country: "US", name: "IPP (PPI) EEUU", period: "Feb 2026", importance: "medium", category: "inflation" },
  { id: "us-fomc-mar", date: "2026-03-18", time: "14:00", country: "US", name: "Decisión de Tasa — FOMC", period: "Mar 2026", importance: "high", category: "rates" },
  { id: "us-retail-mar", date: "2026-03-17", time: "08:30", country: "US", name: "Ventas Minoristas", period: "Feb 2026", importance: "medium", category: "growth" },
  { id: "eu-ecb-mar", date: "2026-03-06", time: "13:45", country: "EU", name: "Decisión de Tasa — BCE", period: "Mar 2026", importance: "high", category: "rates" },
  { id: "uk-boe-mar", date: "2026-03-19", time: "12:00", country: "UK", name: "Decisión de Tasa — BoE", period: "Mar 2026", importance: "high", category: "rates" },
  { id: "jp-boj-mar", date: "2026-03-19", time: "03:00", country: "JP", name: "Decisión de Tasa — BoJ", period: "Mar 2026", importance: "high", category: "rates" },
  { id: "ar-ipc-mar", date: "2026-03-11", time: "12:00", country: "AR", name: "IPC Argentina (INDEC)", period: "Feb 2026", importance: "high", category: "inflation" },
  { id: "us-pce-mar", date: "2026-03-27", time: "08:30", country: "US", name: "PCE Subyacente (Core PCE)", period: "Feb 2026", importance: "high", category: "inflation" },
  { id: "ar-desempleo-q4", date: "2026-03-27", time: "12:00", country: "AR", name: "Tasa de Desempleo — INDEC", period: "Q4 2025", importance: "high", category: "employment", description: "Encuesta Permanente de Hogares (EPH) — INDEC" },
  { id: "eu-cpi-flash-mar", date: "2026-03-31", time: "10:00", country: "EU", name: "IPC Eurozona (flash)", period: "Mar 2026", importance: "high", category: "inflation" },
  { id: "ar-emae-mar", date: "2026-03-28", time: "12:00", country: "AR", name: "EMAE (Actividad Económica)", period: "Ene 2026", importance: "medium", category: "growth" },
  { id: "us-conf-board-mar", date: "2026-03-31", time: "10:00", country: "US", name: "Confianza del Consumidor (CB)", period: "Mar 2026", importance: "medium", category: "sentiment" },

  // ── ABRIL 2026 ─────────────────────────────────────────────────────────────
  { id: "us-nfp-apr", date: "2026-04-03", time: "08:30", country: "US", name: "Nóminas no Agrícolas (NFP)", period: "Mar 2026", importance: "high", category: "employment" },
  { id: "us-cpi-apr", date: "2026-04-10", time: "08:30", country: "US", name: "IPC (CPI) EEUU", period: "Mar 2026", importance: "high", category: "inflation" },
  { id: "us-ppi-apr", date: "2026-04-11", time: "08:30", country: "US", name: "IPP (PPI) EEUU", period: "Mar 2026", importance: "medium", category: "inflation" },
  { id: "us-retail-apr", date: "2026-04-16", time: "08:30", country: "US", name: "Ventas Minoristas", period: "Mar 2026", importance: "medium", category: "growth" },
  { id: "eu-ecb-apr", date: "2026-04-17", time: "13:45", country: "EU", name: "Decisión de Tasa — BCE", period: "Abr 2026", importance: "high", category: "rates" },
  { id: "us-fomc-apr", date: "2026-04-29", time: "14:00", country: "US", name: "Decisión de Tasa — FOMC", period: "Abr 2026", importance: "high", category: "rates" },
  { id: "us-gdp-q1-adv", date: "2026-04-30", time: "08:30", country: "US", name: "PIB EEUU — Avance (Q1 2026)", period: "Q1 2026", importance: "high", category: "growth" },
  { id: "us-pce-apr", date: "2026-04-30", time: "08:30", country: "US", name: "PCE Subyacente (Core PCE)", period: "Mar 2026", importance: "high", category: "inflation" },
  { id: "jp-boj-apr", date: "2026-04-30", time: "03:00", country: "JP", name: "Decisión de Tasa — BoJ", period: "Abr 2026", importance: "high", category: "rates" },
  { id: "ar-ipc-apr", date: "2026-04-10", time: "12:00", country: "AR", name: "IPC Argentina (INDEC)", period: "Mar 2026", importance: "high", category: "inflation" },
  { id: "eu-cpi-flash-apr", date: "2026-04-30", time: "10:00", country: "EU", name: "IPC Eurozona (flash)", period: "Abr 2026", importance: "high", category: "inflation" },
  { id: "uk-cpi-apr", date: "2026-04-16", time: "07:00", country: "UK", name: "IPC Reino Unido", period: "Mar 2026", importance: "high", category: "inflation" },
  { id: "ar-emae-apr", date: "2026-04-25", time: "12:00", country: "AR", name: "EMAE (Actividad Económica)", period: "Feb 2026", importance: "medium", category: "growth" },

  // ── MAYO 2026 ──────────────────────────────────────────────────────────────
  { id: "uk-boe-may", date: "2026-05-07", time: "12:00", country: "UK", name: "Decisión de Tasa — BoE", period: "May 2026", importance: "high", category: "rates" },
  { id: "us-nfp-may", date: "2026-05-08", time: "08:30", country: "US", name: "Nóminas no Agrícolas (NFP)", period: "Abr 2026", importance: "high", category: "employment", description: "Dato de empleo de EEUU — principal indicador de mercado laboral" },
  { id: "us-umich-may", date: "2026-05-08", time: "10:00", country: "US", name: "Sent. Consumidor Michigan (prel.)", period: "May 2026", importance: "medium", category: "sentiment" },
  { id: "ar-ipc-may", date: "2026-05-13", time: "12:00", country: "AR", name: "IPC Argentina (INDEC)", period: "Abr 2026", importance: "high", category: "inflation" },
  { id: "us-cpi-may", date: "2026-05-13", time: "08:30", country: "US", name: "IPC (CPI) EEUU", period: "Abr 2026", importance: "high", category: "inflation" },
  { id: "us-ppi-may", date: "2026-05-14", time: "08:30", country: "US", name: "IPP (PPI) EEUU", period: "Abr 2026", importance: "medium", category: "inflation" },
  { id: "us-retail-may", date: "2026-05-15", time: "08:30", country: "US", name: "Ventas Minoristas", period: "Abr 2026", importance: "medium", category: "growth" },
  { id: "eu-cpi-flash-may", date: "2026-05-30", time: "10:00", country: "EU", name: "IPC Eurozona (flash)", period: "May 2026", importance: "high", category: "inflation" },
  { id: "us-conf-board-may", date: "2026-05-27", time: "10:00", country: "US", name: "Confianza del Consumidor (CB)", period: "May 2026", importance: "medium", category: "sentiment" },
  { id: "us-pce-may", date: "2026-05-29", time: "08:30", country: "US", name: "PCE Subyacente (Core PCE)", period: "Abr 2026", importance: "high", category: "inflation" },
  { id: "us-gdp-q1-prel", date: "2026-05-28", time: "08:30", country: "US", name: "PIB EEUU — Preliminar (Q1 2026)", period: "Q1 2026", importance: "high", category: "growth" },
  { id: "ar-emae-may", date: "2026-05-29", time: "12:00", country: "AR", name: "EMAE (Actividad Económica)", period: "Mar 2026", importance: "medium", category: "growth" },
  { id: "de-cpi-may", date: "2026-05-28", time: "07:00", country: "DE", name: "IPC Alemania (prel.)", period: "May 2026", importance: "medium", category: "inflation" },
  { id: "uk-cpi-may", date: "2026-05-21", time: "07:00", country: "UK", name: "IPC Reino Unido", period: "Abr 2026", importance: "high", category: "inflation" },
  { id: "us-ism-svc-may", date: "2026-05-05", time: "10:00", country: "US", name: "ISM Servicios PMI", period: "Abr 2026", importance: "medium", category: "growth" },
  { id: "us-existing-homes-may", date: "2026-05-21", time: "10:00", country: "US", name: "Ventas de Casas Existentes", period: "Abr 2026", importance: "low", category: "housing" },

  // ── JUNIO 2026 ─────────────────────────────────────────────────────────────
  { id: "us-nfp-jun", date: "2026-06-05", time: "08:30", country: "US", name: "Nóminas no Agrícolas (NFP)", period: "May 2026", importance: "high", category: "employment" },
  { id: "eu-ecb-jun", date: "2026-06-05", time: "13:45", country: "EU", name: "Decisión de Tasa — BCE", period: "Jun 2026", importance: "high", category: "rates" },
  { id: "ar-ipc-jun", date: "2026-06-10", time: "12:00", country: "AR", name: "IPC Argentina (INDEC)", period: "May 2026", importance: "high", category: "inflation" },
  { id: "us-cpi-jun", date: "2026-06-11", time: "08:30", country: "US", name: "IPC (CPI) EEUU", period: "May 2026", importance: "high", category: "inflation" },
  { id: "us-ppi-jun", date: "2026-06-12", time: "08:30", country: "US", name: "IPP (PPI) EEUU", period: "May 2026", importance: "medium", category: "inflation" },
  { id: "us-fomc-jun", date: "2026-06-10", time: "14:00", country: "US", name: "Decisión de Tasa — FOMC", period: "Jun 2026", importance: "high", category: "rates", description: "Con conferencia de prensa y proyecciones económicas (dot plot)" },
  { id: "us-retail-jun", date: "2026-06-16", time: "08:30", country: "US", name: "Ventas Minoristas", period: "May 2026", importance: "medium", category: "growth" },
  { id: "uk-boe-jun", date: "2026-06-18", time: "12:00", country: "UK", name: "Decisión de Tasa — BoE", period: "Jun 2026", importance: "high", category: "rates" },
  { id: "jp-boj-jun", date: "2026-06-17", time: "03:00", country: "JP", name: "Decisión de Tasa — BoJ", period: "Jun 2026", importance: "high", category: "rates" },
  { id: "us-pce-jun", date: "2026-06-26", time: "08:30", country: "US", name: "PCE Subyacente (Core PCE)", period: "May 2026", importance: "high", category: "inflation" },
  { id: "eu-cpi-flash-jun", date: "2026-06-30", time: "10:00", country: "EU", name: "IPC Eurozona (flash)", period: "Jun 2026", importance: "high", category: "inflation" },
  { id: "ar-emae-jun", date: "2026-06-26", time: "12:00", country: "AR", name: "EMAE (Actividad Económica)", period: "Abr 2026", importance: "medium", category: "growth" },
  { id: "ar-desempleo-q1", date: "2026-06-26", time: "12:00", country: "AR", name: "Tasa de Desempleo — INDEC", period: "Q1 2026", importance: "high", category: "employment" },
  { id: "uk-cpi-jun", date: "2026-06-17", time: "07:00", country: "UK", name: "IPC Reino Unido", period: "May 2026", importance: "high", category: "inflation" },

  // ── JULIO 2026 ─────────────────────────────────────────────────────────────
  { id: "us-nfp-jul", date: "2026-07-10", time: "08:30", country: "US", name: "Nóminas no Agrícolas (NFP)", period: "Jun 2026", importance: "high", category: "employment" },
  { id: "ar-ipc-jul", date: "2026-07-08", time: "12:00", country: "AR", name: "IPC Argentina (INDEC)", period: "Jun 2026", importance: "high", category: "inflation" },
  { id: "us-cpi-jul", date: "2026-07-14", time: "08:30", country: "US", name: "IPC (CPI) EEUU", period: "Jun 2026", importance: "high", category: "inflation" },
  { id: "us-ppi-jul", date: "2026-07-15", time: "08:30", country: "US", name: "IPP (PPI) EEUU", period: "Jun 2026", importance: "medium", category: "inflation" },
  { id: "us-retail-jul", date: "2026-07-17", time: "08:30", country: "US", name: "Ventas Minoristas", period: "Jun 2026", importance: "medium", category: "growth" },
  { id: "eu-ecb-jul", date: "2026-07-24", time: "13:45", country: "EU", name: "Decisión de Tasa — BCE", period: "Jul 2026", importance: "high", category: "rates" },
  { id: "us-fomc-jul", date: "2026-07-29", time: "14:00", country: "US", name: "Decisión de Tasa — FOMC", period: "Jul 2026", importance: "high", category: "rates" },
  { id: "us-gdp-q2-adv", date: "2026-07-30", time: "08:30", country: "US", name: "PIB EEUU — Avance (Q2 2026)", period: "Q2 2026", importance: "high", category: "growth" },
  { id: "jp-boj-jul", date: "2026-07-29", time: "03:00", country: "JP", name: "Decisión de Tasa — BoJ", period: "Jul 2026", importance: "high", category: "rates" },
  { id: "us-pce-jul", date: "2026-07-31", time: "08:30", country: "US", name: "PCE Subyacente (Core PCE)", period: "Jun 2026", importance: "high", category: "inflation" },
  { id: "eu-cpi-flash-jul", date: "2026-07-31", time: "10:00", country: "EU", name: "IPC Eurozona (flash)", period: "Jul 2026", importance: "high", category: "inflation" },
  { id: "uk-boe-jul", date: "2026-08-06", time: "12:00", country: "UK", name: "Decisión de Tasa — BoE", period: "Ago 2026", importance: "high", category: "rates" },

  // ── AGOSTO 2026 ────────────────────────────────────────────────────────────
  { id: "us-nfp-aug", date: "2026-08-07", time: "08:30", country: "US", name: "Nóminas no Agrícolas (NFP)", period: "Jul 2026", importance: "high", category: "employment" },
  { id: "ar-ipc-aug", date: "2026-08-12", time: "12:00", country: "AR", name: "IPC Argentina (INDEC)", period: "Jul 2026", importance: "high", category: "inflation" },
  { id: "us-cpi-aug", date: "2026-08-13", time: "08:30", country: "US", name: "IPC (CPI) EEUU", period: "Jul 2026", importance: "high", category: "inflation" },
  { id: "us-ppi-aug", date: "2026-08-14", time: "08:30", country: "US", name: "IPP (PPI) EEUU", period: "Jul 2026", importance: "medium", category: "inflation" },
  { id: "us-retail-aug", date: "2026-08-14", time: "08:30", country: "US", name: "Ventas Minoristas", period: "Jul 2026", importance: "medium", category: "growth" },
  { id: "us-pce-aug", date: "2026-08-28", time: "08:30", country: "US", name: "PCE Subyacente (Core PCE)", period: "Jul 2026", importance: "high", category: "inflation", description: "Jackson Hole Symposium — suele coincidir con discurso del presidente de la Fed" },
  { id: "eu-cpi-flash-aug", date: "2026-08-31", time: "10:00", country: "EU", name: "IPC Eurozona (flash)", period: "Ago 2026", importance: "high", category: "inflation" },
  { id: "uk-cpi-aug", date: "2026-08-19", time: "07:00", country: "UK", name: "IPC Reino Unido", period: "Jul 2026", importance: "high", category: "inflation" },

  // ── SEPTIEMBRE 2026 ────────────────────────────────────────────────────────
  { id: "us-nfp-sep", date: "2026-09-04", time: "08:30", country: "US", name: "Nóminas no Agrícolas (NFP)", period: "Ago 2026", importance: "high", category: "employment" },
  { id: "eu-ecb-sep", date: "2026-09-11", time: "13:45", country: "EU", name: "Decisión de Tasa — BCE", period: "Sep 2026", importance: "high", category: "rates" },
  { id: "ar-ipc-sep", date: "2026-09-09", time: "12:00", country: "AR", name: "IPC Argentina (INDEC)", period: "Ago 2026", importance: "high", category: "inflation" },
  { id: "us-cpi-sep", date: "2026-09-11", time: "08:30", country: "US", name: "IPC (CPI) EEUU", period: "Ago 2026", importance: "high", category: "inflation" },
  { id: "us-ppi-sep", date: "2026-09-12", time: "08:30", country: "US", name: "IPP (PPI) EEUU", period: "Ago 2026", importance: "medium", category: "inflation" },
  { id: "us-fomc-sep", date: "2026-09-16", time: "14:00", country: "US", name: "Decisión de Tasa — FOMC", period: "Sep 2026", importance: "high", category: "rates", description: "Con conferencia de prensa y proyecciones económicas (dot plot)" },
  { id: "jp-boj-sep", date: "2026-09-18", time: "03:00", country: "JP", name: "Decisión de Tasa — BoJ", period: "Sep 2026", importance: "high", category: "rates" },
  { id: "uk-boe-sep", date: "2026-09-17", time: "12:00", country: "UK", name: "Decisión de Tasa — BoE", period: "Sep 2026", importance: "high", category: "rates" },
  { id: "us-retail-sep", date: "2026-09-16", time: "08:30", country: "US", name: "Ventas Minoristas", period: "Ago 2026", importance: "medium", category: "growth" },
  { id: "us-pce-sep", date: "2026-09-25", time: "08:30", country: "US", name: "PCE Subyacente (Core PCE)", period: "Ago 2026", importance: "high", category: "inflation" },
  { id: "eu-cpi-flash-sep", date: "2026-09-30", time: "10:00", country: "EU", name: "IPC Eurozona (flash)", period: "Sep 2026", importance: "high", category: "inflation" },
  { id: "ar-desempleo-q2", date: "2026-09-25", time: "12:00", country: "AR", name: "Tasa de Desempleo — INDEC", period: "Q2 2026", importance: "high", category: "employment" },

  // ── OCTUBRE 2026 ───────────────────────────────────────────────────────────
  { id: "us-nfp-oct", date: "2026-10-02", time: "08:30", country: "US", name: "Nóminas no Agrícolas (NFP)", period: "Sep 2026", importance: "high", category: "employment" },
  { id: "ar-ipc-oct", date: "2026-10-14", time: "12:00", country: "AR", name: "IPC Argentina (INDEC)", period: "Sep 2026", importance: "high", category: "inflation" },
  { id: "us-cpi-oct", date: "2026-10-14", time: "08:30", country: "US", name: "IPC (CPI) EEUU", period: "Sep 2026", importance: "high", category: "inflation" },
  { id: "us-ppi-oct", date: "2026-10-15", time: "08:30", country: "US", name: "IPP (PPI) EEUU", period: "Sep 2026", importance: "medium", category: "inflation" },
  { id: "eu-ecb-oct", date: "2026-10-23", time: "13:45", country: "EU", name: "Decisión de Tasa — BCE", period: "Oct 2026", importance: "high", category: "rates" },
  { id: "us-fomc-oct", date: "2026-10-28", time: "14:00", country: "US", name: "Decisión de Tasa — FOMC", period: "Oct 2026", importance: "high", category: "rates" },
  { id: "us-gdp-q3-adv", date: "2026-10-29", time: "08:30", country: "US", name: "PIB EEUU — Avance (Q3 2026)", period: "Q3 2026", importance: "high", category: "growth" },
  { id: "jp-boj-oct", date: "2026-10-29", time: "03:00", country: "JP", name: "Decisión de Tasa — BoJ", period: "Oct 2026", importance: "high", category: "rates" },
  { id: "us-retail-oct", date: "2026-10-17", time: "08:30", country: "US", name: "Ventas Minoristas", period: "Sep 2026", importance: "medium", category: "growth" },
  { id: "us-pce-oct", date: "2026-10-30", time: "08:30", country: "US", name: "PCE Subyacente (Core PCE)", period: "Sep 2026", importance: "high", category: "inflation" },
  { id: "eu-cpi-flash-oct", date: "2026-10-30", time: "10:00", country: "EU", name: "IPC Eurozona (flash)", period: "Oct 2026", importance: "high", category: "inflation" },
  { id: "uk-boe-oct", date: "2026-11-05", time: "12:00", country: "UK", name: "Decisión de Tasa — BoE", period: "Nov 2026", importance: "high", category: "rates" },

  // ── NOVIEMBRE 2026 ─────────────────────────────────────────────────────────
  { id: "us-nfp-nov", date: "2026-11-06", time: "08:30", country: "US", name: "Nóminas no Agrícolas (NFP)", period: "Oct 2026", importance: "high", category: "employment" },
  { id: "ar-ipc-nov", date: "2026-11-11", time: "12:00", country: "AR", name: "IPC Argentina (INDEC)", period: "Oct 2026", importance: "high", category: "inflation" },
  { id: "us-cpi-nov", date: "2026-11-12", time: "08:30", country: "US", name: "IPC (CPI) EEUU", period: "Oct 2026", importance: "high", category: "inflation" },
  { id: "us-ppi-nov", date: "2026-11-13", time: "08:30", country: "US", name: "IPP (PPI) EEUU", period: "Oct 2026", importance: "medium", category: "inflation" },
  { id: "us-retail-nov", date: "2026-11-17", time: "08:30", country: "US", name: "Ventas Minoristas", period: "Oct 2026", importance: "medium", category: "growth" },
  { id: "us-pce-nov", date: "2026-11-25", time: "08:30", country: "US", name: "PCE Subyacente (Core PCE)", period: "Oct 2026", importance: "high", category: "inflation" },
  { id: "us-gdp-q3-prel", date: "2026-11-25", time: "08:30", country: "US", name: "PIB EEUU — Preliminar (Q3 2026)", period: "Q3 2026", importance: "high", category: "growth" },
  { id: "eu-ecb-nov", date: "2026-11-13", time: "13:45", country: "EU", name: "Decisión de Tasa — BCE (extra)", period: "Nov 2026", importance: "medium", category: "rates" },
  { id: "eu-cpi-flash-nov", date: "2026-11-30", time: "10:00", country: "EU", name: "IPC Eurozona (flash)", period: "Nov 2026", importance: "high", category: "inflation" },
  { id: "ar-desempleo-q3", date: "2026-11-25", time: "12:00", country: "AR", name: "Tasa de Desempleo — INDEC", period: "Q3 2026", importance: "high", category: "employment" },
  { id: "uk-cpi-nov", date: "2026-11-19", time: "07:00", country: "UK", name: "IPC Reino Unido", period: "Oct 2026", importance: "high", category: "inflation" },

  // ── DICIEMBRE 2026 ─────────────────────────────────────────────────────────
  { id: "us-nfp-dec", date: "2026-12-04", time: "08:30", country: "US", name: "Nóminas no Agrícolas (NFP)", period: "Nov 2026", importance: "high", category: "employment" },
  { id: "ar-ipc-dec", date: "2026-12-09", time: "12:00", country: "AR", name: "IPC Argentina (INDEC)", period: "Nov 2026", importance: "high", category: "inflation" },
  { id: "us-cpi-dec", date: "2026-12-10", time: "08:30", country: "US", name: "IPC (CPI) EEUU", period: "Nov 2026", importance: "high", category: "inflation" },
  { id: "eu-ecb-dec", date: "2026-12-11", time: "13:45", country: "EU", name: "Decisión de Tasa — BCE", period: "Dic 2026", importance: "high", category: "rates" },
  { id: "us-fomc-dec", date: "2026-12-09", time: "14:00", country: "US", name: "Decisión de Tasa — FOMC", period: "Dic 2026", importance: "high", category: "rates", description: "Con conferencia de prensa y proyecciones económicas del año 2027" },
  { id: "jp-boj-dec", date: "2026-12-18", time: "03:00", country: "JP", name: "Decisión de Tasa — BoJ", period: "Dic 2026", importance: "high", category: "rates" },
  { id: "uk-boe-dec", date: "2026-12-17", time: "12:00", country: "UK", name: "Decisión de Tasa — BoE", period: "Dic 2026", importance: "high", category: "rates" },
  { id: "us-retail-dec", date: "2026-12-16", time: "08:30", country: "US", name: "Ventas Minoristas", period: "Nov 2026", importance: "medium", category: "growth" },
  { id: "us-pce-dec", date: "2026-12-18", time: "08:30", country: "US", name: "PCE Subyacente (Core PCE)", period: "Nov 2026", importance: "high", category: "inflation" },
  { id: "eu-cpi-flash-dec", date: "2026-12-31", time: "10:00", country: "EU", name: "IPC Eurozona (flash)", period: "Dic 2026", importance: "high", category: "inflation" },
  { id: "uk-cpi-dec", date: "2026-12-17", time: "07:00", country: "UK", name: "IPC Reino Unido", period: "Nov 2026", importance: "high", category: "inflation" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getEventsForWeek(weekStart: Date): EconomicEvent[] {
  const start = weekStart.toLocaleDateString("en-CA"); // YYYY-MM-DD
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const endStr = end.toLocaleDateString("en-CA");
  return ECONOMIC_CALENDAR.filter((e) => e.date >= start && e.date <= endStr);
}

export function getEventsForMonth(year: number, month: number): EconomicEvent[] {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return ECONOMIC_CALENDAR.filter((e) => e.date.startsWith(prefix));
}

/** Returns Monday of the week containing `date` */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${weekStart.toLocaleDateString("es-AR", opts)} – ${end.toLocaleDateString("es-AR", opts)}`;
}
