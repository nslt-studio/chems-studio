import { initSwup, getSwup } from "./swup.js";
import { initGlobal, resetGlobal, closeFilterAccordion } from "./global.js";
import { home } from "./pages/home.js";
import { details } from "./pages/details.js";
import { information } from "./pages/information.js";
import { works } from "./pages/works.js";

// Registre des pages — routes exactes
const pages = {
  "/": home,
  "/home": home,
};

// Registre par namespace (attribut data-namespace sur le body ou #swup)
const namespaces = {
  details: details,
  information: information,
  projects: works,
  filters: works,
};

// Registre par préfixe d'URL
const prefixes = {
  "/projects/": details,
};

function getPageModule() {
  const path = window.location.pathname;
  if (pages[path]) return pages[path];

  const ns = document.querySelector("[data-namespace]")?.getAttribute("data-namespace");
  if (ns && namespaces[ns]) return namespaces[ns];

  for (const [prefix, mod] of Object.entries(prefixes)) {
    if (path.startsWith(prefix)) return mod;
  }

  return null;
}

function isDetailsPage(path) {
  if (path) return path.startsWith("/projects/");
  const ns = document.querySelector("[data-namespace]")?.getAttribute("data-namespace");
  return ns === "details" || window.location.pathname.startsWith("/projects/");
}

function setNav(hidden, animate) {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  const children = nav.children;

  nav.style.pointerEvents = hidden ? "none" : "auto";

  for (const child of children) {
    if (!animate) {
      child.style.transition = "none";
      child.style.opacity = hidden ? "0" : "";
      child.style.filter = hidden ? "blur(var(--blur))" : "";
    } else {
      child.style.transition = "";
      void child.offsetHeight;
      child.style.transition = "opacity 300ms ease, filter 300ms ease";
      void child.offsetHeight;
      child.style.opacity = hidden ? "0" : "";
      child.style.filter = hidden ? "blur(var(--blur))" : "";
    }
  }
}

function updateCurrentLink() {
  const path = window.location.pathname;
  document
    .querySelectorAll(".w--current")
    .forEach((el) => el.classList.remove("w--current"));
  document
    .querySelectorAll(`a[href="${path}"], a[href="${path}/"]`)
    .forEach((el) => el.classList.add("w--current"));
}

function onPageEnter() {
  resetGlobal();
  updateCurrentLink();
  const page = getPageModule();
  if (page?.init) page.init();
}

function onPageLeave() {
  closeFilterAccordion();
  const page = getPageModule();
  if (page?.cleanup) page.cleanup();
}

// ── Inject CSS ──────────────────────────────────────
const STYLES = `
img, video { opacity: 0; transition: opacity 300ms ease; }
.transition-page { transition: opacity 300ms ease, filter 300ms ease; }
html.is-animating .transition-page { opacity: 0; filter: blur(calc(2 * var(--blur))); }
`;
const styleEl = document.createElement("style");
styleEl.textContent = STYLES;
document.head.appendChild(styleEl);

// Boot
document.addEventListener("DOMContentLoaded", () => {
  initGlobal();
  initSwup();

  const swup = getSwup();

  // Animer la nav dès le début de la transition (on connaît la destination)
  swup.hooks.on("visit:start", (visit) => {
    const goingToDetails = isDetailsPage(visit.to.url);
    setNav(goingToDetails, true);
    onPageLeave();
  });

  // Après chaque transition — nouvelle page affichée
  swup.hooks.on("content:replace", () => onPageEnter());

  // Init de la première page
  setNav(isDetailsPage(), false);
  const page = getPageModule();
  if (page?.init) page.init();
});
