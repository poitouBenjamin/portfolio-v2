import { generatePreviews } from "@/lib/previews";
import { getEsquisse, saveEsquisse, type Esquisse } from "@/lib/previews/store";
import { sendReviewEmail } from "./emails";
import { renderThumbnails } from "./thumbnails";

// Esquisses : à l'envoi du brief, trois directions sont générées en arrière-plan.
// Benjamin les relit, puis les envoie au client, qui découvre la première
// et débloque les deux autres sur la page /esquisses/[id].

/** Génère les esquisses et leurs vignettes, puis prévient Benjamin qu'elles sont à relire */
export async function prepareEsquisses(id: string, origin: string) {
  const e = await getEsquisse(id);
  if (!e) return;
  const { brief } = e;
  try {
    const { previews } = await generatePreviews({
      locale: e.locale,
      url: brief.previewUrl || brief.currentUrl,
      prompt: brief.previewPrompt,
      name: brief.name,
      company: brief.company,
      projectType: brief.projectType,
      description: brief.description,
      audience: brief.audience,
      goals: brief.goals,
      features: brief.features,
      images: e.images,
    });
    const thumbs = await renderThumbnails(previews, e.images);
    const ready: Esquisse = { ...e, previews, thumbs, status: "draft" };
    await saveEsquisse(ready);
    await sendReviewEmail(ready, origin);
  } catch (error) {
    console.error("[esquisses] échec de la préparation", id, error);
    const failed: Esquisse = { ...e, status: "failed" };
    await saveEsquisse(failed);
    await sendReviewEmail(failed, origin).catch(() => {});
  }
}
