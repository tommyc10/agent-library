import DOMPurify from 'dompurify';
import { Marked } from 'marked';
import { useEffect, useMemo, useRef } from 'react';
import { copyText } from '../lib/motion';

const escape = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const marked = new Marked({
  gfm: true,
  renderer: {
    code({ text }) {
      return `<div class="lib-code"><button type="button" class="lib-code-copy" data-copy aria-label="Copy code">Copy</button><pre><code>${escape(text)}</code></pre></div>`;
    },
  },
});

interface Props {
  source: string;
  /** The files a relative link can open. A link to anything else is shown as plain text. */
  localFiles?: string[];
  currentFile?: string;
  /** Called with the target of a link that points at another file in the same folder. */
  onLocalLink?: (href: string) => void;
}

/** The file a relative link points at: `./RECIPES.md#springs` is `RECIPES.md`. */
export const localTarget = (href: string, currentFile = '') => {
  const target = href.split('#')[0];
  if (!target) return currentFile;
  const parts = currentFile.split('/').slice(0, -1);
  for (const part of target.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return parts.join('/');
};

export function Markdown({ source, localFiles, currentFile, onLocalLink }: Props) {
  const files = localFiles?.join('\n') ?? '';
  const html = useMemo(() => {
    const page = document.createElement('template');
    page.innerHTML = DOMPurify.sanitize(marked.parse(source, { async: false }));
    const known = files.split('\n');
    for (const link of page.content.querySelectorAll('a')) {
      const href = link.getAttribute('href') ?? '';
      if (!/^https?:/.test(href) && !known.includes(localTarget(href, currentFile))) link.replaceWith(...link.childNodes);
    }
    return page.innerHTML;
  }, [source, files, currentFile]);

  // A code block or table wider than the panel scrolls sideways. Let the keyboard reach it
  // while it does, and leave it out of the tab order while it doesn't.
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mark = () => {
      // Numbered, so each region has a name of its own.
      const counts = { PRE: 0, TABLE: 0 };
      for (const area of el.querySelectorAll<HTMLElement>('.lib-code pre, table')) {
        const kind = area.tagName as keyof typeof counts;
        const scrolls = area.scrollWidth > area.clientWidth;
        if (scrolls) {
          area.tabIndex = 0;
          area.setAttribute('role', 'region');
          area.setAttribute('aria-label', `${kind === 'PRE' ? 'Code example' : 'Table'} ${++counts[kind]}`);
        } else {
          area.removeAttribute('tabindex');
          area.removeAttribute('role');
          area.removeAttribute('aria-label');
        }
      }
    };
    mark();
    const watch = new ResizeObserver(mark);
    watch.observe(el);
    return () => watch.disconnect();
  }, [html]);

  return (
    <div
      ref={root}
      className="lib-md"
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={(event) => {
        const target = event.target as HTMLElement;

        const button = target.closest<HTMLButtonElement>('[data-copy]');
        if (button) {
          void copyText(button.parentElement?.querySelector('pre')?.textContent ?? '');
          button.textContent = 'Copied';
          button.dataset.copied = '';
          setTimeout(() => {
            button.textContent = 'Copy';
            delete button.dataset.copied;
          }, 1400);
          return;
        }

        const link = target.closest('a');
        if (!link) return;
        const href = link.getAttribute('href') ?? '';
        event.preventDefault();
        if (/^https?:/.test(href)) window.open(href, '_blank', 'noopener');
        else onLocalLink?.(href);
      }}
    />
  );
}
