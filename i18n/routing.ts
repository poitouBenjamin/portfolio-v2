import { defineRouting } from "next-intl/routing";

// Français à la racine (/), anglais sous /en.
// Pas de détection automatique : sinon un navigateur anglophone serait
// toujours redirigé de / vers /en et ne pourrait plus revenir au français.
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
  localeDetection: false,
});
