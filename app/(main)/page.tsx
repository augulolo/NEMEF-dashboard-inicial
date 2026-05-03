import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORM_LABELS, PLATFORM_STYLES } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, Clock, AlertCircle, ChevronRight,
  Flame, Instagram, Lightbulb, Newspaper, Sparkles,
} from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const supabase = await createServerSupabaseClient();

  const baHour = (new Date().getUTCHours() + 21) % 24;
  const greeting = baHour < 12 ? "Buenos días" : baHour < 19 ? "Buenas tardes" : "Buenas noches";
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

  // Inicio de la semana (lunes)
  const todayDate = new Date(today + "T00:00:00");
  const weekStart = new Date(todayDate);
  weekStart.setDate(todayDate.getDate() - ((todayDate.getDay() + 6) % 7));
  const weekStartStr = weekStart.toLocaleDateString("en-CA");

  const [postsRes, overdueRes, todayPostsRes, weekPublishedRes, upcomingRes] = await Promise.all([
    // Conteo total
    supabase.from("posts").select("id, status"),
    // Posts vencidos (fecha pasada, aún en scheduled)
    supabase.from("posts")
      .select("id, caption, scheduled_date")
      .eq("status", "scheduled")
      .lt("scheduled_date", today)
      .order("scheduled_date")
      .limit(3),
    // Posts de Instagram programados para hoy
    supabase.from("posts")
      .select("id, caption, type, status")
      .eq("scheduled_date", today)
      .order("created_at"),
    // Posts publicados esta semana
    supabase.from("posts")
      .select("id")
      .eq("status", "published")
      .gte("scheduled_date", weekStartStr)
      .lte("scheduled_date", today),
    // Próximos en el calendario (excluyendo hoy)
    supabase.from("calendar_items")
      .select("id, title, platform, date")
      .eq("status", "scheduled")
      .gt("date", today)
      .order("date")
      .limit(4),
  ]);

  const posts          = postsRes.data ?? [];
  const overdue        = overdueRes.data ?? [];
  const todayPosts     = todayPostsRes.data ?? [];
  const weekPublished  = weekPublishedRes.data ?? [];
  const upcoming       = upcomingRes.data ?? [];
  const published      = posts.filter((p) => p.status === "published").length;

  // Racha de semanas con al menos 1 post publicado (últimas 12 semanas)
  const { data: publishedPosts } = await supabase
    .from("posts")
    .select("scheduled_date")
    .eq("status", "published")
    .not("scheduled_date", "is", null)
    .gte("scheduled_date", (() => {
      const d = new Date(today + "T00:00:00");
      d.setDate(d.getDate() - 84);
      return d.toLocaleDateString("en-CA");
    })());

  let streak = 0;
  const checkDate = new Date(todayDate);
  for (let w = 0; w < 12; w++) {
    const ws = new Date(checkDate);
    ws.setDate(ws.getDate() - ((ws.getDay() + 6) % 7));
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);
    const wsStr = ws.toLocaleDateString("en-CA");
    const weStr = we.toLocaleDateString("en-CA");
    const hasPost = publishedPosts?.some(
      (p) => p.scheduled_date >= wsStr && p.scheduled_date <= weStr
    );
    if (hasPost) streak++;
    else if (w > 0) break; // racha consecutiva
    checkDate.setDate(checkDate.getDate() - 7);
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{greeting} 👋</h1>
        <p className="text-muted-foreground mt-1">
          {new Date(today + "T12:00:00").toLocaleDateString("es-AR", {
            weekday: "long", day: "numeric", month: "long",
          })}
        </p>
      </div>

      {/* Alerta de posts vencidos */}
      {overdue.length > 0 && (
        <Link href="/instagram">
          <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3 hover:border-amber-500/70 transition-colors cursor-pointer">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-amber-300">
                {overdue.length} post{overdue.length > 1 ? "s" : ""} sin publicar — pasaron su fecha
              </p>
              <div className="mt-1 space-y-0.5">
                {overdue.map((p) => (
                  <p key={p.id} className="text-xs text-amber-300/70 truncate">
                    · {new Date(p.scheduled_date + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                    {" — "}{p.caption.slice(0, 55)}{p.caption.length > 55 ? "…" : ""}
                  </p>
                ))}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          </div>
        </Link>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 mb-6">
        <KpiCard label="Publicados total"   value={published}            color="text-emerald-400" icon={CheckCircle2} />
        <KpiCard label="Programados hoy"   value={todayPosts.length}    color="text-blue-400"    icon={Clock} />
        <KpiCard label="Esta semana"        value={weekPublished.length} color="text-primary"     icon={Instagram} />
        <KpiCard label="Racha de semanas"  value={streak}               color="text-amber-400"   icon={Flame}
          suffix={streak === 1 ? " sem" : " sem"} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Posts de hoy */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Posts programados para hoy
            </CardTitle>
            <Link href="/instagram" className="text-xs text-primary hover:underline flex items-center gap-1">
              Gestionar <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {todayPosts.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No hay posts para hoy.</p>
                <Link href="/instagram" className="text-xs text-primary hover:underline mt-1 inline-block">
                  Programar uno →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {todayPosts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-md border p-2.5">
                    <div className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      p.status === "published" ? "bg-emerald-400" : "bg-blue-400"
                    )} />
                    <p className="text-sm truncate flex-1">{p.caption.slice(0, 60)}{p.caption.length > 60 ? "…" : ""}</p>
                    <span className="text-xs text-muted-foreground shrink-0 capitalize">{p.type}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximas publicaciones del calendario */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Próximos en el calendario
            </CardTitle>
            <Link href="/calendar" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver calendario <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No hay próximas publicaciones.</p>
                <Link href="/calendar" className="text-xs text-primary hover:underline mt-1 inline-block">
                  Agregar al calendario →
                </Link>
              </div>
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
      </div>

      {/* Acciones rápidas */}
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Acciones rápidas</h2>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <QuickAction href="/instagram" icon={Instagram}  label="Nuevo post"         desc="Redactá y programá" color="text-pink-400" />
        <QuickAction href="/ideas"     icon={Sparkles}   label="Generar ideas"       desc="Con IA por tema"    color="text-violet-400" />
        <QuickAction href="/news"      icon={Newspaper}  label="Noticias del día"    desc="AR y mundo"         color="text-blue-400" />
        <QuickAction href="/analytics" icon={Lightbulb}  label="Ver analíticas"      desc="Tu contenido"       color="text-amber-400" />
      </div>
    </>
  );
}

function KpiCard({ label, value, icon: Icon, color, suffix = "" }: {
  label: string; value: number; suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={cn("text-2xl font-semibold mt-1 tabular-nums", color)}>
            {value}{suffix}
          </p>
        </div>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function QuickAction({ href, icon: Icon, label, desc, color }: {
  href: string; label: string; desc: string; color: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link href={href}>
      <div className="rounded-lg border bg-card p-4 hover:border-primary/50 transition-colors cursor-pointer flex items-start gap-3">
        <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", color)} />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
      </div>
    </Link>
  );
}
