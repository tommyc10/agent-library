import { RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { fillPrompt, plural, promptParts } from '../lib/library';
import { CopyButton } from './CopyButton';

interface BlankProps {
  name: string;
  value: string | undefined;
  onChange: (value: string) => void;
}

/** An editable gap in a prompt. It wraps with the sentence, which an input can't. */
function Blank({ name, value, onChange }: BlankProps) {
  const ref = useRef<HTMLSpanElement>(null);

  // Keep blanks that share a name in step, without moving the caret in the one being typed in.
  useEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    const text = value ?? name;
    if (el.textContent !== text) el.textContent = text;
  }, [name, value]);

  return (
    <span
      ref={ref}
      className="lib-blank"
      role="textbox"
      aria-label={name}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck={false}
      data-filled={value !== undefined || undefined}
      data-empty={value?.trim() === '' || undefined}
      onInput={(event) => onChange(event.currentTarget.textContent ?? '')}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
    >
      {name}
    </span>
  );
}

export function PromptBody({ body }: { body: string }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const parts = promptParts(body);
  const blanks = new Set(parts.filter((p) => p.blank).map((p) => p.text)).size;
  const edited = Object.keys(values).length > 0;

  return (
    <div className="lib-prompt">
      <p className="lib-prompt-text">
        {parts.map((part, i) =>
          part.blank ? (
            <Blank
              key={i}
              name={part.text}
              value={values[part.text]}
              onChange={(value) => setValues((v) => ({ ...v, [part.text]: value }))}
            />
          ) : (
            part.text
          ),
        )}
      </p>
      <div className="lib-prompt-bar">
        <span className="lib-prompt-hint">
          {blanks > 0 ? `${plural(blanks, 'blank')}. Click one to write your own.` : 'Ready to send as it is.'}
        </span>
        {edited && (
          <button type="button" className="lib-btn" data-variant="ghost" onClick={() => setValues({})}>
            <RotateCcw size={13} />
            Reset
          </button>
        )}
        <CopyButton variant="primary" label="Copy prompt" shortcut text={() => fillPrompt(body, values)} />
      </div>
    </div>
  );
}
