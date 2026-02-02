/**
 * Global — logique partagée sur toutes les pages
 */

let clockInterval = null;
let videoObserver = null;
let filterLeaveTimeout = null;
let filterScrollRAF = null;
let filterOpen = false;

// ── Clock ──────────────────────────────────────────────

function initClock() {
  const el = document.querySelector("#clock");
  if (!el) return;

  function update() {
    const now = new Date();
    const opts = { timeZone: "America/New_York" };
    const h = String(now.toLocaleString("en-US", { ...opts, hour: "numeric", hour12: false }).replace(/^24$/, "00")).padStart(2, "0");
    const m = String(now.toLocaleString("en-US", { ...opts, minute: "numeric" })).padStart(2, "0");
    const s = String(now.toLocaleString("en-US", { ...opts, second: "numeric" })).padStart(2, "0");
    const tz =
      Intl.DateTimeFormat("en", { timeZone: "America/New_York", timeZoneName: "short" })
        .formatToParts(now)
        .find((p) => p.type === "timeZoneName")?.value || "EST";
    el.textContent = `NYC ${h}:${m}:${s} [ ${tz} ]`;
  }

  update();
  clockInterval = setInterval(update, 1000);
}

function destroyClock() {
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
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
