import Swup from "swup";

let swup;

export function initSwup() {
  swup = new Swup({
    animationSelector: '[class*="transition-"]',
    containers: ["#swup"],
    cache: true,
  });

  swup.hooks.on("page:view", (visit) => {
    const event = new CustomEvent("swup:pageView", {
      detail: { url: visit.to.url },
    });
    document.dispatchEvent(event);
  });

  return swup;
}

export function getSwup() {
  return swup;
}
