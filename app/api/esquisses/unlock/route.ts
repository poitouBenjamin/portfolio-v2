import { z } from "zod";
import { paymentMode, stripe } from "@/lib/previews/payment";
import { esquisseIdSchema } from "@/lib/previews/shared";
import { getEsquisse, saveEsquisse } from "@/lib/previews/store";

const bodySchema = z.object({ id: esquisseIdSchema });

// Rend les esquisses complètes une fois le paiement vérifié directement auprès de Stripe :
// le navigateur ne peut pas se déclarer payé lui-même.
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "validation" }, { status: 422 });
  const { id } = parsed.data;

  const esquisse = await getEsquisse(id);
  if (!esquisse?.sentAt) return Response.json({ error: "not_found" }, { status: 404 });

  let paid = esquisse.paid;
  if (!paid && paymentMode() === "dev") {
    paid = true; // bouton de test, jamais disponible en production
  } else if (!paid && stripe && esquisse.checkout) {
    try {
      const checkout = await stripe.checkout.sessions.retrieve(esquisse.checkout);
      paid = checkout.payment_status === "paid" && checkout.metadata?.esquisse === id;
    } catch (error) {
      console.error("[esquisses/unlock] vérification Stripe impossible", error);
      return Response.json({ error: "verify_failed" }, { status: 502 });
    }
  }
  if (!paid) return Response.json({ error: "unpaid" }, { status: 402 });

  if (!esquisse.paid) await saveEsquisse({ ...esquisse, paid: true });
  return Response.json({ paid: true, previews: esquisse.previews });
}
