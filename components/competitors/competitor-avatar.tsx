"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/competitors";
import type { Competitor } from "@/lib/competitors";

const COLORS = [
  "bg-pink-500/20 text-pink-400",
  "bg-blue-500/20 text-blue-400",
  "bg-emerald-500/20 text-emerald-400",
  "bg-amber-500/20 text-amber-400",
  "bg-purple-500/20 text-purple-400",
  "bg-red-500/20 text-red-400",
  "bg-cyan-500/20 text-cyan-400",
  "bg-orange-500/20 text-orange-400",
];

function deterministicColor(handle: string) {
  const idx = handle.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % COLORS.length;
  return COLORS[idx];
}

export function CompetitorAvatar({
  competitor,
  size = "md",
}: {
  competitor: Pick<Competitor, "name" | "handle" | "platform" | "profilePicUrl">;
  size?: "sm" | "md" | "lg";
}) {
  // Try synced pic first, then unavatar.io, then initials
  const { name, handle, platform, profilePicUrl } = competitor;
  const unavatarUrl = getAvatarUrl(platform, handle);

  const [src, setSrc] = useState<string>(profilePicUrl || unavatarUrl);
  const [failed, setFailed] = useState(false);

  const sizeClasses = {
    sm: "h-6 w-6 text-[9px]",
    md: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm",
  }[size];

  const initials = (name || handle)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase() || "??";

  const handleError = () => {
    // If synced pic failed, try unavatar; if unavatar also failed, show initials
    if (src !== unavatarUrl) {
      setSrc(unavatarUrl);
    } else {
      setFailed(true);
    }
  };

  if (!failed) {
    return (
      <img
        src={src}
        alt={name || handle}
        className={cn("rounded-full object-cover bg-muted shrink-0 border border-border", sizeClasses)}
        onError={handleError}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold shrink-0 select-none border border-border/50",
        sizeClasses,
        deterministicColor(handle)
      )}
    >
      {initials}
    </div>
  );
}
