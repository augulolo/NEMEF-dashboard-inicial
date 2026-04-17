"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const t = (e as CustomEvent).detail as Toast;
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4000);
    };
    window.addEventListener("nemef:toast", handler);
    return () => window.removeEventListener("nemef:toast", handler);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium shadow-xl",
            "animate-in slide-in-from-bottom-2 duration-200 pointer-events-auto",
            t.type === "success" && "bg-card border-emerald-500/40 text-emerald-400",
            t.type === "error"   && "bg-card border-red-500/40 text-red-400",
            t.type === "info"    && "bg-card border-primary/40 text-primary",
          )}
        >
          {t.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
          {t.type === "error"   && <XCircle      className="h-4 w-4 shrink-0" />}
          {t.type === "info"    && <Info         className="h-4 w-4 shrink-0" />}
          <span className="text-foreground">{t.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
