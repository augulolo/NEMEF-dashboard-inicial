// ─────────────────────────────────────────────────────────────────────────────
// NEMEF — Newsletter types + HTML email builder
// ─────────────────────────────────────────────────────────────────────────────

export interface DataPoint {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

export interface NewsletterSection {
  heading: string;
  body: string;
  dataPoints?: DataPoint[];
}

export interface NewsletterQuote {
  text: string;
  context: string;
}

export interface NewsletterSource {
  title: string;
  url?: string;
}

export interface Newsletter {
  subject: string;
  previewText: string;
  title: string;
  subtitle: string;
  summary: string;
  sections: NewsletterSection[];
  quotes: NewsletterQuote[];
  keyTakeaways: string[];
  sources: NewsletterSource[];
  cta: string;
  generatedAt: string;
}

// ── HTML email builder ────────────────────────────────────────────────────────
// mode "body" = solo el <table> raíz (para pegar en Mailchimp)
// mode "full" = documento HTML completo (para descargar)

export function buildEmailHTML(n: Newsletter, mode: "full" | "body" = "full"): string {
  const PRIMARY   = "#7c3aed";
  const TEXT      = "#1a1a2e";
  const MUTED     = "#64748b";
  const BORDER    = "#e2e8f0";
  const ACCENT_BG = "#f8f4ff";
  const ACCENT_BR = "#e9d5ff";

  const dateStr = new Date(n.generatedAt).toLocaleDateString("es-AR", {
    day: "numeric", month: "long", year: "numeric",
  });

  // ── Data points row ─────────────────────────────────────────────────────────
  const dataPtsHTML = (pts: DataPoint[]): string =>
    pts.map((p) => `
      <td width="${Math.floor(540 / (pts.length * 2 - 1))}" style="padding:14px 10px;text-align:center;background:${ACCENT_BG};border:1px solid ${ACCENT_BR};border-radius:8px;vertical-align:top;">
        <div style="font-size:10px;color:${MUTED};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">${p.label}</div>
        <div style="font-size:22px;font-weight:800;color:${TEXT};line-height:1;">${p.value}</div>
        ${p.change ? `<div style="font-size:12px;color:${p.positive ? "#059669" : "#dc2626"};margin-top:4px;font-weight:600;">${p.change}</div>` : ""}
      </td>
    `).join(`<td width="12"></td>`);

  // ── Sections ─────────────────────────────────────────────────────────────────
  const sectionsHTML = n.sections.map((s) => `
    <tr><td style="padding:0 0 32px 0;">
      <h2 style="font-size:19px;font-weight:800;color:${TEXT};margin:0 0 14px;padding-bottom:10px;border-bottom:2px solid ${PRIMARY};">${s.heading}</h2>
      <p style="font-size:15px;line-height:1.75;color:${TEXT};margin:0${s.dataPoints?.length ? " 0 20px" : ""};">${s.body.replace(/\n\n/g, "</p><p style=\"font-size:15px;line-height:1.75;color:#1a1a2e;margin:12px 0 0;\">").replace(/\n/g, "<br>")}</p>
      ${s.dataPoints && s.dataPoints.length > 0 ? `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:4px;">
          <tr>${dataPtsHTML(s.dataPoints)}</tr>
        </table>
      ` : ""}
    </td></tr>
  `).join("");

  // ── Quotes ───────────────────────────────────────────────────────────────────
  const quotesHTML = n.quotes.map((q) => `
    <tr><td style="padding:0 0 20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="4" style="background:${PRIMARY};border-radius:2px;">&nbsp;</td>
          <td width="14">&nbsp;</td>
          <td style="padding:16px 20px;background:${ACCENT_BG};border-radius:0 8px 8px 0;border:1px solid ${ACCENT_BR};border-left:none;">
            <p style="font-size:16px;font-style:italic;color:${TEXT};margin:0 0 8px;line-height:1.65;font-weight:500;">&ldquo;${q.text}&rdquo;</p>
            <p style="font-size:12px;color:${MUTED};margin:0;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">${q.context}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  `).join("");

  // ── Key takeaways ────────────────────────────────────────────────────────────
  const takeawaysHTML = n.keyTakeaways.map((t) => `
    <tr>
      <td width="20" style="vertical-align:top;padding-top:2px;color:${PRIMARY};font-weight:800;font-size:14px;">→</td>
      <td style="font-size:14px;color:${TEXT};line-height:1.65;padding-bottom:10px;">${t}</td>
    </tr>
  `).join("");

  // ── Sources ──────────────────────────────────────────────────────────────────
  const sourcesHTML = n.sources.map((s) => `
    <li style="font-size:12px;color:${MUTED};margin-bottom:5px;">
      ${s.url
        ? `<a href="${s.url}" style="color:${PRIMARY};text-decoration:none;">${s.title}</a>`
        : s.title
      }
    </li>
  `).join("");

  const body = `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:#f1f5f9;margin:0;padding:0;">
  <tr><td style="padding:24px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.10);">

      <!-- HEADER -->
      <tr>
        <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 55%,#0f3460 100%);padding:36px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <span style="font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;font-family:Georgia,serif;">NEMEF</span>
                <span style="display:block;font-size:10px;color:rgba(255,255,255,0.45);letter-spacing:0.2em;text-transform:uppercase;margin-top:3px;">No es Magia, Es Finanzas</span>
              </td>
              <td align="right" style="vertical-align:top;">
                <span style="font-size:11px;color:rgba(255,255,255,0.4);white-space:nowrap;">${dateStr}</span>
              </td>
            </tr>
          </table>
          <h1 style="font-size:28px;font-weight:800;color:#ffffff;margin:28px 0 10px;line-height:1.25;letter-spacing:-0.3px;">${n.title}</h1>
          <p style="font-size:15px;color:rgba(255,255,255,0.65);margin:0;line-height:1.55;">${n.subtitle}</p>
        </td>
      </tr>

      <!-- SUMMARY BAND -->
      <tr>
        <td style="padding:28px 40px;background:${ACCENT_BG};border-bottom:1px solid ${ACCENT_BR};">
          <p style="font-size:15px;color:${TEXT};line-height:1.75;margin:0;padding-left:16px;border-left:3px solid ${PRIMARY};font-style:italic;">${n.summary}</p>
        </td>
      </tr>

      <!-- MAIN BODY -->
      <tr>
        <td style="padding:36px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${sectionsHTML}

            ${n.quotes.length > 0 ? `
              <!-- QUOTES -->
              <tr><td style="padding:0 0 8px;">
                <p style="font-size:11px;font-weight:700;color:${MUTED};text-transform:uppercase;letter-spacing:0.12em;margin:0 0 16px;">Citas destacadas</p>
              </td></tr>
              ${quotesHTML}
            ` : ""}

            <!-- KEY TAKEAWAYS -->
            <tr><td style="padding:4px 0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:${ACCENT_BG};border:1px solid ${ACCENT_BR};border-radius:10px;padding:24px 28px;">
                    <p style="font-size:11px;font-weight:700;color:${PRIMARY};text-transform:uppercase;letter-spacing:0.12em;margin:0 0 16px;">Lo más importante</p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      ${takeawaysHTML}
                    </table>
                  </td>
                </tr>
              </table>
            </td></tr>

            <!-- CTA -->
            <tr><td style="padding:0 0 36px;text-align:center;">
              <a href="#" style="display:inline-block;background:${PRIMARY};color:#ffffff;font-size:14px;font-weight:700;padding:15px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.03em;">${n.cta}</a>
            </td></tr>
          </table>
        </td>
      </tr>

      ${n.sources.length > 0 ? `
      <!-- SOURCES -->
      <tr>
        <td style="padding:20px 40px 24px;border-top:1px solid ${BORDER};">
          <p style="font-size:11px;font-weight:700;color:${MUTED};text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;">Fuentes</p>
          <ul style="margin:0;padding-left:18px;">${sourcesHTML}</ul>
        </td>
      </tr>
      ` : ""}

      <!-- FOOTER -->
      <tr>
        <td style="background:#1a1a2e;padding:24px 40px;text-align:center;">
          <p style="font-size:13px;font-weight:700;color:#ffffff;margin:0 0 5px;letter-spacing:0.02em;">NEMEF — No es Magia, Es Finanzas</p>
          <p style="font-size:11px;color:rgba(255,255,255,0.35);margin:0;">Generado el ${dateStr} · Contenido de carácter informativo, no constituye asesoría financiera.</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>`;

  if (mode === "body") return body;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${n.subject}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f1f5f9;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
${body}
</body>
</html>`;
}
