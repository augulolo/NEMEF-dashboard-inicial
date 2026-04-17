import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "NEMEF — No es Magia, Es Finanzas",
  description: "Dashboard de gestión de contenido financiero",
  icons: { icon: "/nemef-logo.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Aplica el tema guardado antes del primer render (evita flash) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('nemef-theme')||'dark';document.documentElement.classList.toggle('dark',t==='dark')}catch(e){document.documentElement.classList.add('dark')}`,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
