import { ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { CopyButton } from './CopyButton';

// All of this is from tblock's README, as of 0.4.0.
const REPO = 'https://github.com/tommyc10/plugins/tree/main/tblock';
const VERSION = '0.4.0';
const COUNTS = [
  { n: 10, label: 'playbooks' },
  { n: 34, label: 'skills' },
  { n: 24, label: 'principles' },
];
const STEPS = [
  { title: 'Describe the task', body: <code>/tblock-mode fix the login redirect</code> },
  { title: 'It picks a playbook', body: 'Bug fix, Feature, UI-UX, Refactoring, Perf and more, each a checklist the agent works through.' },
  { title: 'It proves the change', body: 'It reproduces the problem, keeps the diff small, checks it in the running app and shows you the evidence.' },
];
const INSTALL = [
  { id: 'claude', where: 'Claude Code', lines: ['claude plugin marketplace add tommyc10/plugins', 'claude plugin install tblock@plugins'] },
  { id: 'copilot', where: 'Copilot CLI', lines: ['copilot plugin install tommyc10/plugins:tblock'] },
];

/** The page's hero: what tblock is, how a task runs through it, and how to install it,
 * with a beam of light running round its edge. */
export function Tblock() {
  const [tool, setTool] = useState(INSTALL[0]!);
  const command = tool.lines.join('\n');

  return (
    <div className="lib-tblock-beam">
      <span className="lib-tblock-glow" aria-hidden />
      <section className="lib-tblock" aria-labelledby="lib-tblock-title">
        <div className="lib-tblock-main">
          <p className="lib-tblock-eyebrow">
            <span className="lib-tblock-name">tblock</span>
            <span>Plugin for Claude Code and GitHub Copilot</span>
            <span className="lib-tblock-version">v{VERSION}</span>
          </p>
          <h1 id="lib-tblock-title">Make your coding agent prove its work.</h1>
          <p className="lib-tblock-lead">
            tblock gives the agent a playbook for each kind of task. It names the data before it writes code, keeps changes small,
            and doesn't call anything done until it has shown you it works.
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
              <CopyButton text={command} title={`Copy the ${tool.where} install commands`} />
            </div>
            <p className="lib-tblock-then">
              Then run <code>/setup-tblock</code> once to pick a model for each role.
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

          <a className="lib-btn lib-tblock-link" href={REPO} target="_blank" rel="noreferrer">
            Read the README
            <ArrowUpRight size={14} />
          </a>
        </div>
      </section>
    </div>
  );
}
