import type { Collection, Entry } from './library';

/** A skill's folder: its SKILL.md and the markdown that ships beside it. */
const skillFiles = (entry: Entry, dir: string): Record<string, string> => ({
  [`${dir}/SKILL.md`]: entry.raw,
  ...Object.fromEntries((entry.docs ?? []).map((doc) => [`${dir}/${doc.name}`, doc.body])),
});

/** Links to other entries only work on the site, so the README in a download keeps their text. */
const plainLinks = (markdown: string) => markdown.replace(/\[([^\]]+)\]\((?:skill|prompt|agent)\/[^)]*\)/g, '$1');

async function save(name: string, files: Record<string, string>) {
  // Loaded on first use: nobody pays for the zip code until they download something.
  const { strToU8, zipSync } = await import('fflate');
  const zip = zipSync(Object.fromEntries(Object.entries(files).map(([path, text]) => [path, strToU8(text)])));
  const url = URL.createObjectURL(new Blob([zip as BlobPart], { type: 'application/zip' }));
  Object.assign(document.createElement('a'), { href: url, download: name }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const skillFileCount = (entry: Entry) => 1 + (entry.docs?.length ?? 0);

export const downloadSkill = (entry: Entry) => save(`${entry.name}.zip`, skillFiles(entry, entry.name));

/** A collection as one folder: its guide as the README, its licence, then its skills, agent files and prompts. */
export function downloadCollection(collection: Collection, list: Entry[]) {
  const root = collection.id;
  const files: Record<string, string> = {};
  if (collection.guide) files[`${root}/README.md`] = plainLinks(collection.guide);
  if (collection.license) files[`${root}/LICENSE`] = collection.license;
  for (const entry of list) {
    if (entry.type === 'skill') Object.assign(files, skillFiles(entry, `${root}/skills/${entry.name}`));
    if (entry.type === 'agent') files[`${root}/agents/${entry.path?.split('/').pop() ?? `${entry.name}.md`}`] = entry.raw;
    if (entry.type === 'prompt') files[`${root}/prompts/${entry.name}.md`] = entry.body;
  }
  return save(`${root}.zip`, files);
}
