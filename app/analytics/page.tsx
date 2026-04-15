import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader title="Analíticas" description="Métricas de engagement, alcance y crecimiento de tus cuentas." />
      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
          <CardDescription>Gráficos y KPIs por plataforma van a aparecer acá.</CardDescription>
        </CardHeader>
      </Card>
    </>
  );
}
