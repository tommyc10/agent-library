// Copy the markdown of each skill folder into content/skills/<name>/.
// Usage: node scripts/import-skills.mjs <folder-of-skills> [<folder-of-skills> ...]
// A "folder of skills" holds one folder per skill, each with a SKILL.md.
import { cpSync, existsSync, mkdirSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const out = resolve(import.meta.dirname, '../content/skills');

for (const source of process.argv.slice(2)) {
  for (const name of readdirSync(source)) {
    const from = join(source, name);
    if (!existsSync(join(from, 'SKILL.md'))) continue;
    const real = realpathSync(from);
    const to = join(out, name);
    mkdirSync(to, { recursive: true });
    const files = readdirSync(real);
    for (const file of files.filter((f) => f.endsWith('.md'))) cpSync(join(real, file), join(to, file));
    // The site lists what else ships with the skill without copying it.
    writeFileSync(join(to, 'files.json'), JSON.stringify(files.sort(), null, 2) + '\n');
    console.log(`${name}: ${files.length} files`);
  }
}
