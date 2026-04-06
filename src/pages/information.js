import { scrambleText } from "../scramble.js";

let scrambleCancels = [];
let navCancel = null;
let scrollRAF = null;
let lastSection = null;

const labels = {
  overview: "CREDITS ↓",
  credits: "TOP ↑",
};

const next = {
  overview: "credits",
  credits: "overview",
};

function getNavEl() {
  return document.querySelector("#bottomNav p");
}

function getContainer() {
  return document.querySelector(".information");
}

function getCurrentSection() {
  const container = getContainer();
  if (!container) return null;
  const containerTop = container.getBoundingClientRect().top;
  let closest = null;
  let minDist = Infinity;
  container.querySelectorAll(".information-item").forEach((item) => {
    const dist = Math.abs(item.getBoundingClientRect().top - containerTop);
    if (dist < minDist) { minDist = dist; closest = item; }
  });
  return closest ? closest.getAttribute("data-info") : null;
}

function setNavLabel(section) {
  const el = getNavEl();
  if (!el) return;
  const label = labels[section] || "";
  if (navCancel) navCancel();
  navCancel = scrambleText(el, label);
}

function onScroll() {
  if (scrollRAF) return;
  scrollRAF = requestAnimationFrame(() => {
    scrollRAF = null;
    const section = getCurrentSection();
    if (section && section !== lastSection) {
      lastSection = section;
      setNavLabel(section);
    }
  });
}

function onNavClick() {
  const section = getCurrentSection() || "overview";
  const target = next[section];
  const el = getContainer()?.querySelector(`[data-info="${target}"]`);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

function init() {
  document.querySelectorAll("[scramble]").forEach((el) => {
    const text = el.textContent;
    el.textContent = "";
    const cancel = scrambleText(el, text);
    scrambleCancels.push(cancel);
  });

  lastSection = "overview";
  setNavLabel("overview");

  const container = getContainer();
  if (container) container.addEventListener("scroll", onScroll, { passive: true });

  const bottomNav = document.querySelector("#bottomNav");
  if (bottomNav) bottomNav.addEventListener("click", onNavClick);
}

function cleanup() {
  scrambleCancels.forEach((c) => c());
  scrambleCancels = [];
  if (navCancel) { navCancel(); navCancel = null; }
  if (scrollRAF) { cancelAnimationFrame(scrollRAF); scrollRAF = null; }

  const container = getContainer();
  if (container) container.removeEventListener("scroll", onScroll);

  const bottomNav = document.querySelector("#bottomNav");
  if (bottomNav) bottomNav.removeEventListener("click", onNavClick);

  lastSection = null;
}

export const information = { init, cleanup };
