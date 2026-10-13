// Copy the markdown of each skill folder into content/skills/<name>/.
// Usage: node scripts/import-skills.mjs <folder-of-skills> [<folder-of-skills> ...]
// A "folder of skills" holds one folder per skill, each with a SKILL.md.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const out = resolve(import.meta.dirname, '../content/skills');

/** Every file under a folder, as paths relative to it: `SKILL.md`, `playbooks/bug-fix.md`. */
const walk = (dir, prefix = '') =>
  readdirSync(dir, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory() ? walk(join(dir, f.name), `${prefix}${f.name}/`) : [`${prefix}${f.name}`],
  );

for (const source of process.argv.slice(2)) {
  for (const name of readdirSync(source)) {
    const from = join(source, name);
    if (!existsSync(join(from, 'SKILL.md'))) continue;
    const real = realpathSync(from);
    const to = join(out, name);
    const files = walk(real).sort();
    for (const file of files.filter((f) => f.endsWith('.md'))) {
      mkdirSync(dirname(join(to, file)), { recursive: true });
      cpSync(join(real, file), join(to, file));
    }

    // Copilot and Codex skip a skill whose `name` is not its folder name, without a word.
    const skill = join(to, 'SKILL.md');
    const text = readFileSync(skill, 'utf8');
    const front = /^---\r?\n[\s\S]*?\r?\n---/.exec(text)?.[0] ?? '';
    const fixed = front.replace(/^name:[ \t]*(.*)$/m, (line, value) =>
      value.replace(/^["']|["']$/g, '') === name ? line : `name: ${name}`,
    );
    if (fixed !== front) {
      writeFileSync(skill, fixed + text.slice(front.length));
      console.log(`${name}: renamed in SKILL.md to match its folder`);
    }

    // The site lists what else ships with the skill without copying it.
    writeFileSync(join(to, 'files.json'), JSON.stringify(files, null, 2) + '\n');
    console.log(`${name}: ${files.length} files`);
  }
}
