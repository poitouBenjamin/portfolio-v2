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

type Locale = (typeof routing.locales)[number];

// URL d'une page dans une langue donnée : localePath("en", "/brief") → "/en/brief"
export function localePath(locale: Locale, path = "") {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${prefix}${path}` || "/";
}
