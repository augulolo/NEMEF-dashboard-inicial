import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "scheduled" | "draft" | "published" | "backlog" | "outline";

const variants: Record<Variant, string> = {
  default: "bg-primary/20 text-primary border-primary/30",
  scheduled: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  draft: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  published: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  backlog: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  outline: "border-border text-muted-foreground",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: Variant }) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
