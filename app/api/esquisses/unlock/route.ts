import { z } from "zod";
import { previewsEnabled } from "@/lib/previews/flag";
import { paymentMode, stripe } from "@/lib/previews/payment";
import { sessionIdSchema } from "@/lib/previews/shared";
import { getSession, saveSession } from "@/lib/previews/store";

const bodySchema = z.object({ session: sessionIdSchema });

// Rend les pistes complètes une fois le paiement vérifié directement auprès de Stripe :
// le navigateur ne peut pas se déclarer payé lui-même.
export async function POST(request: Request) {
  if (!previewsEnabled()) return Response.json({ error: "disabled" }, { status: 404 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "validation" }, { status: 422 });
  const id = parsed.data.session;

  const session = await getSession(id);
  if (!session) return Response.json({ error: "not_found" }, { status: 404 });

  let paid = session.paid;
  if (!paid && paymentMode() === "dev") {
    paid = true; // bouton de test, jamais disponible en production
  } else if (!paid && stripe && session.checkout) {
    try {
      const checkout = await stripe.checkout.sessions.retrieve(session.checkout);
      paid = checkout.payment_status === "paid" && checkout.metadata?.previewSession === id;
    } catch (error) {
      console.error("[brief/unlock] vérification Stripe impossible", error);
      return Response.json({ error: "verify_failed" }, { status: 502 });
    }
  }
  if (!paid) return Response.json({ error: "unpaid" }, { status: 402 });

  if (!session.paid) await saveSession(id, { ...session, paid: true });
  return Response.json({ paid: true, previews: session.previews });
}
