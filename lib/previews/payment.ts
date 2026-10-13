import Stripe from "stripe";
import type { PaymentMode } from "./shared";

// Paiement du déblocage des pistes avec Stripe Checkout, intégré dans la page :
// pas de redirection, le brief en cours reste à l'écran.

const secret = process.env.STRIPE_SECRET_KEY;
export const stripe = secret ? new Stripe(secret) : null;

export const paymentMode = (): PaymentMode =>
  stripe && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ? "stripe"
    : process.env.VERCEL_ENV !== "production"
      ? "dev"
      : "off";
