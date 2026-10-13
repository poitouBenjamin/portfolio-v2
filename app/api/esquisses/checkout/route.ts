import { z } from "zod";
import { brandOf } from "@/lib/esquisses/links";
import { previewsEnabled } from "@/lib/previews/flag";
import { stripe } from "@/lib/previews/payment";
import { esquisseIdSchema, UNLOCK_PRICE_EUR } from "@/lib/previews/shared";
import { getEsquisse, saveEsquisse } from "@/lib/previews/store";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";

const bodySchema = z.object({ id: esquisseIdSchema, locale: z.enum(["fr", "en"]) });

// Ouvre un paiement Stripe Checkout pour débloquer les esquisses 2 et 3
export async function POST(request: Request) {
  if (!previewsEnabled()) return Response.json({ error: "disabled" }, { status: 404 });
  if (!stripe) return Response.json({ error: "not_configured" }, { status: 503 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "validation" }, { status: 422 });
  const { id, locale } = parsed.data;

  const esquisse = await getEsquisse(id);
  if (!esquisse?.sentAt) return Response.json({ error: "not_found" }, { status: 404 });
  if (esquisse.paid) return Response.json({ error: "already_paid" }, { status: 409 });

  const copy = (locale === "en" ? en : fr).Esquisses.checkout;
  try {
    const checkout = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      // Carte, Apple Pay et Google Pay : aucun ne quitte la page
      redirect_on_completion: "never",
      allowed_payment_method_types: ["card"],
      // Benjamin reste le vendeur : le montant est déduit de son devis, pas un produit vendu par Stripe
      managed_payments: { enabled: false },
      mode: "payment",
      locale,
      customer_email: esquisse.brief.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: UNLOCK_PRICE_EUR * 100,
            product_data: { name: `${copy.product} · ${brandOf(esquisse)}`, description: copy.description },
          },
        },
      ],
      client_reference_id: id,
      metadata: { esquisse: id },
    });
    await saveEsquisse({ ...esquisse, checkout: checkout.id });
    return Response.json({ clientSecret: checkout.client_secret });
  } catch (error) {
    console.error("[esquisses/checkout] échec Stripe", error);
    return Response.json({ error: "checkout_failed" }, { status: 502 });
  }
}
