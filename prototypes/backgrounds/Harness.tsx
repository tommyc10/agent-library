import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { App } from '../../src/App';
import { Bayer } from './variants/Bayer';
import { DotMatrix } from './variants/DotMatrix';
import { Grain } from './variants/Grain';
import { Scanline } from './variants/Scanline';

const VARIANTS = [
  { name: 'Scanline', Background: Scanline },
  { name: 'Bayer', Background: Bayer },
  { name: 'Grain', Background: Grain },
  { name: 'Dot matrix', Background: DotMatrix },
];

const initial = () => {
  const v = parseInt(new URLSearchParams(location.search).get('v') ?? '', 10);
  return v >= 1 && v <= VARIANTS.length ? v - 1 : 0;
};

export function Harness() {
  const [current, setCurrent] = useState(initial);
  const { Background } = VARIANTS[current];

  const select = (i: number) => {
    if (i < 0 || i >= VARIANTS.length) return;
    setCurrent(i);
    const url = new URL(location.href);
    url.searchParams.set('v', String(i + 1));
    history.replaceState(history.state, '', url);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= VARIANTS.length) select(num - 1);
      else if (e.key === 'ArrowRight') select((current + 1) % VARIANTS.length);
      else if (e.key === 'ArrowLeft') select((current - 1 + VARIANTS.length) % VARIANTS.length);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  return (
    <>
      <Background key={current} />
      <App />
      <Picker current={current} onSelect={select} />
    </>
  );
}

function Picker({ current, onSelect }: { current: number; onSelect: (i: number) => void }) {
  const nav = useRef<HTMLElement>(null);
  const highlight = useRef<HTMLSpanElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);

  useLayoutEffect(() => {
    const move = () => {
      const el = items.current[current];
      if (!el || !highlight.current) return;
      highlight.current.style.width = `${el.offsetWidth}px`;
      highlight.current.style.transform = `translateX(${el.offsetLeft}px)`;
    };
    move();
    addEventListener('resize', move);
    return () => removeEventListener('resize', move);
  }, [current]);

  // Enable the slide only after first paint, so load doesn't animate.
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => nav.current?.setAttribute('data-ready', '')));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <nav ref={nav} className="proto-picker" aria-label="Prototype variants">
      <span ref={highlight} className="proto-picker-highlight" aria-hidden="true" />
      {VARIANTS.map((v, i) => (
        <button
          key={v.name}
          ref={(el) => {
            items.current[i] = el;
          }}
          type="button"
          className="proto-picker-item"
          data-active={i === current ? '' : undefined}
          aria-current={i === current ? 'true' : undefined}
          onClick={() => onSelect(i)}
        >
          {v.name}
        </button>
      ))}
    </nav>
  );
}
