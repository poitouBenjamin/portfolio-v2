"use client";

import type { StripeEmbeddedCheckout } from "@stripe/stripe-js";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { fillImages, UNLOCK_PRICE_EUR, type PaymentMode, type Preview } from "@/lib/previews/shared";

type UnlockStatus = "idle" | "paying" | "verifying" | "done" | "error";
type AdminInfo = { key: string; status: string; sentAt?: number; clientEmail: string; clientUrl: string };

const ghost = "rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold transition hover:border-fog";
const post = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

// Page rendue à 1280 px puis réduite à la largeur de la carte
function Frame({ html, title, locked }: { html: string; title: string; locked?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setScale(el.clientWidth / 1280));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={box} className="relative aspect-[4/5] overflow-hidden bg-white">
      <iframe
        title={title}
        srcDoc={html}
        sandbox=""
        loading="lazy"
        tabIndex={-1}
        className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
        style={{ width: 1280, height: 1600, transform: `scale(${scale})`, filter: locked ? "blur(32px)" : undefined }}
      />
      {locked && (
        <div className="absolute inset-0 grid place-items-center bg-void/30">
          <span className="flex items-center gap-2 rounded-full border border-white/20 bg-void/80 px-4 py-2 font-mono text-xs text-fog backdrop-blur">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
              <path d="M4 7V5a4 4 0 1 1 8 0v2h.5A1.5 1.5 0 0 1 14 8.5v6a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-6A1.5 1.5 0 0 1 3.5 7H4Zm2 0h4V5a2 2 0 1 0-4 0v2Z" />
            </svg>
            {title}
          </span>
        </div>
      )}
    </div>
  );
}

// Vue de relecture de Benjamin : statut, envoi au client, nouvelle génération
function AdminBar({ id, admin }: { id: string; admin: AdminInfo }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const act = async (action: "send" | "regenerate") => {
    setBusy(true);
    setMessage("");
    try {
      const res = await post(`/api/esquisses/${action}`, { id, k: admin.key });
      if (!res.ok) throw new Error(String(res.status));
      setMessage(
        action === "send"
          ? `Email envoyé à ${admin.clientEmail}.`
          : "Génération relancée : tu recevras un email quand ce sera prêt.",
      );
    } catch {
      setMessage("Action impossible, réessaie.");
    } finally {
      setBusy(false);
    }
  };
  const status: Record<string, string> = {
    generating: "Génération en cours…",
    draft: "Prêtes à relire, pas encore envoyées au client",
    sent: `Envoyées au client${admin.sentAt ? ` le ${new Date(admin.sentAt).toLocaleString("fr-FR")}` : ""}`,
    failed: "La génération a échoué",
  };
  const ready = admin.status === "draft" || admin.status === "sent";
  return (
    <div className="mb-12 rounded-2xl border border-dashed border-amber-300/50 bg-amber-300/5 p-5 text-sm">
      <p className="font-mono text-xs text-amber-200 uppercase">Relecture · le client ne voit pas ce bandeau</p>
      <p className="mt-2 text-fog">{status[admin.status] ?? admin.status}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {ready && (
          <button
            type="button"
            disabled={busy}
            onClick={() => act("send")}
            className="rounded-full bg-acid px-5 py-2.5 font-semibold text-void transition hover:bg-white disabled:opacity-60"
          >
            {admin.status === "sent" ? "Renvoyer l’email au client" : "Envoyer au client"}
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => act("regenerate")}
          className={`${ghost} disabled:opacity-60`}
        >
          Regénérer les esquisses
        </button>
        <a href={admin.clientUrl} target="_blank" rel="noopener" className={ghost}>
          Voir la page client ↗
        </a>
      </div>
      {message && (
        <p role="status" className="mt-3 text-acid">
          {message}
        </p>
      )}
    </div>
  );
}

export default function EsquissesView({
  id,
  initialPreviews,
  imageCount,
  payment,
  admin,
}: {
  id: string;
  initialPreviews: Preview[];
  imageCount: number;
  payment: PaymentMode;
  admin?: AdminInfo;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [previews, setPreviews] = useState(initialPreviews);
  const [unlockStatus, setUnlockStatus] = useState<UnlockStatus>("idle");
  const [open, setOpen] = useState<Preview | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const payDialog = useRef<HTMLDialogElement>(null);
  const checkoutBox = useRef<HTMLDivElement>(null);
  const checkout = useRef<StripeEmbeddedCheckout | null>(null);
  const price = { price: UNLOCK_PRICE_EUR };

  // Les visuels du client sont servis par l'API plutôt que recopiés dans chaque esquisse
  const images = Array.from({ length: imageCount }, (_, i) => ({ dataUrl: `/api/esquisses/${id}/images/${i}` }));
  const html = (p: Preview) => fillImages(p.html, images);
  const name = (p: Preview) => t(`Esquisses.directions.${p.direction}`);
  const locked = previews.some((p) => p.locked);

  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);

  // Le serveur vérifie le paiement auprès de Stripe avant de rendre les esquisses complètes
  const verify = async () => {
    setUnlockStatus("verifying");
    try {
      const res = await post("/api/esquisses/unlock", { id });
      if (!res.ok) throw new Error(String(res.status));
      setPreviews(((await res.json()) as { previews: Preview[] }).previews);
      setUnlockStatus("done");
    } catch {
      setUnlockStatus("error");
    }
  };

  const closeCheckout = () => {
    checkout.current?.destroy();
    checkout.current = null;
  };

  // Stripe Checkout intégré dans une fenêtre, sans quitter la page
  const unlock = async () => {
    if (payment === "dev") return verify();
    setUnlockStatus("paying");
    payDialog.current?.showModal();
    try {
      const { loadStripe } = await import("@stripe/stripe-js/pure");
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      if (!stripe) throw new Error("stripe");
      closeCheckout();
      checkout.current = await stripe.createEmbeddedCheckoutPage({
        fetchClientSecret: async () => {
          const res = await post("/api/esquisses/checkout", { id, locale });
          if (!res.ok) throw new Error(String(res.status));
          return ((await res.json()) as { clientSecret: string }).clientSecret;
        },
        onComplete: () => {
          setUnlockStatus("verifying");
          payDialog.current?.close();
          verify();
        },
      });
      checkout.current.mount(checkoutBox.current!);
    } catch {
      payDialog.current?.close();
      setUnlockStatus("error");
    }
  };

  return (
    <div>
      {admin && <AdminBar id={id} admin={admin} />}

      <ul className="grid gap-6 md:grid-cols-3">
        {previews.map((p, i) => (
          <li
            key={p.id}
            id={`esquisse-${p.id}`}
            className="scroll-mt-28 overflow-hidden rounded-2xl border border-white/10 bg-surface"
          >
            <Frame
              html={html(p)}
              title={p.locked ? t("Esquisses.locked") : t("Esquisses.frameTitle", { name: name(p) })}
              locked={p.locked}
            />
            <div className="flex flex-col items-start gap-3 p-5">
              <div>
                <p className="font-mono text-xs text-acid">{t("Esquisses.sketch", { n: i + 1 })}</p>
                <p className="font-display text-xl font-semibold">{name(p)}</p>
                <p className="text-sm text-muted">{t(`Esquisses.directionHints.${p.direction}`)}</p>
              </div>
              {!p.locked && (
                <button
                  type="button"
                  onClick={() => setOpen(p)}
                  className="text-sm text-muted transition hover:text-acid"
                >
                  {t("Esquisses.open")} ↗
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {locked && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-acid/30 bg-acid/5 px-6 py-6">
          <div className="max-w-lg">
            <p className="font-display text-xl font-semibold">{t("Esquisses.unlockTitle")}</p>
            <p className="mt-1 text-sm text-muted">
              {payment === "off" ? t("Esquisses.unlockOff") : t("Esquisses.unlockText", price)}
            </p>
          </div>
          {payment !== "off" && (
            <button
              type="button"
              onClick={unlock}
              disabled={unlockStatus === "paying" || unlockStatus === "verifying"}
              className={
                payment === "dev"
                  ? "rounded-full border border-dashed border-amber-300/60 px-5 py-3 text-sm font-semibold text-amber-200 transition hover:bg-amber-300/10 disabled:opacity-60"
                  : "rounded-full bg-acid px-6 py-3 font-semibold text-void transition hover:bg-white disabled:opacity-60"
              }
            >
              {payment === "dev" ? t("Esquisses.unlockDev") : t("Esquisses.unlockButton", price)}
            </button>
          )}
        </div>
      )}
      {unlockStatus === "error" && (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {t("Esquisses.unlockError")}
        </p>
      )}
      {unlockStatus === "done" && (
        <p role="status" className="mt-4 text-sm text-acid">
          {t("Esquisses.unlocked")}
        </p>
      )}

      {/* Paiement Stripe */}
      <dialog
        ref={payDialog}
        onClose={() => {
          closeCheckout();
          setUnlockStatus((s) => (s === "paying" ? "idle" : s));
        }}
        aria-label={t("Esquisses.checkout.title")}
        className="m-auto max-h-[92vh] w-[min(560px,94vw)] max-w-none overflow-y-auto rounded-2xl border border-white/15 bg-white p-0 text-void backdrop:bg-black/80"
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-3">
          <p className="font-display font-semibold">{t("Esquisses.checkout.title")}</p>
          <button
            type="button"
            onClick={() => payDialog.current?.close()}
            className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold transition hover:border-black/40"
          >
            {t("Esquisses.close")} ✕
          </button>
        </div>
        <div ref={checkoutBox} className="min-h-80 py-4" />
      </dialog>

      {/* Esquisse en grand */}
      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        className="m-auto h-[90vh] w-[min(1280px,94vw)] max-w-none overflow-hidden rounded-2xl border border-white/15 bg-void p-0 text-fog backdrop:bg-black/80"
      >
        {open && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <p className="font-display font-semibold">{name(open)}</p>
              <button type="button" onClick={() => dialog.current?.close()} className={ghost}>
                {t("Esquisses.close")} ✕
              </button>
            </div>
            <iframe
              title={t("Esquisses.frameTitle", { name: name(open) })}
              srcDoc={html(open)}
              sandbox=""
              className="w-full flex-1 border-0 bg-white"
            />
          </div>
        )}
      </dialog>
    </div>
  );
}
