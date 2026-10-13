import { Resend } from "resend";
import { FREE_PREVIEW_ID, UNLOCK_PRICE_EUR } from "@/lib/previews/shared";
import type { Esquisse } from "@/lib/previews/store";
import { profile } from "@/lib/site";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import { brandOf, esquisseUrl } from "./links";

const FROM = () => process.env.BRIEF_FROM ?? "Portfolio <onboarding@resend.dev>";
const OWNER = () => process.env.BRIEF_TO ?? profile.email;

export const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));

type Mail = { to: string; replyTo: string; subject: string; html: string; attachments?: InlineImage[] };
type InlineImage = { filename: string; content: Buffer; contentId: string; contentType: string };

// Sans clé Resend en local, l'email est seulement résumé dans la console
async function send(mail: Mail) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[esquisses] email non envoyé (pas de RESEND_API_KEY) : « ${mail.subject} » → ${mail.to}`);
      return;
    }
    throw new Error("RESEND_API_KEY manquante en production");
  }
  const { error } = await new Resend(apiKey).emails.send({ from: FROM(), ...mail });
  if (error) throw new Error(`Resend : ${error.message}`);
}

// Vignettes jointes à l'email et affichées par cid : rien à charger depuis le site,
// elles s'affichent même si la page n'est pas publique (local, preview Vercel)
const inline = (contentId: string, base64: string): InlineImage => ({
  filename: `${contentId}.jpg`,
  content: Buffer.from(base64, "base64"),
  contentId,
  contentType: "image/jpeg",
});

const layout = (lang: string, body: string) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f2">
<div style="max-width:640px;margin:0 auto;padding:32px 20px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#111">
${body}
</div></body></html>`;

const button = (href: string, label: string) =>
  `<a href="${escape(href)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-weight:600;padding:14px 26px;border-radius:999px">${escape(label)}</a>`;

/** Email de Benjamin : esquisses prêtes à relire (ou génération en échec) */
export async function sendReviewEmail(e: Esquisse, origin: string) {
  const brand = brandOf(e);
  const link = esquisseUrl(origin, e, true);
  const names = fr.Esquisses.directions as Record<string, string>;
  const failed = e.status === "failed";

  const cards = e.previews
    .map(
      (p) => `<td style="padding:4px;vertical-align:top;width:33%">
<img src="cid:relecture-${p.id}" alt="" width="196" style="display:block;width:100%;border-radius:8px;border:1px solid #ddd">
<p style="margin:6px 0 0;font-size:13px;color:#555">${p.id} · ${escape(names[p.direction] ?? p.direction)}${p.id === FREE_PREVIEW_ID ? " (offerte)" : ""}</p></td>`,
    )
    .join("");

  const body = failed
    ? `<h1 style="font-size:20px;margin:0 0 12px">Échec des esquisses · ${escape(brand)}</h1>
<p>La génération des esquisses de ${escape(e.brief.name)} n'a pas abouti. Le client n'a rien reçu.</p>
<p style="margin:24px 0">${button(link, "Ouvrir la fiche et relancer")}</p>`
    : `<h1 style="font-size:20px;margin:0 0 12px">Esquisses à relire · ${escape(brand)}</h1>
<p>Les trois esquisses de ${escape(e.brief.name)} sont prêtes. Le client ne reçoit rien tant que tu ne les as pas envoyées.</p>
<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;margin:16px 0"><tr>${cards}</tr></table>
<p style="margin:24px 0">${button(link, "Relire et envoyer au client")}</p>
<p style="font-size:13px;color:#666">Le brief complet est dans l'email « Nouveau brief » envoyé à la réception.</p>`;

  await send({
    to: OWNER(),
    replyTo: e.brief.email,
    subject: failed ? `Échec des esquisses · ${brand}` : `Esquisses à relire · ${brand}`,
    html: layout("fr", body),
    attachments: failed ? [] : e.previews.map((p) => inline(`relecture-${p.id}`, e.thumbs[p.id].clear)),
  });
}

/** Email du client : la première esquisse nette, les deux autres floutées, tout mène à sa page */
export async function sendClientEmail(e: Esquisse, origin: string) {
  const copy = (e.locale === "en" ? en : fr).Esquisses;
  const names = copy.directions as Record<string, string>;
  const hints = copy.directionHints as Record<string, string>;
  const brand = brandOf(e);
  const link = esquisseUrl(origin, e);
  const values = { brand, name: e.brief.name, price: UNLOCK_PRICE_EUR, phone: profile.phone };
  const p = (text: string, style = "") => `<p style="margin:0 0 14px;${style}">${escape(fill(text, values))}</p>`;
  const shown = (id: string) => e.paid || id === FREE_PREVIEW_ID;

  const cards = e.previews
    .map((preview, i) => {
      const label = `${fill(copy.sketch, { n: i + 1 })} · ${names[preview.direction] ?? preview.direction}`;
      return `<tr><td style="padding:0 0 22px">
<a href="${escape(`${link}#esquisse-${preview.id}`)}" style="text-decoration:none;color:#111">
<img src="cid:esquisse-${preview.id}" alt="${escape(label)}" width="600" style="display:block;width:100%;border-radius:12px;border:1px solid #ddd">
<p style="margin:10px 0 0;font-weight:600">${shown(preview.id) ? "" : "🔒 "}${escape(label)}</p>
<p style="margin:2px 0 0;font-size:13px;color:#666">${escape(hints[preview.direction] ?? "")}</p>
</a></td></tr>`;
    })
    .join("");

  const body = `<p style="margin:0 0 6px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#888">${escape(fill(copy.email.eyebrow, values))}</p>
<h1 style="font-size:26px;line-height:1.2;margin:0 0 20px">${escape(fill(copy.email.title, values))}</h1>
${p(copy.email.greeting)}${p(copy.email.intro)}${p(e.paid ? copy.email.allUnlocked : copy.email.free)}
<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;margin:12px 0 0">${cards}</table>
${e.paid ? "" : p(copy.email.locked)}
<p style="margin:8px 0 28px">${button(link, copy.email.cta)}</p>
${p(copy.email.next)}
<p style="margin:28px 0 0;color:#666">${escape(copy.email.signature)}<br>${escape(profile.phone)} · ${escape(profile.email)}</p>
<p style="margin:20px 0 0;font-size:12px;color:#999">${escape(copy.aiNote)}</p>`;

  await send({
    to: e.brief.email,
    replyTo: OWNER(),
    subject: fill(copy.email.subject, values),
    html: layout(e.locale, body),
    attachments: e.previews.map((preview) =>
      inline(`esquisse-${preview.id}`, shown(preview.id) ? e.thumbs[preview.id].clear : e.thumbs[preview.id].blurred),
    ),
  });
}
