import { generatePreviews, previewRequestSchema } from "@/lib/previews";
import { previewsEnabled } from "@/lib/previews/flag";

// La génération par Claude peut prendre une minute
export const maxDuration = 300;

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

// Limite par IP, en mémoire de l'instance : un garde-fou, pas une protection forte.
// Avant d'activer Claude en production, la remplacer par un stockage partagé.
function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return true;
  hits.set(ip, [...recent, now]);
  return false;
}

export async function POST(request: Request) {
  if (!previewsEnabled()) return Response.json({ error: "disabled" }, { status: 404 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) return Response.json({ error: "rate_limited" }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = previewRequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "validation" }, { status: 422 });

  try {
    return Response.json(await generatePreviews(parsed.data));
  } catch (error) {
    console.error("[brief/previews] échec de la génération", error);
    return Response.json({ error: "generation_failed" }, { status: 502 });
  }
}
