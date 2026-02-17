import EmblaCarousel from "embla-carousel";
import { scrambleText } from "../scramble.js";

let embla = null;
let prevBtn = null;
let nextBtn = null;
let onPrevClick = null;
let onNextClick = null;
let videoRAF = null;
let playBtn = null;
let mutedBtn = null;
let onPlayClick = null;
let onMutedClick = null;
let lastIsVideo = null;
let lastSlideIndex = null;
let hasSlided = false;
let timecodeScrambling = false;
let timecodeScrambleCancels = [];
let closeBtn = null;
let infoBtn = null;
let onInfoClick = null;
let infoOpen = false;
let progressEl = null;
let onProgressClick = null;
let autoAdvanceTimeout = null;
let boundVideoEndedHandlers = [];

// ── Video timecodes ───────────────────────────────────

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

function getActiveVideo() {
  if (!embla) return null;
  const activeIndex = embla.selectedScrollSnap();
  const activeSlide = embla.slideNodes()[activeIndex];
  return activeSlide?.querySelector("video") || null;
}

function updateVideoTimecode() {
  if (!embla) return;

  const video = getActiveVideo();
  const isVideo = !!video;

  const totalEl = document.querySelector(".details-titles [video-total]");
  const progressTimeEl = document.querySelector(".details-titles [video-progress]");
  const controlsEl = document.querySelector(".details-controls");
  const progressBar = document.querySelector(".details-controls .progress-bar");

  // Pas de transition au chargement initial, transition uniquement après le premier slide
  const fade = hasSlided ? "opacity 300ms ease, filter 300ms ease" : "none";

  // ── Sync play button text + scramble timecodes on slide change ──
  const currentIndex = embla.selectedScrollSnap();
  const slideChanged = currentIndex !== lastSlideIndex;
  lastSlideIndex = currentIndex;

  if (slideChanged || isVideo !== lastIsVideo) {
    lastIsVideo = isVideo;
    if (isVideo && playBtn) {
      // La vidéo va s'auto-play via l'IntersectionObserver, garder "Pause"
      playBtn.textContent = "Pause";
    }
    // Scramble les timecodes quand on arrive sur une vidéo
    if (isVideo && hasSlided && slideChanged) {
      timecodeScrambleCancels.forEach((c) => c());
      timecodeScrambleCancels = [];
      timecodeScrambling = true;
      let done = 0;
      const total = (progressTimeEl ? 1 : 0) + (totalEl ? 1 : 0);
      const onScrambleDone = () => { if (++done >= total) timecodeScrambling = false; };

      if (totalEl) {
        if (!totalEl.querySelector("[data-total-base]")) setupTotalOverlay(totalEl);
        const timeStr = formatTime(video.duration || 0);
        const base = totalEl.querySelector("[data-total-base]");
        const overlay = totalEl.querySelector("[data-total-overlay]");
        if (base) timecodeScrambleCancels.push(scrambleText(base, timeStr, onScrambleDone));
        if (overlay) timecodeScrambleCancels.push(scrambleText(overlay, timeStr));
      }
      if (progressTimeEl) {
        timecodeScrambleCancels.push(scrambleText(progressTimeEl, formatTime(video.currentTime || 0), onScrambleDone));
      }
    }
  }

  // ── Timecodes (video-total / video-progress) ──
  if (totalEl) {
    totalEl.style.transition = fade;
    if (isVideo) {
      totalEl.style.opacity = "1";
      totalEl.style.filter = "blur(0px)";
      if (!totalEl.querySelector("[data-total-base]")) setupTotalOverlay(totalEl);
      const overlay = totalEl.querySelector("[data-total-overlay]");
      const progress = video.duration ? (video.currentTime / video.duration) * 100 : 0;
      if (overlay) overlay.style.width = progress + "%";
      if (!timecodeScrambling) {
        const timeStr = formatTime(video.duration || 0);
        const base = totalEl.querySelector("[data-total-base]");
        if (base) base.textContent = timeStr;
        if (overlay) overlay.textContent = timeStr;
      }
    } else {
      totalEl.style.opacity = "0";
      totalEl.style.filter = "blur(var(--blur))";
    }
  }

  if (progressTimeEl) {
    progressTimeEl.style.transition = fade;
    if (isVideo) {
      progressTimeEl.style.opacity = "1";
      progressTimeEl.style.filter = "blur(0px)";
      if (!timecodeScrambling) {
        progressTimeEl.textContent = formatTime(video.currentTime || 0);
      }
    } else {
      progressTimeEl.style.opacity = "0";
      progressTimeEl.style.filter = "blur(var(--blur))";
    }
  }

  // ── Controls visibility ──
  if (controlsEl) {
    controlsEl.style.transition = fade;
    if (isVideo) {
      controlsEl.style.opacity = "1";
      controlsEl.style.filter = "blur(0px)";
      controlsEl.style.pointerEvents = "";
    } else {
      controlsEl.style.opacity = "0";
      controlsEl.style.filter = "blur(var(--blur))";
      controlsEl.style.pointerEvents = "none";
    }
  }

  // ── Progress bar ──
  if (progressBar && isVideo) {
    const progress = video.duration ? (video.currentTime / video.duration) * 100 : 0;
    progressBar.style.width = progress + "%";
  }

  videoRAF = requestAnimationFrame(updateVideoTimecode);
}

// ── Controls (play / mute / progress seek) ────────────

function initControls() {
  playBtn = document.querySelector("#play");
  mutedBtn = document.querySelector("#muted");

  // Play par défaut → texte "Pause"
  if (playBtn) {
    playBtn.textContent = "Pause";
    onPlayClick = () => {
      const video = getActiveVideo();
      if (!video) return;
      if (video.paused) {
        video.play().catch(() => {});
        playBtn.textContent = "Pause";
      } else {
        video.pause();
        playBtn.textContent = "Play";
      }
    };
    playBtn.addEventListener("click", onPlayClick);
  }

  if (mutedBtn) {
    onMutedClick = () => {
      const video = getActiveVideo();
      if (!video) return;
      video.muted = !video.muted;
      mutedBtn.classList.toggle("control-active", video.muted);
    };
    mutedBtn.addEventListener("click", onMutedClick);
  }

  // Progress seek
  progressEl = document.querySelector(".progress");
  if (progressEl) {
    onProgressClick = (e) => {
      const video = getActiveVideo();
      if (!video || !video.duration) return;
      const rect = progressEl.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      video.currentTime = ratio * video.duration;
    };
    progressEl.addEventListener("click", onProgressClick);
  }
}

function destroyControls() {
  if (playBtn && onPlayClick) playBtn.removeEventListener("click", onPlayClick);
  if (mutedBtn && onMutedClick) mutedBtn.removeEventListener("click", onMutedClick);
  if (progressEl && onProgressClick) progressEl.removeEventListener("click", onProgressClick);
  playBtn = null;
  mutedBtn = null;
  onPlayClick = null;
  onMutedClick = null;
  progressEl = null;
  onProgressClick = null;
}

// ── Close button ──────────────────────────────────────

function initClose() {
  closeBtn = document.querySelector("#close");
  if (!closeBtn) return;

  // Définir le href pour que Swup gère la navigation
  const backUrl = document.referrer && new URL(document.referrer).origin === window.location.origin
    ? new URL(document.referrer).pathname
    : "/";
  closeBtn.setAttribute("href", backUrl);
}

function destroyClose() {
  closeBtn = null;
}

// ── Info toggle ───────────────────────────────────────

function initInfo() {
  infoBtn = document.querySelector("#info");
  if (!infoBtn) return;

  infoOpen = false;

  onInfoClick = () => {
    const infoPanel = document.querySelector(".details-info");
    if (!infoPanel) return;

    infoOpen = !infoOpen;
    infoPanel.style.transition = "opacity 300ms ease";
    infoPanel.style.opacity = infoOpen ? "1" : "";
    infoPanel.style.pointerEvents = infoOpen ? "auto" : "";
    infoBtn.textContent = infoOpen ? "Less Info" : "More Info";

    // Scramble les éléments [scramble] à chaque ouverture
    if (infoOpen) {
      infoPanel.querySelectorAll("[scramble]").forEach((el) => {
        const text = el.textContent;
        el.textContent = "";
        scrambleText(el, text);
      });
    }
  };
  infoBtn.addEventListener("click", onInfoClick);
}

function destroyInfo() {
  if (infoBtn && onInfoClick) infoBtn.removeEventListener("click", onInfoClick);
  infoBtn = null;
  onInfoClick = null;
  infoOpen = false;
}

// ── Auto-advance ─────────────────────────────────────

const PHOTO_DELAY = 5000;

function clearAutoAdvance() {
  if (autoAdvanceTimeout) {
    clearTimeout(autoAdvanceTimeout);
    autoAdvanceTimeout = null;
  }
  boundVideoEndedHandlers.forEach(({ video, handler }) => {
    video.removeEventListener("ended", handler);
  });
  boundVideoEndedHandlers = [];
}

function scheduleAutoAdvance() {
  clearAutoAdvance();
  if (!embla) return;

  const video = getActiveVideo();

  if (video) {
    // Retirer loop pour que l'événement ended se déclenche
    video.loop = false;
    // Vidéo : next à la fin
    const handler = () => {
      if (embla) embla.scrollNext();
    };
    video.addEventListener("ended", handler);
    boundVideoEndedHandlers.push({ video, handler });
  } else {
    // Photo : next après 5s
    autoAdvanceTimeout = setTimeout(() => {
      if (embla) embla.scrollNext();
    }, PHOTO_DELAY);
  }
}

// ── Slider ────────────────────────────────────────────

function initSlider() {
  const viewport = document.querySelector(".embla__viewport");
  if (!viewport) return;

  embla = EmblaCarousel(viewport, { loop: true });

  function updateActiveSlide() {
    const slides = embla.slideNodes();
    const active = embla.selectedScrollSnap();
    slides.forEach((s, i) => s.classList.toggle("active", i === active));
  }

  updateActiveSlide();
  embla.on("select", () => {
    hasSlided = true;
    updateActiveSlide();
    scheduleAutoAdvance();
  });

  prevBtn = document.querySelector(".embla__prev");
  nextBtn = document.querySelector(".embla__next");

  if (prevBtn) {
    onPrevClick = () => embla.scrollPrev();
    prevBtn.addEventListener("click", onPrevClick);
  }
  if (nextBtn) {
    onNextClick = () => embla.scrollNext();
    nextBtn.addEventListener("click", onNextClick);
  }

  scheduleAutoAdvance();
}

function destroySlider() {
  clearAutoAdvance();
  // Ne pas appeler embla.destroy() — Swup remplace le DOM,
  // détruire Embla causerait un snap visuel des slides
  if (prevBtn && onPrevClick) prevBtn.removeEventListener("click", onPrevClick);
  if (nextBtn && onNextClick) nextBtn.removeEventListener("click", onNextClick);
  embla = null;
  prevBtn = null;
  nextBtn = null;
  onPrevClick = null;
  onNextClick = null;
}

// ── État initial synchrone (pas de flash) ─────────────

function setInitialState() {
  const video = getActiveVideo();
  const isVideo = !!video;

  const totalEl = document.querySelector(".details-titles [video-total]");
  const progressTimeEl = document.querySelector(".details-titles [video-progress]");
  const controlsEl = document.querySelector(".details-controls");

  [totalEl, progressTimeEl].forEach((el) => {
    if (!el) return;
    el.style.transition = "none";
    el.style.opacity = isVideo ? "1" : "0";
    el.style.filter = isVideo ? "blur(0px)" : "blur(var(--blur))";
  });

  if (controlsEl) {
    controlsEl.style.transition = "none";
    controlsEl.style.opacity = isVideo ? "1" : "0";
    controlsEl.style.filter = isVideo ? "blur(0px)" : "blur(var(--blur))";
    controlsEl.style.pointerEvents = isVideo ? "" : "none";
  }

  lastIsVideo = isVideo;
  lastSlideIndex = embla ? embla.selectedScrollSnap() : null;
}

// ── Lifecycle ─────────────────────────────────────────

function init() {
  initSlider();
  initControls();
  initClose();
  initInfo();
  lastIsVideo = null;
  lastSlideIndex = null;
  hasSlided = false;
  setInitialState();
  videoRAF = requestAnimationFrame(updateVideoTimecode);
}

function cleanup() {
  if (videoRAF) {
    cancelAnimationFrame(videoRAF);
    videoRAF = null;
  }
  destroyControls();
  destroyClose();
  destroyInfo();
  destroySlider();
  lastIsVideo = null;
  lastSlideIndex = null;
  hasSlided = false;
}

export const details = { init, cleanup };
