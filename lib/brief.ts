import { z } from "zod";

// Brief projet : description déclarative des étapes et des champs.
// Les libellés sont dans messages/*.json → Brief.fields.<name>.
// Le même schéma valide côté client (étape par étape) et côté serveur.

export const options = {
  contactPreference: ["email", "phone", "video"],
  projectType: ["showcase", "ecommerce", "webapp", "redesign", "api", "maintenance", "other"],
  goals: ["leads", "sales", "brand", "internalTool", "automation", "audience"],
  hasWebsite: ["yes", "no"],
  assets: ["logo", "brandGuide", "mockups", "copy", "photos", "none"],
  features: [
    "accounts",
    "payment",
    "cms",
    "multilingual",
    "blog",
    "booking",
    "search",
    "map",
    "integrations",
    "analytics",
  ],
  hosting: ["yes", "no", "unsure"],
  maintenance: ["essential", "growth", "unsure", "no"],
  budget: ["lt5k", "5to10k", "10to20k", "20to40k", "gt40k", "unknown"],
  deadline: ["asap", "lt1m", "1to3m", "3to6m", "flexible"],
  decisionMaker: ["me", "shared", "other"],
  previewRating: ["1", "2", "3", "4", "5"],
  previewFavorite: ["1", "2", "3"],
} as const;

type OptionKey = keyof typeof options;

export type Field =
  | { name: string; kind: "text" | "email" | "tel" | "url"; required?: boolean; autoComplete?: string }
  | { name: string; kind: "textarea"; required?: boolean }
  | { name: OptionKey; kind: "radio" | "checkboxes"; required?: boolean }
  | { name: string; kind: "consent"; required: true }
  | { name: "previewStudio"; kind: "studio"; required?: false };

export type Step = { id: string; fields: Field[] };

const consent: Field = { name: "consent", kind: "consent", required: true };

const allSteps: Step[] = [
  {
    id: "you",
    fields: [
      { name: "name", kind: "text", required: true, autoComplete: "name" },
      { name: "email", kind: "email", required: true, autoComplete: "email" },
      { name: "phone", kind: "tel", autoComplete: "tel" },
      { name: "company", kind: "text", autoComplete: "organization" },
      { name: "role", kind: "text", autoComplete: "organization-title" },
      { name: "contactPreference", kind: "radio" },
    ],
  },
  {
    id: "project",
    fields: [
      { name: "projectType", kind: "radio", required: true },
      { name: "description", kind: "textarea", required: true },
      { name: "goals", kind: "checkboxes" },
      { name: "audience", kind: "textarea" },
    ],
  },
  {
    id: "existing",
    fields: [
      { name: "hasWebsite", kind: "radio" },
      { name: "currentUrl", kind: "url" },
      { name: "assets", kind: "checkboxes" },
      { name: "inspirations", kind: "textarea" },
      { name: "competitors", kind: "textarea" },
    ],
  },
  {
    id: "features",
    fields: [
      { name: "features", kind: "checkboxes" },
      { name: "integrationsDetail", kind: "textarea" },
      { name: "hosting", kind: "radio" },
      { name: "maintenance", kind: "radio" },
    ],
  },
  {
    id: "budget",
    fields: [
      { name: "budget", kind: "radio" },
      { name: "deadline", kind: "radio" },
      { name: "deadlineReason", kind: "text" },
      { name: "decisionMaker", kind: "radio" },
      { name: "notes", kind: "textarea" },
    ],
  },
  {
    // Aperçu IA : trois pistes visuelles générées à partir du brief (lib/previews)
    id: "preview",
    fields: [
      { name: "previewUrl", kind: "url" },
      { name: "previewPrompt", kind: "textarea" },
      { name: "previewStudio", kind: "studio" },
    ],
  },
];

// Étapes du parcours ; le consentement se place toujours sur la dernière
export function briefSteps(withPreview: boolean): Step[] {
  const list = allSteps.filter((s) => withPreview || s.id !== "preview");
  return list.map((s, i) => (i === list.length - 1 ? { ...s, fields: [...s.fields, consent] } : s));
}

const text = (max: number) => z.string().trim().max(max);
const required = (max: number) => text(max).min(1, "required");
const choice = <K extends OptionKey>(key: K) => z.enum(options[key]);
const choices = <K extends OptionKey>(key: K) => z.array(choice(key)).max(options[key].length);
const optionalChoice = <K extends OptionKey>(key: K) => z.union([choice(key), z.literal("")]);

export const briefSchema = z.object({
  name: required(120),
  email: z.string().trim().email("email").max(200),
  phone: text(40),
  company: text(120),
  role: text(120),
  contactPreference: optionalChoice("contactPreference"),

  projectType: choice("projectType"),
  description: required(4000),
  goals: choices("goals"),
  audience: text(2000),

  hasWebsite: optionalChoice("hasWebsite"),
  currentUrl: z.union([z.string().trim().url("url").max(500), z.literal("")]),
  assets: choices("assets"),
  inspirations: text(2000),
  competitors: text(2000),

  features: choices("features"),
  integrationsDetail: text(2000),
  hosting: optionalChoice("hosting"),
  maintenance: optionalChoice("maintenance"),

  budget: optionalChoice("budget"),
  deadline: optionalChoice("deadline"),
  deadlineReason: text(300),
  decisionMaker: optionalChoice("decisionMaker"),
  notes: text(4000),

  previewUrl: z.union([z.string().trim().url("url").max(500), z.literal("")]),
  previewPrompt: text(2000),
  previewRating: optionalChoice("previewRating"),
  previewFavorite: optionalChoice("previewFavorite"),
  previewComment: text(2000),

  consent: z.literal(true, "consent"),
});

export type Brief = z.infer<typeof briefSchema>;
export type BriefDraft = Record<string, string | string[] | boolean>;

export const emptyBrief: BriefDraft = {
  ...Object.fromEntries(
    briefSteps(true).flatMap((s) =>
      s.fields.map((f) => [f.name, f.kind === "checkboxes" ? [] : f.kind === "consent" ? false : ""]),
    ),
  ),
  previewRating: "",
  previewFavorite: "",
  previewComment: "",
};

// Erreurs d'une étape : { champ: code } où code ∈ required | email | url | consent | invalid
export function validateStep(step: Step, draft: BriefDraft): Record<string, string> {
  const names = step.fields.map((f) => f.name);
  const result = briefSchema.safeParse(draft);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0]);
    if (!names.includes(field) || errors[field]) continue;
    errors[field] = ["required", "email", "url", "consent"].includes(issue.message) ? issue.message : "required";
  }
  return errors;
}
