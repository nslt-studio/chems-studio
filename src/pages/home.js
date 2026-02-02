/**
 * Home — logique spécifique à la homepage
 */

let activeItem = null;

function init() {
  document.querySelectorAll(".selected-item").forEach((item) => {
    item.addEventListener("mouseenter", handleEnter);
    item.addEventListener("mousemove", handleMove);
    item.addEventListener("mouseleave", handleLeave);
  });
}

function showTitles(item) {
  if (item === activeItem) return;

  const titles = item.querySelector(".selected-titles");
  if (!titles) return;

  // Reset instantanément tous les autres
  document.querySelectorAll(".selected-item .selected-titles").forEach((t) => {
    if (t !== titles) {
      t.style.transition = "none";
      t.style.opacity = "";
      t.style.transform = "";
    }
  });

  activeItem = item;

  // Anime celui-ci
  requestAnimationFrame(() => {
    titles.style.transition = "opacity 300ms ease, transform 300ms ease";
    titles.style.opacity = "1";
    titles.style.transform = "translate(-50%, 0)";
  });
}

function handleEnter(e) {
  showTitles(e.currentTarget);
}

function handleMove(e) {
  showTitles(e.currentTarget);
}

function handleLeave(e) {
  const titles = e.currentTarget.querySelector(".selected-titles");
  if (!titles) return;

  activeItem = null;
  titles.style.transition = "none";
  titles.style.opacity = "";
  titles.style.transform = "";
}

function cleanup() {
  activeItem = null;

  document.querySelectorAll(".selected-item").forEach((item) => {
    item.removeEventListener("mouseenter", handleEnter);
    item.removeEventListener("mousemove", handleMove);
    item.removeEventListener("mouseleave", handleLeave);
  });

  document.querySelectorAll(".selected-item .selected-titles").forEach((t) => {
    t.style.transition = "";
    t.style.opacity = "";
    t.style.transform = "";
  });
}

export const home = { init, cleanup };
