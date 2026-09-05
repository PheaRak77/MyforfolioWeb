/**
 * Maps skill names to their official SVG icon URLs from CDN.
 * Uses cdn.jsdelivr.net/npm/simple-icons (no npm install needed).
 * If no match found, returns null so the component falls back to initials.
 */

const BASE = "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons";

// Map of skill name keywords → Simple Icons slug
const ICON_MAP = {
  // Languages & Markup
  html: `${BASE}/html5.svg`,
  "html&css": `${BASE}/html5.svg`,
  "html5": `${BASE}/html5.svg`,
  css: `${BASE}/css3.svg`,
  css3: `${BASE}/css3.svg`,
  javascript: `${BASE}/javascript.svg`,
  "js": `${BASE}/javascript.svg`,
  typescript: `${BASE}/typescript.svg`,
  python: `${BASE}/python.svg`,
  java: `${BASE}/openjdk.svg`,
  php: `${BASE}/php.svg`,
  "c++": `${BASE}/cplusplus.svg`,
  "c#": `${BASE}/csharp.svg`,
  ruby: `${BASE}/ruby.svg`,
  go: `${BASE}/go.svg`,
  rust: `${BASE}/rust.svg`,
  swift: `${BASE}/swift.svg`,
  kotlin: `${BASE}/kotlin.svg`,
  dart: `${BASE}/dart.svg`,
  r: `${BASE}/r.svg`,
  bash: `${BASE}/gnubash.svg`,
  shell: `${BASE}/gnubash.svg`,
  powershell: `${BASE}/powershell.svg`,

  // Frontend Frameworks
  react: `${BASE}/react.svg`,
  "react js": `${BASE}/react.svg`,
  "react native": `${BASE}/react.svg`,
  "reactjs": `${BASE}/react.svg`,
  vue: `${BASE}/vuedotjs.svg`,
  "vue.js": `${BASE}/vuedotjs.svg`,
  vuejs: `${BASE}/vuedotjs.svg`,
  angular: `${BASE}/angular.svg`,
  svelte: `${BASE}/svelte.svg`,
  nextjs: `${BASE}/nextdotjs.svg`,
  "next.js": `${BASE}/nextdotjs.svg`,
  nuxt: `${BASE}/nuxtdotjs.svg`,
  "nuxt.js": `${BASE}/nuxtdotjs.svg`,
  gatsby: `${BASE}/gatsby.svg`,
  remix: `${BASE}/remix.svg`,
  vite: `${BASE}/vite.svg`,
  webpack: `${BASE}/webpack.svg`,

  // CSS Frameworks & UI
  tailwind: `${BASE}/tailwindcss.svg`,
  tailwindcss: `${BASE}/tailwindcss.svg`,
  "tailwidcss&bootstrap": `${BASE}/tailwindcss.svg`,
  "tailwidcss": `${BASE}/tailwindcss.svg`,
  bootstrap: `${BASE}/bootstrap.svg`,
  material: `${BASE}/mui.svg`,
  "material ui": `${BASE}/mui.svg`,
  mui: `${BASE}/mui.svg`,
  chakra: `${BASE}/chakraui.svg`,
  sass: `${BASE}/sass.svg`,
  scss: `${BASE}/sass.svg`,
  styled: `${BASE}/styledcomponents.svg`,
  shadcn: `${BASE}/shadcnui.svg`,

  // Backend Frameworks
  node: `${BASE}/nodedotjs.svg`,
  "node js": `${BASE}/nodedotjs.svg`,
  nodejs: `${BASE}/nodedotjs.svg`,
  "node.js": `${BASE}/nodedotjs.svg`,
  express: `${BASE}/express.svg`,
  "express js": `${BASE}/express.svg`,
  expressjs: `${BASE}/express.svg`,
  fastapi: `${BASE}/fastapi.svg`,
  django: `${BASE}/django.svg`,
  flask: `${BASE}/flask.svg`,
  laravel: `${BASE}/laravel.svg`,
  "php/laravel": `${BASE}/laravel.svg`,
  "laravel/php": `${BASE}/laravel.svg`,
  symfony: `${BASE}/symfony.svg`,
  spring: `${BASE}/spring.svg`,
  "spring boot": `${BASE}/springboot.svg`,
  nestjs: `${BASE}/nestjs.svg`,
  fastify: `${BASE}/fastify.svg`,
  hono: `${BASE}/hono.svg`,
  rails: `${BASE}/rubyonrails.svg`,

  // Databases
  mysql: `${BASE}/mysql.svg`,
  postgresql: `${BASE}/postgresql.svg`,
  postgres: `${BASE}/postgresql.svg`,
  mongodb: `${BASE}/mongodb.svg`,
  mongo: `${BASE}/mongodb.svg`,
  sqlite: `${BASE}/sqlite.svg`,
  redis: `${BASE}/redis.svg`,
  firebase: `${BASE}/firebase.svg`,
  supabase: `${BASE}/supabase.svg`,
  prisma: `${BASE}/prisma.svg`,
  oracle: `${BASE}/oracle.svg`,
  mariadb: `${BASE}/mariadb.svg`,
  neo4j: `${BASE}/neo4j.svg`,
  cassandra: `${BASE}/apachecassandra.svg`,

  // DevOps & Cloud
  docker: `${BASE}/docker.svg`,
  kubernetes: `${BASE}/kubernetes.svg`,
  aws: `${BASE}/amazonwebservices.svg`,
  "amazon": `${BASE}/amazonwebservices.svg`,
  gcp: `${BASE}/googlecloud.svg`,
  "google cloud": `${BASE}/googlecloud.svg`,
  azure: `${BASE}/microsoftazure.svg`,
  vercel: `${BASE}/vercel.svg`,
  netlify: `${BASE}/netlify.svg`,
  heroku: `${BASE}/heroku.svg`,
  "digital ocean": `${BASE}/digitalocean.svg`,
  digitalocean: `${BASE}/digitalocean.svg`,
  nginx: `${BASE}/nginx.svg`,
  apache: `${BASE}/apache.svg`,
  jenkins: `${BASE}/jenkins.svg`,
  github: `${BASE}/github.svg`,
  "gr&github": `${BASE}/github.svg`,
  "git&github": `${BASE}/github.svg`,
  gitlab: `${BASE}/gitlab.svg`,
  git: `${BASE}/git.svg`,
  linux: `${BASE}/linux.svg`,
  ubuntu: `${BASE}/ubuntu.svg`,
  centos: `${BASE}/centos.svg`,
  ansible: `${BASE}/ansible.svg`,
  terraform: `${BASE}/terraform.svg`,
  "github actions": `${BASE}/githubactions.svg`,
  "ci/cd": `${BASE}/githubactions.svg`,
  render: `${BASE}/render.svg`,

  // AI & ML
  tensorflow: `${BASE}/tensorflow.svg`,
  pytorch: `${BASE}/pytorch.svg`,
  "scikit-learn": `${BASE}/scikitlearn.svg`,
  scikit: `${BASE}/scikitlearn.svg`,
  "mediapipe": `${BASE}/google.svg`,
  opencv: `${BASE}/opencv.svg`,
  keras: `${BASE}/keras.svg`,
  numpy: `${BASE}/numpy.svg`,
  pandas: `${BASE}/pandas.svg`,
  matplotlib: `${BASE}/python.svg`,
  jupyter: `${BASE}/jupyter.svg`,
  huggingface: `${BASE}/huggingface.svg`,
  "hugging face": `${BASE}/huggingface.svg`,
  "langchain": `${BASE}/langchain.svg`,

  // Tools & Others
  figma: `${BASE}/figma.svg`,
  photoshop: `${BASE}/adobephotoshop.svg`,
  illustrator: `${BASE}/adobeillustrator.svg`,
  xd: `${BASE}/adobexd.svg`,
  postman: `${BASE}/postman.svg`,
  insomnia: `${BASE}/insomnia.svg`,
  vscode: `${BASE}/visualstudiocode.svg`,
  "visual studio": `${BASE}/visualstudio.svg`,
  intellij: `${BASE}/intellijidea.svg`,
  graphql: `${BASE}/graphql.svg`,
  rest: `${BASE}/postman.svg`,
  restapi: `${BASE}/postman.svg`,
  "rest api": `${BASE}/postman.svg`,
  socketio: `${BASE}/socketdotio.svg`,
  "socket.io": `${BASE}/socketdotio.svg`,
  jwt: `${BASE}/jsonwebtokens.svg`,
  cloudinary: `${BASE}/cloudinary.svg`,
  stripe: `${BASE}/stripe.svg`,
  npm: `${BASE}/npm.svg`,
  yarn: `${BASE}/yarn.svg`,
  pnpm: `${BASE}/pnpm.svg`,
  jira: `${BASE}/jira.svg`,
  notion: `${BASE}/notion.svg`,
  slack: `${BASE}/slack.svg`,
  trello: `${BASE}/trello.svg`,
  "three.js": `${BASE}/threedotjs.svg`,
  threejs: `${BASE}/threedotjs.svg`,
  electron: `${BASE}/electron.svg`,
  flutter: `${BASE}/flutter.svg`,
  expo: `${BASE}/expo.svg`,
  wordpress: `${BASE}/wordpress.svg`,
  shopify: `${BASE}/shopify.svg`,
  framer: `${BASE}/framer.svg`,
  "framer motion": `${BASE}/framer.svg`,
  astro: `${BASE}/astro.svg`,
  storybook: `${BASE}/storybook.svg`,
  vitest: `${BASE}/vitest.svg`,
  jest: `${BASE}/jest.svg`,
  cypress: `${BASE}/cypress.svg`,
  playwright: `${BASE}/playwright.svg`,
};

/**
 * Given a skill name (from the database), returns the best matching icon URL.
 * Performs case-insensitive fuzzy lookup using keyword matching.
 *
 * @param {string} skillName - The skill name from the database
 * @param {string|null} storedIcon - The icon value already stored in the DB (if any)
 * @returns {string|null} - Icon CDN URL, or null to fall back to initials
 */
export const getSkillIconUrl = (skillName, storedIcon = null) => {
  // If DB already has a valid icon URL, use that
  if (storedIcon && typeof storedIcon === "string" && storedIcon.trim().startsWith("http")) {
    return storedIcon.trim();
  }

  if (!skillName || typeof skillName !== "string") return null;

  const normalized = skillName.toLowerCase().trim();

  // 1. Exact match
  if (ICON_MAP[normalized]) return ICON_MAP[normalized];

  // 2. Check if any key is contained in the skill name
  for (const [key, url] of Object.entries(ICON_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return url;
    }
  }

  return null;
};
