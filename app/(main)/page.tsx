import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Instagram, BarChart3, Calendar, Target, Newspaper } from "lucide-react";
import Link from "next/link";

const secciones = [
  { href: "/instagram", title: "Gestor de Instagram", desc: "Planificá posts, reels y stories financieros.", icon: Instagram },
  { href: "/analytics", title: "Analíticas", desc: "Seguimiento de métricas de tu contenido.", icon: BarChart3 },
  { href: "/calendar", title: "Calendario de contenido", desc: "Programá y visualizá publicaciones.", icon: Calendar },
  { href: "/competitors", title: "Creadores de finanzas", desc: "Seguí referentes de Argentina y el mundo.", icon: Target },
  { href: "/news", title: "Noticias", desc: "Últimas noticias de economía y finanzas argentinas.", icon: Newspaper },
];

export default function Home() {
  return (
    <>
      <PageHeader title="Buenas" description="Tu dashboard de contenido financiero." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {secciones.map(({ href, title, desc, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <Icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{title}</CardTitle>
                <CardDescription>{desc}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
