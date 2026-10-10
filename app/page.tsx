import HeroScene from "@/components/HeroScene";
import SkillsCarousel from "@/components/SkillsCarousel";
import { profile, bio, services, projects, method, skills } from "@/lib/site";

const tel = `tel:${profile.phone.replace(/\s/g, "")}`;
const mail = `mailto:${profile.email}`;
const nav = [
  ["Services", "#services"],
  ["Projets", "#projets"],
  ["Méthode", "#methode"],
  ["À propos", "#a-propos"],
  ["Stack", "#devs"],
];
const marquee = ["Applications web", "API & back-end", "Refonte", "Maintenance", "Cartes interactives", "Performance"];
// Une ambiance de couleur par projet, faute de captures d'écran
const covers = [
  "radial-gradient(60% 80% at 20% 30%, #8b6cff 0%, transparent 60%), radial-gradient(50% 70% at 80% 70%, #ff6ba8 0%, transparent 60%), #120d1f",
  "radial-gradient(60% 80% at 75% 25%, #ff5a36 0%, transparent 60%), radial-gradient(50% 60% at 20% 80%, #ffb03a 0%, transparent 60%), #1a0c08",
  "radial-gradient(60% 80% at 30% 70%, #2bd2ff 0%, transparent 60%), radial-gradient(50% 60% at 80% 20%, #3b5bff 0%, transparent 60%), #07121c",
  "radial-gradient(60% 80% at 70% 70%, #c8ff4d 0%, transparent 55%), radial-gradient(50% 60% at 20% 20%, #1fd39a 0%, transparent 60%), #0b140a",
];
const bioWords = bio.join(" ").split(" ");
const pad = (n: number) => String(n).padStart(2, "0");

const btnPrimary = "rounded-full bg-acid px-7 py-4 font-semibold text-void transition hover:bg-white";
const btnGhost =
  "rounded-full border border-white/20 px-7 py-4 font-semibold transition hover:border-fog hover:bg-white/5";
const sectionTitle = "font-display text-4xl font-bold tracking-[-0.03em] sm:text-6xl";
const serifAccent = "font-serif font-normal tracking-normal";

function SectionHead({ label, children, accent }: { label: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div data-reveal className="mb-16 grid gap-6 md:grid-cols-[1fr_2fr]">
      <p className={`font-mono text-sm ${accent ? "text-acid" : "text-muted"}`}>{label}</p>
      <div>{children}</div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-void via-void/70 to-transparent">
        <div className="mx-auto flex h-18 max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-8">
          <a href="#top" className="font-display text-lg font-bold tracking-tight">
            BP<span className="text-acid">.</span>
          </a>
          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-void/60 p-1 text-sm backdrop-blur-md lg:flex">
            {nav.map(([label, href]) => (
              <a key={href} href={href} className="rounded-full px-4 py-2 text-muted transition hover:bg-white/5 hover:text-fog">
                {label}
              </a>
            ))}
          </nav>
          <a
            href="#contact"
            data-magnetic
            className="rounded-full bg-acid px-5 py-2.5 text-sm font-semibold text-void transition hover:bg-white"
          >
            Me contacter
          </a>
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
              {profile.title} — {profile.location}
            </p>
            <h1
              className="font-display text-[clamp(2.9rem,8.6vw,9rem)] leading-[0.92] font-bold tracking-[-0.04em]"
              aria-label={profile.tagline}
            >
              <span data-hero-line className="line-mask">
                <span>Des applis web</span>
              </span>
              <span data-hero-line className="line-mask">
                <span>
                  <em className={`${serifAccent} text-acid`}>rapides,</em> simples
                </span>
              </span>
              <span data-hero-line className="line-mask">
                <span>&amp; maintenables.</span>
              </span>
            </h1>

            <div className="mt-10 flex flex-col gap-8 border-t border-white/10 pt-8 md:flex-row md:items-end md:justify-between">
              <p data-hero-fade className="max-w-md text-lg text-muted">
                Je suis <span className="text-fog">{profile.name}</span>. Ingénieur devenu développeur, je transforme vos
                besoins en produits web depuis {profile.years} ans.
              </p>
              <div data-hero-fade className="flex flex-wrap gap-3">
                <a href={tel} data-magnetic className={btnPrimary}>
                  M’appeler
                </a>
                <a href={mail} data-magnetic className={btnGhost}>
                  M’écrire
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Bandeau */}
        <div className="overflow-hidden border-y border-white/10 bg-surface py-5" aria-hidden="true">
          <div className="marquee">
            {[0, 1].map((k) => (
              <div key={k} className="flex shrink-0 items-center">
                {marquee.map((m) => (
                  <span key={m} className="flex items-center font-display text-2xl font-semibold tracking-tight sm:text-4xl">
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
          <SectionHead label="(01) Services">
            <h2 className={sectionTitle}>
              Ce que je fais <em className={serifAccent}>pour vous</em>
            </h2>
          </SectionHead>
          <ul className="border-t border-white/10">
            {services.map((s, i) => (
              <li key={s.title} data-reveal className="group border-b border-white/10">
                <div className="grid gap-3 py-8 transition-all duration-500 group-hover:pl-4 sm:py-10 md:grid-cols-[1fr_2fr_1.2fr] md:items-center">
                  <span className="font-mono text-sm text-muted transition group-hover:text-acid">{pad(i + 1)}</span>
                  <h3 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">{s.title}</h3>
                  <p className="text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Projets */}
        <section id="projets" className="mx-auto max-w-[1400px] px-4 pb-28 sm:px-8 sm:pb-40">
          <SectionHead label="(02) Réalisations">
            <h2 className={sectionTitle}>
              Des projets <em className={serifAccent}>bien réels</em>
            </h2>
          </SectionHead>
          <div className="grid gap-6 lg:grid-cols-2">
            {projects.map((p, i) => (
              <article
                key={p.name}
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
                      {p.status && (
                        <span className="rounded-full border border-white/30 bg-black/20 px-3 py-1 backdrop-blur">
                          {p.status}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-4xl font-bold tracking-[-0.03em] text-white sm:text-6xl">{p.name}</h3>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <p className="text-sm font-medium text-acid">{p.client}</p>
                  <p className="mt-3 text-fog/90">{p.need}</p>
                  <ul className="mt-5 space-y-2 text-sm text-muted">
                    {p.done.map((d) => (
                      <li key={d} className="flex gap-3">
                        <span className="mt-[0.55em] h-px w-3 shrink-0 bg-acid" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-8">
                    <ul className="flex flex-wrap gap-2">
                      {p.stack.map((t) => (
                        <li key={t} className="rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-muted">
                          {t}
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
                        <span className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
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
            <SectionHead label="(03) Méthode">
              <h2 className={sectionTitle}>
                Quatre temps, <em className={serifAccent}>zéro surprise</em>
              </h2>
            </SectionHead>
            <ol className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {method.map((m, i) => (
                <li key={m.title} data-reveal className="spotlight bg-surface p-8">
                  <span className="font-serif text-7xl text-acid italic">{i + 1}</span>
                  <h3 className="font-display mt-6 text-2xl font-semibold">{m.title}</h3>
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
              <p className="font-mono text-sm text-muted">(04) À propos</p>
              <dl className="mt-10 space-y-6">
                {[
                  ["Expérience", `${profile.years} ans`],
                  ["Formation", "Ingénieur méca."],
                  ["Format", "Freelance"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-mono text-xs text-muted uppercase">{k}</dt>
                    <dd className="font-display text-3xl font-bold">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <p
              data-scrub-words
              className="font-display text-2xl leading-snug font-medium tracking-tight sm:text-4xl sm:leading-tight"
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
            <SectionHead label="(05) // pour les devs" accent>
              <h2 className={sectionTitle}>
                Sous le <em className={serifAccent}>capot</em>
              </h2>
              <p className="mt-4 max-w-lg text-muted">
                Vous êtes développeur, CTO ou vous montez une équipe ? Voici ce avec quoi je travaille au quotidien.
              </p>
            </SectionHead>

            <SkillsCarousel categories={skills} />

            <a
              href={profile.github}
              target="_blank"
              rel="noopener"
              data-magnetic
              className="mt-12 inline-flex items-center gap-3 rounded-full bg-fog px-6 py-4 font-semibold text-void transition hover:bg-acid"
            >
              <svg viewBox="0 0 16 16" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Voir mon GitHub
            </a>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="relative overflow-hidden">
          <div className="pointer-events-none absolute -bottom-60 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-acid/15 blur-[140px]" />
          <div className="relative mx-auto max-w-[1400px] px-4 pt-28 pb-16 sm:px-8 sm:pt-40">
            <p data-reveal className="font-mono text-sm text-muted">
              (06) Contact
            </p>
            <h2
              data-reveal
              className="font-display mt-6 text-[clamp(3.5rem,13vw,13rem)] leading-[0.85] font-bold tracking-[-0.05em]"
            >
              Parlons<em className={`${serifAccent} text-acid`}>-en.</em>
            </h2>
            <p data-reveal className="mt-8 max-w-xl text-lg text-muted">
              Un appel de 20 minutes suffit pour comprendre votre besoin et vous dire comment je peux vous aider.
            </p>
            <div data-reveal className="mt-10 flex flex-wrap gap-3">
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
                {profile.title} · {profile.location}
              </p>
              <a href="#top" className="transition hover:text-acid">
                Retour en haut ↑
              </a>
            </footer>
          </div>
        </section>
      </main>
    </>
  );
}
