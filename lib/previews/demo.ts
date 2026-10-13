import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import { imageToken, type Preview, type PreviewContext } from "./shared";

// Mode démo : trois maquettes construites à partir de modèles, sans appel à l'IA.
// Elles servent à mettre au point le parcours du brief avant de brancher Claude.

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const firstSentence = (s: string, max: number) => {
  const sentence = s.split(/(?<=[.!?])\s/)[0]?.trim() ?? "";
  return sentence.length > max ? `${sentence.slice(0, max - 1).trimEnd()}…` : sentence;
};

const ui = {
  fr: {
    cta: {
      leads: "Demander un devis",
      sales: "Découvrir la boutique",
      audience: "S’abonner",
      default: "Nous contacter",
    },
    services: "Ce que nous proposons",
    gallery: "En images",
    quote: "Un projet ? Parlons-en.",
    rights: "Tous droits réservés",
    fallbackFeatures: ["Un accompagnement sur mesure", "Une expérience fluide", "Des résultats mesurables"],
    fallbackTagline: "Votre activité mérite un site à sa hauteur.",
  },
  en: {
    cta: { leads: "Get a quote", sales: "Shop now", audience: "Subscribe", default: "Contact us" },
    services: "What we offer",
    gallery: "In pictures",
    quote: "Got a project? Let’s talk.",
    rights: "All rights reserved",
    fallbackFeatures: ["Tailored support", "A seamless experience", "Measurable results"],
    fallbackTagline: "Your business deserves a website that matches it.",
  },
};

type Parts = {
  lang: string;
  brand: string;
  tagline: string;
  intro: string;
  cta: string;
  features: string[];
  primary: string;
  secondary: string;
  logo: string | null;
  photos: string[];
  copy: (typeof ui)["fr"];
};

function parts(ctx: PreviewContext): Parts {
  const copy = ui[ctx.locale];
  const featureLabels = (ctx.locale === "en" ? en : fr).Brief.fields.features.options as Record<string, string>;
  const site = ctx.site;
  const brand =
    ctx.company || site?.siteName || site?.title.split(/\s[|·–—-]\s/)[0] || ctx.name.split(" ")[0] || "Studio";
  const tokens = ctx.images.map((img, i) => ({ name: img.name.toLowerCase(), token: imageToken(i) }));
  const logo = tokens.find((t) => t.name.includes("logo"))?.token ?? null;
  const goal = (["leads", "sales", "audience"] as const).find((g) => ctx.goals.includes(g)) ?? "default";
  // Titre court : l'accroche du site actuel, sinon la première phrase du projet, sinon le nom
  const [lead = "", ...others] = ctx.description.split(/(?<=[.!?])\s/);
  const rest = others.join(" ");
  const short = (t: string) => (t && t.length <= 60 ? t : "");
  const heading = short(site?.headline ?? "") || short(lead.trim()) || brand.slice(0, 40) || copy.fallbackTagline;
  return {
    lang: ctx.locale,
    brand: esc(brand.slice(0, 40)),
    tagline: esc(heading),
    intro: esc(firstSentence(heading === lead ? rest : ctx.description, 220) || site?.description || ""),
    cta: copy.cta[goal],
    features: (ctx.features.length ? ctx.features.map((f) => featureLabels[f] ?? f) : copy.fallbackFeatures)
      .slice(0, 6)
      .map(esc),
    primary: site?.colors[0] ?? "",
    secondary: site?.colors[1] ?? "",
    logo,
    photos: tokens.filter((t) => t.token !== logo).map((t) => t.token),
    copy,
  };
}

const head = (p: Parts, fonts: string, css: string) =>
  `<!doctype html><html lang="${p.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${p.brand}</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fonts}&display=swap"><style>*{box-sizing:border-box;margin:0}img{display:block;max-width:100%}a{color:inherit;text-decoration:none}${css}</style></head>`;

const brandMark = (p: Parts, cls: string) =>
  p.logo ? `<img class="${cls}" src="${p.logo}" alt="${p.brand}">` : `<strong class="${cls}">${p.brand}</strong>`;

// 1. Éditorial : clair, typographie à empattements, beaucoup d'air
function editorial(p: Parts) {
  const accent = p.primary || "#b4532a";
  const hero = p.photos[0];
  return `${head(
    p,
    "family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,400&family=Inter:wght@400;600",
    `body{background:#f6f1ea;color:#1d1a16;font:16px/1.6 Inter,sans-serif}.w{max-width:1100px;margin:auto;padding:0 32px}
nav{display:flex;justify-content:space-between;align-items:center;padding:28px 0;border-bottom:1px solid #1d1a1622}.logo{height:32px;font:600 20px Fraunces,serif}
.links{display:flex;gap:28px;font-size:14px}.btn{background:${accent};color:#fff;padding:12px 22px;border-radius:2px;font-weight:600;font-size:14px;display:inline-block}
.hero{display:grid;grid-template-columns:${hero ? "1.2fr 1fr" : "1fr"};gap:56px;align-items:end;padding:96px 0 80px}h1{font:400 clamp(44px,7vw,88px)/1 Fraunces,serif;letter-spacing:-.02em}h1 em{color:${accent}}
.hero p{margin:28px 0 36px;max-width:520px;color:#1d1a16bb;font-size:18px}.hero img{aspect-ratio:4/5;object-fit:cover;width:100%}
h2{font:italic 400 36px Fraunces,serif;margin-bottom:32px}.list{border-top:1px solid #1d1a1622}.list div{display:flex;gap:32px;padding:22px 0;border-bottom:1px solid #1d1a1622;font:400 24px Fraunces,serif}.list span{font:600 13px Inter;color:${accent};padding-top:8px}
section{padding:72px 0}.band{background:#1d1a16;color:#f6f1ea;text-align:center;padding:96px 32px}.band h2{font-size:48px;font-style:normal}
footer{padding:32px 0;font-size:13px;color:#1d1a1699;display:flex;justify-content:space-between}@media(max-width:760px){.hero{grid-template-columns:1fr}.links{display:none}}`,
  )}<body><div class="w"><nav>${brandMark(p, "logo")}<div class="links"><a>${p.copy.services}</a><a>${p.copy.gallery}</a></div><a class="btn">${p.cta}</a></nav>
<div class="hero"><div><h1>${p.tagline.replace(/(\S+)$/, "<em>$1</em>")}</h1><p>${p.intro}</p><a class="btn">${p.cta} →</a></div>${hero ? `<img src="${hero}" alt="">` : ""}</div>
<section><h2>${p.copy.services}</h2><div class="list">${p.features.map((f, i) => `<div><span>0${i + 1}</span>${f}</div>`).join("")}</div></section></div>
<div class="band"><h2>${p.copy.quote}</h2><br><a class="btn">${p.cta}</a></div><div class="w"><footer><span>© ${p.brand}</span><span>${p.copy.rights}</span></footer></div></body></html>`;
}

// 2. Immersif : sombre, dégradés lumineux, grande photo plein cadre
function immersive(p: Parts) {
  const a = p.primary || "#7c5cff";
  const b = p.secondary || "#22d3ee";
  const hero = p.photos[0];
  return `${head(
    p,
    "family=Space+Grotesk:wght@400;500;700",
    `body{background:#07070b;color:#f3f3f7;font:16px/1.6 "Space Grotesk",sans-serif;overflow-x:hidden}
nav{position:absolute;inset:0 0 auto;display:flex;justify-content:space-between;align-items:center;padding:28px 40px;z-index:2}.logo{height:30px;font-size:20px}
.btn{border:1px solid #ffffff40;padding:12px 24px;border-radius:999px;font-size:14px;backdrop-filter:blur(8px);display:inline-block}.btn.solid{background:linear-gradient(90deg,${a},${b});border:0;color:#07070b;font-weight:700}
.hero{position:relative;min-height:92vh;display:flex;align-items:flex-end;padding:0 40px 80px;overflow:hidden}.hero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55}
.glow{position:absolute;width:60vw;height:60vw;border-radius:50%;filter:blur(90px);opacity:.55}.g1{background:${a};top:-20vw;right:-10vw}.g2{background:${b};bottom:-30vw;left:-15vw;opacity:.35}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,#07070b,transparent 60%)}.hero div{position:relative;z-index:1;max-width:900px}
h1{font-size:clamp(46px,8vw,104px);line-height:.95;font-weight:700;letter-spacing:-.04em}.hero p{margin:24px 0 32px;max-width:560px;color:#f3f3f7bb;font-size:18px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;padding:96px 40px}.card{border:1px solid #ffffff1a;border-radius:20px;padding:28px;background:#ffffff06}.card b{display:block;font-size:13px;background:linear-gradient(90deg,${a},${b});-webkit-background-clip:text;color:transparent;margin-bottom:40px}.card h3{font-size:22px;font-weight:500}
.photos{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;padding:0 40px 96px}.photos img{aspect-ratio:1;object-fit:cover;width:100%;border-radius:20px}
footer{padding:40px;border-top:1px solid #ffffff14;display:flex;justify-content:space-between;font-size:13px;color:#f3f3f799}`,
  )}<body><nav>${brandMark(p, "logo")}<a class="btn">${p.cta}</a></nav>
<div class="hero">${hero ? `<img src="${hero}" alt="">` : ""}<span class="glow g1"></span><span class="glow g2"></span><div><h1>${p.tagline}</h1><p>${p.intro}</p><a class="btn solid">${p.cta} →</a></div></div>
<div class="grid">${p.features.map((f, i) => `<div class="card"><b>0${i + 1}</b><h3>${f}</h3></div>`).join("")}</div>
${
  p.photos.length > 1
    ? `<div class="photos">${p.photos
        .slice(1)
        .map((src) => `<img src="${src}" alt="">`)
        .join("")}</div>`
    : ""
}<footer><span>© ${p.brand}</span><span>${p.copy.rights}</span></footer></body></html>`;
}

// 3. Vivant : couleurs franches, formes arrondies, ton chaleureux
function vivid(p: Parts) {
  const a = p.primary || "#ff5a36";
  const b = p.secondary || "#ffd23f";
  return `${head(
    p,
    "family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800",
    `body{background:#fffaf2;color:#141414;font:17px/1.55 "Bricolage Grotesque",sans-serif}.w{max-width:1160px;margin:auto;padding:0 24px}
nav{display:flex;justify-content:space-between;align-items:center;padding:22px 0}.logo{height:34px;font-weight:800;font-size:22px}
.btn{background:#141414;color:#fff;padding:14px 26px;border-radius:999px;font-weight:700;display:inline-block}.btn.alt{background:${b};color:#141414}
.hero{background:${a};color:#fff;border-radius:36px;padding:72px 56px;display:grid;grid-template-columns:${p.photos[0] ? "1.3fr 1fr" : "1fr"};gap:40px;align-items:center;position:relative;overflow:hidden}
.hero::before{content:"";position:absolute;width:320px;height:320px;border-radius:50%;background:${b};right:-90px;top:-110px;opacity:.9}
h1{font-size:clamp(42px,6.5vw,84px);line-height:.98;font-weight:800;letter-spacing:-.03em;position:relative}.hero p{margin:22px 0 30px;max-width:520px;position:relative;opacity:.92}
.hero img{border-radius:28px;aspect-ratio:1;object-fit:cover;width:100%;position:relative;transform:rotate(3deg);border:6px solid #fff}
.chips{display:flex;flex-wrap:wrap;gap:14px;padding:64px 0}.chips span{border:2px solid #141414;border-radius:999px;padding:14px 24px;font-weight:700;font-size:20px}.chips span:nth-child(3n+1){background:${b}}.chips span:nth-child(3n+2){background:${a};color:#fff;border-color:${a}}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;padding-bottom:64px}.tiles img{border-radius:24px;aspect-ratio:4/3;object-fit:cover;width:100%}
.band{background:#141414;color:#fff;border-radius:36px;padding:64px;display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap}.band h2{font-size:40px;font-weight:800}
footer{padding:36px 0;font-size:14px;display:flex;justify-content:space-between;opacity:.7}@media(max-width:760px){.hero{grid-template-columns:1fr;padding:48px 28px}}`,
  )}<body><div class="w"><nav>${brandMark(p, "logo")}<a class="btn">${p.cta}</a></nav>
<div class="hero"><div><h1>${p.tagline}</h1><p>${p.intro}</p><a class="btn alt">${p.cta} →</a></div>${p.photos[0] ? `<img src="${p.photos[0]}" alt="">` : ""}</div>
<div class="chips">${p.features.map((f) => `<span>${f}</span>`).join("")}</div>
${
  p.photos.length > 1
    ? `<div class="tiles">${p.photos
        .slice(1)
        .map((src) => `<img src="${src}" alt="">`)
        .join("")}</div>`
    : ""
}<div class="band"><h2>${p.copy.quote}</h2><a class="btn alt">${p.cta}</a></div>
<footer><span>© ${p.brand}</span><span>${p.copy.rights}</span></footer></div></body></html>`;
}

export function generateDemo(ctx: PreviewContext): Preview[] {
  const p = parts(ctx);
  return [
    { id: "1", direction: "editorial", html: editorial(p) },
    { id: "2", direction: "immersive", html: immersive(p) },
    { id: "3", direction: "vivid", html: vivid(p) },
  ];
}
