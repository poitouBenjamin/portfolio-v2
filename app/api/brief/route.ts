import { Resend } from "resend";
import { z } from "zod";
import { briefSchema, briefSteps, type Brief } from "@/lib/brief";
import {
  directions,
  fillImages,
  imageSchema,
  MAX_IMAGES,
  stripScripts,
  type Preview,
  type PreviewImage,
} from "@/lib/previews";
import { profile } from "@/lib/site";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";

// En dessous de ce délai, on considère que c'est un bot qui a rempli le formulaire
const MIN_FILL_MS = 4000;

// Pistes de l'étape Aperçu IA, renvoyées par le navigateur avec le brief
const previewsSchema = z.object({
  previews: z
    .array(
      z.object({
        id: z.enum(["1", "2", "3"]),
        direction: z.enum(directions.map((d) => d.key) as [string, ...string[]]),
        html: z.string().max(400_000),
      }),
    )
    .max(3)
    .default([]),
  images: z.array(imageSchema).max(MAX_IMAGES).default([]),
});

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  // Anti-spam : champ piège invisible rempli, ou formulaire soumis trop vite
  const startedAt = Number(body.startedAt);
  if (body.website || !startedAt || Date.now() - startedAt < MIN_FILL_MS) {
    return Response.json({ ok: true }); // réponse neutre, rien n'est envoyé
  }

  const parsed = briefSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "validation", issues: parsed.error.issues.map((i) => i.path[0]) }, { status: 422 });
  }
  const brief = parsed.data;
  const locale = body.locale === "en" ? "en" : "fr";
  const extra = previewsSchema.safeParse(body);
  const { previews, images } = extra.success ? extra.data : { previews: [], images: [] };
  const attachments = previewAttachments(previews as Preview[], images, locale);
  const html = renderEmail(brief, locale, previews as Preview[], images.length);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[brief] RESEND_API_KEY absente, email non envoyé :\n", brief);
      return Response.json({ ok: true, delivered: false });
    }
    console.error("[brief] RESEND_API_KEY manquante en production");
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.BRIEF_FROM ?? "Portfolio <onboarding@resend.dev>",
    to: process.env.BRIEF_TO ?? profile.email,
    replyTo: brief.email,
    subject: `Nouveau brief : ${brief.name}${brief.company ? ` (${brief.company})` : ""}`,
    html,
    attachments,
  });
  if (error) {
    console.error("[brief] échec Resend", error);
    return Response.json({ error: "send_failed" }, { status: 502 });
  }

  // Le client reçoit ses pistes ; un échec ici ne doit pas faire échouer le brief
  if (attachments.length) {
    const copy = (locale === "en" ? en : fr).Brief.clientEmail;
    const brand = brief.company || brief.name;
    const { error: clientError } = await resend.emails.send({
      from: process.env.BRIEF_FROM ?? "Portfolio <onboarding@resend.dev>",
      to: brief.email,
      replyTo: process.env.BRIEF_TO ?? profile.email,
      subject: copy.subject.replace("{brand}", brand),
      html: renderClientEmail(brief, locale),
      attachments,
    });
    if (clientError) console.error("[brief] pistes non envoyées au client", clientError);
  }
  return Response.json({ ok: true, delivered: true });
}

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

// Une pièce jointe HTML autonome par piste, images incluses
function previewAttachments(previews: Preview[], images: PreviewImage[], locale: string) {
  const names = (locale === "en" ? en : fr).Brief.studio.directions as Record<string, string>;
  return previews.map((p) => ({
    filename: `piste-${p.id}-${slug(names[p.direction] ?? p.direction)}.html`,
    content: Buffer.from(fillImages(stripScripts(p.html), images), "utf-8"),
  }));
}

function renderClientEmail(brief: Brief, locale: string) {
  const copy = (locale === "en" ? en : fr).Brief.clientEmail;
  const p = (text: string) => `<p style="margin:0 0 14px">${escape(text)}</p>`;
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"></head><body>
<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#111;max-width:560px">
${p(copy.greeting.replace("{name}", brief.name))}${p(copy.body)}${p(copy.next)}
<p style="margin:24px 0 0;color:#666">${escape(copy.signature)}<br>${escape(profile.phone)} · ${escape(profile.email)}</p>
</div></body></html>`;
}

// Email lisible : une section par étape, libellés et options en français
const fields: Record<string, { label: string; options?: Record<string, string> }> = fr.Brief.fields;
const stepTitles: Record<string, string> = fr.Brief.steps;

function renderEmail(brief: Brief, locale: string, previews: Preview[], imageCount: number) {
  const value = (name: string, raw: unknown): string => {
    if (Array.isArray(raw)) return raw.map((v) => value(name, v)).join(", ");
    const s = String(raw ?? "");
    return fields[name]?.options?.[s] ?? s;
  };

  // Note, piste préférée et commentaire complètent la section Aperçu IA
  const studio = fr.Brief.studio;
  const labels = fr.Brief.previewEmailLabels;
  const favorite = previews.find((p) => p.id === brief.previewFavorite);
  const previewRows: [string, string][] = previews.length
    ? [
        ["Pistes générées", `${previews.length} (en pièces jointes) · ${imageCount} visuel(s) fourni(s)`],
        [
          labels.previewRating,
          brief.previewRating
            ? `${brief.previewRating}/5 · ${studio.ratingValues[brief.previewRating as keyof typeof studio.ratingValues]}`
            : "",
        ],
        [
          labels.previewFavorite,
          favorite
            ? `Piste ${favorite.id} · ${studio.directions[favorite.direction as keyof typeof studio.directions]}`
            : "",
        ],
        [labels.previewComment, brief.previewComment],
      ]
    : [];

  const sections = briefSteps(true)
    .map((step) => {
      const rows = step.fields
        .filter((f) => f.kind !== "consent" && f.kind !== "studio")
        .map((f) => [fields[f.name].label, value(f.name, brief[f.name as keyof Brief])])
        .concat(step.id === "preview" ? previewRows : [])
        .filter(([, v]) => v)
        .map(
          ([label, v]) =>
            `<tr><td style="padding:6px 12px 6px 0;color:#666;vertical-align:top;width:200px">${escape(label)}</td>` +
            `<td style="padding:6px 0;white-space:pre-wrap">${escape(v)}</td></tr>`,
        )
        .join("");
      return rows
        ? `<h2 style="font-size:16px;margin:24px 0 8px">${escape(stepTitles[step.id])}</h2><table>${rows}</table>`
        : "";
    })
    .join("");

  // Document complet avec charset explicite : certains clients mail ignorent
  // l'en-tête Content-Type et retombent sur un autre encodage sans cette balise.
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"></head><body>
<div style="font-family:system-ui,sans-serif;font-size:14px;color:#111;max-width:680px">
<h1 style="font-size:20px">Nouveau brief projet</h1>
<p style="color:#666">Envoyé depuis la version ${locale === "en" ? "anglaise" : "française"} du site. Répondez directement à cet email pour écrire à ${escape(brief.name)}.</p>
${sections}
</div>
</body></html>`;
}
