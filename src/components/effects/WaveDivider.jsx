import { useRef } from 'react';
import useScrollVar from '../../hooks/useScrollVar.js';
import { PALETTE } from '../../config/palette.js';

// Dégradés qui se répètent sans coupure (la dernière couleur reprend la première)
const loopA = [...PALETTE, PALETTE[0]];
const reversed = [...PALETTE].reverse();
const loopB = [...reversed, reversed[0]];
const Stops = ({ colors }) => colors.map((c, i) => <stop key={i} offset={i / (colors.length - 1)} stopColor={c} />);

// Trois vagues qui dérivent à des vitesses différentes ; les couleurs de la palette défilent en boucle avec le scroll.
export default function WaveDivider() {
  const ref = useRef(null);
  const gradA = useRef(null);
  const gradB = useRef(null);
  useScrollVar(ref, 'pass', (p) => {
    gradA.current?.setAttribute('gradientTransform', `translate(${(-p * 2).toFixed(3)} 0)`);
    gradB.current?.setAttribute('gradientTransform', `translate(${(p * 2).toFixed(3)} 0)`);
  });
  return (
    <div ref={ref} className="waves" aria-hidden="true">
      <svg className="waves__a" viewBox="0 0 1440 90" preserveAspectRatio="none">
        <defs>
          <linearGradient ref={gradA} id="wave-grad-a" x1="0" y1="0" x2="1" y2="0" spreadMethod="repeat"><Stops colors={loopA} /></linearGradient>
        </defs>
        <path fill="url(#wave-grad-a)" d="M0 40 Q180 0 360 40 T720 40 T1080 40 T1440 40 V90 H0Z" />
      </svg>
      <svg className="waves__b" viewBox="0 0 1440 90" preserveAspectRatio="none">
        <defs>
          <linearGradient ref={gradB} id="wave-grad-b" x1="0" y1="0" x2="1" y2="0" spreadMethod="repeat"><Stops colors={loopB} /></linearGradient>
        </defs>
        <path fill="url(#wave-grad-b)" d="M0 55 Q180 20 360 55 T720 55 T1080 55 T1440 55 V90 H0Z" />
      </svg>
      <svg className="waves__c" viewBox="0 0 1440 90" preserveAspectRatio="none"><path d="M0 70 Q240 30 480 70 T960 70 T1440 70 V90 H0Z" /></svg>
    </div>
  );
}
