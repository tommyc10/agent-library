import { promptParts, type Entry, type PreviewKind } from '../lib/library';

/** The small drawing at the top of a skill tile. It moves while the tile is hovered or focused. */
export function Preview({ kind = 'blocks' }: { kind?: PreviewKind }) {
  return (
    <div className="lib-pv" data-kind={kind} aria-hidden>
      {kind === 'curve' && (
        <div className="lib-pv-curve">
          <svg viewBox="0 0 160 64" fill="none">
            <path d="M8 56 C 52 56, 44 8, 152 8" />
          </svg>
          <i />
        </div>
      )}
      {kind === 'timeline' && (
        <div className="lib-pv-timeline">
          <i />
          <i />
          <i />
          <i />
          <b />
        </div>
      )}
      {kind === 'spotlight' && (
        <div className="lib-pv-spotlight">
          <i />
          <i />
          <i />
          <b />
        </div>
      )}
      {kind === 'scroll' && (
        <div className="lib-pv-scroll">
          <i />
          <i />
          <i />
        </div>
      )}
      {kind === 'blocks' && (
        <div className="lib-pv-blocks">
          <i />
          <i />
          <i />
          <b />
        </div>
      )}
      {kind === 'phone' && (
        <div className="lib-pv-phone">
          <i />
          <b />
        </div>
      )}
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
    <span className="lib-draw lib-draw-text" data-mono={entry.type === 'agent' || undefined} aria-hidden>
      {entry.type === 'prompt'
        ? promptParts(entry.body).map((part, i) => (part.blank ? <mark key={i}>{part.text}</mark> : part.text))
        : entry.body.slice(0, 420)}
    </span>
  );
}
