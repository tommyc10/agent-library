/** Scanline: a soft wash of the collection hues behind fine horizontal lines, like an old monitor.
 *  The lines are dark, so they only read where there is colour under them. */
export function Scanline() {
  return <div className="bg bg-scan" aria-hidden />;
}
