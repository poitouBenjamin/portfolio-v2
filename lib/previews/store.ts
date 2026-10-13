import { Redis } from "@upstash/redis";
import type { Preview } from "./shared";

// Les pistes générées restent côté serveur : le navigateur ne reçoit les pistes payantes
// qu'une fois le paiement vérifié. Upstash Redis en ligne (via le Marketplace Vercel),
// mémoire du processus en local, où il n'y a qu'une instance.

export type PreviewSession = {
  previews: Preview[];
  paid: boolean;
  createdAt: number;
  /** Dernière session Stripe Checkout ouverte pour ces pistes */
  checkout?: string;
};

const SESSION_TTL_S = 30 * 24 * 60 * 60;

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

const memory = new Map<string, { value: unknown; expires: number }>();

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

const sessionKey = (id: string) => `previews:${id}`;

export const getSession = (id: string) => get<PreviewSession>(sessionKey(id));
export const saveSession = (id: string, session: PreviewSession) => set(sessionKey(id), session, SESSION_TTL_S);

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
