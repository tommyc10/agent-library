import { BorderBeam } from 'border-beam';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { entries, tblock } from '../lib/library';
import { CopyButton } from './CopyButton';
import { Terminal } from './Terminal';

const REPO = 'https://github.com/tommyc10/tblock';
const INSTALL = [
  { id: 'claude', where: 'Claude Code', lines: ['claude plugin marketplace add tommyc10/tblock', 'claude plugin install tblock@tblock'] },
  { id: 'copilot', where: 'Copilot CLI', lines: ['copilot plugin install tommyc10/tblock'] },
];
const COUNTS = [
  { n: tblock.counts.playbooks, label: 'playbooks' },
  { n: tblock.counts.skills, label: 'skills' },
  { n: tblock.counts.principles, label: 'principles' },
  { n: tblock.counts.agents, label: 'agents' },
];
const STEPS = [
  { title: 'Describe the task', body: <code>/tblock-mode fix the login redirect</code> },
  { title: 'It picks a playbook', body: `Sized small, standard or deep, from ${tblock.counts.playbooks} checklists.` },
  { title: 'It proves it, then asks', body: 'Evidence from the running app. Nothing leaves your machine unasked.' },
];
const shipped = entries.filter((e) => e.tblock).length;

/** tblock's small mark: a block lit in the beam's colours. */
export function TblockMark({ label = 'tblock' }: { label?: string }) {
  return (
    <span className="lib-tb-mark">
      <span className="lib-tb-glyph" aria-hidden />
      {label}
    </span>
  );
}

/** The page's hero: what tblock is, how a task runs through it, how to install it, and its
 * command playing for real, with a beam running round its edge. */
export function Tblock({
  theme,
  moving,
  onShowShipped,
}: {
  theme: 'dark' | 'light';
  /** False under reduced motion or when paused from the rail: the beam is off. */
  moving: boolean;
  onShowShipped: () => void;
}) {
  const [tool, setTool] = useState(INSTALL[0]!);

  return (
    <BorderBeam className="lib-tblock-beam" theme={theme} active={moving}>
      <section className="lib-tblock" aria-labelledby="lib-tblock-title">
        <div className="lib-tblock-main">
          <p className="lib-tblock-eyebrow">
            <TblockMark />
            <span>Plugin for Claude Code and GitHub Copilot</span>
            <span className="lib-tblock-version">v{tblock.version}</span>
          </p>
          <h1 id="lib-tblock-title">
            Make your coding agent <span className="lib-tblock-lit">prove its work.</span>
          </h1>
          <p className="lib-tblock-lead">
            tblock gives the agent a playbook for each kind of task. It sizes the work, names the data before it writes code, keeps
            the diff small, and doesn't call anything done until it has shown you it works.
          </p>

          <ol className="lib-tblock-steps">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <span className="lib-tblock-step-n" aria-hidden>
                  {i + 1}
                </span>
                <h2>{step.title}</h2>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="lib-tblock-side">
          <div className="lib-tblock-install">
            <div className="lib-tblock-tabs" role="group" aria-label="Install for">
              {INSTALL.map((target) => (
                <button key={target.id} type="button" aria-pressed={target.id === tool.id} onClick={() => setTool(target)}>
                  {target.where}
                </button>
              ))}
            </div>
            <div className="lib-tblock-cmd">
              <pre>
                {tool.lines.map((line) => (
                  <span key={line}>
                    <span className="lib-tblock-prompt" aria-hidden>
                      ${' '}
                    </span>
                    {line}
                  </span>
                ))}
              </pre>
              <CopyButton text={tool.lines.join('\n')} title={`Copy the ${tool.where} install commands`} />
            </div>
            <p className="lib-tblock-then">
              Then run <code>/setup-tblock</code> once to pick a preset and a model for each role.
            </p>
          </div>

          <dl className="lib-tblock-counts">
            {COUNTS.map((c) => (
              <div key={c.label}>
                <dt>{c.label}</dt>
                <dd>{c.n}</dd>
              </div>
            ))}
          </dl>

          <div className="lib-tblock-links">
            <button type="button" className="lib-btn lib-tblock-shipped" onClick={onShowShipped}>
              <span>
                <strong>{shipped}</strong> skills here ship in tblock
              </span>
              <ArrowRight size={14} />
            </button>
            <a className="lib-btn" data-variant="ghost" href={REPO} target="_blank" rel="noreferrer">
              README
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>

        <div className="lib-tblock-cli">
          <header className="lib-tblock-cli-head">
            <h2>The tblock command</h2>
            <p>
              Real output from the CLI that ships with the plugin. <code>/setup-tblock</code> puts it on your path.
            </p>
          </header>
          <Terminal runs={tblock.terminal} />
        </div>
      </section>
    </BorderBeam>
  );
}
