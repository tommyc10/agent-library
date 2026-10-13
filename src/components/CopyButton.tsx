import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { copyText } from '../lib/motion';

interface Props {
  /** The text, or a function that builds it at the moment of copying. */
  text: string | (() => string);
  label?: ReactNode;
  variant?: 'icon' | 'ghost' | 'primary';
  title?: string;
  /** Lets a keyboard shortcut press this button. */
  shortcut?: boolean;
  /** Opt out of press scaling in contexts where motion would distract. */
  static?: boolean;
}

export function CopyButton({ text, label, variant = 'icon', title = 'Copy', shortcut, static: isStatic }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      className="lib-copy"
      data-variant={variant}
      data-copied={copied || undefined}
      data-static={isStatic || undefined}
      data-shortcut={shortcut ? 'copy' : undefined}
      aria-label={label ? undefined : title}
      title={label ? undefined : title}
      onClick={(event) => {
        event.stopPropagation();
        void copyText(typeof text === 'function' ? text() : text);
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), 1400);
      }}
    >
      <span className="lib-copy-icons" aria-hidden>
        <Copy size={14} />
        <Check size={14} />
      </span>
      {label && <span>{copied ? 'Copied' : label}</span>}
      {shortcut && <kbd className="lib-kbd">C</kbd>}
    </button>
  );
}
