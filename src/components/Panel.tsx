import { ArrowUpRight, Link2, X } from 'lucide-react';
import { motion, type MotionStyle } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { chainsWith, displayName, entries, getCollection, getEntry, hueOf, installCommand, sourceUrl, TYPES, type Entry } from '../lib/library';
import { usePanelMotion } from '../lib/panel-motion';
import { ChainCard } from './Chains';
import { CopyButton } from './CopyButton';
import { TYPE_ICON } from './Items';
import { localTarget, Markdown } from './Markdown';
import { PromptBody } from './PromptBody';

interface Props {
  entry: Entry;
  /** False while the panel is on its way out: the page behind is already live again. */
  open: boolean;
  /** Open already when the page loaded, from a link: no entrance. */
  instant: boolean;
  onClose: () => void;
  onOpen: (id: string) => void;
  /** Called once the panel has finished leaving. */
  onClosed: () => void;
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
          currentFile={current.name}
          localFiles={files.map((f) => f.name)}
          onLocalLink={(href) => {
            const next = files.findIndex((f) => f.name === localTarget(href, current.name));
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
  const inChains = chainsWith(entry.name);

  return (
    <>
      {entry.source && (
        <section className="lib-block">
          <h3 className="lib-label">Install it</h3>
          <div className="lib-calls">
            <div className="lib-call">
              <span className="lib-call-where">Terminal</span>
              <code>{installCommand(entry.source, entry.name)}</code>
              <CopyButton text={installCommand(entry.source, entry.name)} title="Copy install command" />
            </div>
            <div className="lib-call">
              <span className="lib-call-where">From</span>
              <a href={sourceUrl(entry.source, entry.name)} target="_blank" rel="noreferrer">
                {entry.source}
                <ArrowUpRight size={12} />
              </a>
            </div>
          </div>
        </section>
      )}

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

      {inChains.length > 0 && (
        <section className="lib-block">
          <h3 className="lib-label">{inChains.length > 1 ? 'Part of these chains' : 'Part of a chain'}</h3>
          <div className="lib-chains">
            {inChains.map((chain) => (
              <ChainCard key={chain.id} chain={chain} current={entry.name} onOpen={onOpen} />
            ))}
          </div>
        </section>
      )}

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

export function Panel({ entry, open, instant, onClose, onOpen, onClosed }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const motionValues = usePanelMotion(ref, { id: entry.id, open, instant, onClosed, onDismiss: onClose });
  const collection = getCollection(entry.collection);
  const type = TYPES.find((t) => t.id === entry.type)!;
  const Icon = TYPE_ICON[entry.type];
  const skill = entry.skill ? getEntry(`skill/${entry.skill}`) : undefined;

  // Opening, or a new entry in the same panel: back to the top, and take focus if it isn't
  // already inside. The app hands focus back to the page as soon as closing starts.
  useEffect(() => {
    if (!open) return;
    const panel = ref.current;
    panel?.scrollTo({ top: 0 });
    if (!panel?.contains(document.activeElement)) panel?.focus({ preventScroll: true });
    const title = document.title;
    document.title = `${displayName(entry)} · ${title}`;
    return () => {
      document.title = title;
    };
  }, [entry, open]);

  return (
    <>
      <motion.div className="lib-scrim" data-leaving={!open || undefined} style={{ opacity: motionValues.scrim }} onClick={onClose} />
      <motion.div className="lib-panel-shadow" aria-hidden style={{ x: motionValues.x, y: motionValues.y, opacity: motionValues.shadow }} />
      <motion.div
        ref={ref}
        className="lib-panel lib-hue"
        role="dialog"
        aria-modal="true"
        aria-label={displayName(entry)}
        tabIndex={-1}
        inert={!open}
        style={
          {
            '--hue': hueOf(entry),
            x: motionValues.x,
            y: motionValues.y,
            clipPath: motionValues.clipPath,
            opacity: motionValues.fade,
          } as MotionStyle
        }
        // Set on the element directly: a re-render on every scroll event would redraw the markdown.
        onScroll={(event) => event.currentTarget.toggleAttribute('data-scrolled', event.currentTarget.scrollTop > 0)}
      >
        <header className="lib-panel-head" {...motionValues.dragHandlers}>
          <span className="lib-grabber" aria-hidden />
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
      </motion.div>
    </>
  );
}
