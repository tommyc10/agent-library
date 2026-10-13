import { Link2, X } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { displayName, entries, getCollection, getEntry, hueOf, transitionName, TYPES, type Entry } from '../lib/library';
import { CopyButton } from './CopyButton';
import { TYPE_ICON } from './Items';
import { localTarget, Markdown } from './Markdown';
import { PromptBody } from './PromptBody';

interface Props {
  entry: Entry;
  onClose: () => void;
  onOpen: (id: string) => void;
}

/** A markdown file, shown rendered or as the raw text you would copy. */
function Document({ files, path }: { files: { name: string; body: string }[]; path?: string }) {
  const [file, setFile] = useState(0);
  const [raw, setRaw] = useState(false);
  const current = files[file] ?? files[0];

  return (
    <section className="lib-doc">
      <div className="lib-doc-bar">
        {files.length > 1 ? (
          <div className="lib-seg" role="group" aria-label="File">
            {files.map((f, i) => (
              <button key={f.name} type="button" aria-pressed={i === file} onClick={() => setFile(i)}>
                {f.name}
              </button>
            ))}
          </div>
        ) : (
          <span className="lib-doc-name">{path ?? current.name}</span>
        )}
        <span className="lib-doc-end">
          <div className="lib-seg" role="group" aria-label="View">
            <button type="button" aria-pressed={!raw} onClick={() => setRaw(false)}>
              Rendered
            </button>
            <button type="button" aria-pressed={raw} onClick={() => setRaw(true)}>
              Raw
            </button>
          </div>
          <CopyButton variant="ghost" label="Copy file" text={current.body} />
        </span>
      </div>
      {raw ? (
        <pre className="lib-raw">{current.body}</pre>
      ) : (
        <Markdown
          key={current.name}
          source={current.body.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')}
          localFiles={files.map((f) => f.name)}
          onLocalLink={(href) => {
            const next = files.findIndex((f) => f.name === localTarget(href));
            if (next >= 0) setFile(next);
          }}
        />
      )}
    </section>
  );
}

function SkillBody({ entry, onOpen }: { entry: Entry; onOpen: (id: string) => void }) {
  const prompts = entries.filter((e) => e.type === 'prompt' && e.skill === entry.name);
  const calls = [
    { where: 'Claude Code', text: `/${entry.name}` },
    { where: 'Codex', text: `$${entry.name}` },
    { where: 'Anything else', text: `Use the ${entry.name} skill` },
  ];
  const extras = (entry.files ?? []).filter((f) => !f.endsWith('.md'));

  return (
    <>
      <section className="lib-block">
        <h3 className="lib-label">Call it</h3>
        <div className="lib-calls">
          {calls.map((call) => (
            <div key={call.where} className="lib-call">
              <span className="lib-call-where">{call.where}</span>
              <code>{call.text}</code>
              <CopyButton text={call.text} title={`Copy ${call.text}`} />
            </div>
          ))}
        </div>
      </section>

      {prompts.length > 0 && (
        <section className="lib-block">
          <h3 className="lib-label">Prompts that use it</h3>
          <div className="lib-links">
            {prompts.map((prompt) => (
              <button key={prompt.id} type="button" className="lib-link-row" onClick={() => onOpen(prompt.id)}>
                <span>{prompt.title}</span>
                <span>{prompt.description}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <Document files={[{ name: 'SKILL.md', body: entry.raw }, ...(entry.docs ?? [])]} />

      {extras.length > 0 && (
        <section className="lib-block">
          <h3 className="lib-label">Also in the folder</h3>
          <div className="lib-chips">
            {extras.map((file) => (
              <span key={file} className="lib-chip" data-mono>
                {file}
              </span>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export function Panel({ entry, onClose, onOpen }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const collection = getCollection(entry.collection);
  const type = TYPES.find((t) => t.id === entry.type)!;
  const Icon = TYPE_ICON[entry.type];
  const skill = entry.skill ? getEntry(`skill/${entry.skill}`) : undefined;

  // Move focus into the panel, and hand it back to where it was on close.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    ref.current?.focus({ preventScroll: true });
    return () => before?.focus?.({ preventScroll: true });
  }, []);

  // A new entry in the same panel: back to the top, and take focus back if the
  // button that was pressed went away with the old entry.
  useEffect(() => {
    const panel = ref.current;
    panel?.scrollTo({ top: 0 });
    if (!panel?.contains(document.activeElement)) panel?.focus({ preventScroll: true });
    const title = document.title;
    document.title = `${displayName(entry)} · ${title}`;
    return () => {
      document.title = title;
    };
  }, [entry]);

  return (
    <>
      <div className="lib-scrim" onClick={onClose} />
      <div
        ref={ref}
        className="lib-panel lib-hue lib-morph"
        role="dialog"
        aria-modal="true"
        aria-label={displayName(entry)}
        tabIndex={-1}
        style={{ '--hue': hueOf(entry), viewTransitionName: transitionName(entry.id) } as CSSProperties}
      >
        <header className="lib-panel-head">
          <span className="lib-badge" data-tone>
            <Icon size={12} />
            {type.label}
          </span>
          {collection && <span className="lib-panel-collection">{collection.name}</span>}
          <span className="lib-panel-actions">
            <CopyButton text={() => location.href} title="Copy link" />
            <button type="button" className="lib-icon-btn" onClick={onClose} aria-label="Close" title="Close (Esc)">
              <X size={15} />
            </button>
          </span>
        </header>

        <div className="lib-panel-body" key={entry.id}>
          <h2 className="lib-panel-title" data-mono={entry.type === 'skill' || undefined}>
            {displayName(entry)}
          </h2>
          <p className="lib-panel-lead">{entry.description}</p>

          {entry.type === 'skill' && <SkillBody entry={entry} onOpen={onOpen} />}

          {entry.type === 'prompt' && (
            <>
              <PromptBody body={entry.body} />
              {skill && (
                <section className="lib-block">
                  <h3 className="lib-label">Uses the skill</h3>
                  <div className="lib-links">
                    <button type="button" className="lib-link-row" onClick={() => onOpen(skill.id)}>
                      <span data-mono>{displayName(skill)}</span>
                      <span>{skill.description}</span>
                    </button>
                  </div>
                </section>
              )}
            </>
          )}

          {entry.type === 'agent' && <Document files={[{ name: 'AGENTS.md', body: entry.body }]} path={entry.path} />}

          <footer className="lib-panel-foot">
            <Link2 size={12} />
            <span>{entry.id}</span>
          </footer>
        </div>
      </div>
    </>
  );
}
