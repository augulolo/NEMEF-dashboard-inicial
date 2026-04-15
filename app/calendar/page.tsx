"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PlatformFilter } from "@/components/calendar/platform-filter";
import { MonthGrid } from "@/components/calendar/month-grid";
import { DayDetail } from "@/components/calendar/day-detail";
import {
  PLATFORMS,
  SEED_CALENDAR,
  type Platform,
  type CalendarStatus,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

const TODAY = "2026-04-15";
const STATUSES: { key: CalendarStatus | "all"; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "scheduled", label: "Programados" },
  { key: "published", label: "Publicados" },
];

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => {
    const d = new Date(TODAY + "T00:00:00");
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [activePlatforms, setActivePlatforms] = useState<Set<Platform>>(new Set(PLATFORMS));
  const [statusFilter, setStatusFilter] = useState<CalendarStatus | "all">("all");
  const [selectedDay, setSelectedDay] = useState<string>(TODAY);

  const filtered = useMemo(
    () =>
      SEED_CALENDAR.filter(
        (it) =>
          activePlatforms.has(it.platform) && (statusFilter === "all" || it.status === statusFilter)
      ),
    [activePlatforms, statusFilter]
  );

  const monthLabel = `${MONTHS_ES[cursor.month]} ${cursor.year}`;

  const shift = (delta: number) => {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  const togglePlatform = (p: Platform) => {
    setActivePlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  const allPlatforms = () => setActivePlatforms(new Set(PLATFORMS));

  const dayItems = filtered.filter((i) => i.date === selectedDay);

  return (
    <>
      <PageHeader title="Calendario de contenido" description="Resumen mensual de lo programado y publicado." />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Mes anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[180px] text-center text-lg font-semibold capitalize">{monthLabel}</div>
          <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Mes siguiente">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const d = new Date(TODAY + "T00:00:00");
              setCursor({ year: d.getFullYear(), month: d.getMonth() });
              setSelectedDay(TODAY);
            }}
          >
            Hoy
          </Button>
        </div>

        <div className="flex items-center gap-1 rounded-md border p-1">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={cn(
                "px-3 py-1 text-xs rounded transition-colors",
                statusFilter === s.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <PlatformFilter active={activePlatforms} onToggle={togglePlatform} onAll={allPlatforms} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <MonthGrid
          year={cursor.year}
          month={cursor.month}
          items={filtered}
          today={TODAY}
          onSelectDay={setSelectedDay}
        />
        <DayDetail date={selectedDay} items={dayItems} />
      </div>
    </>
  );
}
