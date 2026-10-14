import { promptParts, type Entry, type PreviewKind } from '../lib/library';

/** What each drawing is made of: its class in previews.css, how many still parts (`i`)
 * and moving parts (`b`) it has, and the variant of that drawing, if it is one. */
const DRAWINGS: Record<PreviewKind, { box: string; i: number; b: number; variant?: string }> = {
  curve: { box: 'curve', i: 1, b: 0 },
  review: { box: 'review', i: 3, b: 3 },
  rank: { box: 'rank', i: 4, b: 0 },
  scan: { box: 'scan', i: 4, b: 1 },
  lookup: { box: 'lookup', i: 3, b: 1 },
  press: { box: 'press', i: 1, b: 1 },
  beam: { box: 'beam', i: 1, b: 1 },
  timeline: { box: 'timeline', i: 4, b: 1 },
  spotlight: { box: 'spotlight', i: 3, b: 2 },
  'spotlight-lite': { box: 'spotlight', i: 3, b: 2, variant: 'lite' },
  scroll: { box: 'scroll', i: 3, b: 0 },
  tween: { box: 'tween', i: 2, b: 1 },
  trigger: { box: 'trigger', i: 3, b: 2 },
  morph: { box: 'morph', i: 1, b: 1 },
  orbit: { box: 'orbit', i: 3, b: 1 },
  stagger: { box: 'stagger', i: 5, b: 0 },
  meter: { box: 'meter', i: 6, b: 1 },
  slider: { box: 'slider', i: 2, b: 1 },
  form: { box: 'form', i: 2, b: 2 },
  pick: { box: 'pick', i: 3, b: 1 },
  blocks: { box: 'blocks', i: 3, b: 1 },
  variants: { box: 'variants', i: 3, b: 3 },
  phone: { box: 'phone', i: 1, b: 1 },
  'phone-tabs': { box: 'phone', i: 1, b: 4, variant: 'tabs' },
  'phone-swipe': { box: 'phone', i: 1, b: 2, variant: 'swipe' },
  code: { box: 'code', i: 5, b: 0 },
};

/** Drawings play while they are on screen and rest once they are scrolled away. */
const onScreen =
  typeof IntersectionObserver === 'undefined'
    ? null
    : new IntersectionObserver(
        (seen) => {
          for (const { target, isIntersecting } of seen) target.toggleAttribute('data-live', isIntersecting);
        },
        // Start a little before a drawing scrolls in, so it is never caught standing still.
        { rootMargin: '15% 0px' },
      );

const watch = (el: HTMLElement | null) => {
  if (!el) return;
  if (!onScreen) {
    el.toggleAttribute('data-live', true);
    return;
  }
  onScreen.observe(el);
  return () => onScreen.unobserve(el);
};

/** The small drawing at the top of a skill tile. */
export function Preview({ kind = 'blocks' }: { kind?: PreviewKind }) {
  const drawing = DRAWINGS[kind] ?? DRAWINGS.blocks;
  return (
    <div ref={watch} className="lib-pv" data-kind={kind} aria-hidden>
      <div className={`lib-pv-${drawing.box}`} data-variant={drawing.variant}>
        {kind === 'curve' && (
          <svg viewBox="0 0 160 64" fill="none">
            <path d="M8 56 C 52 56, 44 8, 152 8" />
          </svg>
        )}
        {Array.from({ length: drawing.i }, (_, n) => (
          <i key={n} />
        ))}
        {Array.from({ length: drawing.b }, (_, n) => (
          <b key={n} />
        ))}
      </div>
    </div>
  );
}

/** An entry's picture. A skill has its drawing; a prompt's is the prompt with its blanks lit; an agent file's is the top of the file. */
export function Drawing({ entry }: { entry: Entry }) {
  if (entry.type === 'skill') {
    return (
      <span className="lib-draw">
        <Preview kind={entry.preview} />
      </span>
    );
  }
  return (
    <span className="lib-draw" aria-hidden>
      <span className="lib-draw-text" data-mono={entry.type === 'agent' || undefined}>
        <span className="lib-draw-content">
          {entry.type === 'prompt'
            ? promptParts(entry.body).map((part, i) => (part.blank ? <mark key={i}>{part.text}</mark> : part.text))
            : entry.body.slice(0, 420)}
        </span>
      </span>
    </span>
  );
}
