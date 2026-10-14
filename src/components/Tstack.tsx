import { ArrowUpRight } from 'lucide-react';
import { CopyButton } from './CopyButton';

// All of this is from the TSTACK repository's README, as of pstack 0.15.23.
const REPO = 'https://github.com/tommyc10/tstack';
const COUNTS = [
  { n: 38, label: 'workflows' },
  { n: 23, label: 'playbooks' },
  { n: 24, label: 'principles' },
];
const INSTALL = [
  { where: 'Claude Code', lines: ['/plugin marketplace add tommyc10/tstack', '/plugin install tstack@tstack'] },
  { where: 'GitHub Copilot CLI', lines: ['copilot plugin marketplace add tommyc10/tstack', 'copilot plugin install tstack@tstack'] },
];

/** TSTACK's card in the experimental section: what it is and what state it is in under a
 * strip of hazard tape, with the install commands beside it. */
export function Tstack() {
  return (
    <article className="lib-tstack-card" aria-labelledby="lib-tstack-title">
      <div className="lib-tstack-hatch" aria-hidden />
      <div className="lib-tstack-notice">
        <div className="lib-tstack-name">
          <h3 id="lib-tstack-title">TSTACK</h3>
          <span className="lib-tstack-pill">In development</span>
        </div>
        <p className="lib-tstack-lead">Engineering workflows for Claude Code and GitHub Copilot.</p>
        <p>
          Describe a goal to <code>tstack-mode</code>. It picks a playbook, and the agent has to reproduce, design, verify and show
          evidence before it reports the work as done. TSTACK is a port of pstack and still in development: steps and commands may
          move between versions, and the Copilot side has not been run in a live session yet.
        </p>
        <div className="lib-tstack-actions">
          <a className="lib-btn" data-variant="primary" href={REPO} target="_blank" rel="noreferrer">
            Read the README
            <ArrowUpRight size={14} />
          </a>
        </div>
        <dl className="lib-tstack-counts">
          {COUNTS.map((c) => (
            <div key={c.label}>
              <dt>{c.label}</dt>
              <dd>{c.n}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="lib-tstack-install">
        <h4 className="lib-tstack-install-head">Install</h4>
        {INSTALL.map((target) => (
          <div key={target.where} className="lib-tstack-cmd">
            <span>{target.where}</span>
            <pre>{target.lines.join('\n')}</pre>
            <CopyButton text={target.lines.join('\n')} title={`Copy the ${target.where} commands`} />
          </div>
        ))}
        <p className="lib-tstack-install-note">Experimental. An update may change how it behaves.</p>
      </div>
    </article>
  );
}
