import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type SiteMeta = {
  url: string;
  title: string;
  description: string;
  siteName: string;
  headline: string;
  colors: string[];
};

const TIMEOUT_MS = 5000;
const MAX_BYTES = 600_000;
const MAX_REDIRECTS = 2;

// Adresses privées, locales ou réservées : jamais interrogées depuis le serveur
function isPrivate(ip: string) {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v.startsWith("::ffff:")) return isPrivate(v.slice(7));
    return v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

async function assertPublic(url: URL) {
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("protocol");
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("port");
  const addresses = isIP(url.hostname) ? [{ address: url.hostname }] : await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((a) => isPrivate(a.address))) throw new Error("private");
}

async function readCapped(res: Response) {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.byteLength;
  }
  await reader.cancel().catch(() => {});
  return new TextDecoder().decode(Buffer.concat(chunks));
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

function meta(html: string, key: string) {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${key}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${key}["']`,
    "i",
  );
  const m = html.match(re);
  return decode(m?.[1] ?? m?.[2] ?? "");
}

// Couleurs les plus présentes dans le HTML et le CSS inline, hors gris
function dominantColors(html: string) {
  const counts = new Map<string, number>();
  for (const [, hex] of html.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    const full = (hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex).toLowerCase();
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
    if (Math.max(r, g, b) - Math.min(r, g, b) < 40) continue;
    counts.set(`#${full}`, (counts.get(`#${full}`) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([c]) => c);
}

// Lit le site actuel du client pour en reprendre le nom, le ton et les couleurs.
// Toute erreur est silencieuse : les pistes se génèrent aussi sans.
export async function readSiteMeta(raw: string): Promise<SiteMeta | null> {
  if (!raw) return null;
  try {
    let url = new URL(raw);
    let res: Response | null = null;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      await assertPublic(url);
      res = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { "user-agent": "poitou.digital brief preview", accept: "text/html" },
      });
      const next = res.status >= 300 && res.status < 400 && res.headers.get("location");
      if (!next) break;
      url = new URL(next, url);
    }
    if (!res?.ok || !res.headers.get("content-type")?.includes("text/html")) return null;
    const html = await readCapped(res);
    const themeColor = meta(html, "theme-color");
    return {
      url: url.toString(),
      title: decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? ""),
      description: meta(html, "description") || meta(html, "og:description"),
      siteName: meta(html, "og:site_name"),
      headline: decode((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "").replace(/<[^>]+>/g, " ")).slice(0, 160),
      colors: [...new Set([themeColor, ...dominantColors(html)].filter((c) => /^#[0-9a-f]{6}$/i.test(c)))].slice(0, 4),
    };
  } catch {
    return null;
  }
}
