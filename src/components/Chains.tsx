import type { CSSProperties } from 'react';
import { getCollection, type Chain } from '../lib/library';

interface Props {
  chain: Chain;
  /** The skill this chain is shown beside, marked as the step you are on. */
  current?: string;
  onOpen: (id: string) => void;
}

/** A chain as a numbered run of skills. Each step opens its skill. */
export function ChainCard({ chain, current, onOpen }: Props) {
  return (
    <div className="lib-chain lib-hue" style={{ '--hue': getCollection(chain.collection)?.hue ?? 0 } as CSSProperties}>
      <h3 className="lib-chain-name">{chain.name}</h3>
      <ol className="lib-chain-steps">
        {chain.steps.map((step, n) => (
          <li key={step.skill}>
            <button
              type="button"
              className="lib-chain-step"
              aria-current={step.skill === current ? 'step' : undefined}
              onClick={() => step.skill !== current && onOpen(`skill/${step.skill}`)}
            >
              <span className="lib-chain-n">{n + 1}</span>
              <span data-mono>/{step.skill}</span>
              <span>{step.does}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
