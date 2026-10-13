import { z } from "zod";
import { sendClientEmail } from "@/lib/esquisses/emails";
import { isAdmin } from "@/lib/esquisses/links";
import { esquisseIdSchema } from "@/lib/previews/shared";
import { getEsquisse, saveEsquisse } from "@/lib/previews/store";

const bodySchema = z.object({ id: esquisseIdSchema, k: z.string().max(100) });

// Benjamin a relu les esquisses : le client reçoit son email
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isAdmin(parsed.data.id, parsed.data.k)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const esquisse = await getEsquisse(parsed.data.id);
  if (!esquisse) return Response.json({ error: "not_found" }, { status: 404 });
  if (esquisse.status !== "draft" && esquisse.status !== "sent") {
    return Response.json({ error: "not_ready" }, { status: 409 });
  }

  try {
    await sendClientEmail(esquisse, new URL(request.url).origin);
  } catch (error) {
    console.error("[esquisses/send] email client non envoyé", error);
    return Response.json({ error: "send_failed" }, { status: 502 });
  }
  await saveEsquisse({ ...esquisse, status: "sent", sentAt: Date.now() });
  return Response.json({ ok: true });
}
