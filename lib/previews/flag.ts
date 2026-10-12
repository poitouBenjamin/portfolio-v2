// L'étape « Aperçu IA » du brief reste invisible en production tant qu'elle n'est pas validée :
// active en local et sur les previews Vercel, ou partout avec BRIEF_PREVIEWS=1.
// Lu côté serveur uniquement : la page transmet le résultat au formulaire.
export const previewsEnabled = () => process.env.VERCEL_ENV !== "production" || process.env.BRIEF_PREVIEWS === "1";
