import { useEffect, useRef } from 'react';

/** Bayer: the hue glow drawn as a 1-bit ordered dither, the classic "dither" look.
 *  Each glow is a soft field; a 4x4 Bayer matrix turns its strength into how many pixels
 *  are lit, so gradients become patterns of square pixels instead of smooth fades. */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const CELL = 3; // CSS px per dither pixel

type RGB = [number, number, number];
// x, y: centre as a fraction of the viewport. r: radius as a fraction of its longer side.
// s: peak strength; under 1, so even the centre never fills solid.
const GLOWS: { x: number; y: number; r: number; s: number; dark: RGB; light: RGB }[] = [
  { x: 0.24, y: -0.08, r: 0.26, s: 0.5, dark: [139, 124, 246], light: [91, 71, 214] },
  { x: 0.54, y: -0.12, r: 0.24, s: 0.46, dark: [78, 163, 240], light: [31, 111, 196] },
  { x: 0.82, y: -0.06, r: 0.2, s: 0.4, dark: [76, 195, 138], light: [26, 138, 85] },
  { x: 1.04, y: 0.32, r: 0.18, s: 0.32, dark: [232, 160, 90], light: [184, 100, 28] },
  { x: 0.55, y: 1.14, r: 0.26, s: 0.26, dark: [236, 112, 99], light: [190, 60, 50] },
];

function draw(canvas: HTMLCanvasElement) {
  const light = document.documentElement.dataset.theme === 'light';
  const w = Math.ceil(innerWidth / CELL);
  const h = Math.ceil(innerHeight / CELL);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const side = Math.max(w, h);
  const alpha = Math.round((light ? 0.12 : 0.18) * 255);
  const palette = GLOWS.map((g) => (light ? g.light : g.dark));

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Each lit pixel takes the glows' colours mixed by strength, so hues blend with no seams.
      let total = 0;
      let r = 0;
      let g = 0;
      let b = 0;
      for (let i = 0; i < GLOWS.length; i++) {
        const glow = GLOWS[i];
        const dx = (x - glow.x * w) / (glow.r * side);
        const dy = (y - glow.y * h) / (glow.r * side);
        const wgt = glow.s * Math.exp(-(dx * dx + dy * dy));
        total += wgt;
        r += palette[i][0] * wgt;
        g += palette[i][1] * wgt;
        b += palette[i][2] * wgt;
      }
      if (Math.min(total, 0.55) <= BAYER[(y & 3) * 4 + (x & 3)]) continue;
      const o = (y * w + x) * 4;
      img.data[o] = r / total;
      img.data[o + 1] = g / total;
      img.data[o + 2] = b / total;
      img.data[o + 3] = alpha;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function Bayer() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    let frame = 0;
    const redraw = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => draw(canvas));
    };
    draw(canvas);
    addEventListener('resize', redraw);
    // The app's theme switch sets data-theme on <html>; redraw in the other palette.
    const observer = new MutationObserver(redraw);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener('resize', redraw);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="bg bg-bayer" aria-hidden />;
}
