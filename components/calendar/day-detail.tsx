"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PLATFORM_LABELS, PLATFORM_STYLES, STATUS_LABELS_CAL, type CalendarItem } from "@/lib/calendar";

export function DayDetail({ date, items }: { date: string; items: CalendarItem[] }) {
  const pretty = new Date(date + "T00:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base capitalize">{pretty}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {items.length === 0 ? "Sin contenido este día" : `${items.length} ${items.length === 1 ? "ítem" : "ítems"}`}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((it) => {
          const style = PLATFORM_STYLES[it.platform];
          return (
            <div
              key={it.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-md border p-2.5 text-sm",
                "bg-background/40"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn("h-2 w-2 rounded-full shrink-0", style.dot)} />
                <div className="min-w-0">
                  <p className="truncate">{it.title}</p>
                  <p className="text-xs text-muted-foreground">{PLATFORM_LABELS[it.platform]}</p>
                </div>
              </div>
              <Badge variant={it.status === "published" ? "published" : "scheduled"}>
                {STATUS_LABELS_CAL[it.status]}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
