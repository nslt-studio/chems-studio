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

function setNav(hidden) {
  const nav = document.querySelector(".nav");
  if (!nav) return;

  const filters = document.querySelector(".filters");
  const elements = [...nav.children, ...(filters ? [...filters.children] : [])];

  for (const el of elements) {
    el.style.opacity = hidden ? "0" : "";
    el.style.filter = hidden ? "blur(var(--blur))" : "";
    el.style.pointerEvents = hidden ? "none" : "";
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
  // Mémoriser la dernière page non-details pour le bouton close
  if (!isDetailsPage()) {
    window.__detailsBackUrl = window.location.pathname;
  }
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

// ── Loader ────────────────────────────────────────────
function initLoader() {
  const loader = document.querySelector(".loader");
  if (!loader) return;

  if (sessionStorage.getItem("loaderShown")) {
    loader.remove();
    return;
  }
  sessionStorage.setItem("loaderShown", "1");

  const target = loader.querySelector(".loader-logo");
  if (!target) return;

  // Wrapper pour l'overlay positionné en absolu
  const wrapper = document.createElement("span");
  wrapper.style.cssText = "position:relative;display:inline-block;";
  target.parentNode.insertBefore(wrapper, target);
  wrapper.appendChild(target);

  // Overlay : même image opacity 1, clip-path révèle de bas en haut (le contenu reste fixe)
  const overlay = target.cloneNode(true);
  overlay.style.cssText = "position:absolute;inset:0;opacity:1;clip-path:inset(100% 0 0 0);";
  wrapper.appendChild(overlay);

  setTimeout(() => {
    overlay.style.transition = "clip-path 1200ms cubic-bezier(0.7, 0, 0.25, 1)";
    requestAnimationFrame(() => { overlay.style.clipPath = "inset(0% 0 0 0)"; });

    setTimeout(() => {
      loader.style.transition = "opacity 300ms ease, filter 300ms ease";
      requestAnimationFrame(() => {
        loader.style.opacity = "0";
        loader.style.filter = "blur(calc(2 * var(--blur, 20px)))";
        loader.addEventListener("transitionend", () => loader.remove(), { once: true });
      });
    }, 1500);

  }, 600);
}

// Boot
document.addEventListener("DOMContentLoaded", () => {
  initLoader();
  initGlobal();
  initSwup();

  const swup = getSwup();

  // Animer la nav dès le début de la transition (on connaît la destination)
  swup.hooks.on("visit:start", (visit) => {
    const goingToDetails = isDetailsPage(visit.to.url);
    setNav(goingToDetails);
    onPageLeave();
  });

  // Après chaque transition — nouvelle page affichée
  swup.hooks.on("content:replace", () => onPageEnter());

  // Init de la première page
  const onDetails = isDetailsPage();
  setNav(onDetails);
  if (!onDetails) window.__detailsBackUrl = window.location.pathname;
  const page = getPageModule();
  if (page?.init) page.init();
});
