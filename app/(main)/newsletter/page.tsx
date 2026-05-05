"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import {
  Loader2, Sparkles, Download, Copy, Check, RefreshCw,
  ChevronRight, AlertCircle, ArrowLeft, ExternalLink, Save,
  History, Trash2, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buildEmailHTML, type Newsletter } from "@/lib/newsletter";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────
type Step = "form" | "generating" | "preview";

interface SavedNewsletter {
  id: string;
  subject: string;
  title: string;
  topic: string;
  created_at: string;
  data: Newsletter;
}

interface CopyState { subject: boolean; previewText: boolean; html: boolean }

// ── Helpers ───────────────────────────────────────────────────────────────────
function copyText(text: string) { return navigator.clipboard.writeText(text); }

function downloadHTML(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ────────────────────────────────────────────────────────────
function DataPointCard({ label, value, change, positive }: {
  label: string; value: string; change?: string; positive?: boolean;
}) {
  return (
    <div className="flex-1 rounded-lg border bg-primary/5 border-primary/20 px-4 py-3 text-center min-w-[100px]">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{label}</p>
      <p className="text-xl font-bold text-foreground leading-none">{value}</p>
      {change && (
        <p className={cn("text-xs font-semibold mt-1", positive ? "text-emerald-400" : "text-red-400")}>{change}</p>
      )}
    </div>
  );
}

function CopyButton({ label, copied, onCopy, small }: {
  label: string; copied: boolean; onCopy: () => void; small?: boolean;
}) {
  return (
    <button onClick={onCopy} className={cn(
      "inline-flex items-center gap-1.5 rounded-md border transition-colors font-medium",
      small ? "px-2 py-0.5 text-[11px]" : "px-3 py-1.5 text-xs",
      copied
        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
        : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
    )}>
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copiado" : label}
    </button>
  );
}

// ── Preview ───────────────────────────────────────────────────────────────────
function NewsletterPreview({ newsletter, copied, saving, saved, onCopy, onDownload, onReset, onSave }: {
  newsletter: Newsletter;
  copied: CopyState;
  saving: boolean;
  saved: boolean;
  onCopy: (f: keyof CopyState) => void;
  onDownload: () => void;
  onReset: () => void;
  onSave: () => void;
}) {
  const dateStr = new Date(newsletter.generatedAt).toLocaleDateString("es-AR", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={onReset} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Nuevo newsletter
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onSave}
            disabled={saving || saved}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              saved
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Guardando…" : saved ? "Guardado" : "Guardar"}
          </button>
          <CopyButton label="HTML para Mailchimp" copied={copied.html} onCopy={() => onCopy("html")} />
          <button onClick={onDownload} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Download className="h-3.5 w-3.5" /> Descargar .html
          </button>
        </div>
      </div>

      {/* Email meta */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Datos del email</p>
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">Asunto</span>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">{newsletter.subject}</span>
              <CopyButton small label="Copiar" copied={copied.subject} onCopy={() => onCopy("subject")} />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">Preview</span>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-sm text-muted-foreground flex-1 min-w-0 truncate">{newsletter.previewText}</span>
              <CopyButton small label="Copiar" copied={copied.previewText} onCopy={() => onCopy("previewText")} />
            </div>
          </div>
        </div>
      </div>

      {/* Rendered preview */}
      <div className="rounded-xl border overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] px-8 py-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/nemef-logo.svg" alt="NEMEF" className="h-11 w-11 rounded-lg" />
              <div>
                <span className="text-xl font-black text-white tracking-tight font-serif block">NEMEF</span>
                <span className="text-[10px] text-white/40 tracking-widest uppercase block mt-0.5">No es Magia, Es Finanzas</span>
              </div>
            </div>
            <span className="text-xs text-white/35">{dateStr}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white leading-tight mb-2">{newsletter.title}</h1>
          <p className="text-sm text-white/65 leading-relaxed">{newsletter.subtitle}</p>
        </div>

        {/* Summary */}
        <div className="bg-primary/5 border-b border-primary/15 px-8 py-5">
          <p className="text-sm text-foreground/80 leading-relaxed italic border-l-2 border-primary pl-4">{newsletter.summary}</p>
        </div>

        {/* Body */}
        <div className="bg-card px-8 py-6 space-y-8">
          {newsletter.sections.map((s, i) => (
            <div key={i} className="space-y-4">
              <h2 className="text-base font-bold text-foreground border-b border-primary/30 pb-2">
                <span className="border-b-2 border-primary pb-2">{s.heading}</span>
              </h2>
              <div className="space-y-3">
                {s.body.split("\n\n").map((para, j) => (
                  <p key={j} className="text-sm text-foreground/85 leading-relaxed">{para}</p>
                ))}
              </div>
              {s.dataPoints && s.dataPoints.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-1">
                  {s.dataPoints.map((dp, k) => <DataPointCard key={k} {...dp} />)}
                </div>
              )}
            </div>
          ))}

          {newsletter.quotes.length > 0 && (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Citas destacadas</p>
              {newsletter.quotes.map((q, i) => (
                <div key={i} className="flex gap-4 rounded-r-lg bg-primary/5 border border-primary/15 border-l-4 border-l-primary p-4">
                  <div className="space-y-1.5">
                    <p className="text-sm italic text-foreground/85 leading-relaxed">&ldquo;{q.text}&rdquo;</p>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{q.context}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg bg-primary/5 border border-primary/20 p-5">
            <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-4">Lo más importante</p>
            <ul className="space-y-2.5">
              {newsletter.keyTakeaways.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/85 leading-relaxed">
                  <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />{t}
                </li>
              ))}
            </ul>
          </div>

          {/* Sign-off */}
          <div className="border-t border-border pt-6 space-y-1.5">
            <p className="text-sm text-foreground/80 leading-relaxed">Saludos y hasta el próximo lunes con un nuevo análisis semanal.</p>
            <p className="text-sm text-muted-foreground leading-relaxed italic">Coyuntura global, economía, finanzas y educación financiera — con el objetivo de, cada día, ser un poco menos ignorantes.</p>
          </div>

          <div className="text-center pt-2 pb-4">
            <span className="inline-block bg-primary text-primary-foreground text-sm font-bold px-8 py-3 rounded-lg cursor-default">{newsletter.cta}</span>
          </div>
        </div>

        {newsletter.sources.length > 0 && (
          <div className="border-t bg-muted/30 px-8 py-5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Fuentes</p>
            <ul className="space-y-1.5">
              {newsletter.sources.map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                  {s.url
                    ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">{s.title}<ExternalLink className="h-2.5 w-2.5" /></a>
                    : s.title}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-[#1a1a2e] px-8 py-5">
          <div className="flex items-center gap-3 mb-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nemef-logo.svg" alt="NEMEF" className="h-7 w-7 rounded" />
            <span className="text-xs font-bold text-white">NEMEF — No es Magia, Es Finanzas</span>
          </div>
          <p className="text-[10px] text-white/30">Generado el {dateStr} · Contenido informativo, no constituye asesoría financiera.</p>
        </div>
      </div>

      {/* Bottom export bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
        <div className="text-xs text-muted-foreground">
          Pegá el HTML en <strong>Mailchimp → Campaigns → Design → Code your own</strong>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton label="HTML para Mailchimp" copied={copied.html} onCopy={() => onCopy("html")} />
          <button onClick={onDownload} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Download className="h-3.5 w-3.5" /> Descargar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Preset topics ─────────────────────────────────────────────────────────────
const PRESET_TOPICS = [
  "Dólar blue y brecha cambiaria", "Inflación en Argentina: últimos datos",
  "Qué son los CEDEARs y cómo invertir", "Bitcoin en máximos: qué esperar",
  "El MERVAL en pesos y en dólares", "Plazo fijo vs CER: cuál conviene",
  "Reservas del BCRA: situación actual", "Bonos soberanos argentinos",
  "Stablecoins para el ahorrista argentino", "Tasa de política monetaria BCRA",
  "Libertad financiera en Argentina", "Criptomonedas en 2025: panorama",
];

const LOADING_STEPS = [
  "Consultando datos de mercado…",
  "Analizando fuentes…",
  "Redactando análisis…",
  "Estructurando el informe…",
  "Aplicando sello NEMEF…",
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NewsletterPage() {
  const [step, setStep]               = useState<"form" | "generating" | "preview">("form");
  const [topic, setTopic]             = useState("");
  const [url, setUrl]                 = useState("");
  const [context, setContext]         = useState("");
  const [newsletter, setNewsletter]   = useState<Newsletter | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [copied, setCopied]           = useState<CopyState>({ subject: false, previewText: false, html: false });
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [savedList, setSavedList]     = useState<SavedNewsletter[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingId, setViewingId]     = useState<string | null>(null);

  // Load saved newsletters
  useEffect(() => {
    supabase
      .from("saved_newsletters")
      .select("id, subject, title, topic, created_at, data")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setSavedList(data as SavedNewsletter[]); });
  }, [saved]);

  const generate = async () => {
    if (!topic.trim()) return;
    setStep("generating"); setError(null); setSaved(false);
    let idx = 0;
    const iv = setInterval(() => { idx = Math.min(idx + 1, LOADING_STEPS.length - 1); setLoadingStep(idx); }, 1800);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), url: url.trim() || undefined, context: context.trim() || undefined }),
      });
      const d = await res.json() as { ok: boolean; newsletter?: Newsletter; error?: string };
      clearInterval(iv);
      if (!d.ok || !d.newsletter) { setError(d.error ?? "Error generando el newsletter"); setStep("form"); return; }
      setNewsletter(d.newsletter);
      setStep("preview");
    } catch { clearInterval(iv); setError("Error de red. Intentá de nuevo."); setStep("form"); }
  };

  const handleCopy = async (field: keyof CopyState) => {
    if (!newsletter) return;
    const text = field === "html" ? buildEmailHTML(newsletter, "body") : field === "subject" ? newsletter.subject : newsletter.previewText;
    await copyText(text);
    setCopied((p) => ({ ...p, [field]: true }));
    setTimeout(() => setCopied((p) => ({ ...p, [field]: false })), 2500);
  };

  const handleDownload = () => {
    if (!newsletter) return;
    const html = buildEmailHTML(newsletter, "full");
    const slug = newsletter.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
    downloadHTML(html, `nemef-newsletter-${slug}.html`);
  };

  const handleSave = async () => {
    if (!newsletter || saving || saved) return;
    setSaving(true);
    const { error: err } = await supabase.from("saved_newsletters").insert({
      subject: newsletter.subject,
      title: newsletter.title,
      subtitle: newsletter.subtitle,
      topic: topic.trim(),
      data: newsletter,
      html_body: buildEmailHTML(newsletter, "body"),
    });
    setSaving(false);
    if (!err) setSaved(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("saved_newsletters").delete().eq("id", id);
    setSavedList((p) => p.filter((n) => n.id !== id));
  };

  const handleView = (item: SavedNewsletter) => {
    setNewsletter(item.data);
    setTopic(item.topic);
    setSaved(true);
    setViewingId(item.id);
    setStep("preview");
  };

  const handleReset = () => {
    setStep("form"); setNewsletter(null); setError(null);
    setLoadingStep(0); setSaved(false); setViewingId(null);
  };

  return (
    <>
      <PageHeader
        title="Newsletter Analítico"
        description="Generá informes tipo newsletter con datos reales, fuentes y sello NEMEF. Listos para Mailchimp."
      />

      {step === "form" && (
        <div className="max-w-2xl space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Tema del newsletter <span className="text-red-400">*</span></label>
            <input
              type="text" value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && generate()}
              placeholder="ej: El dólar blue superó los $1.500 y la brecha se amplió al 40%"
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_TOPICS.map((t) => (
                <button key={t} onClick={() => setTopic(t)} className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  topic === t ? "border-primary/50 bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                )}>{t}</button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">URL de fuente <span className="text-muted-foreground font-normal">(opcional)</span></label>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.infobae.com/economia/…"
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="text-xs text-muted-foreground">Si pegás una nota periodística, el análisis se basará en ese contenido.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Contexto adicional <span className="text-muted-foreground font-normal">(opcional)</span></label>
            <textarea value={context} onChange={(e) => setContext(e.target.value)}
              placeholder="ej: El público objetivo son ahorristas que quieren dolarizarse. Hacé hincapié en las opciones legales como dólar MEP y CEDEAR."
              rows={3}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          <button onClick={generate} disabled={!topic.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Sparkles className="h-4 w-4" /> Generar newsletter
          </button>

          {/* Saved newsletters history */}
          {savedList.length > 0 && (
            <div className="pt-2 border-t border-border">
              <button onClick={() => setShowHistory((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3">
                <History className="h-4 w-4" />
                Newsletters guardados ({savedList.length})
                <ChevronRight className={cn("h-4 w-4 transition-transform", showHistory && "rotate-90")} />
              </button>
              {showHistory && (
                <div className="space-y-2">
                  {savedList.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3 group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subject}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {new Date(item.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                          {item.topic && <> · {item.topic}</>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleView(item)}
                          className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Ver y exportar">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors" title="Eliminar">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {step === "generating" && (
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-base font-semibold text-foreground">{LOADING_STEPS[loadingStep]}</p>
            <p className="text-xs text-muted-foreground">Esto puede tomar hasta 30 segundos</p>
          </div>
          <div className="flex gap-1.5">
            {LOADING_STEPS.map((_, i) => (
              <span key={i} className={cn("inline-block h-1.5 w-1.5 rounded-full transition-colors duration-500", i <= loadingStep ? "bg-primary" : "bg-muted")} />
            ))}
          </div>
        </div>
      )}

      {step === "preview" && newsletter && (
        <div className="max-w-3xl">
          <NewsletterPreview
            newsletter={newsletter}
            copied={copied}
            saving={saving}
            saved={saved}
            onCopy={handleCopy}
            onDownload={handleDownload}
            onReset={handleReset}
            onSave={handleSave}
          />
        </div>
      )}
    </>
  );
}
