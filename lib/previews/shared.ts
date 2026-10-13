import { z } from "zod";
import type { SiteMeta } from "./site-meta";

// Aperçus IA du brief : trois pistes visuelles générées à partir des réponses du client.
// Sans ANTHROPIC_API_KEY, les pistes viennent de modèles locaux (mode démo).

export const MAX_IMAGES = 4;
export const MAX_IMAGE_CHARS = 700_000; // data URL déjà compressée côté navigateur

// Les images ne sont jamais recopiées dans le HTML généré : il les référence par jeton,
// et le jeton est remplacé au moment d'afficher ou d'envoyer la piste.
export const imageToken = (i: number) => `{{image:${i + 1}}}`;

export const directions = [
  { id: "1", key: "editorial" },
  { id: "2", key: "immersive" },
  { id: "3", key: "vivid" },
] as const;
export type DirectionKey = (typeof directions)[number]["key"];

/** `locked` : piste payante pas encore débloquée, son texte est brouillé (voir lock.ts) */
export type Preview = { id: string; direction: DirectionKey; html: string; locked?: boolean };

// La première piste est offerte, les deux autres se débloquent en un paiement,
// déduit du devis si le projet se fait.
export const FREE_PREVIEW_ID = "1";
export const UNLOCK_PRICE_EUR = 29;

/** Comment débloquer les pistes : Stripe, bouton de test (hors production), ou indisponible */
export type PaymentMode = "stripe" | "dev" | "off";

export const sessionIdSchema = z.string().uuid();

export const imageSchema = z.object({
  name: z.string().trim().max(120),
  dataUrl: z
    .string()
    .max(MAX_IMAGE_CHARS)
    .regex(/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/),
});
export type PreviewImage = z.infer<typeof imageSchema>;

export const previewRequestSchema = z.object({
  locale: z.enum(["fr", "en"]),
  url: z.union([z.string().trim().url().max(500), z.literal("")]),
  prompt: z.string().trim().max(2000),
  name: z.string().trim().max(120),
  company: z.string().trim().max(120),
  projectType: z.string().max(40),
  description: z.string().trim().max(4000),
  audience: z.string().trim().max(2000),
  goals: z.array(z.string().max(40)).max(10),
  features: z.array(z.string().max(40)).max(12),
  images: z.array(imageSchema).max(MAX_IMAGES),
  /** Pistes précédentes : si elles étaient payées, les nouvelles le sont aussi */
  previous: sessionIdSchema.optional(),
});
export type PreviewRequest = z.infer<typeof previewRequestSchema>;
export type PreviewContext = PreviewRequest & { site: SiteMeta | null };

export const fillImages = (html: string, images: { dataUrl: string }[]) =>
  html.replace(/\{\{image:(\d+)\}\}/g, (_, n) => images[Number(n) - 1]?.dataUrl ?? "");
