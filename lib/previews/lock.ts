import { FREE_PREVIEW_ID, type Preview } from "./shared";

const letters = "abcdefghijklmnopqrstuvwxyz";
const randomLetter = () => letters[Math.floor(Math.random() * letters.length)];

// Remplace chaque lettre et chiffre du texte visible par une lettre au hasard.
// Mise en page, couleurs et images restent : floutée, la piste donne envie
// sans rien livrer de son contenu, même en ouvrant les outils du navigateur.
const scrambleText = (text: string) =>
  text.replace(/&[#\w]+;|[\p{L}\p{N}]/gu, (c) => {
    if (c.length > 1) return c; // entité HTML
    const r = randomLetter();
    return c !== c.toLowerCase() ? r.toUpperCase() : r;
  });

// Textes portés par les balises elles-mêmes (texte alternatif, infobulles…)
const scrambleAttributes = (tag: string) =>
  tag.replace(
    /(\s(?:alt|title|aria-label|placeholder|value)\s*=\s*)("[^"]*"|'[^']*')/gi,
    (_, name: string, value: string) => name + scrambleText(value),
  );

export function scramble(html: string) {
  return html
    .split(/(<style[\s\S]*?<\/style>|<title[\s\S]*?<\/title>|<[^>]*>)/i)
    .map((part, i) => (i % 2 ? (part.startsWith("<style") ? part : scrambleAttributes(part)) : scrambleText(part)))
    .join("");
}

/** Pistes telles que le navigateur peut les voir */
export const present = (previews: Preview[], paid: boolean): Preview[] =>
  previews.map((p) => (paid || p.id === FREE_PREVIEW_ID ? p : { ...p, html: scramble(p.html), locked: true }));

/** Pistes auxquelles le client a droit (emails compris) */
export const unlocked = (previews: Preview[], paid: boolean) =>
  previews.filter((p) => paid || p.id === FREE_PREVIEW_ID);
