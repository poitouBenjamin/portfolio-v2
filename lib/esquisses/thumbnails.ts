import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import sharp from "sharp";
import { scramble } from "@/lib/previews/lock";
import { fillImages, FREE_PREVIEW_ID, type Preview, type PreviewImage } from "@/lib/previews/shared";
import type { Thumbs } from "@/lib/previews/store";

// Vignettes des esquisses pour les emails : capture du haut de page dans un Chrome sans
// interface, réduite en JPEG. Les esquisses payantes ont aussi une version floutée,
// capturée à partir du texte brouillé : même zoomée, elle ne livre rien.

const WIDTH = 1280;
const HEIGHT = 800;
const THUMB_WIDTH = 600;

// En ligne : Chromium allégé pour les fonctions Vercel. En local : le Chrome installé.
const localChrome =
  process.env.CHROME_PATH ??
  (process.platform === "win32"
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : "/usr/bin/google-chrome");

const launch = async () =>
  process.env.VERCEL
    ? puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true })
    : puppeteer.launch({ executablePath: localChrome, headless: true });

export async function renderThumbnails(previews: Preview[], images: PreviewImage[]): Promise<Thumbs> {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT });
    const shot = async (html: string) => {
      // Les polices Google peuvent tarder : on n'attend pas plus de quelques secondes
      await page.setContent(fillImages(html, images), { waitUntil: "load", timeout: 15_000 }).catch(() => {});
      return Buffer.from(await page.screenshot({ type: "png" }));
    };

    const thumbs: Thumbs = {};
    for (const p of previews) {
      const clear = await sharp(await shot(p.html))
        .resize(THUMB_WIDTH)
        .jpeg({ quality: 82 })
        .toBuffer();
      const blurred =
        p.id === FREE_PREVIEW_ID
          ? ""
          : (
              await sharp(await shot(scramble(p.html)))
                .resize(THUMB_WIDTH)
                .blur(14)
                .jpeg({ quality: 70 })
                .toBuffer()
            ).toString("base64");
      thumbs[p.id] = { clear: clear.toString("base64"), blurred };
    }
    return thumbs;
  } finally {
    await browser.close();
  }
}
