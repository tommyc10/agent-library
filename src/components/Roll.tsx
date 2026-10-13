import { useStill } from '../lib/motion';

function Digits({ value }: { value: number }) {
  return (
    <span className="lib-roll-n" data-still={useStill()}>
      {value}
    </span>
  );
}

/** A number that rolls to its new value when it changes. */
export function Roll({ value }: { value: number }) {
  return (
    <span className="lib-roll">
      <Digits key={value} value={value} />
    </span>
  );
}
