import { useState } from 'react';
import { flushSync } from 'react-dom';

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Run a state change as a view transition, so named elements move to where they end up. */
export function transition(update: () => void, done?: () => void) {
  if (!document.startViewTransition || reducedMotion()) {
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
