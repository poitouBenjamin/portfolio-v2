import { generatePreviews, previewRequestSchema } from "@/lib/previews";
import { previewsEnabled } from "@/lib/previews/flag";
import { present } from "@/lib/previews/lock";
import { getSession, rateLimited, saveSession, storeReady } from "@/lib/previews/store";

// La génération par Claude peut prendre une minute
export const maxDuration = 300;

const WINDOW_S = 60 * 60;
const MAX_PER_WINDOW = 5;

export async function POST(request: Request) {
  if (!previewsEnabled()) return Response.json({ error: "disabled" }, { status: 404 });
  if (!storeReady()) {
    console.error("[brief/previews] stockage non configuré (UPSTASH_REDIS_REST_URL / TOKEN)");
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (await rateLimited(`previews:${ip}`, MAX_PER_WINDOW, WINDOW_S)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = previewRequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "validation" }, { status: 422 });

  try {
    const { mode, previews } = await generatePreviews(parsed.data);
    // Un client qui a déjà payé garde l'accès complet s'il relance la génération
    const previous = parsed.data.previous ? await getSession(parsed.data.previous) : null;
    const paid = Boolean(previous?.paid);
    const session = crypto.randomUUID();
    await saveSession(session, { previews, paid, createdAt: Date.now() });
    return Response.json({ mode, session, paid, previews: present(previews, paid) });
  } catch (error) {
    console.error("[brief/previews] échec de la génération", error);
    return Response.json({ error: "generation_failed" }, { status: 502 });
  }
}
