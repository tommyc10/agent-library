import { useState } from 'react';
import { flushSync } from 'react-dom';

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A spring in Apple's two numbers: damping (1 settles without bouncing, lower bounces)
 * and response (roughly how many seconds it takes to get there). */
export const spring = (damping: number, response: number) => ({
  type: 'spring' as const,
  stiffness: ((2 * Math.PI) / response) ** 2,
  damping: (4 * Math.PI * damping) / response,
  mass: 1,
});

/** How far a flick carries past the point it was let go, in px, like a scroll coasting to a stop. */
export const project = (velocity: number, deceleration = 0.998) => ((velocity / 1000) * deceleration) / (1 - deceleration);

/** Past an edge, follow the pointer less the further it goes, instead of stopping dead. */
export const rubberband = (overshoot: number, dimension: number, constant = 0.55) =>
  (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));

/** Change the whole page at once and cross-fade it. Only the theme switch uses this: it has
 * no motion to interrupt, and colours can't be faded one by one. */
export function transition(update: () => void, done?: () => void) {
  if (!document.startViewTransition) {
    update();
    done?.();
    return;
  }
  const vt = document.startViewTransition(() => flushSync(update));
  // A transition is skipped when the tab is hidden or another one starts; the update still lands.
  vt.ready.catch(() => {});
  vt.finished.catch(() => {}).finally(() => done?.());
}

/** True while results are changing because of typing, when nothing should animate in. */
export const typing = { now: false };

/** Whether this component mounted mid-typing, and so should skip its arrival. */
export const useStill = () => useState(() => typing.now)[0] || undefined;

/** Say something to a screen reader through the page's one status region. */
export function announce(text: string) {
  const region = document.getElementById('lib-status');
  if (!region) return;
  // Empty it first, so the same message twice in a row is read twice.
  region.textContent = '';
  requestAnimationFrame(() => (region.textContent = text));
}

export async function copyText(text: string) {
  announce('Copied');
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Clipboard API needs a secure context; fall back for plain http previews.
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
}
