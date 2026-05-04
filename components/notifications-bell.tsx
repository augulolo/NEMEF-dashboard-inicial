"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Calendar, AlertCircle, CheckCircle2, X, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Notification {
  id: string;
  type: "overdue" | "today" | "tomorrow" | "competitor_up" | "competitor_down";
  message: string;
  detail?: string;
  href: string;
}

const TODAY = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
const TOMORROW = () => {
  const d = new Date(TODAY() + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA");
};

export function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("nemef_notif_dismissed") ?? "[]")); } catch { return new Set(); }
  });
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const today = TODAY();
    const tomorrow = TOMORROW();

    Promise.all([
      supabase
        .from("posts")
        .select("id, caption, scheduled_date, status")
        .eq("status", "scheduled")
        .lte("scheduled_date", tomorrow)
        .order("scheduled_date"),
      supabase
        .from("competitors")
        .select("id, name, handle, followers_history"),
    ]).then(([postsRes, compRes]) => {
      const notifs: Notification[] = [];

      // Post alerts
      for (const p of postsRes.data ?? []) {
        const date = p.scheduled_date as string;
        const preview = (p.caption as string).slice(0, 50) + ((p.caption as string).length > 50 ? "…" : "");
        if (date < today) {
          notifs.push({ id: `overdue-${p.id}`, type: "overdue", message: "Post atrasado", detail: preview, href: "/instagram" });
        } else if (date === today) {
          notifs.push({ id: `today-${p.id}`, type: "today", message: "Para publicar hoy", detail: preview, href: "/instagram" });
        } else if (date === tomorrow) {
          notifs.push({ id: `tomorrow-${p.id}`, type: "tomorrow", message: "Para mañana", detail: preview, href: "/instagram" });
        }
      }

      // Competitor growth alerts (>5% change between last 2 sync points)
      for (const c of compRes.data ?? []) {
        const hist = Array.isArray(c.followers_history) ? c.followers_history as number[] : [];
        if (hist.length < 2) continue;
        const prev = hist[hist.length - 2];
        const last = hist[hist.length - 1];
        if (!prev || prev === 0) continue;
        const pct = ((last - prev) / prev) * 100;
        if (Math.abs(pct) >= 5) {
          const isUp = pct > 0;
          notifs.push({
            id: `comp-${c.id}-${last}`,
            type: isUp ? "competitor_up" : "competitor_down",
            message: `${c.name} ${isUp ? "creció" : "bajó"} ${Math.abs(pct).toFixed(1)}%`,
            detail: `@${c.handle} — ${last.toLocaleString("es-AR")} seguidores`,
            href: "/competitors",
          });
        }
      }

      setNotifications(notifs);
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const PANEL_WIDTH = 320;
      const MARGIN = 8;

      // Position below the button, aligned to its left edge,
      // but clamp so the panel never goes off-screen to the right
      const left = Math.min(rect.left, window.innerWidth - PANEL_WIDTH - MARGIN);
      const top = rect.bottom + MARGIN;

      setPanelStyle({ top, left, width: PANEL_WIDTH });
    }
    setOpen((v) => !v);
  };

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    localStorage.setItem("nemef_notif_dismissed", JSON.stringify([...next]));
  };

  const visible = notifications.filter((n) => !dismissed.has(n.id));
  const overdueCount = visible.filter((n) => n.type === "overdue").length;
  const badge = visible.length;

  if (notifications.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
        aria-label="Notificaciones"
      >
        <Bell className="h-4 w-4" />
        {badge > 0 && (
          <span className={cn(
            "absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full text-[10px] font-bold flex items-center justify-center px-0.5 tabular-nums",
            overdueCount > 0 ? "bg-amber-500 text-white" : "bg-primary text-primary-foreground"
          )}>
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="fixed rounded-xl border bg-card shadow-2xl z-[200] overflow-hidden"
          style={panelStyle}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-sm font-semibold">Notificaciones</h3>
              {badge > 0 && (
                <span className={cn(
                  "h-4 min-w-[16px] rounded-full text-[10px] font-bold flex items-center justify-center px-1 tabular-nums",
                  overdueCount > 0 ? "bg-amber-500/20 text-amber-400" : "bg-primary/20 text-primary"
                )}>
                  {badge}
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {visible.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Todo al día</p>
            </div>
          ) : (
            <ul className="divide-y max-h-80 overflow-y-auto">
              {visible.map((n) => (
                <li key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors">
                  <div className="shrink-0 mt-0.5">
                    {n.type === "overdue" ? (
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                    ) : n.type === "competitor_up" ? (
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                    ) : n.type === "competitor_down" ? (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    ) : (
                      <Calendar className="h-4 w-4 text-blue-400" />
                    )}
                  </div>
                  <Link href={n.href} onClick={() => setOpen(false)} className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs font-semibold",
                      n.type === "overdue"         ? "text-amber-300" :
                      n.type === "competitor_up"   ? "text-emerald-300" :
                      n.type === "competitor_down" ? "text-red-300" :
                                                     "text-foreground"
                    )}>
                      {n.message}
                    </p>
                    {n.detail && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{n.detail}</p>
                    )}
                  </Link>
                  <button
                    onClick={(e) => { e.preventDefault(); dismiss(n.id); }}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                    title="Descartar"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Footer — dismiss all */}
          {visible.length > 1 && (
            <div className="px-4 py-2 border-t bg-muted/10">
              <button
                onClick={() => visible.forEach((n) => dismiss(n.id))}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Descartar todas
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
