import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { reducedMotion } from '../lib/motion';
import { CopyButton } from './CopyButton';

interface Run {
  command: string;
  output: string;
}

const TYPE_MS = 34;
const LINE_MS = 22;
/** The pause between the command and its first line, as if the CLI were thinking. */
const THINK_MS = 260;

/** What colour a line of output gets, from the shapes tblock prints. */
function Line({ text }: { text: string }) {
  const status = /^(\s*)(PASS|SKIP|WARN|FAIL)(\s.*)?$/.exec(text);
  if (status) {
    return (
      <>
        {status[1]}
        <span data-tone={status[2].toLowerCase()}>{status[2]}</span>
        {status[3]}
      </>
    );
  }
  if (/^\s*->/.test(text)) return <span data-tone="hint">{text}</span>;
  if (/^tblock \d/.test(text)) return <span data-tone="head">{text}</span>;
  if (/^\s*\*\s/.test(text)) return <span data-tone="current">{text}</span>;
  return <>{text}</>;
}

/** A terminal that types each command and prints its real output, then moves on to the next.
 * It moves on only by itself: once someone picks a command, it stays there. */
export function Terminal({ runs }: { runs: Run[] }) {
  const [at, setAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  // Cleared the moment someone picks a command, or when motion is reduced or paused.
  const [auto, setAuto] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const run = runs[at]!;
  const lines = run.output.split('\n');
  const typeEnd = run.command.length * TYPE_MS;
  const total = typeEnd + THINK_MS + lines.length * LINE_MS;
  // Reduced motion, or paused from the rail: the whole run at once, and no moving on.
  const instant = () => reducedMotion() || document.documentElement.hasAttribute('data-still');

  // Holds only while on screen, so nobody scrolls back to a command they never saw start.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const seen = new IntersectionObserver(([e]) => el.toggleAttribute('data-live', e!.isIntersecting));
    seen.observe(el);
    return () => seen.disconnect();
  }, []);

  useEffect(() => {
    if (instant()) {
      setElapsed(Infinity);
      return;
    }
    setElapsed(0);
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = now - start;
      setElapsed(t);
      if (t < total) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [at, total]);

  const typed = Math.min(run.command.length, Math.floor(elapsed / TYPE_MS));
  const shown = elapsed >= typeEnd + THINK_MS ? Math.min(lines.length, Math.floor((elapsed - typeEnd - THINK_MS) / LINE_MS) + 1) : 0;
  const done = elapsed >= total;

  // The screen is shorter than most runs, so it follows the newest line like a real terminal.
  const screen = useRef<HTMLPreElement>(null);
  useLayoutEffect(() => {
    if (screen.current) screen.current.scrollTop = screen.current.scrollHeight;
  }, [at, shown, done]);

  const pick = (i: number) => {
    setAuto(false);
    setAt(i);
  };

  return (
    <div className="lib-term" ref={ref} data-done={done || undefined} data-auto={(auto && !instant()) || undefined}>
      <div className="lib-term-bar">
        <span className="lib-term-lights" aria-hidden>
          <span />
          <span />
          <span />
        </span>
        <div className="lib-term-tabs" role="group" aria-label="Command">
          {runs.map((r, i) => (
            <button
              key={r.command}
              type="button"
              className="lib-term-tab"
              aria-pressed={i === at}
              onClick={() => pick(i)}
              // The bar under the current command fills while it holds, then the next one plays.
              onAnimationEnd={(event) => {
                if (event.animationName === 'lib-term-hold' && auto) setAt((at + 1) % runs.length);
              }}
            >
              {r.command}
            </button>
          ))}
        </div>
        <CopyButton text={run.command} title={`Copy ${run.command}`} />
      </div>
      <pre className="lib-term-screen" ref={screen} aria-hidden>
        <span className="lib-term-cmd">
          <span className="lib-term-prompt">$ </span>
          {run.command.slice(0, typed)}
          {shown === 0 && <span className="lib-term-caret" />}
        </span>
        {'\n'}
        {lines.slice(0, shown).map((line, i) => (
          <span key={i} className="lib-term-line">
            <Line text={line} />
            {'\n'}
          </span>
        ))}
        {done && (
          <span className="lib-term-cmd">
            <span className="lib-term-prompt">$ </span>
            <span className="lib-term-caret" />
          </span>
        )}
      </pre>
      {/* What a screen reader gets: the whole run, without the typing. */}
      <pre className="lib-status">{`$ ${run.command}\n${run.output}`}</pre>
    </div>
  );
}
