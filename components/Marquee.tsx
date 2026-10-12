"use client";

import { useEffect, useRef } from "react";

const SPEED = 60; // px/s en défilement libre

// Bandeau qui défile tout seul et qu'on peut aussi attraper : glisser à la souris
// ou au doigt, molette horizontale. Le scroll de la page lui donne un coup d'élan.
export default function Marquee({ items }: { items: string[] }) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const abort = new AbortController();
    const { signal } = abort;

    let x = 0;
    let boost = 0; // vitesse ajoutée par l'utilisateur·rice, amortie à chaque image
    let drag: { start: number; x: number; last: number; t: number } | null = null;
    let lastScroll = window.scrollY;
    let prev = performance.now();
    let raf = 0;

    // Deux copies identiques : on boucle sur la largeur d'une seule
    const wrap = () => {
      const half = el.scrollWidth / 2;
      if (!half) return;
      x = ((x % half) - half) % half;
    };

    const frame = (now: number) => {
      const dt = Math.min((now - prev) / 1000, 0.1);
      prev = now;
      if (!drag) {
        x -= ((reduce ? 0 : SPEED) + boost) * dt;
        boost *= Math.pow(0.04, dt);
      }
      wrap();
      el.style.transform = `translate3d(${x}px,0,0)`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    el.addEventListener(
      "pointerdown",
      (e) => {
        drag = { start: e.clientX, x, last: e.clientX, t: performance.now() };
        boost = 0;
        el.setPointerCapture(e.pointerId);
        el.dataset.dragging = "";
      },
      { signal },
    );
    el.addEventListener(
      "pointermove",
      (e) => {
        if (!drag) return;
        const now = performance.now();
        // Vitesse du geste, reprise comme élan au relâchement
        boost = (-(e.clientX - drag.last) / Math.max((now - drag.t) / 1000, 0.001)) * 0.6;
        drag.last = e.clientX;
        drag.t = now;
        x = drag.x + e.clientX - drag.start;
      },
      { signal },
    );
    const release = () => {
      // Relâché après une pause : pas d'élan résiduel
      if (drag && performance.now() - drag.t > 100) boost = 0;
      drag = null;
      delete el.dataset.dragging;
    };
    el.addEventListener("pointerup", release, { signal });
    el.addEventListener("pointercancel", release, { signal });

    el.addEventListener(
      "wheel",
      (e) => {
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // le scroll vertical reste à la page
        e.preventDefault();
        x -= e.deltaX;
      },
      { signal, passive: false },
    );

    if (!reduce) {
      window.addEventListener(
        "scroll",
        () => {
          boost = Math.min(boost + Math.abs(window.scrollY - lastScroll) * 2, 900);
          lastScroll = window.scrollY;
        },
        { signal, passive: true },
      );
    }

    return () => {
      abort.abort();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="overflow-hidden border-y border-white/10 bg-surface py-5" aria-hidden="true">
      <div
        ref={track}
        className="flex w-max cursor-grab touch-pan-y will-change-transform select-none data-[dragging]:cursor-grabbing"
      >
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center">
            {items.map((m) => (
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
  );
}
