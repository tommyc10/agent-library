// Write content/tblock.json from an installed tblock plugin: its version, what it ships,
// and the real output of the commands the page's terminal plays.
// Usage: node scripts/sync-tblock.mjs <tblock plugin folder>
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const dir = process.argv[2];
if (!dir || !existsSync(join(dir, 'plugin.json'))) {
  console.error('Usage: npm run sync-tblock -- <tblock plugin folder, the one with plugin.json>');
  process.exit(1);
}

const { version } = JSON.parse(readFileSync(join(dir, 'plugin.json'), 'utf8'));
const folders = readdirSync(join(dir, 'skills')).filter((name) => existsSync(join(dir, 'skills', name, 'SKILL.md')));
const principles = folders.filter((name) => name.startsWith('principle-'));
const skills = folders.filter((name) => !name.startsWith('principle-')).sort();
const playbooks = readdirSync(join(dir, 'skills/tblock-mode/playbooks')).filter((f) => f.endsWith('.md'));
const agents = readdirSync(join(dir, 'agents')).filter((f) => f.endsWith('.md'));

// Run from the home folder, so no repository's setup shows up in the output.
const run = (args) =>
  execFileSync('node', [join(dir, 'bin/tblock.mjs'), ...args], { cwd: homedir(), env: { ...process.env, NO_COLOR: '1' } })
    .toString()
    .replaceAll(homedir(), '~')
    .trimEnd();

const terminal = [['doctor'], ['preset'], ['roles']].map((args) => ({ command: `tblock ${args.join(' ')}`, output: run(args) }));

const out = resolve(import.meta.dirname, '../content/tblock.json');
const data = {
  version,
  counts: { playbooks: playbooks.length, skills: skills.length, principles: principles.length, agents: agents.length },
  skills,
  terminal,
};
writeFileSync(out, JSON.stringify(data, null, 2) + '\n');
console.log(`tblock ${version}: ${skills.length} skills, ${playbooks.length} playbooks, ${principles.length} principles, ${agents.length} agents`);
