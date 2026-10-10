# Benjamin Poitou — Portfolio

Site vitrine de **Benjamin Poitou**, développeur fullstack JS freelance (Paris · remote).

![Aperçu du hero](docs/preview.png)

## Stack

| Domaine   | Choix                                                                |
| --------- | -------------------------------------------------------------------- |
| Framework | [Next.js 16](https://nextjs.org) (App Router), React 19, TypeScript  |
| Style     | Tailwind CSS 4, polices auto-hébergées via `next/font`               |
| 3D        | [Three.js](https://threejs.org) et shaders GLSL écrits à la main     |
| Animation | [GSAP](https://gsap.com) + ScrollTrigger, [Lenis](https://lenis.dev) |
| Qualité   | ESLint 9, Prettier, `tsc --noEmit`                                   |

## Points notables

- **Hero WebGL.** Une icosphère est déformée par deux octaves de bruit simplex dans le vertex shader, et les normales sont recalculées par différences finies. Le fragment shader combine un effet de Fresnel irisé et une lumière qui suit la souris.
- **Performance.** La page est un Server Component pré-rendu en statique. Three.js est importé dynamiquement, hors du bundle initial. Le rendu se met en pause quand le canvas sort de l'écran, et le `devicePixelRatio` est plafonné à 2.
- **Accessibilité.** `prefers-reduced-motion` coupe les animations et le défilement fluide. Le carrousel suit la sémantique `tablist`/`tabpanel` et se pilote au clavier. Le curseur et l'effet magnétique ne s'activent qu'avec une souris (`pointer: fine`).
- **Robustesse.** Chaque effet renvoie une fonction de nettoyage (listeners, contexte GSAP, ressources GPU), pour un fonctionnement correct en StrictMode.
- **Contenu centralisé.** Tout le texte vit dans [`lib/site.ts`](lib/site.ts), un module typé qu'on modifie sans toucher au balisage.

## Structure

```
app/
  layout.tsx          polices, métadonnées, montage des interactions
  page.tsx            sections de la landing (Server Component)
  globals.css         tokens du thème et effets (grain, halo, bandeau)
components/
  HeroScene.tsx       montage paresseux de la scène 3D
  Interactions.tsx    défilement fluide, apparitions, curseur
  SkillsCarousel.tsx  carrousel de compétences accessible
lib/
  site.ts             contenu du site
  hero-scene.ts       scène Three.js et shaders
  interactions.ts     GSAP, ScrollTrigger, Lenis
```

## Démarrer

Prérequis : Node.js 20 ou plus (voir `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script                 | Rôle                             |
| ---------------------- | -------------------------------- |
| `npm run build`        | build de production              |
| `npm run lint`         | ESLint                           |
| `npm run typecheck`    | vérification TypeScript          |
| `npm run format`       | formatage Prettier               |
| `npm run format:check` | vérifie le formatage sans écrire |

## Workflow

Une branche par changement (`feat/`, `fix/`, `chore/`, `ci/`, `docs/`), des commits au format [Conventional Commits](https://www.conventionalcommits.org), et un merge sur `main` par Pull Request.

## Contact

[poitou.benjamin.dev@gmail.com](mailto:poitou.benjamin.dev@gmail.com)
