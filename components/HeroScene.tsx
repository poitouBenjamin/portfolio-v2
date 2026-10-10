"use client";

import { useEffect, useRef } from "react";

export default function HeroScene() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    // Three.js est chargé à part pour ne pas alourdir le premier rendu
    import("@/lib/hero-scene").then(({ initHeroScene }) => {
      if (!cancelled && ref.current) cleanup = initHeroScene(ref.current);
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
