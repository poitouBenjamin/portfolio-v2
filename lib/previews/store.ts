import { Redis } from "@upstash/redis";
import type { Brief } from "@/lib/brief";
import type { Preview, PreviewImage } from "./shared";

// Une fiche par brief : les esquisses générées restent côté serveur, le navigateur ne reçoit
// les esquisses payantes qu'une fois le paiement vérifié. Upstash Redis en ligne (via le
// Marketplace Vercel), mémoire du processus en local, où il n'y a qu'une instance.

/** generating → draft (à relire par Benjamin) → sent (le client a reçu son email) */
export type EsquisseStatus = "generating" | "draft" | "sent" | "failed";

/** Vignettes JPEG en base64, par esquisse : nette, et floutée pour les esquisses payantes */
export type Thumbs = Record<string, { clear: string; blurred: string }>;

export type Esquisse = {
  id: string;
  locale: "fr" | "en";
  brief: Brief;
  images: PreviewImage[];
  previews: Preview[];
  thumbs: Thumbs;
  status: EsquisseStatus;
  paid: boolean;
  createdAt: number;
  sentAt?: number;
  /** Dernière session Stripe Checkout ouverte pour ces esquisses */
  checkout?: string;
};

const ESQUISSE_TTL_S = 90 * 24 * 60 * 60;

// L'intégration Vercel peut préfixer les variables (ex. porfolio_KV_REST_API_URL)
const env = (name: string) =>
  process.env[name] ?? Object.entries(process.env).find(([k, v]) => k.endsWith(`_${name}`) && v)?.[1];

const url = env("UPSTASH_REDIS_REST_URL") ?? env("KV_REST_API_URL");
const token = env("UPSTASH_REDIS_REST_TOKEN") ?? env("KV_REST_API_TOKEN");
const redis = url && token ? new Redis({ url, token }) : null;

// Partagée via globalThis : en local, pages et routes API peuvent charger chacune leur copie du module
const memory = ((
  globalThis as { esquissesMemory?: Map<string, { value: unknown; expires: number }> }
).esquissesMemory ??= new Map());

export const storeReady = () => Boolean(redis) || process.env.VERCEL_ENV !== "production";

function assertReady() {
  // En production, plusieurs instances tournent : la mémoire locale perdrait les pistes
  if (!storeReady()) throw new Error("Stockage des pistes non configuré (UPSTASH_REDIS_REST_URL / TOKEN)");
}

async function get<T>(key: string): Promise<T | null> {
  assertReady();
  if (redis) return redis.get<T>(key);
  const entry = memory.get(key);
  return entry && entry.expires > Date.now() ? (entry.value as T) : null;
}

async function set(key: string, value: unknown, ttlSeconds: number) {
  assertReady();
  if (redis) return void (await redis.set(key, value, { ex: ttlSeconds }));
  memory.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
}

const esquisseKey = (id: string) => `esquisses:${id}`;

export const getEsquisse = (id: string) => get<Esquisse>(esquisseKey(id));
export const saveEsquisse = (esquisse: Esquisse) => set(esquisseKey(esquisse.id), esquisse, ESQUISSE_TTL_S);

/** Compte un appel et dit si la limite est dépassée sur la fenêtre */
export async function rateLimited(key: string, max: number, windowSeconds: number) {
  assertReady();
  const k = `rate:${key}`;
  if (redis) {
    const count = await redis.incr(k);
    if (count === 1) await redis.expire(k, windowSeconds);
    return count > max;
  }
  const entry = memory.get(k);
  const count = entry && entry.expires > Date.now() ? (entry.value as number) + 1 : 1;
  memory.set(k, { value: count, expires: entry && count > 1 ? entry.expires : Date.now() + windowSeconds * 1000 });
  return count > max;
}
