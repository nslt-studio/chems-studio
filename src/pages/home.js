/**
 * Home — logique spécifique à la homepage
 */

import { scrambleText } from "../scramble.js";

let videoRAF = null;
let scrambleCancels = [];
let scrambleProtected = new Set();
let scrollRAF = null;
let lastActiveItem = null;
const hoveredTitles = new Set();

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(Math.floor(seconds) % 60).padStart(2, "0");
  const ms = String(Math.floor((seconds % 1) * 1000)).padStart(3, "0");
  return `${m}:${s}:${ms}`;
}

function setupTotalOverlay(totalEl) {
  totalEl.style.opacity = "1";

  const wrapper = document.createElement("span");
  wrapper.style.position = "relative";
  wrapper.style.display = "inline-block";

  const base = document.createElement("span");
  base.style.opacity = "0.35";
  base.setAttribute("data-total-base", "");

  const overlay = document.createElement("span");
  overlay.style.position = "absolute";
  overlay.style.inset = "0";
  overlay.style.whiteSpace = "nowrap";
  overlay.style.clipPath = "inset(0 100% 0 0)";
  overlay.setAttribute("data-total-overlay", "");

  wrapper.appendChild(base);
  wrapper.appendChild(overlay);
  totalEl.textContent = "";
  totalEl.appendChild(wrapper);
}

function updateVideoTimecodes() {
  document.querySelectorAll(".selected-item").forEach((item) => {
    const totalEl = item.querySelector("[video-total]");
    const progressEl = item.querySelector("[video-progress]");
    const video = item.querySelector("video");
    if (!video) return;

    if (totalEl && !totalEl.classList.contains("w-condition-invisible") && !scrambleProtected.has(totalEl)) {
      // Setup overlay structure on first pass
      if (!totalEl.querySelector("[data-total-base]")) {
        setupTotalOverlay(totalEl);
      }

      const timeStr = formatTime(video.duration || 0);
      const base = totalEl.querySelector("[data-total-base]");
      const overlay = totalEl.querySelector("[data-total-overlay]");
      base.textContent = timeStr;
      overlay.textContent = timeStr;

      const progress = video.duration ? (video.currentTime / video.duration) * 100 : 0;
      overlay.style.clipPath = `inset(0 ${100 - progress}% 0 0)`;
    }

    if (progressEl && !progressEl.classList.contains("w-condition-invisible") && !scrambleProtected.has(progressEl)) {
      progressEl.textContent = formatTime(video.currentTime || 0);
    }
  });

  videoRAF = requestAnimationFrame(updateVideoTimecodes);
}

function rotationLoop() {
  let activeItem = null;
  let minDist = Infinity;

  document.querySelectorAll(".selected-item .selected-link").forEach((el) => {
    const item = el.closest(".selected-item");
    const rect = item.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / rect.height));
    el.style.transform = `rotateX(${progress * 90}deg)`;
    const dist = Math.abs(rect.top);
    if (dist < minDist) { minDist = dist; activeItem = item; }
  });

  if (activeItem !== lastActiveItem) {
    const video = activeItem?.querySelector("video");
    if (video) video.play().catch(() => {});
    lastActiveItem = activeItem;

    // Précharger les 2 vidéos suivantes
    const items = [...document.querySelectorAll(".selected-item")];
    const idx = items.indexOf(activeItem);
    [1, 2].forEach((offset) => {
      const next = items[idx + offset];
      if (!next) return;
      const v = next.querySelector("video");
      if (v && v.dataset.src && !v.src) v.src = v.dataset.src;
    });
  }

  document.querySelectorAll(".selected-item").forEach((item) => {
    const inner = item.querySelector(".selected-titles-inner");
    if (inner) {
      const isActive = item === activeItem;
      inner.style.opacity = (isActive || hoveredTitles.has(inner)) ? "1" : "0.25";
    }
    if (item !== activeItem) {
      const video = item.querySelector("video");
      if (video && !video.paused) video.pause();
    }
  });

  scrollRAF = requestAnimationFrame(rotationLoop);
}

function initScrollRotate() {
  if (window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".selected-item .selected-titles-inner").forEach((inner) => {
      inner.addEventListener("mouseenter", () => hoveredTitles.add(inner));
      inner.addEventListener("mouseleave", () => hoveredTitles.delete(inner));
    });
  }
  scrollRAF = requestAnimationFrame(rotationLoop);
}

function destroyScrollRotate() {
  if (scrollRAF) {
    cancelAnimationFrame(scrollRAF);
    scrollRAF = null;
  }
  document.querySelectorAll(".selected-item .selected-titles-inner").forEach((inner) => {
    inner.removeEventListener("mouseenter", () => hoveredTitles.add(inner));
    inner.removeEventListener("mouseleave", () => hoveredTitles.delete(inner));
    inner.style.opacity = "";
  });
  document.querySelectorAll(".selected-item .selected-link").forEach((el) => {
    el.style.transform = "";
  });
  hoveredTitles.clear();
  lastActiveItem = null;
}

function handleTitlesClick(e) {
  const item = e.currentTarget.closest(".selected-item");
  if (!item) return;
  item.scrollIntoView({ behavior: "smooth", inline: "center", block: "start" });
}

function initScramble() {
  document.querySelectorAll("[scramble]").forEach((el) => {
    const text = el.textContent;
    el.textContent = "";
    const isTimecode = el.hasAttribute("video-progress") || el.hasAttribute("video-total");
    if (isTimecode) scrambleProtected.add(el);
    const cancel = scrambleText(el, text, isTimecode ? () => scrambleProtected.delete(el) : undefined);
    scrambleCancels.push(cancel);
  });
}

function destroyScramble() {
  scrambleCancels.forEach((cancel) => cancel());
  scrambleCancels = [];
  scrambleProtected = new Set();
}

function init() {
  document.querySelectorAll(".selected-titles-inner").forEach((el) => {
    el.addEventListener("click", handleTitlesClick);
  });

  initScramble();
  initScrollRotate();
  videoRAF = requestAnimationFrame(updateVideoTimecodes);
}

function cleanup() {
  document.querySelectorAll(".selected-titles-inner").forEach((el) => {
    el.removeEventListener("click", handleTitlesClick);
  });

  destroyScramble();
  destroyScrollRotate();

  if (videoRAF) {
    cancelAnimationFrame(videoRAF);
    videoRAF = null;
  }
}

export const home = { init, cleanup };
