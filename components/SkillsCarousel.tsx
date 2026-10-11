"use client";

import { useEffect, useRef, useState } from "react";
import type { Skill } from "@/lib/site";

const pad = (n: number) => String(n).padStart(2, "0");

type Labels = { carousel: string; carouselRole: string; previous: string; next: string };

// Une catégorie par diapo, en boucle. Flèches, onglets, clavier ou glisser.
// Sur mobile, pas d'onglets empilés : le nom de la catégorie est dans la diapo.
// Les textes arrivent déjà traduits depuis la page (Server Component).
export default function SkillsCarousel({
  categories,
  labels,
}: {
  categories: { id: string; title: string; items: Skill[] }[];
  labels: Labels;
}) {
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

  // La hauteur suit la diapo active : pas de vide sous les catégories courtes
  useEffect(() => {
    const el = track.current;
    const panel = el?.children[index] as HTMLElement | undefined;
    if (!el || !panel) return;
    const fit = () => (el.style.height = `${panel.offsetHeight}px`);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [index]);

  const arrow =
    "grid h-11 w-11 place-items-center rounded-full border border-white/15 transition hover:border-acid hover:text-acid";
  const arrows = (
    <>
      <button aria-label={labels.previous} onClick={() => go(index - 1)} className={arrow}>
        ←
      </button>
      <button aria-label={labels.next} onClick={() => go(index + 1)} className={arrow}>
        →
      </button>
    </>
  );

  const counter = (
    <span className="font-mono text-sm whitespace-nowrap text-muted">
      {pad(index + 1)} / {pad(categories.length)}
    </span>
  );

  return (
    <div
      data-reveal
      tabIndex={0}
      aria-roledescription={labels.carouselRole}
      aria-label={labels.carousel}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
    >
      <div className="mb-6 hidden items-center justify-between gap-4 md:flex">
        <div role="tablist" className="flex flex-wrap gap-2">
          {categories.map((c, i) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={i === index}
              onClick={() => go(i)}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted transition hover:text-fog aria-selected:border-acid aria-selected:bg-acid aria-selected:text-void"
            >
              {c.title}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {counter}
          {arrows}
        </div>
      </div>

      <div
        ref={track}
        className="carousel-track flex snap-x snap-mandatory items-start overflow-x-auto overflow-y-hidden transition-[height] duration-500 ease-out motion-reduce:transition-none"
      >
        {categories.map((c) => (
          <div key={c.id} className="w-full shrink-0 snap-start" role="tabpanel" aria-label={c.title}>
            <h3 className="mb-4 font-display text-2xl font-semibold tracking-tight md:hidden">{c.title}</h3>
            <ul className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-4">
              {c.items.map((s) => (
                <li
                  key={s.name}
                  className="spotlight flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-raised/60 p-2 text-center transition duration-300 hover:-translate-y-1 hover:border-white/25 sm:aspect-[4/3] sm:gap-4 sm:p-4 lg:aspect-[16/10]"
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
                      className={`h-9 w-9 object-contain sm:h-12 sm:w-12 ${s.invert ? "invert" : ""} ${s.mono ? "brightness-0 invert" : ""}`}
                    />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 font-mono text-sm font-medium sm:h-12 sm:w-12">
                      {s.name.slice(0, 2)}
                    </span>
                  )}
                  <span className="text-xs font-medium sm:text-sm">{s.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 md:hidden">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5" aria-hidden="true">
            {categories.map((c, i) => (
              <span
                key={c.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-acid" : "w-1.5 bg-white/20"}`}
              />
            ))}
          </div>
          {counter}
        </div>
        <div className="flex items-center gap-3">{arrows}</div>
      </div>
    </div>
  );
}
