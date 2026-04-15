"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { TOPIC_LABELS, TOPIC_STYLES, type NewsItem } from "@/lib/news";

function timeAgo(iso: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "recién";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `hace ${days}d`;
  return new Date(iso).toLocaleDateString("es-AR", { month: "short", day: "numeric" });
}

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <Card className="hover:border-primary/50 transition-colors group">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
            <span className="font-medium text-foreground/80 truncate">{item.source}</span>
            <span>·</span>
            <span>{timeAgo(item.publishedAt)}</span>
          </div>
          <div className="flex flex-wrap gap-1 shrink-0">
            {item.topics.map((t) => (
              <span
                key={t}
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  TOPIC_STYLES[t]
                )}
              >
                {TOPIC_LABELS[t]}
              </span>
            ))}
          </div>
        </div>
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block group-hover:text-primary transition-colors"
        >
          <h3 className="text-base font-semibold leading-snug flex items-start gap-1.5">
            <span>{item.title}</span>
            <ExternalLink className="h-3.5 w-3.5 mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
        </a>
        {item.summary && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{item.summary}</p>
        )}
      </CardContent>
    </Card>
  );
}
