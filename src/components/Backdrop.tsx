import { useEffect, useRef } from 'react';
import { collections } from '../lib/library';
import { reducedMotion } from '../lib/motion';

const STEP = 18; // px between dots, and so between characters
const RAMP = '·:+*#'; // coolest to warmest
const RADIUS = 140; // how far the pointer's light reaches, in px
const FONT = "12px 'Geist Mono Variable', ui-monospace, monospace";
const HUES = collections.map((c) => c.hue);

/** What is behind the page: a faint dot grid, and nothing else until the pointer moves.
 * The dots near the pointer turn into characters, each in one of the collection colours
 * picked at random, and cool back to dots behind it. A touch screen only has the dots. */
export function Backdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const still = reducedMotion();
    let cols = 0;
    let rows = 0;
    // Per cell: how warm the pointer left it, the colour it took, and a number that
    // decides which character it shows, so neighbours at the same warmth still differ.
    let heat = new Float32Array(0);
    let hues = new Float32Array(0);
    let seeds = new Float32Array(0);
    const pointer = { x: 0, y: 0, presence: 0 };
    let id = 0;

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = FONT;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      cols = Math.ceil(width / STEP);
      rows = Math.ceil(height / STEP);
      heat = new Float32Array(cols * rows);
      hues = new Float32Array(cols * rows);
      seeds = new Float32Array(cols * rows);
    };

    const frame = () => {
      id = 0;
      const light = document.documentElement.dataset.theme === 'light';
      ctx.clearRect(0, 0, cols * STEP, rows * STEP);
      let warm = pointer.presence > 0.02;
      if (warm) {
        // A soft pool of light for the characters to sit in.
        const reach = RADIUS * 1.2;
        const pool = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, reach);
        const tone = light ? '0.4 0 0' : '0.9 0 0';
        pool.addColorStop(0, `oklch(${tone} / ${(pointer.presence * (light ? 0.04 : 0.06)).toFixed(3)})`);
        pool.addColorStop(1, `oklch(${tone} / 0)`);
        ctx.fillStyle = pool;
        ctx.fillRect(pointer.x - reach, pointer.y - reach, reach * 2, reach * 2);
        pointer.presence *= still ? 0 : 0.95;
      }
      for (let i = 0; i < heat.length; i++) {
        const h = heat[i];
        if (h < 0.04) continue;
        warm = true;
        const level = Math.floor(Math.min(0.999, h * (0.7 + 0.6 * seeds[i])) * RAMP.length);
        ctx.fillStyle = `oklch(${light ? 0.5 : 0.82} 0.14 ${hues[i]} / ${(h * (light ? 0.7 : 0.6)).toFixed(3)})`;
        ctx.fillText(RAMP[level], ((i % cols) + 0.5) * STEP, (Math.floor(i / cols) + 0.5) * STEP);
        // Cooling: quick at first, then a slow tail. Without motion it goes out at once.
        heat[i] = still ? 0 : h * 0.95;
      }
      if (warm && !still) id = requestAnimationFrame(frame);
    };

    const onMove = (event: PointerEvent) => {
      // Not for touch, and not while the panel covers the page.
      if (event.pointerType === 'touch' || document.documentElement.hasAttribute('data-locked')) return;
      const box = canvas.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      Object.assign(pointer, { x, y, presence: 1 });
      const reach = Math.ceil(RADIUS / STEP);
      const cx = Math.floor(x / STEP);
      const cy = Math.floor(y / STEP);
      for (let r = Math.max(0, cy - reach); r <= Math.min(rows - 1, cy + reach); r++) {
        for (let c = Math.max(0, cx - reach); c <= Math.min(cols - 1, cx + reach); c++) {
          const d = Math.hypot((c + 0.5) * STEP - x, (r + 0.5) * STEP - y) / RADIUS;
          if (d >= 1) continue;
          const i = r * cols + c;
          const glow = (1 - d) ** 2;
          if (glow <= heat[i]) continue;
          // A cell that was cold takes a new colour and character each time it lights.
          if (heat[i] < 0.04) {
            hues[i] = HUES[Math.floor(Math.random() * HUES.length)];
            seeds[i] = Math.random();
          }
          heat[i] = glow;
        }
      }
      if (!id) id = requestAnimationFrame(frame);
    };

    resize();
    const watch = new ResizeObserver(resize);
    watch.observe(canvas);
    void document.fonts.load(FONT).catch(() => {});
    addEventListener('pointermove', onMove, { passive: true });
    return () => {
      watch.disconnect();
      removeEventListener('pointermove', onMove);
      cancelAnimationFrame(id);
    };
  }, []);

  return (
    <div className="lib-backdrop" aria-hidden>
      <canvas ref={ref} />
    </div>
  );
}
