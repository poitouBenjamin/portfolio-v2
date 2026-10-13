import Anthropic from "@anthropic-ai/sdk";
import { directions, imageToken, type DirectionKey, type Preview, type PreviewContext } from "./shared";

// Génération réelle des pistes avec Claude : une requête par direction, en parallèle.
// Activée dès que ANTHROPIC_API_KEY est définie (sinon le mode démo prend le relais).

const MODEL = "claude-opus-5-5";

const SYSTEM = `You are a senior web designer building a homepage mockup for a prospective client of a freelance web developer.
Return one complete, self-contained HTML document and nothing else: no Markdown fences, no commentary.
Rules:
- Inline all CSS in a <style> tag. Google Fonts <link> tags are allowed. No JavaScript, no external images.
- The client's uploaded images are referenced only by their token as the src attribute, e.g. <img src="{{image:1}}">. Never invent other image URLs; use CSS shapes, gradients and typography instead.
- Responsive from 360px to 1440px wide. Real, specific copy in the client's language drawn from the brief, never lorem ipsum.
- Sections: navigation, hero with a clear call to action, two or three sections that serve the project's goals, footer.
- Keep it under 400 lines.`;

const directionBriefs: Record<DirectionKey, string> = {
  editorial:
    "Direction 1, editorial: light background, refined serif display typography, generous white space, restrained accent colour, magazine-like rhythm.",
  immersive:
    "Direction 2, immersive: dark theme, bold sans-serif display type, luminous gradients, full-bleed imagery, cinematic feel.",
  vivid:
    "Direction 3, vivid: saturated brand colours, rounded shapes, playful layout, warm and friendly tone, energetic but tidy.",
};

function briefText(ctx: PreviewContext, direction: DirectionKey) {
  const lines = [
    `Language of the page: ${ctx.locale === "en" ? "English" : "French"}.`,
    `Client: ${ctx.name}${ctx.company ? `, ${ctx.company}` : ""}.`,
    `Project type: ${ctx.projectType}. Goals: ${ctx.goals.join(", ") || "not given"}. Features wanted: ${ctx.features.join(", ") || "not given"}.`,
    `Project description: ${ctx.description}`,
    ctx.audience && `Audience: ${ctx.audience}`,
    ctx.prompt && `What the client imagines: ${ctx.prompt}`,
    ctx.site &&
      `Current website (${ctx.site.url}): title "${ctx.site.title}", description "${ctx.site.description}", main heading "${ctx.site.headline}", brand colours ${ctx.site.colors.join(", ") || "unknown"}. Keep the brand recognisable.`,
    ctx.images.length
      ? `Uploaded images, in order: ${ctx.images.map((img, i) => `${imageToken(i)} = "${img.name}"`).join("; ")}. A file named like a logo is the logo.`
      : "No images were uploaded.",
    directionBriefs[direction],
  ];
  return lines.filter(Boolean).join("\n");
}

const extractHtml = (text: string) => {
  const unfenced = text.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/, "");
  const start = unfenced.search(/<!doctype html|<html/i);
  if (start === -1) throw new Error("no_html");
  return unfenced.slice(start).trim();
};

export async function generateWithClaude(ctx: PreviewContext): Promise<Preview[]> {
  const client = new Anthropic();
  const images: Anthropic.Beta.BetaContentBlockParam[] = ctx.images.map((img) => {
    const [, mediaType, data] = img.dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/)!;
    return {
      type: "image",
      source: { type: "base64", media_type: mediaType as "image/png", data },
    };
  });

  return Promise.all(
    directions.map(async ({ id, key }) => {
      const message = await client.beta.messages
        .stream({
          model: MODEL,
          max_tokens: 32000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          output_config: { effort: "medium" },
          system: SYSTEM,
          messages: [{ role: "user", content: [...images, { type: "text", text: briefText(ctx, key) }] }],
        })
        .finalMessage();
      if (message.stop_reason === "refusal") throw new Error("refusal");
      const text = message.content.map((b) => (b.type === "text" ? b.text : "")).join("");
      return { id, direction: key, html: extractHtml(text) };
    }),
  );
}
