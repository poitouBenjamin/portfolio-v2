// Tout le contenu du site est ici. Les valeurs marquées TODO sont à compléter.

export const profile = {
  name: "Benjamin Poitou",
  title: "Développeur Fullstack JS",
  tagline: "Je transforme vos besoins en applications web rapides, simples et maintenables.",
  location: "Paris · remote",
  status: "Freelance",
  years: 6,
  email: "poitoubenjamin@gmail.com",
  phone: "+33 6 00 00 00 00", // TODO: vrai numéro
  github: "https://github.com/", // TODO: URL GitHub
  linkedin: "https://www.linkedin.com/", // TODO: URL LinkedIn
};

export const bio = [
  "D’abord ingénieur en mécanique, je suis devenu développeur full stack par goût de construire des choses utiles. Mon parcours m’a appris à écouter, comprendre le besoin, poser les bonnes questions, puis livrer un produit propre.",
  "Basé à Paris, mon objectif se résume à choisir les bons outils, tester, et livrer un produit dont je maîtrise chaque détail.",
];

export const services = [
  {
    title: "Applications web sur mesure",
    text: "Un outil pensé pour votre métier, du premier écran à la mise en ligne.",
  },
  {
    title: "API et back-end",
    text: "Des données fiables, des intégrations propres avec vos outils existants.",
  },
  {
    title: "Refonte et modernisation",
    text: "Un site ou une application qui vieillit ? Je le remets à niveau sans tout casser.",
  },
  {
    title: "Maintenance et évolution",
    text: "Corrections, nouvelles fonctionnalités, performances : votre produit continue d’avancer.",
  },
];

export type Project = {
  name: string;
  client: string;
  year?: string;
  status?: string;
  need: string;
  done: string[];
  stack: string[];
  url?: string;
  urlLabel?: string;
};

export const projects: Project[] = [
  {
    name: "AMI du quartier",
    client: "AMI Paris",
    need: "Faire vivre le flagship du Marais : inviter les clients à partager leurs « moments d’amitié » géolocalisés dans le quartier, pour créer du lien avec la marque et ramener du monde en boutique.",
    done: [
      "Carte interactive à deux niveaux : les grandes zones du quartier, puis chaque lieu au zoom",
      "Adresses privées anonymisées et regroupées par rue, lieux d’intérêt épinglés individuellement",
      "Filtres par type de moment, pilotés depuis le back-office",
      "Feed qui alterne contributions perso, communauté, sélection AMI et contenus de la marque selon le profil de l’utilisateur",
    ],
    stack: ["JavaScript", "Cartographie"], // TODO: stack exacte
    url: "https://family.amiparis.com/fr",
    urlLabel: "family.amiparis.com",
  },
  {
    name: "Depuis 1926",
    client: "FC Lorient",
    need: "Célébrer les 100 ans du club avec un site dédié à son histoire et à ses supporters.",
    done: ["Participation au développement du site du centenaire"], // TODO: détailler ta partie
    stack: ["JavaScript"], // TODO
    url: "https://depuis1926.fclorient.bzh/",
    urlLabel: "depuis1926.fclorient.bzh",
  },
  {
    name: "ADI Global",
    client: "ADI",
    need: "Un site international pour présenter l’offre et les services du distributeur.", // TODO: à valider
    done: ["Participation au développement du site"], // TODO: détailler ta partie
    stack: ["JavaScript"], // TODO
    url: "https://www.adiglobal.com/",
    urlLabel: "adiglobal.com",
  },
  {
    name: "Transaction immobilière",
    client: "Foncia · Emeria group",
    status: "Mission en cours",
    need: "Outiller l’activité de transaction immobilière d’un des leaders européens de la gestion immobilière.",
    done: ["Développement de la partie transaction immobilière"], // TODO: détailler
    stack: ["JavaScript"], // TODO
  },
];

export const method = [
  { title: "Écouter", text: "On part de votre besoin réel, pas d’une solution toute faite." },
  { title: "Comprendre", text: "Je pose les bonnes questions pour lever les zones d’ombre avant d’écrire du code." },
  { title: "Tester", text: "Je choisis les bons outils et je vérifie chaque fonctionnalité avant de la livrer." },
  { title: "Livrer", text: "Un produit propre, documenté, dont je maîtrise chaque détail." },
];

const dev = (path: string) => `https://cdn.jsdelivr.net/gh/devicons/devicon@v2.17.0/icons/${path}.svg`;
const si = (slug: string) => `https://cdn.jsdelivr.net/npm/simple-icons@16.34.0/icons/${slug}.svg`;

// invert : logo monochrome noir, à passer en blanc sur fond sombre
// mono : logo multicolore peu lisible sur fond sombre, affiché en blanc uni
export type Skill = { name: string; logo?: string; invert?: boolean; mono?: boolean };

export const skills: { title: string; items: Skill[] }[] = [
  {
    title: "Langages",
    items: [
      { name: "HTML5", logo: dev("html5/html5-original") },
      { name: "CSS3", logo: dev("css3/css3-original") },
      { name: "JavaScript ES6+", logo: dev("javascript/javascript-plain") },
      { name: "TypeScript", logo: dev("typescript/typescript-original") },
      { name: "Java", logo: dev("java/java-original") },
      { name: "C", logo: dev("c/c-line") },
      { name: "Matlab", logo: dev("matlab/matlab-original") },
      { name: "SQL", logo: dev("azuresqldatabase/azuresqldatabase-original") },
    ],
  },
  {
    title: "Frameworks & librairies",
    items: [
      { name: "Node.js", logo: dev("nodejs/nodejs-original") },
      { name: "React", logo: dev("react/react-original") },
      { name: "Next.js", logo: dev("nextjs/nextjs-original"), invert: true },
      { name: "Spring", logo: dev("spring/spring-original") },
      { name: "Tailwind", logo: dev("tailwindcss/tailwindcss-original") },
      { name: "shadcn/ui", logo: si("shadcnui"), invert: true },
    ],
  },
  {
    title: "Bases de données",
    items: [
      { name: "MySQL", logo: dev("mysql/mysql-original") },
      { name: "PostgreSQL", logo: dev("postgresql/postgresql-original") },
      { name: "JDBC" },
      { name: "Hibernate", logo: dev("hibernate/hibernate-original") },
    ],
  },
  {
    title: "Cloud & DevOps",
    items: [
      { name: "AWS", logo: dev("amazonwebservices/amazonwebservices-original-wordmark"), mono: true },
      { name: "Docker", logo: dev("docker/docker-original") },
      { name: "Datadog", logo: dev("datadog/datadog-original"), mono: true },
      { name: "Review apps" },
      { name: "Vercel", logo: dev("vercel/vercel-original"), invert: true },
      { name: "GCP", logo: dev("googlecloud/googlecloud-original") },
    ],
  },
  {
    title: "Outils",
    items: [
      { name: "VS Code", logo: dev("vscode/vscode-original") },
      { name: "IntelliJ IDEA", logo: dev("intellij/intellij-original") },
      { name: "Git", logo: dev("git/git-original") },
    ],
  },
  {
    title: "IA",
    items: [
      { name: "GitHub Copilot", logo: si("githubcopilot"), invert: true },
      { name: "Cursor", logo: si("cursor"), invert: true },
      { name: "Claude Code", logo: si("claude"), invert: true },
    ],
  },
  {
    title: "Conception & CMS",
    items: [
      { name: "UML", logo: dev("unifiedmodelinglanguage/unifiedmodelinglanguage-original") },
      { name: "Prismic", logo: si("prismic"), invert: true },
      { name: "Sanity", logo: dev("sanity/sanity-original") },
      { name: "WordPress", logo: dev("wordpress/wordpress-plain"), invert: true },
      { name: "Figma", logo: dev("figma/figma-original") },
    ],
  },
];
