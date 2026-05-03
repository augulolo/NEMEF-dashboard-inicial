import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORM_LABELS, PLATFORM_STYLES } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, Clock, AlertCircle, ChevronRight,
  Flame, Instagram, Lightbulb, Newspaper, Sparkles, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { OwnAccountWidget } from "@/components/home/own-account-widget";

function serverGrowthPct(history: number[]): number {
  if (!history || history.length < 2) return 0;
  const first = history[0], last = history[history.length - 1];
  if (!first || first === 0) return 0;
  return ((last - first) / first) * 100;
}

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

  const [postsRes, overdueRes, todayPostsRes, weekPublishedRes, upcomingRes, newsRes, competitorsRes] = await Promise.all([
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
    // Últimas noticias
    supabase.from("news_cache")
      .select("id, title, source, topic, url, published_at")
      .order("published_at", { ascending: false })
      .limit(3),
    // Top competidores por seguidores
    supabase.from("competitors")
      .select("id, name, handle, platform, followers, followers_history, profile_pic_url")
      .order("followers", { ascending: false })
      .limit(5),
  ]);

  const posts          = postsRes.data ?? [];
  const overdue        = overdueRes.data ?? [];
  const todayPosts     = todayPostsRes.data ?? [];
  const weekPublished  = weekPublishedRes.data ?? [];
  const upcoming       = upcomingRes.data ?? [];
  const newsItems      = newsRes?.data ?? [];

  // Top 3 competidores por crecimiento
  const rawCompetitors = competitorsRes?.data ?? [];
  const topCompetitors = rawCompetitors
    .map((c) => ({
      ...c,
      growthPct: serverGrowthPct(
        Array.isArray(c.followers_history) ? c.followers_history : []
      ),
    }))
    .sort((a, b) => b.growthPct - a.growthPct)
    .slice(0, 3);
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

      {/* Últimas noticias financieras */}
      {newsItems.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Newspaper className="h-3.5 w-3.5" />
              Últimas noticias financieras
            </h2>
            <Link href="/news" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todas <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none">
            {newsItems.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 w-64 rounded-lg border bg-card p-4 hover:border-primary/50 transition-colors block"
              >
                <p className="text-sm font-medium leading-snug line-clamp-2 mb-2">{item.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/70 truncate">{item.source}</span>
                  {item.published_at && (
                    <>
                      <span>·</span>
                      <span className="shrink-0">
                        {new Date(item.published_at).toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Creadores en tendencia */}
      {topCompetitors.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Creadores en tendencia
            </h2>
            <Link href="/competitors" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                {topCompetitors.map((c) => {
                  const initials = c.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
                  return (
                    <div key={c.id} className="flex items-center gap-3">
                      {c.profile_pic_url ? (
                        <img
                          src={c.profile_pic_url}
                          alt={c.name}
                          className="h-9 w-9 rounded-full object-cover bg-muted shrink-0"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0 select-none">
                          {initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.handle}</p>
                      </div>
                      <div className={cn(
                        "text-xs font-semibold tabular-nums shrink-0 px-2 py-0.5 rounded-full border",
                        c.growthPct >= 0
                          ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                          : "text-red-400 border-red-500/30 bg-red-500/10"
                      )}>
                        {c.growthPct >= 0 ? "+" : ""}{c.growthPct.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

      {/* Widget de mis cuentas NEMEF */}
      <div className="mb-6">
        <OwnAccountWidget />
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
