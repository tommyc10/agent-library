import { FileText, MessageSquareText, Zap } from 'lucide-react';
import { motion, type MotionStyle, type Variants } from 'motion/react';
import type { Ref } from 'react';
import { displayName, fillPrompt, hueOf, TYPES, type Entry, type EntryType } from '../lib/library';
import { spring, typing, useStill } from '../lib/motion';
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
  active: boolean;
  onOpen: (id: string) => void;
  ref?: Ref<HTMLDivElement>;
}

/** How tiles and sections move to their new places when a filter changes: a spring that
 * starts from where they are, so clicking through filters quickly never makes them jump.
 * While typing, results change on every key, so they go straight there. */
export const reflow = () => (typing.now ? { duration: 0 } : spring(1, 0.35));

/** Leaving: a quick fade where it stood, while the rest close the gap. `custom` is
 * whether typing is under way, read when the exit starts rather than when last drawn. */
export const leave: Variants = {
  out: (still: boolean) => ({ opacity: 0, transition: still ? { duration: 0 } : { duration: 0.15 } }),
};

/** One entry in the gallery: its picture, its name and what it is for. */
export function Tile({ entry, index, active, onOpen, ref }: ItemProps) {
  const Icon = TYPE_ICON[entry.type];
  return (
    <motion.div
      ref={ref}
      layout="position"
      transition={reflow()}
      exit="out"
      variants={leave}
      className="lib-tile lib-hue"
      style={{ '--hue': hueOf(entry), '--i': Math.min(index, 10) } as MotionStyle}
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
    </motion.div>
  );
}
