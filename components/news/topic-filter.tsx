"use client";

import { cn } from "@/lib/utils";
import { TOPICS, TOPIC_LABELS, TOPIC_STYLES, type NewsTopic } from "@/lib/news";

export function TopicFilter({
  active,
  onChange,
  counts,
}: {
  active: NewsTopic | "all";
  onChange: (t: NewsTopic | "all") => void;
  counts: Record<NewsTopic | "all", number>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange("all")}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
          active === "all"
            ? "bg-primary text-primary-foreground border-primary"
            : "border-border text-muted-foreground hover:bg-accent"
        )}
      >
        Todos <span className="opacity-70">({counts.all})</span>
      </button>
      {TOPICS.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            active === t ? TOPIC_STYLES[t] : "border-border text-muted-foreground hover:bg-accent"
          )}
        >
          {TOPIC_LABELS[t]} <span className="opacity-70">({counts[t]})</span>
        </button>
      ))}
    </div>
  );
}
