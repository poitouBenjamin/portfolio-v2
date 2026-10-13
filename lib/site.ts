// Données indépendantes de la langue. Les textes traduits sont dans messages/{fr,en}.json.

export const profile = {
  name: "Benjamin Poitou",
  years: 6,
  email: "poitou.benjamin.dev@gmail.com",
  phone: "+33 6 80 64 42 13",
  github: "https://github.com/poitouBenjamin/portfolio-v2",
  linkedin: "https://www.linkedin.com/in/benjamin-poitou-dev/",
};

// Réalisations et Stack sont mises de côté : le site se concentre sur la prestation.
// Elles partiront sur un site portfolio à part. Pour les réafficher, repasser à true
// et renuméroter les libellés (NN) des sections dans messages/{fr,en}.json.
export const showPortfolio = false;

export type Project = {
  /** Clé dans messages/*.json → Projects.items */
  id: "om" | "ami" | "fcl" | "pgw" | "foncia";
  client: string;
  /** Projet phare : carte pleine largeur en tête de section */
  featured?: boolean;
  /** Studio avec lequel le projet a été réalisé */
  studio?: string;
  ongoing?: boolean;
  stack: string[];
  /** Capture du site, dans public/projects */
  preview: string;
  url?: string;
  /** Domaine affiché dans la barre de la fenêtre et sur le lien */
  urlLabel: string;
};

// Les fichiers de traduction (i18n) sont communs à tous les projets
export const projects: Project[] = [
  {
    id: "om",
    studio: "Velours",
    client: "Olympique de Marseille",
    featured: true,
    stack: ["Next.js", "Tailwind", "shadcn/ui", "Sanity", "Stats Perform", "ReachFive", "i18n", "Vercel"],
    preview: "/projects/om-match.webp",
    url: "https://www.om.fr/",
    urlLabel: "om.fr",
  },
  {
    id: "ami",
    studio: "Velours",
    client: "AMI Paris",
    stack: ["Next.js", "Tailwind", "shadcn/ui", "Sanity", "Custom back-office", "i18n", "Vercel"],
    preview: "/projects/ami.webp",
    url: "https://family.amiparis.com/fr",
    urlLabel: "family.amiparis.com",
  },
  {
    id: "fcl",
    studio: "Velours",
    client: "FC Lorient",
    stack: ["Next.js", "Tailwind", "shadcn/ui", "WordPress headless", "i18n", "Vercel"],
    preview: "/projects/fcl.webp",
    url: "https://depuis1926.fclorient.bzh/",
    urlLabel: "depuis1926.fclorient.bzh",
  },
  {
    id: "pgw",
    studio: "Velours",
    client: "Paris Games Week",
    stack: ["Next.js", "Tailwind", "shadcn/ui", "Sanity", "i18n", "Vercel"],
    preview: "/projects/pgw.webp",
    url: "https://www.parisgamesweek.com/",
    urlLabel: "parisgamesweek.com",
  },
  {
    id: "foncia",
    client: "Emeria · groupe Foncia",
    ongoing: true,
    stack: ["React", "Node.js", "Microservices", "Docker", "GitLab CI", "Verdaccio"],
    // ERP interne : pas de lien public, on illustre avec le site grand public
    preview: "/projects/foncia.webp",
    urlLabel: "foncia.com",
  },
];

const dev = (path: string) => `https://cdn.jsdelivr.net/gh/devicons/devicon@v2.17.0/icons/${path}.svg`;
const si = (slug: string) => `https://cdn.jsdelivr.net/npm/simple-icons@16.34.0/icons/${slug}.svg`;

// invert : logo monochrome noir, à passer en blanc sur fond sombre
// mono : logo multicolore peu lisible sur fond sombre, affiché en blanc uni
export type Skill = { name: string; logo?: string; invert?: boolean; mono?: boolean };

export type SkillCategory = {
  /** Clé dans messages/*.json → Devs.categories */
  id: "frontend" | "backend" | "data" | "devops" | "cms" | "workflow" | "scientific";
  items: Skill[];
};

// Regroupé par usage dans un projet plutôt que par type de techno
export const skills: SkillCategory[] = [
  {
    id: "frontend",
    items: [
      { name: "TypeScript", logo: dev("typescript/typescript-original") },
      { name: "JavaScript ES6+", logo: dev("javascript/javascript-plain") },
      { name: "React", logo: dev("react/react-original") },
      { name: "Next.js", logo: dev("nextjs/nextjs-original"), invert: true },
      { name: "Tailwind", logo: dev("tailwindcss/tailwindcss-original") },
      { name: "shadcn/ui", logo: si("shadcnui"), invert: true },
      { name: "HTML5", logo: dev("html5/html5-original") },
      { name: "CSS3", logo: dev("css3/css3-original") },
    ],
  },
  {
    id: "backend",
    items: [
      { name: "Node.js", logo: dev("nodejs/nodejs-original") },
      { name: "Mongoose", logo: dev("mongoose/mongoose-original") },
      { name: "Java", logo: dev("java/java-original") },
      { name: "Spring", logo: dev("spring/spring-original") },
      { name: "Hibernate", logo: dev("hibernate/hibernate-original") },
      { name: "JDBC" },
    ],
  },
  {
    id: "data",
    items: [
      { name: "MongoDB", logo: dev("mongodb/mongodb-original") },
      { name: "PostgreSQL", logo: dev("postgresql/postgresql-original") },
      { name: "MySQL", logo: dev("mysql/mysql-original") },
      { name: "SQL", logo: dev("azuresqldatabase/azuresqldatabase-original") },
      // Synchronise MongoDB vers Elasticsearch, pas de logo officiel
      { name: "Monstache" },
    ],
  },
  {
    id: "devops",
    items: [
      { name: "Docker", logo: dev("docker/docker-original") },
      { name: "AWS", logo: dev("amazonwebservices/amazonwebservices-original-wordmark"), mono: true },
      { name: "GCP", logo: dev("googlecloud/googlecloud-original") },
      { name: "Vercel", logo: dev("vercel/vercel-original"), invert: true },
      { name: "GitLab CI", logo: dev("gitlab/gitlab-original") },
      { name: "Datadog", logo: dev("datadog/datadog-original"), mono: true },
      { name: "Verdaccio", logo: si("verdaccio"), invert: true },
      { name: "Review apps" },
    ],
  },
  {
    id: "cms",
    items: [
      { name: "Figma", logo: dev("figma/figma-original") },
      { name: "Sanity", logo: dev("sanity/sanity-original") },
      { name: "Prismic", logo: si("prismic"), invert: true },
      { name: "WordPress", logo: dev("wordpress/wordpress-plain"), invert: true },
    ],
  },
  {
    id: "workflow",
    items: [
      { name: "Git", logo: dev("git/git-original") },
      { name: "VS Code", logo: dev("vscode/vscode-original") },
      { name: "IntelliJ IDEA", logo: dev("intellij/intellij-original") },
      { name: "Claude Code", logo: si("claude"), invert: true },
      { name: "Cursor", logo: si("cursor"), invert: true },
      { name: "GitHub Copilot", logo: si("githubcopilot"), invert: true },
    ],
  },
  {
    // Calcul scientifique, hérité de la formation d'ingénieur mécanique
    id: "scientific",
    items: [
      { name: "UML", logo: dev("unifiedmodelinglanguage/unifiedmodelinglanguage-original") },
      { name: "C", logo: dev("c/c-line") },
      { name: "Matlab", logo: dev("matlab/matlab-original") },
    ],
  },
];
