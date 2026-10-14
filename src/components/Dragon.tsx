import { animate, motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { reducedMotion, spring } from '../lib/motion';

/* The dragon in the rail, built from the layers that assets/brand/split-dragon.py cuts from
 * the favicon: the whites, both irises on one sheet, a lid per eye, and the head with the eyes
 * cut out on top. It watches the pointer, blinks, sneezes sparks when poked, and gets dizzy if
 * you circle it. Positions are percentages of the mark, so it works at any size. */

const LIDS = {
  left: { left: '23.52%', top: '61.08%', width: '20.26%', height: '14.04%' },
  right: { left: '64.43%', top: '53.99%', width: '18.18%', height: '18.1%' },
};
const NOSTRILS = [
  { x: 47.8, y: 75.6 },
  { x: 63, y: 74.8 },
];
/** How far the irises travel inside the eyes before the lids cover them. */
const EYE_RANGE = { x: 5, y: 2.6 };
/** How far away the pointer has to be before the eyes go all the way to the side. */
const REACH = 160;
/** Two laps around the dragon inside this radius make it dizzy. */
const DIZZY_RADIUS = 140;
const DIZZY_TURN = Math.PI * 4;

type Spark = { id: number; x: number; y: number; dx: number; dy: number; rise: number; size: number; hue: number; delay: number };

let sparkId = 0;

export function Dragon() {
  const [still] = useState(reducedMotion);
  const ref = useRef<HTMLSpanElement>(null);
  const [sparks, setSparks] = useState<Spark[]>([]);

  // Where it is looking, from -1 to 1 on each axis. The eyes dart there; the head follows lazily.
  const lookX = useMotionValue(0);
  const lookY = useMotionValue(0);
  const eyeX = useSpring(lookX, spring(0.8, 0.16));
  const eyeY = useSpring(lookY, spring(0.8, 0.16));
  const headX = useSpring(lookX, spring(0.6, 0.6));
  const headY = useSpring(lookY, spring(0.6, 0.6));
  const wobble = useMotionValue(0);
  const squash = useMotionValue(1);
  const lid = useMotionValue(0);

  const irisX = useTransform(eyeX, (v) => `${v * EYE_RANGE.x}%`);
  const irisY = useTransform(eyeY, (v) => `${v * EYE_RANGE.y}%`);
  const turnX = useTransform(headX, (v) => `${v * 4}%`);
  const turnY = useTransform(headY, (v) => `${v * 3}%`);
  const tilt = useTransform(() => headX.get() * 7 + wobble.get());

  const busy = useRef(false);
  const heat = useRef({ level: 0, at: 0 });

  const blink = (times = 1) =>
    animate(lid, [0, 1, 1, 0], {
      duration: 0.2,
      times: [0, 0.35, 0.5, 1],
      ease: 'easeInOut',
      repeat: times - 1,
      repeatDelay: 0.08,
    });

  useEffect(() => {
    if (still) return;
    const el = ref.current!;
    let idle = 0;
    let blinker = 0;
    let spin = 0;
    let lastAngle: number | null = null;
    let lastNear = 0;

    // Blink every few seconds, sometimes twice.
    const scheduleBlink = () => {
      blinker = window.setTimeout(() => {
        if (!busy.current) blink(Math.random() < 0.2 ? 2 : 1);
        scheduleBlink();
      }, 2500 + Math.random() * 4000);
    };
    scheduleBlink();

    const rest = () => {
      if (busy.current) return;
      lookX.set(0);
      lookY.set(0);
    };

    const dizzy = () => {
      busy.current = true;
      const start = performance.now();
      const loop = (now: number) => {
        const t = (now - start) / 1000;
        if (t < 1.6) {
          const fade = 1 - Math.max(0, t - 1.1) / 0.5;
          lookX.set(Math.cos(t * 13) * 0.9 * fade);
          lookY.set(Math.sin(t * 13) * 0.9 * fade);
          requestAnimationFrame(loop);
        } else {
          busy.current = false;
          blink(2);
        }
      };
      requestAnimationFrame(loop);
      animate(wobble, [0, -14, 11, -9, 6, -3, 0], { duration: 1.6, ease: 'easeInOut' });
    };

    const onMove = (e: PointerEvent) => {
      window.clearTimeout(idle);
      idle = window.setTimeout(rest, 5000);
      if (busy.current) return;
      const box = el.getBoundingClientRect();
      const dx = e.clientX - (box.left + box.width / 2);
      const dy = e.clientY - (box.top + box.height / 2);
      const distance = Math.hypot(dx, dy) || 1;
      const reach = Math.min(distance / REACH, 1);
      lookX.set((dx / distance) * reach);
      lookY.set((dy / distance) * reach);

      // Add up how far the pointer has swept around the dragon. Leaving the ring, or
      // pausing for half a second, starts the count again.
      const now = performance.now();
      if (distance > DIZZY_RADIUS || distance < 12 || now - lastNear > 500) {
        spin = 0;
        lastAngle = null;
      }
      if (distance <= DIZZY_RADIUS) {
        lastNear = now;
        const angle = Math.atan2(dy, dx);
        if (lastAngle !== null) {
          let step = angle - lastAngle;
          if (step > Math.PI) step -= Math.PI * 2;
          if (step < -Math.PI) step += Math.PI * 2;
          spin += step;
        }
        lastAngle = angle;
        if (Math.abs(spin) > DIZZY_TURN) {
          spin = 0;
          lastAngle = null;
          dizzy();
        }
      }
    };

    const leave = () => {
      window.clearTimeout(idle);
      idle = window.setTimeout(rest, 800);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    window.addEventListener('blur', leave);
    return () => {
      window.clearTimeout(idle);
      window.clearTimeout(blinker);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', leave);
      window.removeEventListener('blur', leave);
    };
  }, [still]);

  // Poke it and it sneezes sparks. Keep poking and the sneezes get bigger.
  const sneeze = () => {
    if (still || busy.current) return;
    const now = performance.now();
    heat.current.level = now - heat.current.at < 1200 ? Math.min(heat.current.level + 1, 3) : 0;
    heat.current.at = now;
    const level = heat.current.level;

    animate(squash, [1, 0.84, 1.1 + level * 0.04, 1], { duration: 0.5, times: [0, 0.25, 0.55, 1], ease: 'easeOut' });
    animate(lid, [0, 0.85, 0.85, 0], { duration: 0.45, times: [0, 0.2, 0.55, 1] });

    const count = 4 + level * 3;
    const fresh: Spark[] = Array.from({ length: count }, (_, i) => {
      const nostril = NOSTRILS[i % 2];
      // Out and down from each nostril, then drifting up as they cool.
      const angle = (i % 2 ? 0.15 : 0.85) * Math.PI + (Math.random() - 0.5) * 1.1;
      const far = (5 + Math.random() * 6) * (1 + level * 0.35);
      return {
        id: sparkId++,
        x: nostril.x,
        y: nostril.y,
        dx: Math.cos(angle) * far,
        dy: Math.abs(Math.sin(angle)) * far * 0.6,
        rise: 6 + Math.random() * 8 + level * 3,
        size: 2 + Math.random() * 2 + level * 0.5,
        hue: 8 + Math.random() * 30,
        delay: 0.08 + Math.random() * 0.08,
      };
    });
    setSparks((s) => [...s, ...fresh]);
  };

  return (
    <span ref={ref} className="lib-mark" aria-hidden onPointerDown={sneeze}>
      <motion.span className="lib-mark-head" style={{ x: turnX, y: turnY, rotate: tilt, scale: squash }}>
        <img src="./dragon/whites.png" alt="" draggable={false} />
        <motion.img src="./dragon/iris.png" alt="" draggable={false} style={{ x: irisX, y: irisY }} />
        {(['left', 'right'] as const).map((side) => (
          <motion.img
            key={side}
            className="lib-mark-lid"
            src={`./dragon/lid-${side}.png`}
            alt=""
            draggable={false}
            style={{ ...LIDS[side], scaleY: lid }}
          />
        ))}
        <img src="./dragon/head.png" alt="" draggable={false} />
      </motion.span>
      {sparks.map((s) => (
        <motion.span
          key={s.id}
          className="lib-mark-spark"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, margin: -s.size / 2, '--hue': s.hue } as CSSProperties}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ x: [0, s.dx, s.dx * 1.3], y: [0, s.dy, s.dy - s.rise], scale: [1, 1, 0.3], opacity: [1, 1, 0] }}
          transition={{ duration: 0.75, delay: s.delay, times: [0, 0.3, 1], ease: 'easeOut' }}
          onAnimationComplete={() => setSparks((all) => all.filter((x) => x.id !== s.id))}
        />
      ))}
    </span>
  );
}
