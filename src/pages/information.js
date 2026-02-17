import { scrambleText } from "../scramble.js";

let scrambleCancels = [];

function init() {
  document.querySelectorAll("[scramble]").forEach((el) => {
    const text = el.textContent;
    el.textContent = "";
    const cancel = scrambleText(el, text);
    scrambleCancels.push(cancel);
  });
}

function cleanup() {
  scrambleCancels.forEach((cancel) => cancel());
  scrambleCancels = [];
}

export const information = { init, cleanup };
