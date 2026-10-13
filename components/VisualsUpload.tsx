"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { MAX_IMAGE_CHARS, MAX_IMAGES, type PreviewImage } from "@/lib/previews/shared";

const ghost = "rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold transition hover:border-fog";

// Réduit l'image dans le navigateur avant envoi : les requêtes restent légères
async function compress(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  for (const [max, quality] of [
    [1400, 0.82],
    [1000, 0.7],
    [700, 0.6],
  ]) {
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL("image/webp", quality);
    if (url.length <= MAX_IMAGE_CHARS) return url; // PNG si le navigateur ne sait pas encoder en WebP
  }
  throw new Error("too_large");
}

// Étape Esquisses du brief : le client joint ses visuels, les esquisses arrivent par email
export default function VisualsUpload({
  images,
  setImages,
}: {
  images: PreviewImage[];
  setImages: (images: PreviewImage[]) => void;
}) {
  const t = useTranslations();
  const [uploadError, setUploadError] = useState(false);

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    setUploadError(false);
    const room = MAX_IMAGES - images.length;
    const added: PreviewImage[] = [];
    for (const file of [...files].filter((f) => f.type.startsWith("image/")).slice(0, room)) {
      try {
        added.push({ name: file.name.slice(0, 120), dataUrl: await compress(file) });
      } catch {
        setUploadError(true);
      }
    }
    setImages([...images, ...added]);
  };

  return (
    <div className="space-y-8">
      <p className="rounded-2xl border border-acid/25 bg-acid/5 px-5 py-4 text-sm text-fog/90">
        {t("Brief.sketches.intro")}
      </p>
      <div>
        <p className="mb-1 font-medium">{t("Brief.sketches.uploadLabel")}</p>
        <p className="mb-3 text-sm text-muted">{t("Brief.sketches.uploadHint", { max: MAX_IMAGES })}</p>
        <div className="flex flex-wrap items-center gap-3">
          {images.map((img, i) => (
            <div
              key={`${img.name}-${i}`}
              className="relative h-20 w-20 overflow-hidden rounded-xl border border-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local en data URL */}
              <img src={img.dataUrl} alt={img.name} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setImages(images.filter((_, j) => j !== i))}
                aria-label={t("Brief.sketches.remove", { name: img.name })}
                className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-void/80 text-xs transition hover:bg-red-500"
              >
                ✕
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <label className={`${ghost} cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-acid`}>
              + {t("Brief.sketches.uploadButton")}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                className="sr-only"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
        {uploadError && <p className="mt-2 text-sm text-red-300">{t("Brief.sketches.uploadError")}</p>}
      </div>
    </div>
  );
}
