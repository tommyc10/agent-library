import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { parse } from 'yaml';

const CONTENT = resolve(import.meta.dirname, 'content');

/** Split a markdown file into its frontmatter and the text below it. */
function readMarkdown(path: string) {
  const raw = readFileSync(path, 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  let meta: Record<string, unknown> = {};
  try {
    if (match) meta = parse(match[1]);
  } catch (error) {
    // Usually a colon in an unquoted value. Say which file, so it is a ten second fix.
    throw new Error(`Frontmatter in ${path} is not valid YAML: ${(error as Error).message}`);
  }
  return { meta, raw, body: match ? raw.slice(match[0].length).trim() : raw.trim() };
}

function markdownIn(dir: string) {
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md')).sort() : [];
}

function filesIn(dir: string, prefix = ''): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((item) => {
      const name = prefix + item.name;
      if (item.isDirectory()) return filesIn(join(dir, item.name), `${name}/`);
      return item.isFile() ? [name] : [];
    })
    .sort();
}

/** Everything under content/ as one JSON module. The files are the library. */
function collect() {
  const config = parse(readFileSync(join(CONTENT, 'library.yml'), 'utf8'));
  const entries: Record<string, unknown>[] = [];

  for (const name of readdirSync(join(CONTENT, 'skills')).sort()) {
    const dir = join(CONTENT, 'skills', name);
    if (!existsSync(join(dir, 'SKILL.md'))) continue;
    const { meta, body, raw } = readMarkdown(join(dir, 'SKILL.md'));
    const listed = existsSync(join(dir, 'files.json'))
      ? (JSON.parse(readFileSync(join(dir, 'files.json'), 'utf8')) as string[])
      : filesIn(dir);
    entries.push({
      id: `skill/${name}`,
      type: 'skill',
      name,
      title: name,
      description: String(meta.description ?? '').trim(),
      collection: 'other',
      tags: [],
      body,
      raw,
      files: listed,
      docs: filesIn(dir)
        .filter((f) => f.endsWith('.md') && f !== 'SKILL.md')
        .map((f) => ({ name: f, body: readFileSync(join(dir, f), 'utf8') })),
      ...config.skills?.[name],
    });
  }

  for (const type of ['prompt', 'agent'] as const) {
    const dir = join(CONTENT, `${type}s`);
    for (const file of markdownIn(dir)) {
      const { meta, body, raw } = readMarkdown(join(dir, file));
      const name = basename(file, '.md');
      entries.push({
        id: `${type}/${name}`,
        type,
        name,
        title: name,
        description: '',
        collection: 'other',
        tags: [],
        body,
        raw: type === 'prompt' ? body : raw,
        ...meta,
      });
    }
  }

  // A chain that names a skill the library doesn't have would draw a dead step, so say which.
  const chains = (config.chains ?? []) as { id: string; steps: { skill: string }[] }[];
  for (const chain of chains) {
    for (const step of chain.steps) {
      if (!entries.some((e) => e.id === `skill/${step.skill}`)) {
        throw new Error(`Chain "${chain.id}" in library.yml names "${step.skill}", which is not in content/skills/.`);
      }
    }
  }

  return { collections: config.collections, examples: config.examples ?? [], chains, entries };
}

function library(): Plugin {
  const id = 'virtual:library';
  return {
    name: 'library',
    resolveId: (source) => (source === id ? `\0${id}` : undefined),
    load(loaded) {
      if (loaded !== `\0${id}`) return;
      return `export default ${JSON.stringify(collect())}`;
    },
    configureServer(server) {
      server.watcher.add(CONTENT);
      const reload = (path: string) => {
        if (!path.startsWith(CONTENT)) return;
        const mod = server.moduleGraph.getModuleById(`\0${id}`);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', reload).on('change', reload).on('unlink', reload);
    },
  };
}

export default defineConfig({
  // Relative paths, so the build works from any sub-path (GitLab or GitHub Pages).
  base: './',
  plugins: [react(), library()],
  server: { port: 5199 },
});
