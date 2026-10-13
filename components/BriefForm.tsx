"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import VisualsUpload from "@/components/VisualsUpload";
import { briefSteps, emptyBrief, options, validateStep, type BriefDraft, type Field, type Step } from "@/lib/brief";
import { briefSamples } from "@/lib/brief-samples";
import type { PreviewImage } from "@/lib/previews/shared";
import { profile } from "@/lib/site";

type FieldCopy = { label: string; hint?: string; placeholder?: string; options?: Record<string, string> };
type Status = "idle" | "sending" | "success" | "error";

const DRAFT_KEY = "brief-draft";

const input =
  "w-full rounded-xl border border-white/10 bg-raised/70 px-4 py-3 text-fog placeholder:text-muted/60 transition outline-none focus:border-acid aria-invalid:border-red-400/70";
const chip =
  "cursor-pointer rounded-full border border-white/10 px-4 py-2 text-sm text-muted transition select-none hover:border-white/30 hover:text-fog has-checked:border-acid has-checked:bg-acid has-checked:text-void has-focus-visible:outline-2 has-focus-visible:outline-acid";

export default function BriefForm({
  homeHref,
  withPreview,
  devFill,
}: {
  homeHref: string;
  withPreview: boolean;
  devFill: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const copy = t.raw("Brief.fields") as Record<string, FieldCopy>;
  const stepTitles = t.raw("Brief.steps") as Record<string, string>;
  const errorCopy = t.raw("Brief.errors") as Record<string, string>;

  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<BriefDraft>(emptyBrief);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  // Visuels de l'étape Esquisses : trop lourds pour le brouillon en sessionStorage
  const [images, setImages] = useState<PreviewImage[]>([]);
  // Le serveur a lancé la préparation des esquisses : le message de fin l'annonce
  const [sketches, setSketches] = useState(false);
  const steps = useMemo(() => briefSteps(withPreview), [withPreview]);
  const [filled, setFilled] = useState<Record<string, boolean>>({});
  const startedAt = useRef(0);
  const honeypot = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  // Reprend un brouillon éventuel et note l'heure de début (anti-spam)
  useEffect(() => {
    startedAt.current = Date.now();
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restauration ponctuelle au montage
      if (saved) setDraft({ ...emptyBrief, ...JSON.parse(saved) });
    } catch {}
  }, []);

  const update = (name: string, value: BriefDraft[string]) => {
    setDraft((d) => {
      const next = { ...d, [name]: value };
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setErrors((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  // Outil de test (hors production) : remplit ou vide les champs de l'étape avec un exemple
  const fillStep = (target: Step, on: boolean) => {
    const sample = briefSamples[locale === "en" ? "en" : "fr"];
    for (const f of target.fields) if (f.name in sample) update(f.name, on ? sample[f.name] : emptyBrief[f.name]);
    setFilled((current) => ({ ...current, [target.id]: on }));
  };

  const goTo = (i: number) => {
    // L'adresse du site actuel, déjà donnée plus tôt, sert de point de départ à l'aperçu
    if (steps[i].id === "preview" && !draft.previewUrl && draft.currentUrl) update("previewUrl", draft.currentUrl);
    setStepIndex(i);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Valide l'étape courante ; en cas d'erreur, place le focus sur le premier champ fautif
  const checkStep = () => {
    const stepErrors = validateStep(step, draft);
    setErrors(stepErrors);
    const first = step.fields.find((f) => stepErrors[f.name]);
    if (first) document.getElementById(`field-${first.name}`)?.focus();
    return !first;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkStep()) return;
    if (!isLast) return goTo(stepIndex + 1);

    setStatus("sending");
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          ...(images.length ? { images } : {}),
          website: honeypot.current?.value ?? "",
          startedAt: startedAt.current,
          locale,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSketches(Boolean(((await res.json()) as { esquisses?: boolean }).esquisses));
      setStatus("success");
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {}
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div role="status" className="rounded-3xl border border-acid/40 bg-surface p-8 sm:p-12">
        <p className="font-serif text-6xl text-acid italic">✓</p>
        <h2 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">{t("Brief.success.title")}</h2>
        <p className="mt-3 max-w-lg text-muted">
          {sketches ? t("Brief.success.textSketches") : t("Brief.success.text")}
        </p>
        <a
          href={homeHref}
          className="mt-8 inline-flex rounded-full bg-acid px-6 py-3 font-semibold text-void transition hover:bg-white"
        >
          {t("Brief.success.back")}
        </a>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="scroll-mt-28">
      {/* Progression */}
      <div className="mb-10">
        <p className="font-mono text-sm text-muted" aria-live="polite">
          {t("Brief.stepOf", { current: stepIndex + 1, total: steps.length })} · {stepTitles[step.id]}
        </p>
        <ol className="mt-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
          {steps.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                disabled={i > stepIndex}
                onClick={() => goTo(i)}
                aria-current={i === stepIndex ? "step" : undefined}
                className="group w-full text-left disabled:cursor-default"
              >
                <span
                  className={`block h-1 rounded-full transition-colors duration-500 ${i <= stepIndex ? "bg-acid" : "bg-white/10"}`}
                />
                <span
                  className={`mt-2 hidden text-xs sm:block ${i === stepIndex ? "text-fog" : "text-muted group-enabled:group-hover:text-fog"}`}
                >
                  {stepTitles[s.id]}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {devFill && (
        <label className="mb-8 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-amber-300/40 bg-amber-300/5 px-4 py-3 font-mono text-xs text-amber-100/90">
          <input
            type="checkbox"
            checked={!!filled[step.id]}
            onChange={(e) => fillStep(step, e.target.checked)}
            className="h-4 w-4 accent-amber-300"
          />
          DEV · remplir cette étape avec un exemple
        </label>
      )}

      <fieldset key={step.id} className="space-y-8">
        <legend className="sr-only">{stepTitles[step.id]}</legend>
        {step.fields.map((field) =>
          field.kind === "studio" ? (
            <VisualsUpload key={field.name} images={images} setImages={setImages} />
          ) : field.name === "currentUrl" && draft.hasWebsite !== "yes" ? null : (
            <FieldControl
              key={field.name}
              field={field}
              copy={copy[field.name]}
              value={draft[field.name]}
              error={errors[field.name] && errorCopy[errors[field.name]]}
              onChange={(v) => update(field.name, v)}
            />
          ),
        )}
      </fieldset>

      {/* Champ piège pour les bots : invisible et ignoré par les lecteurs d'écran */}
      <input
        ref={honeypot}
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px opacity-0"
      />

      {status === "error" && (
        <p role="alert" className="mt-8 rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm">
          {t("Brief.errors.server", { email: profile.email })}
        </p>
      )}

      <div className="mt-12 flex items-center justify-between gap-4 border-t border-white/10 pt-8">
        {stepIndex > 0 ? (
          <button
            type="button"
            onClick={() => goTo(stepIndex - 1)}
            className="rounded-full border border-white/20 px-6 py-3 font-semibold transition hover:border-fog"
          >
            ← {t("Brief.previous")}
          </button>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-full bg-acid px-7 py-3 font-semibold text-void transition hover:bg-white disabled:opacity-60"
        >
          {status === "sending" ? t("Brief.sending") : isLast ? t("Brief.submit") : `${t("Brief.next")} →`}
        </button>
      </div>
    </form>
  );
}

function FieldControl({
  field,
  copy,
  value,
  error,
  onChange,
}: {
  field: Field;
  copy: FieldCopy;
  value: BriefDraft[string];
  error?: string;
  onChange: (value: BriefDraft[string]) => void;
}) {
  const id = `field-${field.name}`;
  const describedBy = [copy.hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const label = (
    <>
      {copy.label}
      {field.required && <span className="text-acid"> *</span>}
    </>
  );
  const hint = copy.hint && (
    <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
      {copy.hint}
    </p>
  );
  const errorText = error && (
    <p id={`${id}-error`} className="mt-2 text-sm text-red-300">
      {error}
    </p>
  );

  if (field.kind === "consent") {
    return (
      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-muted">
          <input
            id={id}
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className="mt-0.5 h-5 w-5 shrink-0 accent-acid"
          />
          <span>{label}</span>
        </label>
        {errorText}
      </div>
    );
  }

  if (field.kind === "radio" || field.kind === "checkboxes") {
    const multiple = field.kind === "checkboxes";
    const selected = multiple ? (value as string[]) : [value as string];
    const toggle = (opt: string) =>
      multiple
        ? onChange(selected.includes(opt) ? selected.filter((v) => v !== opt) : [...selected, opt])
        : onChange(opt);

    return (
      <fieldset aria-describedby={describedBy} aria-invalid={!!error}>
        <legend className="mb-3 font-medium">{label}</legend>
        {hint}
        <div className="flex flex-wrap gap-2">
          {options[field.name].map((opt, i) => (
            <label key={opt} className={chip}>
              <input
                id={i === 0 ? id : undefined}
                type={multiple ? "checkbox" : "radio"}
                name={field.name}
                value={opt}
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="sr-only"
              />
              {copy.options?.[opt] ?? opt}
            </label>
          ))}
        </div>
        {errorText}
      </fieldset>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-medium">
        {label}
      </label>
      {hint && <div className="-mt-1 mb-3">{hint}</div>}
      {field.kind === "textarea" ? (
        <textarea
          id={id}
          rows={5}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={copy.placeholder}
          required={field.required}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`${input} resize-y`}
        />
      ) : (
        <input
          id={id}
          type={field.kind}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={copy.placeholder}
          required={field.required}
          autoComplete={"autoComplete" in field ? field.autoComplete : undefined}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={input}
        />
      )}
      {errorText}
    </div>
  );
}
