"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Calendar, Instagram, Newspaper, Target, LayoutDashboard, LogOut, Sun, Moon, Lightbulb, StickyNote, Zap, FileText, BookOpen, MonitorPlay, Settings, Mail, Search, TrendingUp, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase";
import { useTheme } from "@/components/theme-provider";
import { useEffect, useState } from "react";
import { NotificationsBell } from "@/components/notifications-bell";

const nav = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/instagram", label: "Gestor de Instagram", icon: Instagram },
  { href: "/analytics", label: "Analíticas", icon: BarChart3 },
  { href: "/calendar", label: "Calendario", icon: Calendar },
  { href: "/competitors", label: "Creadores", icon: Target },
  { href: "/news", label: "Noticias", icon: Newspaper },
  { href: "/mercado", label: "Mercado Global", icon: TrendingUp },
  { href: "/calendario-economico", label: "Calendario Económico", icon: CalendarDays },
  { href: "/ideas", label: "Ideas con IA", icon: Lightbulb },
  { href: "/notas", label: "Notas rápidas", icon: StickyNote },
  { href: "/hooks", label: "Hooks y CTAs", icon: Zap },
  { href: "/reports", label: "Reportes", icon: FileText },
  { href: "/newsletter", label: "Newsletter", icon: Mail },
  { href: "/projects", label: "Lab. de Proyectos", icon: BookOpen },
  { href: "/teleprompter", label: "Teleprompter", icon: MonitorPlay },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "scheduled")
      .lt("scheduled_date", today)
      .then(({ count }) => { if (count) setOverdueCount(count); });
  }, [pathname]); // refresh when navigating

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="w-64 shrink-0 border-r bg-card h-screen sticky top-0 flex flex-col">
      <div className="p-5 border-b flex items-center gap-3">
        <Logo className="h-9 w-9" />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold tracking-tight leading-none">NEMEF</h1>
          <p className="text-[10px] text-muted-foreground mt-1 leading-tight">No es Magia, Es Finanzas</p>
        </div>
        <NotificationsBell />
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{label}</span>
              {href === "/instagram" && overdueCount > 0 && (
                <span className="ml-auto h-5 min-w-[20px] rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center px-1 tabular-nums shrink-0">
                  {overdueCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Buscar</span>
          <kbd className="text-[10px] border rounded px-1.5 py-0.5 opacity-60">⌘K</kbd>
        </button>
      </div>
      <div className="p-3 border-t">
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? "Modo claro" : "Modo oscuro"}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
        <p className="text-xs text-muted-foreground text-center mt-2">v0.8.0</p>
      </div>
    </aside>
  );
}
