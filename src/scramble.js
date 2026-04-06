const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:+-";
const RESOLVE_INTERVAL = 90;

/**
 * Anime un élément texte avec un effet de scramble progressif gauche → droite.
 * Retourne une fonction cancel() pour arrêter l'animation.
 */
export function scrambleText(el, targetText, onDone) {
  const resolved = new Array(targetText.length).fill(false);
  let nextResolve = 0;
  let lastResolveTime = performance.now();
  let rafId = null;

  // Espaces, crochets et ponctuation se résolvent immédiatement
  for (let i = 0; i < targetText.length; i++) {
    if (" []().,".includes(targetText[i])) {
      resolved[i] = true;
      if (i === nextResolve) nextResolve++;
    }
  }
  while (nextResolve < targetText.length && resolved[nextResolve]) nextResolve++;

  function tick(now) {
    if (now - lastResolveTime >= RESOLVE_INTERVAL && nextResolve < targetText.length) {
      resolved[nextResolve] = true;
      lastResolveTime = now;
      nextResolve++;
      while (nextResolve < targetText.length && resolved[nextResolve]) nextResolve++;
    }

    let display = "";
    for (let i = 0; i < targetText.length; i++) {
      display += resolved[i]
        ? targetText[i]
        : CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    el.textContent = display;

    if (nextResolve >= targetText.length) {
      el.textContent = targetText;
      rafId = null;
      if (onDone) onDone();
      return;
    }

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  return () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}
