import data from 'virtual:library';

export type EntryType = 'skill' | 'prompt' | 'agent';
export type PreviewKind = 'curve' | 'timeline' | 'spotlight' | 'scroll' | 'blocks' | 'phone';

export interface Entry {
  id: string;
  type: EntryType;
  name: string;
  title: string;
  description: string;
  collection: string;
  tags: string[];
  /** The markdown below the frontmatter. For a prompt, the prompt itself. */
  body: string;
  /** What "copy file" copies. */
  raw: string;
  /** Skills: every file in the skill's folder. */
  files?: string[];
  /** Skills: the other markdown files that ship beside SKILL.md. */
  docs?: { name: string; body: string }[];
  preview?: PreviewKind;
  /** Prompts: the skill this prompt calls. */
  skill?: string;
  /** Agent files: where the file lives. */
  path?: string;
}

export interface Collection {
  id: string;
  name: string;
  hue: number;
  description: string;
}

export interface LibraryData {
  collections: Collection[];
  examples: string[];
  entries: Entry[];
}

export const { collections, examples, entries } = data;

export const TYPES: { id: EntryType; label: string; plural: string }[] = [
  { id: 'skill', label: 'Skill', plural: 'Skills' },
  { id: 'prompt', label: 'Prompt', plural: 'Prompts' },
  { id: 'agent', label: 'Agent file', plural: 'Agent files' },
];

const entryById = new Map(entries.map((e) => [e.id, e]));
const collectionById = new Map(collections.map((c) => [c.id, c]));

export const getEntry = (id: string | null) => (id ? entryById.get(id) : undefined);
export const getCollection = (id: string) => collectionById.get(id);
export const hueOf = (entry: Entry) => collectionById.get(entry.collection)?.hue ?? 0;

/** What a skill is called by: `/animate`. Prompts and agent files use their title. */
export const displayName = (entry: Entry) => (entry.type === 'skill' ? `/${entry.name}` : entry.title);

/** A name safe to use as a view-transition-name. */
export const transitionName = (id: string) => `e-${id.replace(/[^a-z0-9]/gi, '-')}`;

const pluralRules = new Intl.PluralRules('en');

/** A count with its noun: "1 file", "3 files". */
export const plural = (n: number, one: string, other = `${one}s`) => `${n} ${pluralRules.select(n) === 'one' ? one : other}`;

const BLANK = /\{\{(.+?)\}\}/g;

/** A prompt with its blanks filled in. An untouched blank keeps its example text. */
export function fillPrompt(body: string, values: Record<string, string> = {}) {
  return body.replace(BLANK, (_, key: string) => values[key]?.trim() || key);
}

/** Split a prompt into plain text and blanks, in order. */
export function promptParts(body: string) {
  return body.split(BLANK).map((text, i) => ({ text, blank: i % 2 === 1 }));
}

const STOP = new Set(
  'a an and are as at be can do does for from how i in is it me my of on or our so that the this to up we what with you your'.split(' '),
);

function tokens(query: string) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => (t.length > 4 ? t.replace(/(ing|ed|s)$/, '') : t));
}

/** Rank entries against a plain-language query. Names count most, body text least. */
export function search(query: string, list: Entry[]) {
  const words = tokens(query);
  if (!words.length) return list;

  const fieldsOf = (entry: Entry): [string, number][] => [
    [`${entry.name} ${entry.title}`.toLowerCase(), 6],
    [entry.tags.join(' ').toLowerCase(), 4],
    [entry.description.toLowerCase(), 3],
    [(collectionById.get(entry.collection)?.name ?? '').toLowerCase(), 2],
    [entry.body.toLowerCase(), 1],
  ];
  const all = list.map((entry) => ({ entry, fields: fieldsOf(entry) }));

  // A word found in few entries says more than one found in most of them:
  // in "add a toast", "toast" should decide the result, not "add".
  const rarity = words.map((word) => {
    const found = all.filter(({ fields }) => fields.some(([text]) => text.includes(word))).length;
    return found ? Math.log(1 + all.length / found) : 0;
  });

  const scored = all
    .map(({ entry, fields }) => {
      let score = 0;
      words.forEach((word, i) => {
        const hit = fields.find(([text]) => text.includes(word));
        if (hit) score += hit[1] * rarity[i];
      });
      return { entry, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // Body text matches almost anything, so keep only what is close to the best match.
  const best = scored[0]?.score ?? 0;
  return scored.filter((s) => s.score >= best * 0.4).map((s) => s.entry);
}
