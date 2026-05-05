"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ECONOMIC_CALENDAR,
  COUNTRY_FLAGS,
  COUNTRY_NAMES,
  getWeekStart,
  getEventsForWeek,
  formatWeekRange,
  type EconomicEvent,
  type EventCountry,
  type EventImportance,
} from "@/lib/economic-calendar";

// ── Importance badge ──────────────────────────────────────────────────────────
function ImportanceBadge({ importance }: { importance: EventImportance }) {
  const cfg = {
    high:   { dot: "bg-red-500",    text: "text-red-400",    border: "border-red-500/30",    bg: "bg-red-500/5",    label: "Alta" },
    medium: { dot: "bg-amber-400",  text: "text-amber-400",  border: "border-amber-500/30",  bg: "bg-amber-500/5",  label: "Media" },
    low:    { dot: "bg-slate-500",  text: "text-slate-400",  border: "border-slate-500/30",  bg: "bg-slate-500/5",  label: "Baja" },
  }[importance];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold", cfg.text, cfg.border, cfg.bg)}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ── Category label ─────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<EconomicEvent["category"], string> = {
  rates: "Tasas", employment: "Empleo", inflation: "Inflación",
  growth: "Crecimiento", trade: "Comercio", sentiment: "Confianza",
  housing: "Vivienda", other: "Otro",
};

// ── Event row ─────────────────────────────────────────────────────────────────
function EventRow({ event, isPast }: { event: EconomicEvent; isPast: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "group rounded-lg border transition-colors cursor-pointer",
        isPast ? "opacity-55 hover:opacity-80" : "hover:bg-accent/30",
        event.importance === "high" && !isPast ? "border-l-2 border-l-red-500/60" : "border-border"
      )}
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Time */}
        <div className="w-12 shrink-0 text-right">
          {event.time ? (
            <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5 inline" />{event.time}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground/40">—</span>
          )}
        </div>

        {/* Flag */}
        <span className="text-base w-6 text-center shrink-0" title={COUNTRY_NAMES[event.country]}>
          {COUNTRY_FLAGS[event.country]}
        </span>

        {/* Importance */}
        <div className="w-16 shrink-0 hidden sm:block">
          <ImportanceBadge importance={event.importance} />
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-sm font-medium truncate", isPast ? "text-muted-foreground" : "text-foreground")}>
              {event.name}
            </span>
            {event.period && (
              <span className="text-[10px] text-muted-foreground/60 shrink-0">{event.period}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 sm:hidden">
            <ImportanceBadge importance={event.importance} />
            <span className="text-[10px] text-muted-foreground">
              {CATEGORY_LABELS[event.category]}
            </span>
          </div>
        </div>

        {/* Category */}
        <span className="text-[10px] text-muted-foreground hidden md:block shrink-0">
          {CATEGORY_LABELS[event.category]}
        </span>

        {/* Previous / Forecast / Actual */}
        <div className="hidden lg:flex items-center gap-4 shrink-0 text-xs tabular-nums">
          {event.previous && (
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Anterior</p>
              <p className="text-muted-foreground font-mono">{event.previous}</p>
            </div>
          )}
          {event.forecast && (
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Estimado</p>
              <p className="text-foreground font-mono">{event.forecast}</p>
            </div>
          )}
          {event.actual !== undefined ? (
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Real</p>
              <p className="text-emerald-400 font-mono font-semibold">{event.actual}</p>
            </div>
          ) : isPast ? (
            <div className="text-right w-16">
              <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Real</p>
              <p className="text-muted-foreground/40">—</p>
            </div>
          ) : null}
        </div>
      </div>

      {open && event.description && (
        <div className="px-4 pb-3 pt-0 border-t border-border/50">
          <p className="text-xs text-muted-foreground leading-relaxed">{event.description}</p>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const TODAY = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

const COUNTRY_FILTERS: { key: EventCountry | "ALL"; label: string }[] = [
  { key: "ALL", label: "Todos" },
  { key: "US",  label: "🇺🇸 EEUU" },
  { key: "EU",  label: "🇪🇺 Euro" },
  { key: "UK",  label: "🇬🇧 UK" },
  { key: "JP",  label: "🇯🇵 Japón" },
  { key: "DE",  label: "🇩🇪 Alemania" },
  { key: "AR",  label: "🇦🇷 Argentina" },
  { key: "CN",  label: "🇨🇳 China" },
];

const IMP_FILTERS: { key: EventImportance | "ALL"; label: string }[] = [
  { key: "ALL",    label: "Todos" },
  { key: "high",   label: "🔴 Alta" },
  { key: "medium", label: "🟡 Media" },
  { key: "low",    label: "⚪ Baja" },
];

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_NAMES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

export default function CalendarioEconomicoPage() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date(TODAY + "T00:00:00")));
  const [countryFilter, setCountryFilter] = useState<EventCountry | "ALL">("ALL");
  const [impFilter, setImpFilter] = useState<EventImportance | "ALL">("high");
  const [viewMode, setViewMode] = useState<"week" | "month">("week");

  const goToday = () => setWeekStart(getWeekStart(new Date(TODAY + "T00:00:00")));
  const shiftWeek = (d: number) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + d * 7);
    setWeekStart(next);
  };

  // All events for display period
  const periodEvents = useMemo(() => {
    let evts: EconomicEvent[];
    if (viewMode === "week") {
      evts = getEventsForWeek(weekStart);
    } else {
      const prefix = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}`;
      evts = ECONOMIC_CALENDAR.filter((e) => e.date.startsWith(prefix));
    }
    return evts
      .filter((e) => countryFilter === "ALL" || e.country === countryFilter)
      .filter((e) => impFilter === "ALL" || e.importance === impFilter)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? ""));
  }, [weekStart, countryFilter, impFilter, viewMode]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, EconomicEvent[]>();
    for (const e of periodEvents) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    return map;
  }, [periodEvents]);

  const weekLabel = useMemo(() => {
    if (viewMode === "week") return formatWeekRange(weekStart);
    return `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
  }, [weekStart, viewMode]);

  const shiftLabel = viewMode === "week" ? "semana" : "mes";
  const shiftMonth = (d: number) => {
    const next = new Date(weekStart);
    next.setMonth(next.getMonth() + d);
    next.setDate(1);
    setWeekStart(getWeekStart(next));
  };
  const shift = viewMode === "week" ? shiftWeek : shiftMonth;

  const highCount = periodEvents.filter((e) => e.importance === "high").length;

  return (
    <>
      <PageHeader
        title="Calendario Económico"
        description="Fechas clave: decisiones de tasas, datos de empleo, inflación, PIB y más."
      />

      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="p-1.5 rounded border hover:bg-accent" aria-label={`${shiftLabel} anterior`}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-[200px] text-center text-sm font-semibold capitalize">{weekLabel}</div>
          <button onClick={() => shift(1)} className="p-1.5 rounded border hover:bg-accent" aria-label={`${shiftLabel} siguiente`}>
            <ChevronRight className="h-4 w-4" />
          </button>
          <button onClick={goToday} className="text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            Hoy
          </button>
          {/* Week/Month toggle */}
          <div className="flex rounded-md border overflow-hidden">
            <button onClick={() => setViewMode("week")} className={cn("px-3 py-1 text-xs transition-colors", viewMode === "week" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>Semana</button>
            <button onClick={() => setViewMode("month")} className={cn("px-3 py-1 text-xs transition-colors", viewMode === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>Mes</button>
          </div>
        </div>
        {highCount > 0 && (
          <span className="text-xs text-red-400 font-medium">
            🔴 {highCount} evento{highCount !== 1 ? "s" : ""} de alta relevancia
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex items-center gap-1.5 rounded-lg border p-1 overflow-x-auto">
          {COUNTRY_FILTERS.map((f) => (
            <button key={f.key} onClick={() => setCountryFilter(f.key as EventCountry | "ALL")}
              className={cn("px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap",
                countryFilter === f.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          {IMP_FILTERS.map((f) => (
            <button key={f.key} onClick={() => setImpFilter(f.key as EventImportance | "ALL")}
              className={cn("px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap",
                impFilter === f.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event list */}
      {grouped.size === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">No hay eventos para esta {shiftLabel} con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([date, events]) => {
            const d = new Date(date + "T12:00:00");
            const dayName = DAY_NAMES[d.getDay()];
            const dayNum = d.getDate();
            const monthName = MONTH_NAMES[d.getMonth()];
            const isPastDate = date < TODAY;
            const isToday = date === TODAY;

            return (
              <div key={date}>
                {/* Date header */}
                <div className={cn(
                  "flex items-center gap-3 mb-3",
                  isPastDate && !isToday && "opacity-60"
                )}>
                  <div className={cn(
                    "flex items-center justify-center h-9 w-9 rounded-full text-sm font-bold shrink-0",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : isPastDate
                        ? "bg-muted text-muted-foreground"
                        : "bg-card border border-border text-foreground"
                  )}>
                    {dayNum}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground capitalize">
                      {isToday ? "Hoy" : dayName}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2 capitalize">{monthName}</span>
                  </div>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground shrink-0">{events.length} evento{events.length !== 1 ? "s" : ""}</span>
                </div>

                {/* Events */}
                <div className="space-y-1.5 pl-12">
                  {events.map((e) => (
                    <EventRow key={e.id} event={e} isPast={date < TODAY} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 rounded-lg border border-border bg-muted/20 px-5 py-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3">Leyenda de importancia</p>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500 inline-block" /> <strong className="text-red-400">Alta</strong> — Impacto significativo en mercados. FOMC, NFP, CPI, PIB.</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-400 inline-block" /> <strong className="text-amber-400">Media</strong> — Influye en sectores o divisas específicos.</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-slate-500 inline-block" /> <strong className="text-slate-400">Baja</strong> — Dato de seguimiento.</div>
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-3">Horarios en ET (Eastern Time, EEUU). Hacé click en un evento para ver su descripción. Fechas aproximadas basadas en calendarios históricos.</p>
      </div>
    </>
  );
}
