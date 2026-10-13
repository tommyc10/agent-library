import { LayoutGrid, Moon, Search, Sun, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { flushSync } from 'react-dom';
import { Tile, TYPE_ICON } from './components/Items';
import { Panel } from './components/Panel';
import { Roll } from './components/Roll';
import { collections, displayName, entries, examples, getEntry, plural, search, TYPES, type Entry, type EntryType } from './lib/library';
import { announce, reducedMotion, transition, typing } from './lib/motion';

type TypeFilter = EntryType | 'all';

const readHash = () => {
  const id = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  return getEntry(id) ? id : null;
};

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

const count = (list: Entry[], type: EntryType) => list.filter((e) => e.type === type).length;

export function App() {
  const [type, setType] = useState<TypeFilter>('all');
  const [collection, setCollection] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(readHash);
  // Which items are their own layer in the next view transition: all of them (a filter
  // change, so they slide to their new places) or one (it grows into the panel).
  const [named, setNamed] = useState<'all' | string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('library-theme') ?? 'dark');
  const searchRef = useRef<HTMLInputElement>(null);
  // What had focus when the panel opened. The page behind goes inert, which drops focus,
  // so it has to be noted before that and handed back once the page is live again.
  const opener = useRef<HTMLElement | null>(null);

  const searching = query.trim().length > 0;
  const matched = useMemo(() => search(query, entries), [query]);
  const inCollection = (e: Entry) => !collection || e.collection === collection;
  const inType = (e: Entry) => type === 'all' || e.type === type;
  const visible = matched.filter((e) => inCollection(e) && inType(e));
  const forTypes = matched.filter(inCollection);
  const forCollections = matched.filter(inType);

  const sections = collections
    .map((c) => ({ ...c, items: visible.filter((e) => e.collection === c.id) }))
    .filter((s) => s.items.length > 0);

  // The order the arrow keys walk in: top to bottom as drawn.
  const order = searching ? visible.map((e) => e.id) : sections.flatMap((s) => s.items.map((e) => e.id));

  // With reduced motion nothing is named, so a view transition only cross-fades the page.
  const name = (which: 'all' | string) => setNamed(reducedMotion() ? null : which);

  const refilter = (update: () => void) => {
    typing.now = false;
    flushSync(() => name('all'));
    setActive(null);
    transition(update, () => setNamed(null));
  };

  const openEntry = (id: string) => {
    history.pushState(null, '', `#/${id}`);
    if (open) return setOpen(id);
    opener.current = document.activeElement as HTMLElement | null;
    flushSync(() => name(id));
    transition(() => setOpen(id));
  };

  const close = () => {
    if (!open) return;
    history.pushState(null, '', location.pathname + location.search);
    flushSync(() => name(open));
    transition(
      () => setOpen(null),
      () => setNamed(null),
    );
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('library-theme', next);
    transition(() => setTheme(next));
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const onPop = () => setOpen(readHash());
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    document.documentElement.toggleAttribute('data-locked', open !== null);
    if (open === null) opener.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (open) close();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }
      if (event.key === 'Escape') {
        if (isTyping(event.target) && open) return (event.target as HTMLElement).blur();
        if (open) return close();
        if (query) return setQuery('');
        return searchRef.current?.blur();
      }
      if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === '/' && !open) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key.toLowerCase() === 'c' && open) {
        const panel = document.querySelector('.lib-panel');
        (panel?.querySelector<HTMLElement>('[data-shortcut="copy"]') ?? panel?.querySelector<HTMLElement>('.lib-doc .lib-copy'))?.click();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    if (!active) return;
    document.querySelector(`[data-entry="${active}"]`)?.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
  }, [active]);

  // Typing changes the results without moving focus, so say how many there are.
  useEffect(() => {
    if (searching) announce(visible.length ? plural(visible.length, 'result') : 'No results');
  }, [searching, query, visible.length]);

  const onSearchKey = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const at = active ? order.indexOf(active) : -1;
      const next = event.key === 'ArrowDown' ? Math.min(at + 1, order.length - 1) : Math.max(at - 1, 0);
      setActive(order[next] ?? null);
      const entry = getEntry(order[next] ?? null);
      if (entry) announce(`${displayName(entry)}, ${next + 1} of ${order.length}`);
    }
    if (event.key === 'Enter') {
      const target = active ?? (searching ? order[0] : null);
      if (target) openEntry(target);
    }
  };

  const item = (entry: Entry, index: number) => ({
    entry,
    index,
    named: open !== entry.id && (named === 'all' || named === entry.id),
    active: active === entry.id,
    onOpen: openEntry,
  });

  const typeTabs: { id: TypeFilter; label: string; icon: typeof Search; total: number }[] = [
    { id: 'all', label: 'Everything', icon: LayoutGrid, total: forTypes.length },
    ...TYPES.map((t) => ({ id: t.id, label: t.plural, icon: TYPE_ICON[t.id], total: count(forTypes, t.id) })),
  ];
  const openEntryData = getEntry(open);

  return (
    <div className="lib">
      <aside className="lib-rail" inert={open !== null}>
        <div className="lib-brand">
          <span className="lib-mark" aria-hidden />
          <span>
            <strong>Library</strong>
            <small>Skills, prompts and agent files</small>
          </span>
        </div>

        <nav className="lib-nav" aria-label="Type" style={{ '--at': typeTabs.findIndex((t) => t.id === type) } as CSSProperties}>
          <span className="lib-nav-pill" aria-hidden />
          {typeTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className="lib-nav-item"
              aria-current={tab.id === type || undefined}
              onClick={() => tab.id !== type && refilter(() => setType(tab.id))}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
              <Roll value={tab.total} />
            </button>
          ))}
        </nav>

        <h2 className="lib-rail-label">Collections</h2>
        <div className="lib-collections">
          {collections.map((c) => (
            <button
              key={c.id}
              type="button"
              className="lib-nav-item lib-hue"
              style={{ '--hue': c.hue } as CSSProperties}
              aria-pressed={collection === c.id}
              onClick={() => refilter(() => setCollection(collection === c.id ? null : c.id))}
            >
              <span className="lib-dot" aria-hidden />
              <span>{c.name}</span>
              <Roll value={forCollections.filter((e) => e.collection === c.id).length} />
            </button>
          ))}
        </div>

        <div className="lib-rail-foot">
          <span className="lib-keys">
            <kbd className="lib-kbd">⌘K</kbd> search
            <kbd className="lib-kbd">C</kbd> copy
          </span>
          <button type="button" className="lib-icon-btn" onClick={toggleTheme} aria-label="Switch theme" title="Switch theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </aside>

      <main className="lib-main" inert={open !== null}>
        <header className="lib-hero">
          <h1>What do you need an agent to do?</h1>
          <p className="lib-hero-sub">
            <Roll value={count(entries, 'skill')} /> skills, <Roll value={count(entries, 'prompt')} /> prompts and{' '}
            <Roll value={count(entries, 'agent')} /> agent files, ready to copy.
          </p>

          <label className="lib-search">
            <Search size={17} />
            <input
              ref={searchRef}
              value={query}
              placeholder="Describe the job, or type a name"
              aria-label="Search the library"
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => {
                typing.now = true;
                setQuery(event.target.value);
                setActive(null);
              }}
              onKeyDown={onSearchKey}
            />
            {query ? (
              <button type="button" className="lib-icon-btn" onClick={() => setQuery('')} aria-label="Clear search">
                <X size={15} />
              </button>
            ) : (
              <kbd className="lib-kbd">⌘K</kbd>
            )}
          </label>

          <div className="lib-examples">
            <span>Try</span>
            {examples.map((example) => (
              <button key={example} type="button" className="lib-example" onClick={() => refilter(() => setQuery(example))}>
                {example}
              </button>
            ))}
          </div>
        </header>

        <div className="lib-body">
          {visible.length === 0 && (
            <div className="lib-empty">
              <p>Nothing here matches that.</p>
              <button
                type="button"
                className="lib-btn"
                onClick={() =>
                  refilter(() => {
                    setQuery('');
                    setType('all');
                    setCollection(null);
                  })
                }
              >
                Show everything
              </button>
            </div>
          )}

          {searching && visible.length > 0 && (
            <section className="lib-section">
              <header className="lib-section-head">
                <h2>Best matches</h2>
                <span className="lib-section-count">
                  <Roll value={visible.length} />
                </span>
              </header>
              <div className="lib-tiles">
                {visible.map((entry, i) => (
                  <Tile key={entry.id} {...item(entry, i)} />
                ))}
              </div>
            </section>
          )}

          {!searching &&
            sections.map((section, n) => (
              <section key={section.id} className="lib-section lib-hue" style={{ '--hue': section.hue } as CSSProperties}>
                <header className="lib-section-head">
                  <span className="lib-section-n">{String(n + 1).padStart(2, '0')}</span>
                  <h2>{section.name}</h2>
                  <p>{section.description}</p>
                  <span className="lib-section-count">
                    <Roll value={section.items.length} />
                  </span>
                </header>
                <div className="lib-tiles">
                  {section.items.map((entry, i) => (
                    <Tile key={entry.id} {...item(entry, i)} />
                  ))}
                </div>
              </section>
            ))}
        </div>
      </main>

      <div id="lib-status" className="lib-status" role="status" />

      {openEntryData && <Panel entry={openEntryData} onClose={close} onOpen={openEntry} />}
    </div>
  );
}
