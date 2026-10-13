import DOMPurify from 'dompurify';
import { Marked } from 'marked';
import { useMemo } from 'react';
import { copyText } from '../lib/motion';

const escape = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const marked = new Marked({
  gfm: true,
  renderer: {
    code({ text }) {
      return `<div class="lib-code"><button type="button" class="lib-code-copy" data-copy>Copy</button><pre><code>${escape(text)}</code></pre></div>`;
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

  return (
    <div
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
