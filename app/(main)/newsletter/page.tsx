"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import {
  Loader2, Sparkles, Download, Copy, Check, Mail, RefreshCw,
  ChevronRight, AlertCircle, ArrowLeft, ExternalLink, Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buildEmailHTML, type Newsletter } from "@/lib/newsletter";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = "form" | "generating" | "preview";

interface CopyState {
  subject: boolean;
  previewText: boolean;
  html: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function copyText(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

function downloadHTML(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
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
        <p className={cn("text-xs font-semibold mt-1", positive ? "text-emerald-400" : "text-red-400")}>
          {change}
        </p>
      )}
    </div>
  );
}

function CopyButton({
  label, copied, onCopy, small,
}: { label: string; copied: boolean; onCopy: () => void; small?: boolean }) {
  return (
    <button
      onClick={onCopy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border transition-colors font-medium",
        small
          ? "px-2 py-0.5 text-[11px]"
          : "px-3 py-1.5 text-xs",
        copied
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
          : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copiado" : label}
    </button>
  );
}

// ── Preview renderer ──────────────────────────────────────────────────────────

function NewsletterPreview({
  newsletter, copied, onCopy, onDownload, onReset,
}: {
  newsletter: Newsletter;
  copied: CopyState;
  onCopy: (field: keyof CopyState) => void;
  onDownload: () => void;
  onReset: () => void;
}) {
  const dateStr = new Date(newsletter.generatedAt).toLocaleDateString("es-AR", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Nuevo newsletter
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <CopyButton
            label="Copiar HTML (Mailchimp)"
            copied={copied.html}
            onCopy={() => onCopy("html")}
          />
          <button
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Descargar .html
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

      {/* Newsletter rendered */}
      <div className="rounded-xl border overflow-hidden">
        {/* Header band */}
        <div className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] px-8 py-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <span className="text-xl font-black text-white tracking-tight font-serif">NEMEF</span>
              <span className="block text-[10px] text-white/40 tracking-widest uppercase mt-0.5">No es Magia, Es Finanzas</span>
            </div>
            <span className="text-xs text-white/35">{dateStr}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white leading-tight mb-2">{newsletter.title}</h1>
          <p className="text-sm text-white/65 leading-relaxed">{newsletter.subtitle}</p>
        </div>

        {/* Summary band */}
        <div className="bg-primary/5 border-b border-primary/15 px-8 py-5">
          <p className="text-sm text-foreground/80 leading-relaxed italic border-l-2 border-primary pl-4">
            {newsletter.summary}
          </p>
        </div>

        {/* Body */}
        <div className="bg-card px-8 py-6 space-y-8">
          {/* Sections */}
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
                  {s.dataPoints.map((dp, k) => (
                    <DataPointCard key={k} {...dp} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Quotes */}
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

          {/* Key takeaways */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-5">
            <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-4">Lo más importante</p>
            <ul className="space-y-2.5">
              {newsletter.keyTakeaways.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/85 leading-relaxed">
                  <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="text-center pt-2 pb-4">
            <span className="inline-block bg-primary text-primary-foreground text-sm font-bold px-8 py-3 rounded-lg cursor-default">
              {newsletter.cta}
            </span>
          </div>
        </div>

        {/* Sources */}
        {newsletter.sources.length > 0 && (
          <div className="border-t bg-muted/30 px-8 py-5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Fuentes</p>
            <ul className="space-y-1.5">
              {newsletter.sources.map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {s.title}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ) : s.title}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer band */}
        <div className="bg-[#1a1a2e] px-8 py-5 text-center">
          <p className="text-xs font-bold text-white mb-1">NEMEF — No es Magia, Es Finanzas</p>
          <p className="text-[10px] text-white/30">Generado el {dateStr} · Contenido informativo, no constituye asesoría financiera.</p>
        </div>
      </div>

      {/* Bottom export bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
        <div className="text-xs text-muted-foreground">
          Exportá el HTML y pegalo en <strong>Mailchimp → Campaigns → Design → Code your own</strong>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton
            label="HTML para Mailchimp"
            copied={copied.html}
            onCopy={() => onCopy("html")}
          />
          <button
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Descargar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const PRESET_TOPICS = [
  "Dólar blue y brecha cambiaria",
  "Inflación en Argentina: últimos datos",
  "Qué son los CEDEARs y cómo invertir",
  "Bitcoin en máximos: qué esperar",
  "El MERVAL en pesos y en dólares",
  "Plazo fijo vs CER: cuál conviene",
  "Reservas del BCRA: situación actual",
  "Bonos soberanos argentinos",
  "Stablecoins para el ahorrista argentino",
  "Tasa de política monetaria BCRA",
  "Libertad financiera en Argentina",
  "Criptomonedas en 2025: panorama",
];

const LOADING_STEPS = [
  "Consultando datos de mercado…",
  "Analizando fuentes…",
  "Redactando análisis…",
  "Estructurando el informe…",
  "Aplicando sello NEMEF…",
];

export default function NewsletterPage() {
  const [step, setStep]                 = useState<Step>("form");
  const [topic, setTopic]               = useState("");
  const [url, setUrl]                   = useState("");
  const [context, setContext]           = useState("");
  const [newsletter, setNewsletter]     = useState<Newsletter | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [loadingStep, setLoadingStep]   = useState(0);
  const [copied, setCopied]             = useState<CopyState>({ subject: false, previewText: false, html: false });

  const generate = async () => {
    if (!topic.trim()) return;
    setStep("generating");
    setError(null);

    // Animate loading steps
    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, LOADING_STEPS.length - 1);
      setLoadingStep(stepIdx);
    }, 1800);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), url: url.trim() || undefined, context: context.trim() || undefined }),
      });
      const data = await res.json() as { ok: boolean; newsletter?: Newsletter; error?: string };

      clearInterval(interval);

      if (!data.ok || !data.newsletter) {
        setError(data.error ?? "Error generando el newsletter");
        setStep("form");
        return;
      }

      setNewsletter(data.newsletter);
      setStep("preview");
    } catch {
      clearInterval(interval);
      setError("Error de red. Revisá la conexión e intentá de nuevo.");
      setStep("form");
    }
  };

  const handleCopy = async (field: keyof CopyState) => {
    if (!newsletter) return;
    let text = "";
    if (field === "subject")      text = newsletter.subject;
    if (field === "previewText")  text = newsletter.previewText;
    if (field === "html")         text = buildEmailHTML(newsletter, "body");

    await copyText(text);
    setCopied((prev) => ({ ...prev, [field]: true }));
    setTimeout(() => setCopied((prev) => ({ ...prev, [field]: false })), 2500);
  };

  const handleDownload = () => {
    if (!newsletter) return;
    const html = buildEmailHTML(newsletter, "full");
    const slug = newsletter.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
    downloadHTML(html, `nemef-newsletter-${slug}.html`);
  };

  const handleReset = () => {
    setStep("form");
    setNewsletter(null);
    setError(null);
    setLoadingStep(0);
  };

  const selectPreset = (t: string) => {
    setTopic(t);
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
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Topic */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tema del newsletter <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && generate()}
              placeholder="ej: El dólar blue superó los $1.500 y la brecha se amplió al 40%"
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {/* Preset chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => selectPreset(t)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    topic === t
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* URL (optional) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              URL de fuente <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.infobae.com/economia/…"
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="text-xs text-muted-foreground">
              Si pegás una nota periodística, el análisis se basará en ese contenido.
            </p>
          </div>

          {/* Context (optional) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Contexto adicional <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Ej: El público objetivo es ahorristas que quieren dolarizarse. Hacé hincapié en las opciones legales como dólar MEP y CEDEAR."
              rows={3}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          <button
            onClick={generate}
            disabled={!topic.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="h-4 w-4" />
            Generar newsletter
          </button>
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
              <span
                key={i}
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full transition-colors duration-500",
                  i <= loadingStep ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      )}

      {step === "preview" && newsletter && (
        <div className="max-w-3xl">
          <NewsletterPreview
            newsletter={newsletter}
            copied={copied}
            onCopy={handleCopy}
            onDownload={handleDownload}
            onReset={handleReset}
          />
        </div>
      )}
    </>
  );
}
