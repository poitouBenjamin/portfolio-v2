import { generateWithClaude } from "./claude";
import { generateDemo } from "./demo";
import { type Preview, type PreviewContext, type PreviewRequest } from "./shared";
import { readSiteMeta } from "./site-meta";

export * from "./shared";

export const previewMode = () => (process.env.ANTHROPIC_API_KEY ? "claude" : "demo");

// Pas de script dans une piste : elles s'affichent en iframe isolée et partent en pièce jointe
export const stripScripts = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");

export async function generatePreviews(request: PreviewRequest): Promise<{ mode: string; previews: Preview[] }> {
  const context: PreviewContext = { ...request, site: await readSiteMeta(request.url) };
  const mode = previewMode();
  const previews = mode === "claude" ? await generateWithClaude(context) : generateDemo(context);
  return { mode, previews: previews.map((p) => ({ ...p, html: stripScripts(p.html) })) };
}
