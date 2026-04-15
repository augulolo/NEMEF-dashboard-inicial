import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEMEF — No es Magia, Es Finanzas",
  description: "Dashboard de gestión de contenido financiero",
  icons: { icon: "/nemef-logo.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
