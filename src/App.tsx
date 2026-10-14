import { ChevronDown, ChevronUp, LayoutGrid, Moon, Pause, Play, Search, Sun, X } from 'lucide-react';
import { AnimatePresence, motion, MotionConfig, type MotionStyle } from 'motion/react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { Backdrop } from './components/Backdrop';
import { ChainCard } from './components/Chains';
import { Dragon } from './components/Dragon';
import { leave, reflow, Tile, TYPE_ICON } from './components/Items';
import { Panel } from './components/Panel';
import { Roll } from './components/Roll';
import { Tstack } from './components/Tstack';
import { chains, collections, displayName, entries, examples, getEntry, plural, search, TYPES, type Entry, type EntryType } from './lib/library';
import { announce, reducedMotion, transition, typing } from './lib/motion';

type TypeFilter = EntryType | 'all';

const readHash = () => {
  const id = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  return getEntry(id) ? id : null;
};

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

const count = (list: Entry[], type: EntryType) => list.filter((e) => e.type === type).length;

/** The search shortcut as this keyboard writes it. Both ⌘K and Ctrl+K work everywhere. */
const SEARCH_KEY = /mac|iphone|ipad/i.test(
  (navigator as Navigator & { userAgentData?: { platform: string } }).userAgentData?.platform || navigator.platform,
)
  ? '⌘K'
  : 'Ctrl K';

/** How many tiles fit across the gallery, kept current as it is resized. It matches the
 * grid in app.css: tiles at least 18.75rem wide with a 16px gap. */
function useColumns(ref: RefObject<HTMLElement | null>) {
  const [columns, setColumns] = useState(3);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const tile = 18.75 * parseFloat(getComputedStyle(document.documentElement).fontSize);
      setColumns(Math.max(1, Math.floor((el.clientWidth + 16) / (tile + 16))));
    };
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(el);
    return () => watch.disconnect();
  }, [ref]);
  return columns;
}

/** How many panel entries this tab has stacked on the history entry it opened from. */
const depth = (): number => history.state?.depth ?? 0;

export function App() {
  const [type, setType] = useState<TypeFilter>('all');
  const [collection, setCollection] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(readHash);
  // What the panel shows. It outlives `open` while the panel animates away, so the page
  // is live again the moment closing starts, not when the motion ends.
  const [shown, setShown] = useState(open);
  // The panel was open when the page loaded, from a link: it starts in place.
  const linked = useRef(open !== null);
  const [active, setActive] = useState<string | null>(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('library-theme') ?? 'dark');
  // The skill drawings loop while on screen; this stops them, and the choice is kept.
  const [still, setStill] = useState(() => localStorage.getItem('library-still') === 'true');
  const searchRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  // The collections opened out to show everything in them. The rest show one row.
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const columns = useColumns(bodyRef);
  // One row of tiles; on a phone, where a row is one tile, two.
  const preview = Math.max(columns, 2);
  // What had focus when the panel opened. The page behind goes inert, which drops focus,
  // so it has to be noted before that and handed back once the page is live again.
  const opener = useRef<HTMLElement | null>(null);
  // Set while `close` walks back through history, so the popstate it causes closes the panel.
  const leaving = useRef(false);

  const searching = query.trim().length > 0;
  const matched = useMemo(() => search(query, entries), [query]);
  const inCollection = (e: Entry) => !collection || e.collection === collection;
  const inType = (e: Entry) => type === 'all' || e.type === type;
  const visible = matched.filter((e) => inCollection(e) && inType(e));
  const forTypes = matched.filter(inCollection);
  const forCollections = matched.filter(inType);

  // Each collection shows its first row until it is opened, so the whole library fits in a
  // few screens. Picking a collection in the rail shows all of that one.
  const sections = collections
    .map((c) => ({ ...c, all: visible.filter((e) => e.collection === c.id) }))
    .filter((s) => s.all.length > 0)
    .map((s) => {
      const open = collection !== null || expanded.has(s.id);
      return { ...s, open, folds: collection === null && s.all.length > preview, items: open ? s.all : s.all.slice(0, preview) };
    });

  // The order the arrow keys walk in: top to bottom as drawn.
  const order = searching ? visible.map((e) => e.id) : sections.flatMap((s) => s.items.map((e) => e.id));

  // A filter change from a click, as opposed to typing: the results move to their places.
  const refilter = (update: () => void) => {
    typing.now = false;
    setActive(null);
    update();
  };

  const toggleSection = (id: string) =>
    refilter(() =>
      setExpanded((old) => {
        const next = new Set(old);
        if (!next.delete(id)) next.add(id);
        return next;
      }),
    );

  // The chains and experimental sections are only there when nothing is filtered, so clear the filters, then go.
  const goTo = (id: string) => {
    refilter(() => {
      setQuery('');
      setType('all');
      setCollection(null);
    });
    requestAnimationFrame(() =>
      document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' }),
    );
  };

  const show = (id: string) => {
    if (!open) {
      // Safari doesn't focus a button when it is clicked, so fall back to the tile's own
      // button: that is where focus goes back to when the panel closes.
      const focused = document.activeElement;
      opener.current =
        focused instanceof HTMLElement && focused !== document.body
          ? focused
          : document.querySelector<HTMLElement>(`[data-entry="${id}"] .lib-tile-name`);
    }
    linked.current = false;
    setOpen(id);
    setShown(id);
  };

  const hide = () => setOpen(null);

  const openEntry = (id: string) => {
    history.pushState({ depth: depth() + 1 }, '', `#/${id}`);
    show(id);
  };

  // The close button, Escape and Back all leave the same way: back to the history entry
  // the panel was opened from, so Back afterwards never opens it again.
  const close = () => {
    if (!open) return;
    if (depth() > 0) {
      leaving.current = true;
      history.go(-depth());
    } else {
      // Arrived here from a link, with no list behind it: this entry becomes the list.
      history.replaceState(null, '', location.pathname + location.search);
      hide();
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('library-theme', next);
    transition(() => setTheme(next));
  };

  // A different collection is a different page: show it from its top. Left alone, the page
  // keeps the scroll it had, so a longer collection opens part way down, and a shorter one
  // snaps back to the top once the old one has faded and stopped holding the page open.
  // The most it can scroll is read from `main`, which the fading section isn't part of.
  // This runs before paint, so the jump to the new place is hidden by the cross-fade.
  const switched = useRef(false);
  useLayoutEffect(() => {
    if (!switched.current) {
      switched.current = true;
      return;
    }
    const start = bodyRef.current!.getBoundingClientRect().top + scrollY - 24;
    const furthest = bodyRef.current!.closest('main')!.getBoundingClientRect().bottom + scrollY - innerHeight;
    const top = Math.max(0, Math.min(start, furthest));
    if (scrollY > top) scrollTo({ top, behavior: 'instant' });
  }, [collection]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.toggleAttribute('data-still', still);
    localStorage.setItem('library-still', String(still));
  }, [still]);

  useEffect(() => {
    const onPop = () => {
      const id = readHash();
      if (leaving.current) {
        leaving.current = false;
        if (id) history.replaceState(null, '', location.pathname + location.search);
        return hide();
      }
      if (id === open) return;
      if (id) show(id);
      else hide();
    };
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  });

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
    active: active === entry.id,
    onOpen: openEntry,
  });

  const typeTabs: { id: TypeFilter; label: string; icon: typeof Search; total: number }[] = [
    { id: 'all', label: 'Everything', icon: LayoutGrid, total: forTypes.length },
    ...TYPES.map((t) => ({ id: t.id, label: t.plural, icon: TYPE_ICON[t.id], total: count(forTypes, t.id) })),
  ];
  const shownEntry = getEntry(shown);

  return (
    // Under reduced motion, Motion keeps fades and drops movement.
    <MotionConfig reducedMotion="user">
    <div className="lib">
      <aside className="lib-rail" inert={open !== null}>
        <div className="lib-brand">
          <Dragon />
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
          <button type="button" className="lib-nav-item lib-nav-chains" onClick={() => goTo('chains')}>
            <span className="lib-dot" aria-hidden />
            <span>Chains</span>
            <span className="lib-roll">{chains.length}</span>
          </button>
          <button type="button" className="lib-nav-item lib-nav-experimental" onClick={() => goTo('experimental')}>
            <span className="lib-dot" aria-hidden />
            <span>Experimental</span>
            <span className="lib-roll">1</span>
          </button>
        </div>

        <div className="lib-rail-foot">
          <span className="lib-keys">
            <kbd className="lib-kbd">{SEARCH_KEY}</kbd> search
            <kbd className="lib-kbd">C</kbd> copy
          </span>
          <span className="lib-rail-tools">
            <button
              type="button"
              className="lib-icon-btn"
              onClick={() => setStill((s) => !s)}
              aria-pressed={still}
              aria-label="Pause animations"
              title={still ? 'Play animations' : 'Pause animations'}
            >
              {still ? <Play size={15} /> : <Pause size={15} />}
            </button>
            <button type="button" className="lib-icon-btn" onClick={toggleTheme} aria-label="Switch theme" title="Switch theme">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </span>
        </div>
      </aside>

      <Backdrop />

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
              <kbd className="lib-kbd">{SEARCH_KEY}</kbd>
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

        <div className="lib-body" ref={bodyRef}>
          <AnimatePresence mode="popLayout" initial={false} custom={typing.now}>
          {visible.length === 0 && (
            <motion.div key="empty" className="lib-empty" layout="position" transition={reflow()} exit="out" variants={leave}>
              <p>{searching ? `No matches for “${query.trim()}”.` : 'Nothing matches these filters.'}</p>
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
                {searching ? 'Clear search and filters' : 'Clear filters'}
              </button>
            </motion.div>
          )}

          {searching && visible.length > 0 && (
            <motion.section key="matches" className="lib-section" layout="position" transition={reflow()} exit="out" variants={leave}>
              <header className="lib-section-head">
                <h2>Best matches</h2>
                <span className="lib-section-count">
                  <Roll value={visible.length} />
                </span>
              </header>
              <div className="lib-tiles">
                <AnimatePresence mode="popLayout" initial={false} custom={typing.now}>
                  {visible.map((entry, i) => (
                    <Tile key={entry.id} {...item(entry, i)} />
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          )}

          {!searching &&
            sections.map((section, n) => (
              <motion.section
                key={section.id}
                className="lib-section lib-hue"
                style={{ '--hue': section.hue } as MotionStyle}
                layout="position"
                transition={reflow()}
                exit="out"
                variants={leave}
              >
                <header className="lib-section-head">
                  <span className="lib-section-n">{String(n + 1).padStart(2, '0')}</span>
                  <h2>{section.name}</h2>
                  <p>{section.description}</p>
                  {section.folds ? (
                    <button type="button" className="lib-more" aria-expanded={section.open} onClick={() => toggleSection(section.id)}>
                      {section.open ? 'Show fewer' : `Show all ${section.all.length}`}
                      {section.open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  ) : (
                    <span className="lib-section-count">
                      <Roll value={section.all.length} />
                    </span>
                  )}
                </header>
                <div className="lib-tiles">
                  <AnimatePresence mode="popLayout" initial={false} custom={typing.now}>
                    {section.items.map((entry, i) => (
                      <Tile key={entry.id} {...item(entry, i)} />
                    ))}
                  </AnimatePresence>
                </div>
              </motion.section>
            ))}
          </AnimatePresence>
        </div>

        {/* Not entries, so these are only there when the whole library is: no search, no filter. */}
        {!searching && type === 'all' && !collection && chains.length > 0 && (
          <section id="chains" className="lib-section lib-chains-section" aria-labelledby="lib-chains-title">
            <header className="lib-section-head">
              <span className="lib-section-n">→</span>
              <h2 id="lib-chains-title">Chains</h2>
              <p>Skills that hand on to each other. Run them in order.</p>
              <span className="lib-section-count">{chains.length}</span>
            </header>
            <div className="lib-chains">
              {chains.map((chain) => (
                <ChainCard key={chain.id} chain={chain} onOpen={openEntry} />
              ))}
            </div>
          </section>
        )}

        {!searching && type === 'all' && !collection && (
          <section id="experimental" className="lib-section lib-experimental" aria-labelledby="lib-experimental-title">
            <header className="lib-section-head">
              <span className="lib-section-n">X</span>
              <h2 id="lib-experimental-title">Experimental</h2>
              <p>Still in development. Expect rough edges and changes.</p>
              <span className="lib-section-count">1</span>
            </header>
            <Tstack />
          </section>
        )}
      </main>

      <div id="lib-status" className="lib-status" role="status" />

      {shownEntry && (
        <Panel
          entry={shownEntry}
          open={open !== null}
          instant={linked.current}
          onClose={close}
          onOpen={openEntry}
          onClosed={() => setShown(null)}
        />
      )}
    </div>
    </MotionConfig>
  );
}
