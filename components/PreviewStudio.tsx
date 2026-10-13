"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { BriefDraft } from "@/lib/brief";
import type { StripeEmbeddedCheckout } from "@stripe/stripe-js";
import {
  fillImages,
  MAX_IMAGE_CHARS,
  MAX_IMAGES,
  UNLOCK_PRICE_EUR,
  type PaymentMode,
  type Preview,
  type PreviewImage,
} from "@/lib/previews/shared";

type Status = "idle" | "loading" | "done" | "error" | "rateLimited";
type UnlockStatus = "idle" | "paying" | "verifying" | "done" | "error";

const chip =
  "cursor-pointer rounded-full border border-white/10 px-4 py-2 text-sm text-muted transition select-none hover:border-white/30 hover:text-fog has-checked:border-acid has-checked:bg-acid has-checked:text-void has-focus-visible:outline-2 has-focus-visible:outline-acid";
const ghost = "rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold transition hover:border-fog";

// Réduit l'image dans le navigateur avant envoi : les requêtes restent légères
async function compress(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  for (const [max, quality] of [
    [1400, 0.82],
    [1000, 0.7],
    [700, 0.6],
  ]) {
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL("image/webp", quality);
    if (url.length <= MAX_IMAGE_CHARS) return url; // PNG si le navigateur ne sait pas encoder en WebP
  }
  throw new Error("too_large");
}

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
        style={{ width: 1280, height: 1600, transform: `scale(${scale})`, filter: locked ? "blur(14px)" : undefined }}
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

export default function PreviewStudio({
  draft,
  update,
  images,
  setImages,
  previews,
  setPreviews,
  session,
  setSession,
  paid,
  setPaid,
  payment,
}: {
  draft: BriefDraft;
  update: (name: string, value: BriefDraft[string]) => void;
  images: PreviewImage[];
  setImages: (images: PreviewImage[]) => void;
  previews: Preview[];
  setPreviews: (previews: Preview[]) => void;
  /** Identifiant des pistes stockées côté serveur */
  session: string;
  setSession: (session: string) => void;
  paid: boolean;
  setPaid: (paid: boolean) => void;
  payment: PaymentMode;
}) {
  const t = useTranslations();
  const steps = t.raw("Brief.studio.generating") as string[];
  const [status, setStatus] = useState<Status>(previews.length ? "done" : "idle");
  const [mode, setMode] = useState("");
  const [uploadError, setUploadError] = useState(false);
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState<Preview | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [unlockStatus, setUnlockStatus] = useState<UnlockStatus>("idle");
  const payDialog = useRef<HTMLDialogElement>(null);
  const checkoutBox = useRef<HTMLDivElement>(null);
  const checkout = useRef<StripeEmbeddedCheckout | null>(null);
  const price = { price: UNLOCK_PRICE_EUR };

  // Messages d'attente qui se succèdent pendant la génération
  useEffect(() => {
    if (status !== "loading") return;
    const id = setInterval(() => setTick((n) => n + 1), 3500);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    setUploadError(false);
    const room = MAX_IMAGES - images.length;
    const added: PreviewImage[] = [];
    for (const file of [...files].filter((f) => f.type.startsWith("image/")).slice(0, room)) {
      try {
        added.push({ name: file.name.slice(0, 120), dataUrl: await compress(file) });
      } catch {
        setUploadError(true);
      }
    }
    setImages([...images, ...added]);
  };

  const generate = async () => {
    setStatus("loading");
    setTick(0);
    try {
      const res = await fetch("/api/brief/previews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: document.documentElement.lang === "en" ? "en" : "fr",
          url: draft.previewUrl,
          prompt: draft.previewPrompt,
          name: draft.name,
          company: draft.company,
          projectType: draft.projectType,
          description: draft.description,
          audience: draft.audience,
          goals: draft.goals,
          features: draft.features,
          images,
          previous: session || undefined,
        }),
      });
      if (res.status === 429) return setStatus("rateLimited");
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { mode: string; session: string; paid: boolean; previews: Preview[] };
      setMode(data.mode);
      setSession(data.session);
      setPaid(data.paid);
      setPreviews(data.previews);
      setUnlockStatus("idle");
      update("previewFavorite", "");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  // Le serveur vérifie le paiement auprès de Stripe avant de rendre les pistes complètes
  const verify = async () => {
    setUnlockStatus("verifying");
    try {
      const res = await fetch("/api/brief/previews/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { previews: Preview[] };
      setPreviews(data.previews);
      setPaid(true);
      setUnlockStatus("done");
    } catch {
      setUnlockStatus("error");
    }
  };

  const closeCheckout = () => {
    checkout.current?.destroy();
    checkout.current = null;
  };

  // Stripe Checkout intégré dans une fenêtre : le brief en cours reste à l'écran
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
          const res = await fetch("/api/brief/previews/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session, locale: document.documentElement.lang === "en" ? "en" : "fr" }),
          });
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

  const locked = previews.some((p) => p.locked);
  const name = (p: Preview) => t(`Brief.studio.directions.${p.direction}`);

  return (
    <div className="space-y-8">
      <p className="rounded-2xl border border-acid/25 bg-acid/5 px-5 py-4 text-sm text-fog/90">
        {t("Brief.studio.intro")}
      </p>

      {/* Visuels du client */}
      <div>
        <p className="mb-1 font-medium">{t("Brief.studio.uploadLabel")}</p>
        <p className="mb-3 text-sm text-muted">{t("Brief.studio.uploadHint", { max: MAX_IMAGES })}</p>
        <div className="flex flex-wrap items-center gap-3">
          {images.map((img, i) => (
            <div
              key={`${img.name}-${i}`}
              className="group relative h-20 w-20 overflow-hidden rounded-xl border border-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local en data URL */}
              <img src={img.dataUrl} alt={img.name} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setImages(images.filter((_, j) => j !== i))}
                aria-label={t("Brief.studio.remove", { name: img.name })}
                className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-void/80 text-xs transition hover:bg-red-500"
              >
                ✕
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <label className={`${ghost} cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-acid`}>
              + {t("Brief.studio.uploadButton")}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                className="sr-only"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
        {uploadError && <p className="mt-2 text-sm text-red-300">{t("Brief.studio.uploadError")}</p>}
      </div>

      {/* Génération */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={generate}
          disabled={status === "loading"}
          className="rounded-full bg-acid px-6 py-3 font-semibold text-void transition hover:bg-white disabled:opacity-60"
        >
          ✳ {previews.length ? t("Brief.studio.regenerate") : t("Brief.studio.generate")}
        </button>
        {status === "loading" && (
          <p className="font-mono text-sm text-acid" aria-live="polite">
            {steps[tick % steps.length]}
          </p>
        )}
      </div>
      {status === "error" && (
        <p role="alert" className="text-sm text-red-300">
          {t("Brief.studio.error")}
        </p>
      )}
      {status === "rateLimited" && (
        <p role="alert" className="text-sm text-red-300">
          {t("Brief.studio.rateLimited")}
        </p>
      )}

      {status === "loading" && (
        <div className="grid gap-4 sm:grid-cols-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
          ))}
        </div>
      )}

      {/* Les trois pistes */}
      {status !== "loading" && previews.length > 0 && (
        <div className="space-y-8">
          {mode === "demo" && <p className="font-mono text-xs text-muted">{t("Brief.studio.demoNote")}</p>}
          <ul className="grid gap-4 sm:grid-cols-3">
            {previews.map((p, i) => (
              <li key={p.id} className="overflow-hidden rounded-2xl border border-white/10 bg-surface">
                <Frame
                  html={fillImages(p.html, images)}
                  title={p.locked ? t("Brief.studio.locked") : t("Brief.studio.frameTitle", { name: name(p) })}
                  locked={p.locked}
                />
                <div className="flex flex-col items-start gap-3 p-4">
                  <div>
                    <p className="font-mono text-xs text-acid">{t("Brief.studio.piste", { n: i + 1 })}</p>
                    <p className="font-display text-lg font-semibold">{name(p)}</p>
                    <p className="text-xs text-muted">{t(`Brief.studio.directionHints.${p.direction}`)}</p>
                  </div>
                  {!p.locked && (
                    <button
                      type="button"
                      onClick={() => setOpen(p)}
                      className="text-sm text-muted transition hover:text-acid"
                    >
                      {t("Brief.studio.open")} ↗
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Déblocage des pistes 2 et 3 */}
          {locked && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-acid/30 bg-acid/5 px-5 py-5">
              <div className="max-w-md">
                <p className="font-display text-lg font-semibold">{t("Brief.studio.unlockTitle")}</p>
                <p className="mt-1 text-sm text-muted">
                  {payment === "off" ? t("Brief.studio.unlockOff") : t("Brief.studio.unlockText", price)}
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
                  {payment === "dev" ? t("Brief.studio.unlockDev") : t("Brief.studio.unlockButton", price)}
                </button>
              )}
            </div>
          )}
          {unlockStatus === "error" && (
            <p role="alert" className="text-sm text-red-300">
              {t("Brief.studio.unlockError")}
            </p>
          )}
          {unlockStatus === "done" && paid && (
            <p role="status" className="text-sm text-acid">
              {t("Brief.studio.unlocked")}
            </p>
          )}

          <fieldset>
            <legend className="mb-3 font-medium">{t("Brief.studio.ratingLabel")}</legend>
            <div className="flex flex-wrap gap-2">
              {Object.entries(t.raw("Brief.studio.ratingValues") as Record<string, string>).map(([value, label]) => (
                <label key={value} className={chip}>
                  <input
                    type="radio"
                    name="previewRating"
                    value={value}
                    checked={draft.previewRating === value}
                    onChange={() => update("previewRating", value)}
                    className="sr-only"
                  />
                  {"★".repeat(Number(value))} {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 font-medium">{t("Brief.studio.favoriteLabel")}</legend>
            <div className="flex flex-wrap gap-2">
              {previews.map((p, i) =>
                p.locked ? null : (
                  <label key={p.id} className={chip}>
                    <input
                      type="radio"
                      name="previewFavorite"
                      value={p.id}
                      checked={draft.previewFavorite === p.id}
                      onChange={() => update("previewFavorite", p.id)}
                      className="sr-only"
                    />
                    {t("Brief.studio.piste", { n: i + 1 })} · {name(p)}
                  </label>
                ),
              )}
            </div>
          </fieldset>

          <div>
            <label htmlFor="field-previewComment" className="mb-2 block font-medium">
              {t("Brief.studio.commentLabel")}
            </label>
            <textarea
              id="field-previewComment"
              rows={3}
              value={draft.previewComment as string}
              onChange={(e) => update("previewComment", e.target.value)}
              placeholder={t("Brief.studio.commentPlaceholder")}
              className="w-full resize-y rounded-xl border border-white/10 bg-raised/70 px-4 py-3 text-fog transition outline-none placeholder:text-muted/60 focus:border-acid"
            />
          </div>
          <p className="text-sm text-muted">{t("Brief.studio.emailNote")}</p>
        </div>
      )}

      {/* Paiement Stripe */}
      <dialog
        ref={payDialog}
        onClose={() => {
          closeCheckout();
          setUnlockStatus((s) => (s === "paying" ? "idle" : s));
        }}
        aria-label={t("Brief.studio.checkout.title")}
        className="m-auto max-h-[92vh] w-[min(560px,94vw)] max-w-none overflow-y-auto rounded-2xl border border-white/15 bg-white p-0 text-void backdrop:bg-black/80"
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-3">
          <p className="font-display font-semibold">{t("Brief.studio.checkout.title")}</p>
          <button
            type="button"
            onClick={() => payDialog.current?.close()}
            className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold transition hover:border-black/40"
          >
            {t("Brief.studio.close")} ✕
          </button>
        </div>
        <div ref={checkoutBox} className="min-h-80 py-4" />
      </dialog>

      {/* Piste en grand */}
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
                {t("Brief.studio.close")} ✕
              </button>
            </div>
            <iframe
              title={t("Brief.studio.frameTitle", { name: name(open) })}
              srcDoc={fillImages(open.html, images)}
              sandbox=""
              className="w-full flex-1 border-0 bg-white"
            />
          </div>
        )}
      </dialog>
    </div>
  );
}
