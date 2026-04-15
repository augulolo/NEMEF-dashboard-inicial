"use client";

import { cn } from "@/lib/utils";
import { PLATFORM_STYLES, type CalendarItem } from "@/lib/calendar";

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
                !inMonth && "bg-background/30 opacity-50",
                (i + 1) % 7 === 0 && "border-r-0"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-xs font-medium inline-flex items-center justify-center h-6 w-6 rounded-full",
                    isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                  )}
                >
                  {date.getDate()}
                </span>
                {dayItems.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">{dayItems.length}</span>
                )}
              </div>
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
