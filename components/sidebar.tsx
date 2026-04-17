"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Calendar, Instagram, Newspaper, Target, LayoutDashboard, LogOut, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase";
import { useTheme } from "@/components/theme-provider";

const nav = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/instagram", label: "Gestor de Instagram", icon: Instagram },
  { href: "/analytics", label: "Analíticas", icon: BarChart3 },
  { href: "/calendar", label: "Calendario", icon: Calendar },
  { href: "/competitors", label: "Creadores", icon: Target },
  { href: "/news", label: "Noticias", icon: Newspaper },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();

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
        <div>
          <h1 className="text-lg font-bold tracking-tight leading-none">NEMEF</h1>
          <p className="text-[10px] text-muted-foreground mt-1 leading-tight">No es Magia, Es Finanzas</p>
        </div>
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
              {label}
            </Link>
          );
        })}
      </nav>

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
        <p className="text-xs text-muted-foreground text-center mt-2">v0.1.0</p>
      </div>
    </aside>
  );
}
