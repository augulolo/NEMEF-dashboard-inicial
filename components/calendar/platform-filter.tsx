"use client";

import { cn } from "@/lib/utils";
import { PLATFORMS, PLATFORM_LABELS, PLATFORM_STYLES, type Platform } from "@/lib/calendar";

export function PlatformFilter({
  active,
  onToggle,
  onAll,
}: {
  active: Set<Platform>;
  onToggle: (p: Platform) => void;
  onAll: () => void;
}) {
  const allOn = active.size === PLATFORMS.length;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onAll}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
          allOn
            ? "bg-primary text-primary-foreground border-primary"
            : "border-border text-muted-foreground hover:bg-accent"
        )}
      >
        Todas
      </button>
      {PLATFORMS.map((p) => {
        const on = active.has(p);
        const style = PLATFORM_STYLES[p];
        return (
          <button
            key={p}
            onClick={() => onToggle(p)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              on ? style.chip : "border-border text-muted-foreground hover:bg-accent opacity-60"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
            {PLATFORM_LABELS[p]}
          </button>
        );
      })}
    </div>
  );
}
