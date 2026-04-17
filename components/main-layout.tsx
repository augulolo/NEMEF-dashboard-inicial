"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 transition-transform duration-200",
          "md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar onClose={() => setOpen(false)} />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header móvil */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b bg-card sticky top-0 z-10 shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo className="h-7 w-7" />
          <span className="font-bold text-sm tracking-tight">NEMEF</span>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
