"use client";

import { cn } from "@/lib/utils";
import { PLATFORM_LABELS, PLATFORM_STYLES, type CalendarItem } from "@/lib/calendar";

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const TODAY = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

function getWeekDays(referenceDate: string): string[] {
  const d = new Date(referenceDate + "T00:00:00");
  const day = d.getDay(); // 0 = Sunday
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return dd.toLocaleDateString("en-CA");
  });
}

export function WeekGrid({
  referenceDate,
  items,
  selectedDay,
  onSelectDay,
}: {
  referenceDate: string;
  items: CalendarItem[];
  selectedDay: string;
  onSelectDay: (day: string) => void;
}) {
  const weekDays = getWeekDays(referenceDate);

  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {weekDays.map((date, i) => {
          const isToday = date === TODAY;
          const isSelected = date === selectedDay;
          const dayNum = new Date(date + "T00:00:00").getDate();
          return (
            <button
              key={date}
              onClick={() => onSelectDay(date)}
              className={cn(
                "flex flex-col items-center py-3 text-xs font-medium transition-colors border-r last:border-r-0",
                isSelected ? "bg-primary text-primary-foreground" :
                isToday ? "bg-primary/10 text-primary" :
                "text-muted-foreground hover:bg-accent"
              )}
            >
              <span className="text-[10px] uppercase tracking-wide">{DAYS_ES[i]}</span>
              <span className={cn("text-base font-bold mt-0.5 h-7 w-7 flex items-center justify-center rounded-full",
                isToday && !isSelected && "ring-1 ring-primary"
              )}>
                {dayNum}
              </span>
              {/* Dot indicator for items */}
              {items.some((it) => it.date === date) && (
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full mt-1",
                  isSelected ? "bg-primary-foreground" : "bg-primary"
                )} />
              )}
            </button>
          );
        })}
      </div>

      {/* Events row */}
      <div className="grid grid-cols-7 min-h-[120px]">
        {weekDays.map((date) => {
          const dayItems = items.filter((it) => it.date === date);
          const isToday = date === TODAY;
          const isSelected = date === selectedDay;
          return (
            <button
              key={date}
              onClick={() => onSelectDay(date)}
              className={cn(
                "flex flex-col gap-1 p-2 text-left border-r last:border-r-0 min-h-[120px] transition-colors align-top",
                isSelected ? "bg-primary/5" : isToday ? "bg-primary/5" : "hover:bg-accent/50"
              )}
            >
              {dayItems.length === 0 ? null : dayItems.map((item) => {
                const style = PLATFORM_STYLES[item.platform as keyof typeof PLATFORM_STYLES];
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded px-1.5 py-1 text-[10px] leading-tight truncate border",
                      style?.dot ? `border-opacity-30` : "border-border",
                      item.status === "published" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-primary/10 border-primary/30 text-primary"
                    )}
                    title={item.title}
                  >
                    <span className={cn("inline-block h-1.5 w-1.5 rounded-full mr-1 align-middle", style?.dot)} />
                    {item.title.slice(0, 25)}{item.title.length > 25 ? "…" : ""}
                  </div>
                );
              })}
              {dayItems.length > 3 && (
                <span className="text-[10px] text-muted-foreground">+{dayItems.length - 3} más</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
