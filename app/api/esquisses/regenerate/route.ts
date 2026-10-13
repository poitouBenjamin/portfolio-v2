import { after } from "next/server";
import { z } from "zod";
import { prepareEsquisses } from "@/lib/esquisses";
import { isAdmin } from "@/lib/esquisses/links";
import { esquisseIdSchema } from "@/lib/previews/shared";
import { getEsquisse, saveEsquisse } from "@/lib/previews/store";

// Génération (Claude) puis captures : jusqu'à quelques minutes
export const maxDuration = 300;

const bodySchema = z.object({ id: esquisseIdSchema, k: z.string().max(100) });

// Nouvelle génération à la demande de Benjamin, suivie d'un nouvel email de relecture
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isAdmin(parsed.data.id, parsed.data.k)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const esquisse = await getEsquisse(parsed.data.id);
  if (!esquisse) return Response.json({ error: "not_found" }, { status: 404 });
  if (esquisse.status === "generating") return Response.json({ error: "busy" }, { status: 409 });

  await saveEsquisse({ ...esquisse, status: "generating" });
  const origin = new URL(request.url).origin;
  after(() => prepareEsquisses(esquisse.id, origin));
  return Response.json({ ok: true });
}
