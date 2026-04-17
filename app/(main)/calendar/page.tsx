"use client";

import { useEffect, useMemo, useState } from "react";
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
  type CalendarItem,
} from "@/lib/calendar";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/posts";

function postToCalendarItem(p: Post): CalendarItem {
  return {
    id: `post-${p.id}`,
    title: p.caption.slice(0, 60) + (p.caption.length > 60 ? "…" : ""),
    platform: "instagram",
    status: p.status === "published" ? "published" : "scheduled",
    date: p.scheduledDate!,
  };
}

const TODAY = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }); // yyyy-mm-dd en timezone AR
const STATUSES: { key: CalendarStatus | "all"; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "scheduled", label: "Programados" },
  { key: "published", label: "Publicados" },
];

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function fromDB(row: Record<string, unknown>): CalendarItem {
  return {
    id: row.id as string,
    title: row.title as string,
    platform: row.platform as Platform,
    status: row.status as CalendarStatus,
    date: row.date as string,
  };
}

export default function CalendarPage() {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => {
    const d = new Date(TODAY + "T00:00:00");
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [activePlatforms, setActivePlatforms] = useState<Set<Platform>>(new Set(PLATFORMS));
  const [statusFilter, setStatusFilter] = useState<CalendarStatus | "all">("all");
  const [selectedDay, setSelectedDay] = useState<string>(TODAY);

  useEffect(() => {
    Promise.all([
      supabase.from("calendar_items").select("*").order("date", { ascending: true }),
      supabase.from("posts").select("*").not("scheduled_date", "is", null),
    ]).then(([calRes, postsRes]) => {
      let calItems: CalendarItem[] = [];

      if (calRes.error) {
        calItems = SEED_CALENDAR;
      } else if (calRes.data && calRes.data.length > 0) {
        calItems = calRes.data.map(fromDB);
      } else {
        const seedRows = SEED_CALENDAR.map((i) => ({
          title: i.title, platform: i.platform, status: i.status, date: i.date,
        }));
        supabase.from("calendar_items").insert(seedRows).then(() => {});
        calItems = SEED_CALENDAR;
      }

      // Fusionar posts de Instagram con fecha programada
      const postItems: CalendarItem[] = (postsRes.data ?? [])
        .map((r) => ({
          id: r.id,
          caption: r.caption,
          type: r.type,
          status: r.status,
          scheduledDate: r.scheduled_date,
          createdAt: r.created_at,
        } as Post))
        .filter((p) => p.scheduledDate)
        .map(postToCalendarItem);

      // Evitar duplicados si ya existe un calendar_item con mismo id
      const existingIds = new Set(calItems.map((i) => i.id));
      const newPostItems = postItems.filter((p) => !existingIds.has(p.id));

      setItems([...calItems, ...newPostItems]);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(
    () =>
      items.filter(
        (it) =>
          activePlatforms.has(it.platform) &&
          (statusFilter === "all" || it.status === statusFilter)
      ),
    [items, activePlatforms, statusFilter]
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
        <PlatformFilter
          active={activePlatforms}
          onToggle={togglePlatform}
          onAll={() => setActivePlatforms(new Set(PLATFORMS))}
        />
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Cargando calendario…</div>
      ) : (
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
      )}
    </>
  );
}
