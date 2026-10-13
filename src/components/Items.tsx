import { FileText, MessageSquareText, Zap } from 'lucide-react';
import type { CSSProperties } from 'react';
import { displayName, fillPrompt, hueOf, transitionName, TYPES, type Entry, type EntryType } from '../lib/library';
import { useStill } from '../lib/motion';
import { CopyButton } from './CopyButton';
import { Drawing } from './Preview';

export const TYPE_ICON: Record<EntryType, typeof Zap> = {
  skill: Zap,
  prompt: MessageSquareText,
  agent: FileText,
};

export interface ItemProps {
  entry: Entry;
  /** Position in its group, for the staggered arrival. */
  index: number;
  /** True while this item should move as its own layer in a view transition. */
  named: boolean;
  active: boolean;
  onOpen: (id: string) => void;
}

function itemStyle({ entry, index, named }: ItemProps) {
  return {
    '--hue': hueOf(entry),
    '--i': Math.min(index, 10),
    viewTransitionName: named ? transitionName(entry.id) : undefined,
  } as CSSProperties;
}

/** One entry in the gallery: its picture, its name and what it is for. */
export function Tile(props: ItemProps) {
  const { entry, active, onOpen } = props;
  const Icon = TYPE_ICON[entry.type];
  return (
    <div
      className="lib-tile lib-hue lib-morph"
      style={itemStyle(props)}
      data-entry={entry.id}
      data-active={active || undefined}
      data-still={useStill()}
    >
      <Drawing entry={entry} />
      <span className="lib-tile-caption">
        <button type="button" className="lib-tile-name" data-mono={entry.type === 'skill' || undefined} onClick={() => onOpen(entry.id)}>
          {displayName(entry)}
        </button>
        <span className="lib-kind">
          <Icon size={11} />
          {TYPES.find((t) => t.id === entry.type)!.label}
        </span>
      </span>
      <span className="lib-tile-desc">{entry.description}</span>
      {entry.type !== 'skill' && (
        <CopyButton
          text={() => (entry.type === 'prompt' ? fillPrompt(entry.body) : entry.raw)}
          title={entry.type === 'prompt' ? 'Copy prompt' : 'Copy file'}
        />
      )}
    </div>
  );
}
