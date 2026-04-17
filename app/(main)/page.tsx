import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORM_LABELS, PLATFORM_STYLES } from "@/lib/calendar";
import { formatCount } from "@/lib/competitors";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Target, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);

  const [postsRes, upcomingRes, competitorsRes] = await Promise.all([
    supabase.from("posts").select("id, status"),
    supabase
      .from("calendar_items")
      .select("*")
      .gte("date", today)
      .eq("status", "scheduled")
      .order("date")
      .limit(5),
    supabase
      .from("competitors")
      .select("id, name, handle, platform, followers, engagement_rate")
      .order("followers", { ascending: false })
      .limit(5),
  ]);

  const posts       = postsRes.data ?? [];
  const upcoming    = upcomingRes.data ?? [];
  const competitors = competitorsRes.data ?? [];

  const published = posts.filter((p) => p.status === "published").length;

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{greeting}</h1>
        <p className="text-muted-foreground mt-2">
          {new Date().toLocaleDateString("es-AR", {
            weekday: "long", day: "numeric", month: "long",
          })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <KpiCard label="Posts publicados"        value={published}         icon={CheckCircle2} color="text-emerald-400" />
        <KpiCard label="Próximas publicaciones"  value={upcoming.length}   icon={Clock}        color="text-blue-400" />
        <KpiCard label="Creadores seguidos"      value={competitors.length} icon={Target}      color="text-primary" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Próximas publicaciones */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Próximas publicaciones
            </CardTitle>
            <Link href="/calendar" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver calendario <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay publicaciones programadas.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((item) => {
                  const style = PLATFORM_STYLES[item.platform as keyof typeof PLATFORM_STYLES];
                  const dateLabel = new Date(item.date + "T12:00:00").toLocaleDateString("es-AR", {
                    weekday: "short", day: "numeric", month: "short",
                  });
                  return (
                    <div key={item.id} className="flex items-center gap-3 rounded-md border p-2.5">
                      <span className={cn("h-2 w-2 rounded-full shrink-0", style.dot)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {PLATFORM_LABELS[item.platform as keyof typeof PLATFORM_LABELS]}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{dateLabel}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top creadores */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Top creadores
            </CardTitle>
            <Link href="/competitors" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {competitors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay creadores cargados.</p>
            ) : (
              <div className="space-y-2">
                {competitors.map((c) => {
                  const style = PLATFORM_STYLES[c.platform as keyof typeof PLATFORM_STYLES];
                  return (
                    <div key={c.id} className="flex items-center gap-3 rounded-md border p-2.5">
                      <span className={cn("h-2 w-2 rounded-full shrink-0", style.dot)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.handle}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                        {formatCount(c.followers)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 md:grid-cols-3">
        <QuickLink href="/instagram" label="Gestor de Instagram" desc="Planificá nuevos posts" />
        <QuickLink href="/news"      label="Noticias del día"    desc="Finanzas AR y mundo" />
        <QuickLink href="/analytics" label="Ver analíticas"      desc="Métricas de tu contenido" />
      </div>
    </>
  );
}

function KpiCard({ label, value, icon: Icon, color }: {
  label: string; value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={cn("text-2xl font-semibold mt-1 tabular-nums", color)}>{value}</p>
        </div>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link href={href}>
      <div className="rounded-lg border bg-card p-4 hover:border-primary transition-colors cursor-pointer">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </Link>
  );
}
