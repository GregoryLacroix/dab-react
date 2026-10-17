import { useRef } from 'react';
import useScrollVar from '../../hooks/useScrollVar.js';

const Line = ({ words }) => (
  <>
    {[...words, ...words].map((w, i) => (
      <span key={i}>{w}<i className="marquee__dot" /></span>
    ))}
  </>
);

// Deux lignes géantes qui glissent en sens opposés pendant le scroll.
export default function Marquee({ words }) {
  const ref = useRef(null);
  useScrollVar(ref, 'pass');
  return (
    <div ref={ref} className="marquee" aria-hidden="true">
      <p className="marquee__line marquee__line--solid"><Line words={words} /></p>
      <p className="marquee__line marquee__line--outline"><Line words={words} /></p>
    </div>
  );
}
