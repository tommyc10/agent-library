/** Dot matrix: a fixed grid of tiny dots. Colour drifts very slowly underneath and only shows
 *  through the dots. The one variant that moves; it holds still under reduced motion. */
export function DotMatrix() {
  return (
    <div className="bg bg-dots" aria-hidden>
      <div className="bg-dots-field">
        <span className="bg-dots-blob" style={{ '--hue': 285, '--x': '8vw', '--y': '-20vh', '--dur': '48s' } as React.CSSProperties} />
        <span className="bg-dots-blob" style={{ '--hue': 235, '--x': '42vw', '--y': '-30vh', '--dur': '62s' } as React.CSSProperties} />
        <span className="bg-dots-blob" style={{ '--hue': 150, '--x': '70vw', '--y': '-14vh', '--dur': '54s' } as React.CSSProperties} />
        <span className="bg-dots-blob" style={{ '--hue': 15, '--x': '60vw', '--y': '60vh', '--dur': '70s' } as React.CSSProperties} />
      </div>
    </div>
  );
}
