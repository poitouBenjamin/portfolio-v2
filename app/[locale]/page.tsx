import { notFound } from "next/navigation";
import { hasLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import HeroScene from "@/components/HeroScene";
import SkillsCarousel from "@/components/SkillsCarousel";
import { localePath, routing } from "@/i18n/routing";
import { profile, projects, skills } from "@/lib/site";

const tel = `tel:${profile.phone.replace(/\s/g, "")}`;
const mail = `mailto:${profile.email}`;
// Une ambiance de couleur par projet, faute de captures d'écran
const covers = [
  "radial-gradient(60% 80% at 20% 30%, #8b6cff 0%, transparent 60%), radial-gradient(50% 70% at 80% 70%, #ff6ba8 0%, transparent 60%), #120d1f",
  "radial-gradient(60% 80% at 75% 25%, #ff5a36 0%, transparent 60%), radial-gradient(50% 60% at 20% 80%, #ffb03a 0%, transparent 60%), #1a0c08",
  "radial-gradient(60% 80% at 30% 70%, #2bd2ff 0%, transparent 60%), radial-gradient(50% 60% at 80% 20%, #3b5bff 0%, transparent 60%), #07121c",
  "radial-gradient(60% 80% at 70% 70%, #c8ff4d 0%, transparent 55%), radial-gradient(50% 60% at 20% 20%, #1fd39a 0%, transparent 60%), #0b140a",
];
const pad = (n: number) => String(n).padStart(2, "0");

const btnPrimary = "rounded-full bg-acid px-7 py-4 font-semibold text-void transition hover:bg-white";
const btnGhost =
  "rounded-full border border-white/20 px-7 py-4 font-semibold transition hover:border-fog hover:bg-white/5";
const sectionTitle = "font-display text-5xl leading-[0.95] font-bold tracking-[-0.04em] sm:text-7xl";
const serifAccent = "font-serif font-normal tracking-normal";

function SectionHead({
  label,
  children,
  accent,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div data-reveal className="mb-16 grid gap-6 sm:mb-24 md:grid-cols-[1fr_2fr]">
      <p className={`pt-3 font-mono text-sm ${accent ? "text-acid" : "text-muted"}`}>{label}</p>
      <div>{children}</div>
    </div>
  );
}

// Libellé façon balise HTML pour la section développeurs
function CodeTag({ name, closing }: { name: string; closing?: boolean }) {
  return (
    <span className="text-muted">
      &lt;{closing && "/"}
      <span className="text-acid">{name}</span>&gt;
    </span>
  );
}

export default function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = useTranslations();

  const otherLocale = routing.locales.find((l) => l !== locale)!;
  const otherHref = localePath(otherLocale);

  const nav = [
    [t("Nav.services"), "#services"],
    [t("Nav.projects"), "#projets"],
    [t("Nav.method"), "#methode"],
    [t("Nav.about"), "#a-propos"],
    [t("Nav.stack"), "#devs"],
  ];
  const marquee = t.raw("Marquee") as string[];
  const services = t.raw("Services.items") as { title: string; text: string }[];
  const method = t.raw("Method.items") as { title: string; text: string }[];
  const bioWords = t("About.bio").split(" ");
  const categories = skills.map((c) => ({ ...c, title: t(`Devs.categories.${c.id}`) }));

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-void via-void/70 to-transparent">
        {/* 3 colonnes : la nav reste centrée quelle que soit la largeur des actions */}
        <div className="mx-auto flex h-18 max-w-[1400px] items-center justify-end gap-6 px-4 sm:px-8 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          <nav className="col-start-2 hidden items-center gap-1 rounded-full border border-white/10 bg-void/60 p-1 text-sm backdrop-blur-md lg:flex">
            {nav.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-4 py-2 text-muted transition hover:bg-white/5 hover:text-fog"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="col-start-3 flex items-center justify-end gap-2">
            <a
              href={otherHref}
              hrefLang={otherLocale}
              lang={otherLocale}
              aria-label={t("Nav.switchLocale")}
              title={t("Nav.switchLocale")}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 font-mono text-xs font-medium uppercase transition hover:border-acid hover:text-acid"
            >
              {otherLocale}
            </a>
            <a
              href="#contact"
              data-magnetic
              className="rounded-full bg-acid px-5 py-2.5 text-sm font-semibold text-void transition hover:bg-white"
            >
              {t("Nav.contact")}
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden pb-10 sm:pb-14">
          <HeroScene />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-void via-void/70 to-transparent" />

          <div className="relative mx-auto w-full max-w-[1400px] px-4 sm:px-8">
            <p
              data-hero-fade
              className="mb-6 flex items-center gap-3 font-mono text-xs tracking-[0.2em] text-muted uppercase sm:text-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-acid opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-acid" />
              </span>
              {t("Profile.title")} — {t("Profile.city")}
            </p>
            <h1
              className="font-display text-[clamp(2.9rem,8.6vw,9rem)] leading-[0.92] font-bold tracking-[-0.04em]"
              aria-label={t("Metadata.description")}
            >
              <span data-hero-line className="line-mask">
                <span>{t("Hero.line1")}</span>
              </span>
              <span data-hero-line className="line-mask">
                <span>
                  <em className={`${serifAccent} text-acid`}>{t("Hero.line2Accent")}</em> {t("Hero.line2")}
                </span>
              </span>
              <span data-hero-line className="line-mask">
                <span>{t("Hero.line3")}</span>
              </span>
            </h1>
          </div>
        </section>

        {/* Bandeau */}
        <div className="overflow-hidden border-y border-white/10 bg-surface py-5" aria-hidden="true">
          <div className="marquee">
            {[0, 1].map((k) => (
              <div key={k} className="flex shrink-0 items-center">
                {marquee.map((m) => (
                  <span
                    key={m}
                    className="flex items-center font-display text-2xl font-semibold tracking-tight sm:text-4xl"
                  >
                    <span className="px-8">{m}</span>
                    <span className="text-acid">✳</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <section id="services" className="mx-auto max-w-[1400px] px-4 py-28 sm:px-8 sm:py-40">
          <SectionHead label={t("Services.label")}>
            <h2 className={sectionTitle}>
              {t("Services.title")} <em className={serifAccent}>{t("Services.titleAccent")}</em>
            </h2>
          </SectionHead>
          <ul className="border-t border-white/10">
            {services.map((s, i) => (
              <li key={s.title} data-reveal className="group border-b border-white/10">
                <div className="grid gap-3 py-8 transition-all duration-500 group-hover:pl-4 sm:py-10 md:grid-cols-[1fr_2fr_1.2fr] md:items-center">
                  <span className="font-mono text-sm text-muted transition group-hover:text-acid">{pad(i + 1)}</span>
                  <h3 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">{s.title}</h3>
                  <p className="text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Projets */}
        <section id="projets" className="mx-auto max-w-[1400px] px-4 pb-28 sm:px-8 sm:pb-40">
          <SectionHead label={t("Projects.label")}>
            <h2 className={sectionTitle}>
              {t("Projects.title")} <em className={serifAccent}>{t("Projects.titleAccent")}</em>
            </h2>
          </SectionHead>
          <div className="grid gap-6 lg:grid-cols-2">
            {projects.map((p, i) => (
              <article
                key={p.id}
                data-reveal
                className="spotlight group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-surface transition-colors duration-500 hover:border-white/25"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <div
                    className="absolute inset-0 scale-110 blur-2xl transition-transform duration-[1.2s] ease-out group-hover:scale-125 group-hover:rotate-3"
                    style={{ background: covers[i % covers.length] }}
                  />
                  <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8">
                    <div className="flex items-start justify-between font-mono text-xs text-white/70">
                      <span>{pad(i + 1)}</span>
                      {p.ongoing && (
                        <span className="rounded-full border border-white/30 bg-black/20 px-3 py-1 backdrop-blur">
                          {t("Projects.ongoing")}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                      {t(`Projects.items.${p.id}.name`)}
                    </h3>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <p className="text-sm font-medium text-acid">{p.client}</p>
                  <p className="mt-3 text-fog/90">{t(`Projects.items.${p.id}.need`)}</p>
                  <ul className="mt-5 space-y-2 text-sm text-muted">
                    {(t.raw(`Projects.items.${p.id}.done`) as string[]).map((d) => (
                      <li key={d} className="flex gap-3">
                        <span className="mt-[0.55em] h-px w-3 shrink-0 bg-acid" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-8">
                    <ul className="flex flex-wrap gap-2">
                      {p.stack.map((s) => (
                        <li
                          key={s}
                          className="rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-muted"
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-2 text-sm font-medium transition hover:text-acid"
                      >
                        {p.urlLabel}
                        <span className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                          ↗
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Méthode */}
        <section id="methode" className="border-y border-white/10 bg-surface">
          <div className="mx-auto max-w-[1400px] px-4 py-28 sm:px-8 sm:py-40">
            <SectionHead label={t("Method.label")}>
              <h2 className={sectionTitle}>
                {t("Method.title")} <em className={serifAccent}>{t("Method.titleAccent")}</em>
              </h2>
            </SectionHead>
            <ol className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {method.map((m, i) => (
                <li key={m.title} data-reveal className="spotlight bg-surface p-8">
                  <span className="font-serif text-7xl text-acid italic">{i + 1}</span>
                  <h3 className="mt-6 font-display text-xl font-medium">{m.title}</h3>
                  <p className="mt-3 text-muted">{m.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* À propos */}
        <section id="a-propos" className="mx-auto max-w-[1400px] px-4 py-28 sm:px-8 sm:py-40">
          <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
            <div data-reveal>
              <p className="font-mono text-sm text-muted">{t("About.label")}</p>
              <dl className="mt-10 space-y-6">
                {[
                  [t("About.experience"), t("About.experienceValue", { years: profile.years })],
                  [t("About.education"), t("About.educationValue")],
                  [t("About.format"), t("About.formatValue")],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-mono text-xs text-muted uppercase">{k}</dt>
                    <dd className="mt-1 font-display text-2xl font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <p
              data-scrub-words
              className="font-display text-2xl leading-snug font-light tracking-tight sm:text-4xl sm:leading-tight"
            >
              {bioWords.map((w, i) => (
                <span key={i} className="w">
                  {w}{" "}
                </span>
              ))}
            </p>
          </div>
        </section>

        {/* Développeurs */}
        <section id="devs" className="relative overflow-hidden border-y border-white/10 bg-surface">
          <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-violet/20 blur-[120px]" />
          <div className="relative mx-auto max-w-[1400px] px-4 py-28 sm:px-8 sm:py-40">
            <SectionHead label={<CodeTag name={t("Devs.tag")} />} accent>
              <h2 className={sectionTitle}>
                {t("Devs.title")} <em className={serifAccent}>{t("Devs.titleAccent")}</em>
              </h2>
              <p className="mt-4 max-w-lg text-muted">{t("Devs.intro")}</p>
            </SectionHead>

            <SkillsCarousel
              categories={categories}
              labels={{
                carousel: t("Devs.carousel"),
                carouselRole: t("Devs.carouselRole"),
                previous: t("Devs.previous"),
                next: t("Devs.next"),
              }}
            />

            <div data-reveal className="mt-16 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <p className="font-mono text-sm whitespace-nowrap" aria-hidden="true">
                <CodeTag name={t("Devs.tag")} closing />
              </p>
              <a
                href={profile.github}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 font-mono text-xs whitespace-nowrap text-muted transition hover:text-acid"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                {t("Devs.github")}
              </a>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="relative overflow-hidden">
          <div className="pointer-events-none absolute -bottom-60 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-acid/15 blur-[140px]" />
          <div className="relative mx-auto max-w-[1400px] px-4 pt-28 pb-16 sm:px-8 sm:pt-40">
            <p data-reveal className="font-mono text-sm text-muted">
              {t("Contact.label")}
            </p>
            <h2
              data-reveal
              className="mt-6 font-display text-[clamp(3.5rem,13vw,13rem)] leading-[0.85] font-bold tracking-[-0.05em]"
            >
              {t("Contact.title")}
              <em className={`${serifAccent} text-acid`}>{t("Contact.titleAccent")}</em>
            </h2>
            <p data-reveal className="mt-8 max-w-xl text-lg text-muted">
              {t("Contact.intro")}
            </p>
            <a
              data-reveal
              href={localePath(locale, "/brief")}
              className="group mt-10 flex max-w-xl items-center justify-between gap-6 rounded-2xl border border-acid/30 bg-acid/5 px-6 py-5 transition hover:border-acid hover:bg-acid/10"
            >
              <span>
                <span className="block text-sm text-muted">{t("Contact.briefLead")}</span>
                <span className="font-display text-xl font-semibold">{t("Contact.brief")}</span>
              </span>
              <span className="text-2xl text-acid transition-transform group-hover:translate-x-1">→</span>
            </a>
            <div data-reveal className="mt-6 flex flex-wrap gap-3">
              <a href={tel} data-magnetic className={btnPrimary}>
                {profile.phone}
              </a>
              <a href={mail} data-magnetic className={btnGhost}>
                {profile.email}
              </a>
              <a href={profile.linkedin} target="_blank" rel="noopener" data-magnetic className={btnGhost}>
                LinkedIn ↗
              </a>
            </div>

            <footer className="mt-32 flex flex-wrap justify-between gap-4 border-t border-white/10 pt-8 font-mono text-xs text-muted">
              <p>
                © {new Date().getFullYear()} {profile.name}
              </p>
              <p>
                {t("Profile.title")} · {t("Profile.location")}
              </p>
              <a href="#top" className="transition hover:text-acid">
                {t("Footer.backToTop")}
              </a>
            </footer>
          </div>
        </section>
      </main>
    </>
  );
}
