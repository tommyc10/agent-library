import { Download } from 'lucide-react';
import type { CSSProperties } from 'react';
import { downloadCollection } from '../lib/download';
import { entries, plural, type Collection } from '../lib/library';
import { Markdown } from './Markdown';

interface Props {
  collection: Collection;
  guide: string;
  onOpen: (id: string) => void;
}

/** What a collection is and how to set it up, shown above its entries once it is opened. */
export function Guide({ collection, guide, onOpen }: Props) {
  const list = entries.filter((e) => e.collection === collection.id);
  return (
    <section className="lib-guide lib-hue" style={{ '--hue': collection.hue } as CSSProperties} aria-label={`${collection.name} guide`}>
      <div className="lib-guide-bar">
        <span className="lib-guide-name">Guide</span>
        <button type="button" className="lib-btn" data-tone onClick={() => void downloadCollection(collection, list)}>
          <Download size={14} />
          Download all of {collection.name}
          <span className="lib-guide-count">{plural(list.length, 'entry', 'entries')}, .zip</span>
        </button>
      </div>
      {/* Links in a guide name other entries, as `skill/how`, and open them here. */}
      <Markdown source={guide} localFiles={list.map((e) => e.id)} onLocalLink={onOpen} />
    </section>
  );
}
