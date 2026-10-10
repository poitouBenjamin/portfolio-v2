"use client";

import { useEffect, useRef, useState } from "react";
import type { skills as Skills } from "@/lib/site";

const pad = (n: number) => String(n).padStart(2, "0");

// Une catégorie par diapo, en boucle. Flèches, onglets, clavier ou glisser.
export default function SkillsCarousel({ categories }: { categories: typeof Skills }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const next = (i + categories.length) % categories.length;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: next * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };

  // L'index suit la position réelle du défilement (utile au doigt sur mobile)
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const arrow =
    "grid h-11 w-11 place-items-center rounded-full border border-white/15 transition hover:border-acid hover:text-acid";

  return (
    <div
      data-reveal
      tabIndex={0}
      aria-roledescription="carrousel"
      aria-label="Compétences"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" className="flex flex-wrap gap-2">
          {categories.map((c, i) => (
            <button
              key={c.title}
              role="tab"
              aria-selected={i === index}
              onClick={() => go(i)}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted transition hover:text-fog aria-selected:border-acid aria-selected:bg-acid aria-selected:text-void"
            >
              {c.title}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-muted">
            {pad(index + 1)} / {pad(categories.length)}
          </span>
          <button aria-label="Catégorie précédente" onClick={() => go(index - 1)} className={arrow}>
            ←
          </button>
          <button aria-label="Catégorie suivante" onClick={() => go(index + 1)} className={arrow}>
            →
          </button>
        </div>
      </div>

      <div ref={track} className="carousel-track flex snap-x snap-mandatory overflow-x-auto">
        {categories.map((c) => (
          <div key={c.title} className="w-full shrink-0 snap-start" role="tabpanel" aria-label={c.title}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {c.items.map((s) => (
                <li
                  key={s.name}
                  className="spotlight flex aspect-[4/3] flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-raised/60 p-4 text-center transition duration-300 hover:-translate-y-1 hover:border-white/25"
                >
                  {s.logo ? (
                    // SVG distants : <img> suffit, next/image n'apporte rien ici
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.logo}
                      alt=""
                      loading="lazy"
                      width={48}
                      height={48}
                      className={`h-12 w-12 object-contain ${s.invert ? "invert" : ""} ${s.mono ? "brightness-0 invert" : ""}`}
                    />
                  ) : (
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 font-mono text-sm font-medium">
                      {s.name.slice(0, 2)}
                    </span>
                  )}
                  <span className="text-sm font-medium">{s.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
