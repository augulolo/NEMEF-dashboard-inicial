"use client";

import { cn } from "@/lib/utils";
import { PLATFORM_STYLES, type CalendarItem } from "@/lib/calendar";

/** Fondo sutil para densidad de posts: 0 = sin posts, escala hasta 4+ */
function densityBg(count: number): string {
  if (count === 0) return "";
  if (count === 1) return "bg-primary/5";
  if (count === 2) return "bg-primary/10";
  if (count === 3) return "bg-primary/15";
  return "bg-primary/20"; // 4+
}

/** Dots de colores por tipo de post para visualización compacta */
const TYPE_DOT: Record<string, string> = {
  reel:     "bg-violet-500",
  carousel: "bg-blue-500",
  photo:    "bg-pink-500",
  story:    "bg-amber-500",
};

/** Leyenda de densidad que se puede mostrar encima del grid */
export const DENSITY_LEGEND = [
  { label: "1 post",  bg: "bg-primary/5" },
  { label: "2 posts", bg: "bg-primary/10" },
  { label: "3 posts", bg: "bg-primary/15" },
  { label: "4+",      bg: "bg-primary/20" },
];

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MonthGrid({
  year,
  month,
  items,
  today,
  onSelectDay,
}: {
  year: number;
  month: number;
  items: CalendarItem[];
  today: string;
  onSelectDay: (date: string) => void;
}) {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push({
      date: new Date(year, month - 1, prevMonthDays - startWeekday + 1 + i),
      inMonth: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
  }

  const byDay = new Map<string, CalendarItem[]>();
  for (const it of items) {
    const list = byDay.get(it.date) ?? [];
    list.push(it);
    byDay.set(it.date, list);
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="grid grid-cols-7 border-b bg-background/50">
        {WEEKDAYS.map((w) => (
          <div key={w} className="px-3 py-2 text-xs font-semibold text-muted-foreground tracking-wide uppercase">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-fr">
        {cells.map(({ date, inMonth }, i) => {
          const key = iso(date);
          const dayItems = byDay.get(key) ?? [];
          const isToday = key === today;
          const visible = dayItems.slice(0, 3);
          const extra = dayItems.length - visible.length;
          return (
            <button
              key={i}
              onClick={() => onSelectDay(key)}
              className={cn(
                "min-h-[120px] text-left border-b border-r last:border-r-0 p-2 flex flex-col gap-1 transition-colors hover:bg-accent/30",
                inMonth ? densityBg(dayItems.length) : "bg-background/30 opacity-50",
                (i + 1) % 7 === 0 && "border-r-0"
              )}
            >
              {/* Número del día + barra de densidad */}
              <div className="flex items-start justify-between gap-1">
                <span
                  className={cn(
                    "text-xs font-medium inline-flex items-center justify-center h-6 w-6 rounded-full shrink-0",
                    isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                  )}
                >
                  {date.getDate()}
                </span>
                {/* Dots de tipo (reel/carousel/photo/story) */}
                {inMonth && dayItems.length > 0 && (
                  <div className="flex items-center flex-wrap gap-0.5 mt-1">
                    {dayItems.slice(0, 6).map((it, idx) => {
                      const typeKey = (it as CalendarItem & { postType?: string }).postType ?? "";
                      const dotColor = TYPE_DOT[typeKey] ?? PLATFORM_STYLES[it.platform].dot;
                      return (
                        <span
                          key={`${it.id}-${idx}`}
                          title={it.title}
                          className={cn("h-2 w-2 rounded-full shrink-0", dotColor)}
                        />
                      );
                    })}
                    {dayItems.length > 6 && (
                      <span className="text-[9px] text-muted-foreground leading-none">+{dayItems.length - 6}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Chips de título (hasta 3) */}
              <div className="flex flex-col gap-1 overflow-hidden">
                {visible.map((it) => {
                  const style = PLATFORM_STYLES[it.platform];
                  return (
                    <div
                      key={it.id}
                      className={cn(
                        "rounded border px-1.5 py-0.5 text-[11px] leading-tight truncate flex items-center gap-1",
                        style.chip,
                        it.status === "published" && "opacity-70"
                      )}
                      title={`${it.title} — ${it.platform}`}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", style.dot)} />
                      <span className="truncate">{it.title}</span>
                    </div>
                  );
                })}
                {extra > 0 && (
                  <span className="text-[10px] text-muted-foreground pl-1">+{extra} más</span>
                )}
              </div>

              {/* Mini barra de densidad en el fondo */}
              {inMonth && dayItems.length > 0 && (
                <div className="mt-auto pt-1">
                  <div className="h-0.5 rounded-full bg-primary/30 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(dayItems.length / 5, 1) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
