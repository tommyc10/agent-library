import { animate, useMotionValue, useTransform, type MotionValue } from 'motion/react';
import { useLayoutEffect, useRef, type RefObject } from 'react';
import { reducedMotion, spring } from './motion';

/** Below this width the panel is a sheet that rises from the bottom edge. */
export const SHEET = '(max-width: 56.25em)';

const RADIUS = 14;
// Opening and closing: no bounce, nothing was thrown.
const GLIDE = spring(1, 0.35);
const FADE_IN = spring(1, 0.2);
const CALM = { duration: 0.2, ease: 'easeOut' } as const;

type Box = { left: number; top: number; width: number; height: number };

/** The frame of an entry's tile, when it is on screen to grow from or shrink back into. */
function frameOf(id: string): Box | null {
  const frame = document.querySelector(`[data-entry="${id}"] .lib-draw`);
  if (!frame) return null;
  const r = frame.getBoundingClientRect();
  const onScreen = r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  return onScreen ? r : null;
}

interface Options {
  id: string;
  open: boolean;
  /** Open already when the page loaded, from a link: no entrance. */
  instant: boolean;
  onClosed: () => void;
}

/**
 * Moves the panel between its tile and its place, on four springs: across, down, and how
 * much of its right and bottom are cut away. Every change starts from where the panel is
 * on screen at that moment, carrying the speed it has, so closing a panel that is still
 * opening simply turns it round. The content keeps its real size and is cut, never stretched.
 */
export function usePanelMotion(ref: RefObject<HTMLElement | null>, { id, open, instant, onClosed }: Options) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const cutRight = useMotionValue(0);
  const cutBottom = useMotionValue(0);
  const fade = useMotionValue(instant ? 1 : 0);
  // Where the panel rests, and whether it is a sheet, as of the last open or close.
  const box = useRef<Box>({ left: 0, top: 0, width: 1, height: 1 });
  const sheet = useRef(false);
  // Release speed of a drag that dismissed the sheet, handed to the closing spring.
  const fling = useRef(0);
  const run = useRef(0);
  const first = useRef(true);

  const clipPath = useTransform([cutRight, cutBottom], ([r, b]: number[]) =>
    r === 0 && b === 0 ? 'none' : `inset(0px ${r}px ${b}px 0px round ${RADIUS}px)`,
  );
  // The drop shadow can't be cut with the panel, so it comes in as the panel reaches full size.
  const shadow = useTransform([cutRight, cutBottom, fade], ([r, b, f]: number[]) => f * Math.max(0, 1 - (r + b) / 160));
  // A sheet's dimming follows how far up it is, so dragging it down lightens the page.
  const scrim = useTransform([fade, y], ([f, top]: number[]) =>
    sheet.current ? f * Math.min(1, Math.max(0, 1 - top / box.current.height)) : f,
  );

  useLayoutEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    const token = ++run.current;
    const entering = first.current;
    first.current = false;

    const r = panel.getBoundingClientRect();
    const rest = { left: r.left - x.get(), top: r.top - y.get(), width: r.width, height: r.height };
    box.current = rest;
    sheet.current = matchMedia(SHEET).matches;
    const still = reducedMotion();
    const geometry = [x, y, cutRight, cutBottom];

    if (open) {
      if (entering) {
        if (instant) return;
        if (sheet.current && !still) {
          y.set(rest.height);
          fade.set(1);
        } else if (!still) {
          const from = frameOf(id);
          if (from) {
            x.set(from.left - rest.left);
            y.set(from.top - rest.top);
            cutRight.set(rest.width - from.width);
            cutBottom.set(rest.height - from.height);
          } else {
            x.set(innerWidth - rest.left);
          }
        }
      }
      if (still) {
        geometry.forEach((v) => v.set(0));
        animate(fade, 1, CALM);
      } else {
        geometry.forEach((v) => animate(v, 0, GLIDE));
        animate(fade, 1, sheet.current ? { duration: 0 } : FADE_IN);
      }
      return;
    }

    // Closing: back into the tile if it is on screen, otherwise out the way a panel of
    // this kind came in, down for a sheet and off to the right for the side panel.
    const moves: [MotionValue<number>, number, object][] = [];
    if (still) {
      // nothing travels; it only fades
    } else if (sheet.current) {
      moves.push([y, rest.height, { ...GLIDE, velocity: fling.current }]);
    } else {
      const to = frameOf(id);
      const target = to
        ? [to.left - rest.left, to.top - rest.top, rest.width - to.width, rest.height - to.height]
        : [innerWidth - rest.left, 0, 0, 0];
      geometry.forEach((v, i) => moves.push([v, target[i], GLIDE]));
    }
    fling.current = 0;
    const fading = still ? animate(fade, 0, CALM) : sheet.current ? null : animate(fade, 0, GLIDE);
    Promise.all([...moves.map(([v, to, options]) => animate(v, to, options)), fading]).then(() => {
      if (run.current === token) onClosed();
    });
    // `id` and `onClosed` are read at the moment of opening or closing; only `open` starts a move.
  }, [open]);

  return { x, y, clipPath, fade, shadow, scrim, box, sheet, fling };
}
