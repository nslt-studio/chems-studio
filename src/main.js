import { initSwup, getSwup } from "./swup.js";
import { initGlobal, resetGlobal, closeFilterAccordion } from "./global.js";
import { home } from "./pages/home.js";

// Registre des pages — ajouter ici chaque nouvelle page
const pages = {
  "/": home,
  "/home": home,
};

function getPageModule() {
  const path = window.location.pathname;
  return pages[path] || null;
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

// Boot
document.addEventListener("DOMContentLoaded", () => {
  initGlobal();
  initSwup();

  const swup = getSwup();

  // Après chaque transition — nouvelle page affichée
  swup.hooks.on("content:replace", () => onPageEnter());

  // Avant chaque transition — page actuelle va disparaître
  swup.hooks.on("visit:start", () => onPageLeave());

  // Init de la première page
  const page = getPageModule();
  if (page?.init) page.init();
});
