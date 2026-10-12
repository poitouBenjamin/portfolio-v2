const pad = (n: number) => String(n).padStart(2, "0");

type Step = { title: string; text: string };

// Un décor animé par étape, en CSS pur (voir .method-* dans globals.css)
const motifs = [
  // Écouter : des ondes qui se propagent
  <div key="listen" className="absolute top-[38%] right-[18%]">
    {[0, 1, 2, 3].map((i) => (
      <span key={i} className="method-ripple" style={{ animationDelay: `${-i * 1.5}s` }} />
    ))}
  </div>,
  // Comprendre : une trame de points qu'un faisceau vient éclairer
  <div key="understand" className="absolute inset-0">
    <div className="method-dots absolute inset-0 opacity-40" />
    <div className="method-dots method-dots-lit absolute inset-0" />
  </div>,
  // Itérer : des orbites qui tournent à des vitesses différentes
  <svg
    key="iterate"
    viewBox="0 0 400 400"
    className="absolute top-1/2 right-[-35%] h-[115%] -translate-y-1/2 opacity-80 sm:right-[-18%]"
    fill="none"
  >
    {[
      [180, 70, 18, "#c8ff4d"],
      [150, 110, 26, "#8b6cff"],
      [110, 160, 34, "#ededf0"],
    ].map(([rx, ry, s, c], i) => (
      <g key={i} className="method-orbit" style={{ animationDuration: `${s}s` }}>
        <ellipse cx="200" cy="200" rx={rx} ry={ry} stroke={`${c}55`} strokeDasharray="3 7" />
        <circle cx={200 + Number(rx)} cy="200" r="5" fill={String(c)} />
      </g>
    ))}
  </svg>,
  // Tester : une grille balayée par un faisceau de contrôle
  <div key="test" className="absolute inset-0">
    <div className="method-grid absolute inset-0" />
    <div className="method-scan absolute inset-0" />
  </div>,
  // Livrer : des traînées qui décollent
  <div key="deliver" className="absolute inset-0">
    {[8, 22, 37, 51, 63, 76, 88].map((left, i) => (
      <span
        key={left}
        className="method-streak"
        style={{ left: `${left}%`, animationDelay: `${-i * 0.9}s`, animationDuration: `${3.5 + (i % 3)}s` }}
      />
    ))}
  </div>,
];

// Halo coloré qui dérive lentement derrière chaque étape
const glows = [
  "radial-gradient(closest-side, #c8ff4d55, transparent)",
  "radial-gradient(closest-side, #8b6cff66, transparent)",
  "radial-gradient(closest-side, #8b6cff55, #c8ff4d22 60%, transparent)",
  "radial-gradient(closest-side, #1fd39a44, transparent)",
  "radial-gradient(closest-side, #c8ff4d66, transparent)",
];

// Les étapes défilent de gauche à droite pendant que la section reste épinglée
// (voir lib/interactions.ts). Sans animation (prefers-reduced-motion), elles s'empilent.
export default function MethodSlides({ steps, hint }: { steps: Step[]; hint: string }) {
  const total = pad(steps.length);
  return (
    <div
      data-hscroll
      className="flex flex-col gap-8 motion-safe:h-svh motion-safe:justify-center motion-safe:overflow-hidden motion-reduce:pb-28 sm:motion-reduce:pb-40"
    >
      <ol
        data-hscroll-track
        className="flex flex-col gap-4 px-[max(1rem,calc((100vw-1400px)/2+2rem))] motion-safe:w-max motion-safe:flex-row motion-safe:gap-6"
      >
        {steps.map((s, i) => (
          <li
            key={s.title}
            data-hscroll-panel
            className="spotlight relative flex min-h-[420px] shrink-0 flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-void p-7 motion-safe:h-[min(70svh,640px)] motion-safe:w-[84vw] sm:p-12 lg:motion-safe:w-[60vw]"
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
              <div className="method-glow" style={{ background: glows[i], animationDelay: `${-i * 3}s` }} />
              {motifs[i]}
              {/* Voile sombre sous le texte pour garder la lecture confortable */}
              <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_0%_100%,var(--color-void)_25%,transparent_70%)]" />
              <span
                data-hscroll-num
                className="absolute right-[4%] -bottom-[0.18em] font-serif text-[clamp(14rem,32vw,30rem)] leading-none text-transparent italic [-webkit-text-stroke:1px_rgb(200_255_77/0.45)]"
              >
                {i + 1}
              </span>
            </div>

            <p className="font-mono text-sm">
              <span className="text-acid">{pad(i + 1)}</span>
              <span className="text-muted"> / {total}</span>
            </p>
            <div data-hscroll-copy className="max-w-lg">
              <h3 className="font-display text-5xl leading-none font-bold tracking-[-0.04em] sm:text-7xl">{s.title}</h3>
              <p className="mt-5 text-lg text-muted sm:text-xl">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* Avancement, visible seulement pendant le défilement horizontal */}
      <div
        aria-hidden="true"
        className="hidden items-center gap-6 px-[max(1rem,calc((100vw-1400px)/2+2rem))] font-mono text-xs text-muted motion-safe:flex"
      >
        <span className="whitespace-nowrap">
          <span data-hscroll-count className="text-acid">
            01
          </span>{" "}
          / {total}
        </span>
        <span className="h-px flex-1 bg-white/10">
          <span data-hscroll-bar className="block h-full origin-left scale-x-0 bg-acid" />
        </span>
        <span className="hidden whitespace-nowrap sm:inline">{hint} →</span>
      </div>
    </div>
  );
}
