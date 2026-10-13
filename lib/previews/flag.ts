import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Les esquisses restent invisibles en production tant qu'elles ne sont pas validées :
// actives en local et sur les previews Vercel, partout avec BRIEF_PREVIEWS=1,
// ou seulement pour Benjamin en mode testeur (cookie déposé par /api/esquisses/tester).
// Lu côté serveur uniquement : la page transmet le résultat au formulaire.

export const TESTER_COOKIE = "esquisses_tester";

export const previewsOpen = () => process.env.VERCEL_ENV !== "production" || process.env.BRIEF_PREVIEWS === "1";

/** Valeur du cookie testeur : dérivée de BRIEF_TESTER_TOKEN, impossible à fabriquer sans lui */
export function testerCookieValue() {
  const token = process.env.BRIEF_TESTER_TOKEN;
  return token ? createHash("sha256").update(`esquisses-tester:${token}`).digest("base64url") : null;
}

export const isTesterToken = (given: string | null) => {
  const token = process.env.BRIEF_TESTER_TOKEN;
  if (!token || !given) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
};

export async function isTester() {
  const expected = testerCookieValue();
  const given = (await cookies()).get(TESTER_COOKIE)?.value;
  return Boolean(expected && given === expected);
}

export async function previewsEnabled() {
  return previewsOpen() || (await isTester());
}
