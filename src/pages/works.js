import { scrambleText } from "../scramble.js";

let listeners = [];

function handleItemEnter(e) {
  const item = e.currentTarget;
  item.querySelectorAll("[scramble]").forEach((el) => {
    const text = el.textContent;
    el.textContent = "";
    scrambleText(el, text);
  });
}

function init() {
  document.querySelectorAll(".work-item").forEach((item) => {
    item.addEventListener("mouseenter", handleItemEnter);
    listeners.push(item);
  });
}

function cleanup() {
  listeners.forEach((item) => {
    item.removeEventListener("mouseenter", handleItemEnter);
  });
  listeners = [];
}

export const works = { init, cleanup };
