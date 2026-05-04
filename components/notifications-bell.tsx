"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Calendar, AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Notification {
  id: string;
  type: "overdue" | "today" | "tomorrow";
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
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const today = TODAY();
    const tomorrow = TOMORROW();

    supabase
      .from("posts")
      .select("id, caption, scheduled_date, status")
      .eq("status", "scheduled")
      .lte("scheduled_date", tomorrow)
      .order("scheduled_date")
      .then(({ data }) => {
        const notifs: Notification[] = [];
        for (const p of data ?? []) {
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
        setNotifications(notifs);
      });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

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
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
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
        <div className="absolute right-0 top-10 w-80 rounded-xl border bg-card shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-semibold">Notificaciones</h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {visible.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Todo al día</p>
            </div>
          ) : (
            <ul className="divide-y max-h-72 overflow-y-auto">
              {visible.map((n) => (
                <li key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors">
                  <div className="shrink-0 mt-0.5">
                    {n.type === "overdue" ? (
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                    ) : (
                      <Calendar className="h-4 w-4 text-blue-400" />
                    )}
                  </div>
                  <Link href={n.href} onClick={() => setOpen(false)} className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs font-medium",
                      n.type === "overdue" ? "text-amber-300" : "text-foreground"
                    )}>{n.message}</p>
                    {n.detail && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{n.detail}</p>
                    )}
                  </Link>
                  <button
                    onClick={() => dismiss(n.id)}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                    title="Descartar"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
