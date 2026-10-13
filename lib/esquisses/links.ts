import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { localePath } from "@/i18n/routing";
import type { Esquisse } from "@/lib/previews/store";

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

// Nom lisible dans l'URL, suffixe aléatoire pour qu'elle ne se devine pas
export const newEsquisseId = (brand: string) =>
  `${slug(brand) || "esquisses"}-${randomBytes(8)
    .toString("base64url")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")}`.slice(0, 80);

// Lien de relecture de Benjamin : signé, pour que seul lui puisse envoyer ou regénérer
function secret() {
  const value = process.env.ESQUISSES_SECRET;
  if (value) return value;
  if (process.env.VERCEL_ENV === "production") throw new Error("ESQUISSES_SECRET manquante en production");
  return "dev-esquisses";
}

export const adminKey = (id: string) => createHmac("sha256", secret()).update(id).digest("base64url");

export function isAdmin(id: string, key: string | null | undefined) {
  if (!key) return false;
  const expected = Buffer.from(adminKey(id));
  const given = Buffer.from(key);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export const esquisseUrl = (origin: string, e: Pick<Esquisse, "id" | "locale">, admin = false) =>
  `${origin}${localePath(e.locale, `/esquisses/${e.id}`)}${admin ? `?k=${adminKey(e.id)}` : ""}`;

export const brandOf = (e: Pick<Esquisse, "brief">) => e.brief.company || e.brief.name;
