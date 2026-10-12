import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Branche défilement fluide, animations et effets souris. Renvoie une fonction de nettoyage.
export function initInteractions(): () => void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const abort = new AbortController();
  const { signal } = abort;

  // Défilement fluide, synchronisé avec ScrollTrigger
  let lenis: Lenis | null = null;
  const tick = (t: number) => lenis?.raf(t * 1000);
  if (!reduce) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
  }
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener(
      "click",
      (e) => {
        const id = a.getAttribute("href")!;
        const el = id === "#top" ? document.body : document.querySelector(id);
        if (!el || !lenis) return;
        e.preventDefault();
        lenis.scrollTo(el as HTMLElement, { offset: -72 });
      },
      { signal },
    );
  });

  const ctx = gsap.context(() => {
    if (reduce) return;

    // Titre principal : chaque ligne monte depuis son masque
    gsap.from("[data-hero-line] > span", {
      yPercent: 110,
      duration: 1.2,
      ease: "expo.out",
      stagger: 0.09,
      delay: 0.15,
    });
    gsap.from("[data-hero-fade]", { opacity: 0, y: 20, duration: 1, ease: "power3.out", stagger: 0.08, delay: 0.6 });

    // Méthode : section épinglée, les étapes défilent de gauche à droite.
    // Créée avant les autres déclencheurs pour qu'ils tiennent compte de l'espace d'épinglage.
    const hscroll = document.querySelector<HTMLElement>("[data-hscroll]");
    const track = hscroll?.querySelector<HTMLElement>("[data-hscroll-track]");
    if (hscroll && track) {
      const panels = gsap.utils.toArray<HTMLElement>("[data-hscroll-panel]", hscroll);
      const count = hscroll.querySelector<HTMLElement>("[data-hscroll-count]");
      const distance = () => track.scrollWidth - hscroll.clientWidth;
      const slide = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: hscroll,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: ({ progress }) => {
            if (count) count.textContent = String(Math.round(progress * (panels.length - 1)) + 1).padStart(2, "0");
          },
        },
      });
      gsap.to("[data-hscroll-bar]", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { trigger: hscroll, start: "top top", end: () => `+=${distance()}`, scrub: true },
      });

      panels.forEach((panel, i) => {
        // Le grand chiffre glisse moins vite que la carte : effet de profondeur
        gsap.fromTo(
          panel.querySelector("[data-hscroll-num]"),
          { xPercent: 35 },
          {
            xPercent: -35,
            ease: "none",
            scrollTrigger: {
              trigger: panel,
              containerAnimation: slide,
              start: "left right",
              end: "right left",
              scrub: true,
            },
          },
        );
        if (i === 0) return;
        gsap.from(panel.querySelector("[data-hscroll-copy]"), {
          opacity: 0,
          x: 80,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: panel, containerAnimation: slide, start: "left 75%" },
        });
      });
    }

    // Apparitions au scroll
    gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 48,
        duration: 1.1,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    // IA : le terminal de l'agent s'écrit ligne par ligne
    gsap.utils.toArray<HTMLElement>("[data-type-lines]").forEach((el) => {
      gsap.from(el.children, {
        opacity: 0,
        x: -12,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.45,
        scrollTrigger: { trigger: el, start: "top 80%" },
      });
    });

    // À propos : les mots s'allument au fil du scroll
    const words = gsap.utils.toArray<HTMLElement>("[data-scrub-words] .w");
    if (words.length) {
      gsap.fromTo(
        words,
        { opacity: 0.15 },
        {
          opacity: 1,
          stagger: 0.05,
          ease: "none",
          scrollTrigger: { trigger: "[data-scrub-words]", start: "top 75%", end: "bottom 45%", scrub: true },
        },
      );
    }

    if (!finePointer) return;

    // Boutons magnétiques
    document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
      const x = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const y = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      el.addEventListener(
        "pointermove",
        (e) => {
          const r = el.getBoundingClientRect();
          x((e.clientX - r.left - r.width / 2) * 0.3);
          y((e.clientY - r.top - r.height / 2) * 0.3);
        },
        { signal },
      );
      el.addEventListener("pointerleave", () => (x(0), y(0)), { signal });
    });
  });

  // Halo sur les cartes (délégué, pour couvrir aussi les cartes rendues plus tard)
  document.addEventListener(
    "pointermove",
    (e) => {
      const card = (e.target as Element | null)?.closest?.<HTMLElement>(".spotlight");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    },
    { signal },
  );

  // Curseur
  let cursor: HTMLDivElement | null = null;
  if (finePointer && !reduce) {
    const c = document.createElement("div");
    cursor = c;
    c.className = "cursor";
    document.body.append(c);
    const cx = gsap.quickTo(c, "x", { duration: 0.25, ease: "power3" });
    const cy = gsap.quickTo(c, "y", { duration: 0.25, ease: "power3" });
    window.addEventListener("pointermove", (e) => (cx(e.clientX), cy(e.clientY)), { signal });
    document.addEventListener(
      "pointerover",
      (e) => c.classList.toggle("is-hover", !!(e.target as Element).closest?.("a, button")),
      { signal },
    );
  }

  return () => {
    abort.abort();
    ctx.revert();
    gsap.ticker.remove(tick);
    lenis?.destroy();
    cursor?.remove();
  };
}
