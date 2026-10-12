import { useTranslations } from "next-intl";

const tools = ["Claude Code", "Codex", "Cursor", "Copilot", "Agents", "Skills", "MCP"];
const card = "spotlight relative overflow-hidden rounded-3xl border border-white/10 bg-surface p-7 sm:p-10";
const cardTitle = "font-display text-2xl font-semibold tracking-tight sm:text-3xl";

// Puce verte, reprise dans toutes les listes de la section
function Dash() {
  return <span className="mt-[0.6em] h-px w-3 shrink-0 bg-acid" />;
}

// Section IA : ce que les outils changent pour le client, l'offre de suivi
// et l'IA intégrée au produit. Le terminal s'écrit au scroll (lib/interactions.ts).
export default function AiSection({ head }: { head: React.ReactNode }) {
  const t = useTranslations();
  const terminal = t.raw("AI.terminal") as string[];
  const stats = t.raw("AI.report.stats") as { value: string; label: string; delta: string }[];

  return (
    <section id="ia" className="relative mx-auto max-w-[1400px] px-4 pb-28 sm:px-8 sm:pb-40">
      <div className="pointer-events-none absolute top-40 -left-40 h-96 w-96 rounded-full bg-violet/15 blur-[120px]" />
      {head}

      <div className="relative grid gap-6 lg:grid-cols-6">
        {/* Livré plus vite, avec le terminal d'un agent */}
        <article data-reveal className={`${card} grid gap-10 lg:col-span-6 lg:grid-cols-2 lg:items-center`}>
          <div>
            <h3 className={cardTitle}>{t("AI.speed.title")}</h3>
            <p className="mt-4 text-muted sm:text-lg">{t("AI.speed.text")}</p>
            <p className="mt-6 flex gap-3 text-sm text-fog">
              <Dash />
              {t("AI.speed.note")}
            </p>
            <p className="mt-10 font-mono text-xs tracking-wider text-muted uppercase">{t("AI.toolsLabel")}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {tools.map((tool) => (
                <li
                  key={tool}
                  className="rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-fog transition hover:border-acid hover:text-acid"
                >
                  {tool}
                </li>
              ))}
            </ul>
          </div>
          <div
            aria-hidden="true"
            className="overflow-hidden rounded-2xl border border-white/10 bg-void shadow-2xl shadow-black/50"
          >
            <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="ml-3 font-mono text-[11px] text-white/40">~/projet-client</span>
            </div>
            <ol
              data-type-lines
              className="space-y-3 p-5 font-mono text-[13px] leading-relaxed whitespace-pre sm:p-7 sm:text-sm"
            >
              {terminal.map((line, i) => (
                <li
                  key={line}
                  className={i === 0 ? "text-fog" : i === terminal.length - 1 ? "text-acid" : "text-muted"}
                >
                  {line}
                  {i === terminal.length - 1 && <span className="terminal-caret" />}
                </li>
              ))}
            </ol>
          </div>
        </article>

        {(["tests", "budget"] as const).map((k, i) => (
          <article key={k} data-reveal className={`${card} lg:col-span-3`}>
            <span className="font-serif text-6xl leading-none text-acid italic">{i === 0 ? "+" : "€"}</span>
            <h3 className={`${cardTitle} mt-8`}>{t(`AI.${k}.title`)}</h3>
            <p className="mt-4 text-muted">{t(`AI.${k}.text`)}</p>
          </article>
        ))}

        {/* Offre de suivi, avec un exemple de rapport mensuel */}
        <article
          data-reveal
          className={`${card} grid gap-10 border-acid/25 lg:col-span-6 lg:grid-cols-[1fr_1.1fr] lg:items-center`}
        >
          <div className="pointer-events-none absolute -right-20 -bottom-40 -z-10 h-96 w-96 rounded-full bg-acid/10 blur-[110px]" />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-acid px-3 py-1 font-mono text-xs font-medium text-void">
                {t("AI.followup.badge")}
              </span>
              <span className="font-mono text-xs text-muted">{t("AI.followup.price")}</span>
            </div>
            <h3 className={`${cardTitle} mt-6`}>{t("AI.followup.title")}</h3>
            <p className="mt-4 text-muted sm:text-lg">{t("AI.followup.text")}</p>
            <ul className="mt-6 space-y-3 text-sm text-fog/90 sm:text-base">
              {(t.raw("AI.followup.items") as string[]).map((item) => (
                <li key={item} className="flex gap-3">
                  <Dash />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="#contact"
              data-magnetic
              className="mt-8 inline-flex rounded-full bg-acid px-6 py-3 font-semibold text-void transition hover:bg-white"
            >
              {t("AI.followup.cta")}
            </a>
          </div>

          <figure className="rounded-2xl border border-white/10 bg-void p-5 shadow-2xl shadow-black/50 sm:p-7">
            <figcaption className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <span>
                <span className="block font-mono text-[11px] text-muted">{t("AI.report.from")}</span>
                <span className="mt-1 block font-display text-lg font-semibold">{t("AI.report.subject")}</span>
              </span>
              <span className="shrink-0 rounded-full border border-white/15 px-2.5 py-1 font-mono text-[10px] text-muted uppercase">
                {t("AI.report.tag")}
              </span>
            </figcaption>
            <dl className="grid grid-cols-3 gap-3 py-5">
              {stats.map((s) => (
                <div key={s.label} className="rounded-xl bg-white/[0.03] p-3">
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{s.value}</dd>
                  <dd className="mt-1 flex flex-wrap items-baseline justify-between gap-x-2 text-[11px] text-muted">
                    {s.label}
                    <span className="font-mono text-acid">{s.delta}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="font-mono text-[11px] tracking-wider text-muted uppercase">{t("AI.report.summaryTitle")}</p>
            <p className="mt-2 text-sm text-fog/90">{t("AI.report.summary")}</p>
            <p className="mt-5 font-mono text-[11px] tracking-wider text-muted uppercase">
              {t("AI.report.actionsTitle")}
            </p>
            <ol className="mt-2 space-y-1.5 text-sm text-fog/90">
              {(t.raw("AI.report.actions") as string[]).map((a, i) => (
                <li key={a} className="flex gap-3">
                  <span className="font-mono text-acid">{i + 1}.</span>
                  {a}
                </li>
              ))}
            </ol>
            <p className="mt-5 flex gap-3 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-xs text-amber-100/90">
              <span className="relative mt-1 flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-300" />
              </span>
              {t("AI.report.alert")}
            </p>
          </figure>
        </article>

        {/* L'IA intégrée au produit du client */}
        <article data-reveal className={`${card} grid gap-8 lg:col-span-6 lg:grid-cols-2`}>
          <div>
            <h3 className={cardTitle}>{t("AI.product.title")}</h3>
            <p className="mt-4 text-muted sm:text-lg">{t("AI.product.text")}</p>
          </div>
          <ul className="border-t border-white/10">
            {(t.raw("AI.product.items") as string[]).map((item, i) => (
              <li
                key={item}
                className="group flex items-baseline gap-5 border-b border-white/10 py-4 transition-all duration-500 hover:pl-3"
              >
                <span className="font-mono text-xs text-muted transition group-hover:text-acid">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-lg font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
