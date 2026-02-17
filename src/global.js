/**
 * Global — logique partagée sur toutes les pages
 */

import { scrambleText } from "./scramble.js";

let clockInterval = null;
let clockCycleTimeout = null;
let clockScrambleCancel = null;
let currentCityIndex = 0;
let clockScrambling = false;
let videoObserver = null;
let filterLeaveTimeout = null;
let filterScrollRAF = null;
let filterOpen = false;

// ── Clock ──────────────────────────────────────────────

const CLOCK_CITIES = [
  { label: "NYC", timeZone: "America/New_York" },
  { label: "LA", timeZone: "America/Los_Angeles" },
  { label: "PAR", timeZone: "Europe/Paris", tzLabel: { standard: "CET", daylight: "CEST" } },
];
const CLOCK_CYCLE_MS = 5000;

function formatCity(city) {
  const now = new Date();
  const opts = { timeZone: city.timeZone };
  const h = String(now.toLocaleString("en-US", { ...opts, hour: "numeric", hour12: false }).replace(/^24$/, "00")).padStart(2, "0");
  const m = String(now.toLocaleString("en-US", { ...opts, minute: "numeric" })).padStart(2, "0");
  const s = String(now.toLocaleString("en-US", { ...opts, second: "numeric" })).padStart(2, "0");
  let tz;
  if (city.tzLabel) {
    const isDST = new Date(now.toLocaleString("en-US", { timeZone: city.timeZone })).getTimezoneOffset() !== new Date(new Date(now.getFullYear(), 0, 1).toLocaleString("en-US", { timeZone: city.timeZone })).getTimezoneOffset();
    tz = isDST ? city.tzLabel.daylight : city.tzLabel.standard;
  } else {
    tz = Intl.DateTimeFormat("en", { timeZone: city.timeZone, timeZoneName: "short" })
      .formatToParts(now)
      .find((p) => p.type === "timeZoneName")?.value || "";
  }
  return `${city.label} ${h}:${m}:${s} [ ${tz} ]`;
}

function initClock() {
  const el = document.querySelector("#clock");
  if (!el) return;

  function update() {
    if (clockScrambling) return;
    el.textContent = formatCity(CLOCK_CITIES[currentCityIndex]);
  }

  function scheduleCycle() {
    clockCycleTimeout = setTimeout(() => {
      currentCityIndex = (currentCityIndex + 1) % CLOCK_CITIES.length;
      const target = formatCity(CLOCK_CITIES[currentCityIndex]);
      clockScrambling = true;
      clearInterval(clockInterval);
      clockScrambleCancel = scrambleText(el, target, () => {
        clockScrambling = false;
        clockScrambleCancel = null;
        clockInterval = setInterval(update, 1000);
        scheduleCycle();
      });
    }, CLOCK_CYCLE_MS);
  }

  update();
  clockInterval = setInterval(update, 1000);
  scheduleCycle();
}

function destroyClock() {
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
  if (clockCycleTimeout) {
    clearTimeout(clockCycleTimeout);
    clockCycleTimeout = null;
  }
  if (clockScrambleCancel) {
    clockScrambleCancel();
    clockScrambleCancel = null;
  }
  clockScrambling = false;
  currentCityIndex = 0;
}

// ── Video play/pause au viewport ───────────────────────

function initVideoPlayback() {
  videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.play().catch(() => {});
        } else {
          entry.target.pause();
        }
      });
    },
    { threshold: 0.25 }
  );

  document.querySelectorAll("video").forEach((v) => videoObserver.observe(v));
}

function destroyVideoPlayback() {
  if (videoObserver) {
    videoObserver.disconnect();
    videoObserver = null;
  }
}

// ── Media reveal (opacity 0 → 1 au chargement) ────────

function initMediaReveal() {
  document.querySelectorAll("img").forEach((img) => {
    if (img.complete && img.naturalHeight > 0) {
      img.style.opacity = "1";
    } else {
      img.addEventListener("load", () => (img.style.opacity = "1"), {
        once: true,
      });
    }
  });

  document.querySelectorAll("video").forEach((video) => {
    if (video.readyState >= 2) {
      video.style.opacity = "1";
    } else {
      video.addEventListener(
        "loadeddata",
        () => (video.style.opacity = "1"),
        { once: true }
      );
    }
  });
}

// ── Filters ────────────────────────────────────────────

function openFilter(accordion, btn) {
  if (filterOpen) return;
  filterOpen = true;
  btn.textContent = "-";

  const inner = accordion.querySelector(".filters-inner");
  if (!inner) return;

  // D'abord la width
  accordion.style.maxWidth = inner.offsetWidth + "px";

  // Puis la height, 150ms avant la fin de la transition width
  setTimeout(() => {
    accordion.style.maxHeight = inner.offsetHeight + "px";
  }, 150);
}

function closeFilter(accordion, btn) {
  if (!filterOpen) return;
  filterOpen = false;
  btn.textContent = "+";

  // D'abord la height
  accordion.style.maxHeight = "";

  // Puis la width, 150ms avant la fin de la transition height
  setTimeout(() => {
    accordion.style.maxWidth = "";
  }, 150);
}

function onFilterScroll() {
  if (!filterOpen) return;
  if (filterScrollRAF) return;

  filterScrollRAF = requestAnimationFrame(() => {
    filterScrollRAF = null;
    const accordion = document.querySelector(".filters-accordion");
    const btn = document.querySelector(".filter-button");
    if (accordion && btn) closeFilter(accordion, btn);
  });
}

function onFilterLeave() {
  clearTimeout(filterLeaveTimeout);
  filterLeaveTimeout = setTimeout(() => {
    const accordion = document.querySelector(".filters-accordion");
    const btn = document.querySelector(".filter-button");
    if (accordion && btn) closeFilter(accordion, btn);
  }, 4000);
}

function onFilterEnter() {
  clearTimeout(filterLeaveTimeout);
}

function onFilterClick() {
  const accordion = document.querySelector(".filters-accordion");
  const btn = document.querySelector(".filter-button");
  if (!accordion || !btn) return;

  if (filterOpen) {
    closeFilter(accordion, btn);
  } else {
    openFilter(accordion, btn);
  }
}

function initFilters() {
  const filters = document.querySelector(".filters");
  const btn = document.querySelector(".filter-button");
  if (!filters || !btn) return;

  btn.addEventListener("click", onFilterClick);
  filters.addEventListener("mouseleave", onFilterLeave);
  filters.addEventListener("mouseenter", onFilterEnter);
  window.addEventListener("scroll", onFilterScroll, { passive: true });
}

function destroyFilters() {
  clearTimeout(filterLeaveTimeout);
  if (filterScrollRAF) cancelAnimationFrame(filterScrollRAF);
  filterLeaveTimeout = null;
  filterScrollRAF = null;
  filterOpen = false;

  const filters = document.querySelector(".filters");
  const btn = document.querySelector(".filter-button");
  if (btn) {
    btn.removeEventListener("click", onFilterClick);
    btn.textContent = "+";
  }
  if (filters) {
    filters.removeEventListener("mouseleave", onFilterLeave);
    filters.removeEventListener("mouseenter", onFilterEnter);
  }
  window.removeEventListener("scroll", onFilterScroll);

  const accordion = document.querySelector(".filters-accordion");
  if (accordion) {
    accordion.style.maxWidth = "";
    accordion.style.maxHeight = "";
  }
}

// ── API publique ───────────────────────────────────────

export function initGlobal() {
  initClock();
  initVideoPlayback();
  initMediaReveal();
  initFilters();
}

export function resetGlobal() {
  destroyClock();
  destroyVideoPlayback();
  destroyFilters();
  initClock();
  initVideoPlayback();
  initMediaReveal();
  initFilters();
}

export function closeFilterAccordion() {
  if (!filterOpen) return;
  const accordion = document.querySelector(".filters-accordion");
  const btn = document.querySelector(".filter-button");
  if (accordion && btn) closeFilter(accordion, btn);
}

export function destroyGlobal() {
  destroyClock();
  destroyVideoPlayback();
  destroyFilters();
}
