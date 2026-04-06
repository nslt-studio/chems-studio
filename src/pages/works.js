import { scrambleText } from "../scramble.js";

let listeners = [];
// Map<element, cancel()>
const activeCancels = new Map();

function handleItemEnter(e) {
  const item = e.currentTarget;
  item.querySelectorAll("[scramble]").forEach((el) => {
    // Annule l'animation en cours si elle n'est pas terminée
    if (activeCancels.has(el)) activeCancels.get(el)();
    // Lit le texte original stocké à l'init
    const text = el.dataset.originalText;
    el.textContent = "";
    const cancel = scrambleText(el, text, () => activeCancels.delete(el));
    activeCancels.set(el, cancel);
  });
}

function init() {
  document.querySelectorAll(".work-item").forEach((item) => {
    // Stocke le texte original une seule fois
    item.querySelectorAll("[scramble]").forEach((el) => {
      el.dataset.originalText = el.textContent;
    });
    item.addEventListener("mouseenter", handleItemEnter);
    listeners.push(item);
  });
}

function cleanup() {
  activeCancels.forEach((cancel) => cancel());
  activeCancels.clear();
  listeners.forEach((item) => {
    item.removeEventListener("mouseenter", handleItemEnter);
  });
  listeners = [];
}

export const works = { init, cleanup };
