import { Resend } from "resend";
import { briefSchema, steps, type Brief } from "@/lib/brief";
import { profile } from "@/lib/site";
import fr from "@/messages/fr.json";

// En dessous de ce délai, on considère que c'est un bot qui a rempli le formulaire
const MIN_FILL_MS = 4000;

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
  const html = renderEmail(brief, locale);

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
  });
  if (error) {
    console.error("[brief] échec Resend", error);
    return Response.json({ error: "send_failed" }, { status: 502 });
  }
  return Response.json({ ok: true, delivered: true });
}

// Email lisible : une section par étape, libellés et options en français
const fields: Record<string, { label: string; options?: Record<string, string> }> = fr.Brief.fields;
const stepTitles: Record<string, string> = fr.Brief.steps;

function renderEmail(brief: Brief, locale: string) {
  const value = (name: string, raw: unknown): string => {
    if (Array.isArray(raw)) return raw.map((v) => value(name, v)).join(", ");
    const s = String(raw ?? "");
    return fields[name]?.options?.[s] ?? s;
  };

  const sections = steps
    .map((step) => {
      const rows = step.fields
        .filter((f) => f.kind !== "consent")
        .map((f) => [fields[f.name].label, value(f.name, brief[f.name as keyof Brief])])
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

  return `<div style="font-family:system-ui,sans-serif;font-size:14px;color:#111;max-width:680px">
<h1 style="font-size:20px">Nouveau brief projet</h1>
<p style="color:#666">Envoyé depuis la version ${locale === "en" ? "anglaise" : "française"} du site. Répondez directement à cet email pour écrire à ${escape(brief.name)}.</p>
${sections}
</div>`;
}
