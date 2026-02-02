/**
 * Home — logique spécifique à la homepage
 */

let videoRAF = null;

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(Math.floor(seconds) % 60).padStart(2, "0");
  const ms = String(Math.floor((seconds % 1) * 1000)).padStart(3, "0");
  return `${m}:${s}:${ms}`;
}

function setupTotalOverlay(totalEl) {
  totalEl.style.position = "relative";
  totalEl.style.opacity = "1";

  const base = document.createElement("span");
  base.style.opacity = "0.35";
  base.setAttribute("data-total-base", "");

  const overlay = document.createElement("span");
  overlay.style.position = "absolute";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.overflow = "hidden";
  overlay.style.whiteSpace = "nowrap";
  overlay.style.width = "0%";
  overlay.setAttribute("data-total-overlay", "");

  totalEl.textContent = "";
  totalEl.appendChild(base);
  totalEl.appendChild(overlay);
}

function updateVideoTimecodes() {
  document.querySelectorAll(".selected-item").forEach((item) => {
    const totalEl = item.querySelector("[video-total]");
    const progressEl = item.querySelector("[video-progress]");
    const video = item.querySelector("video");
    if (!video) return;

    if (totalEl && !totalEl.classList.contains("w-condition-invisible")) {
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
      overlay.style.width = progress + "%";
    }

    if (progressEl && !progressEl.classList.contains("w-condition-invisible")) {
      progressEl.textContent = formatTime(video.currentTime || 0);
    }
  });

  videoRAF = requestAnimationFrame(updateVideoTimecodes);
}

function handleTitlesClick(e) {
  const item = e.currentTarget.closest(".selected-item");
  if (!item) return;
  item.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
}

function init() {
  document.querySelectorAll(".selected-titles-inner").forEach((el) => {
    el.addEventListener("click", handleTitlesClick);
  });

  videoRAF = requestAnimationFrame(updateVideoTimecodes);
}

function cleanup() {
  document.querySelectorAll(".selected-titles-inner").forEach((el) => {
    el.removeEventListener("click", handleTitlesClick);
  });

  if (videoRAF) {
    cancelAnimationFrame(videoRAF);
    videoRAF = null;
  }
}

export const home = { init, cleanup };
