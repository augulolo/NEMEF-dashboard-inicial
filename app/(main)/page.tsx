import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORM_LABELS, PLATFORM_STYLES } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, Clock, AlertCircle, ChevronRight,
  Flame, Instagram, Lightbulb, Newspaper, Sparkles, TrendingUp, CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { OwnAccountWidget } from "@/components/home/own-account-widget";
import { MarketTicker } from "@/components/home/market-ticker";
import { WeeklyBrief } from "@/components/home/weekly-brief";
import { CompetitorAvatar } from "@/components/competitors/competitor-avatar";
import { GenerateButton } from "@/components/home/generate-button";

function serverGrowthPct(history: number[]): number {
  if (!history || history.length < 2) return 0;
  const real = history.filter((v) => v > 0);
  if (real.length < 2) return 0;
  const first = real[0], last = real[real.length - 1];
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

  // Próximos 7 días (hoy inclusive)
  const next7End = new Date(todayDate);
  next7End.setDate(next7End.getDate() + 6);
  const next7EndStr = next7End.toLocaleDateString("en-CA");

  const [postsRes, overdueRes, todayPostsRes, weekPublishedRes, upcomingRes, newsRes, competitorsRes, next7Res] = await Promise.all([
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
    // Posts programados para los próximos 7 días
    supabase.from("posts")
      .select("id, caption, type, status, scheduled_date")
      .eq("status", "scheduled")
      .gte("scheduled_date", today)
      .lte("scheduled_date", next7EndStr)
      .order("scheduled_date"),
  ]);

  const posts          = postsRes.data ?? [];
  const overdue        = overdueRes.data ?? [];
  const todayPosts     = todayPostsRes.data ?? [];
  const weekPublished  = weekPublishedRes.data ?? [];
  const upcoming       = upcomingRes.data ?? [];
  const newsItems      = newsRes?.data ?? [];
  const next7Posts     = next7Res?.data ?? [];

  // Top 3 competidores por crecimiento
  const rawCompetitors = competitorsRes?.data ?? [];
  const topCompetitors = rawCompetitors
    .map((c) => ({
      ...c,
      profilePicUrl: (c.profile_pic_url as string) ?? "",
      growthPct: serverGrowthPct(
        Array.isArray(c.followers_history) ? c.followers_history : []
      ),
    }))
    .sort((a, b) => b.growthPct - a.growthPct)
    .slice(0, 3);
  const published      = posts.filter((p) => p.status === "published").length;

  // Armar los 7 días
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toLocaleDateString("en-CA");
    const dayPosts = next7Posts.filter((p) => p.scheduled_date === dateStr);
    return { dateStr, dayPosts };
  });

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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{greeting} 👋</h1>
          <p className="text-muted-foreground mt-1">
            {new Date(today + "T12:00:00").toLocaleDateString("es-AR", {
              weekday: "long", day: "numeric", month: "long",
            })}
          </p>
        </div>
        <GenerateButton />
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

      {/* Panel próximos 7 días */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Próximos 7 días — Instagram
          </h2>
          <Link href="/instagram" className="text-xs text-primary hover:underline flex items-center gap-1">
            Gestionar <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {next7Days.map(({ dateStr, dayPosts }, i) => {
            const isToday = dateStr === today;
            const d = new Date(dateStr + "T12:00:00");
            const dayName = d.toLocaleDateString("es-AR", { weekday: "short" });
            const dayNum  = d.getDate();
            return (
              <div
                key={dateStr}
                className={cn(
                  "rounded-lg border p-2 min-h-[88px] flex flex-col gap-1.5 transition-colors",
                  isToday
                    ? "border-primary/60 bg-primary/5"
                    : dayPosts.length > 0
                    ? "border-border bg-card"
                    : "border-dashed border-border/50 bg-transparent"
                )}
              >
                <div className="text-center">
                  <p className={cn(
                    "text-[10px] font-medium uppercase tracking-wide",
                    isToday ? "text-primary" : "text-muted-foreground"
                  )}>
                    {dayName}
                  </p>
                  <p className={cn(
                    "text-base font-bold leading-tight tabular-nums",
                    isToday ? "text-primary" : "text-foreground"
                  )}>
                    {dayNum}
                  </p>
                </div>
                {dayPosts.length > 0 ? (
                  <div className="flex flex-col gap-1 flex-1">
                    {dayPosts.slice(0, 2).map((p) => (
                      <div
                        key={p.id}
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[9px] font-medium truncate leading-tight",
                          p.type === "reel"     ? "bg-pink-500/20 text-pink-300" :
                          p.type === "carousel" ? "bg-violet-500/20 text-violet-300" :
                          p.type === "story"    ? "bg-amber-500/20 text-amber-300" :
                                                  "bg-blue-500/20 text-blue-300"
                        )}
                        title={p.caption}
                      >
                        {p.caption.slice(0, 22)}{p.caption.length > 22 ? "…" : ""}
                      </div>
                    ))}
                    {dayPosts.length > 2 && (
                      <p className="text-[9px] text-muted-foreground text-center">
                        +{dayPosts.length - 2} más
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[9px] text-muted-foreground/40 text-center mt-auto pb-1">—</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Brief semanal IA */}
      <WeeklyBrief />

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
                  return (
                    <div key={c.id} className="flex items-center gap-3">
                      <CompetitorAvatar
                        competitor={{ name: c.name, handle: c.handle, platform: c.platform, profilePicUrl: c.profilePicUrl }}
                        size="md"
                      />
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

      {/* Ticker de mercado */}
      <div className="mb-6">
        <MarketTicker />
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
