import { useRef } from 'react';
import useScrollVar from '../../hooks/useScrollVar.js';
import { PALETTE } from '../../config/palette.js';
import { useI18n } from '../../i18n/I18nProvider.jsx';

const loop = [...PALETTE, PALETTE[0]]; // se répète sans coupure
const wave = 'M0 40 Q100 0 200 40 T400 40 T600 40 T800 40 V100 H0Z';

// Section épinglée : le scroll peint le galet, trace le coup de pinceau et fait défiler les 3 étapes.
export default function PaintStory({ steps }) {
  const { t } = useI18n();
  const ref = useRef(null);
  const strokeGrad = useRef(null);
  // Le scroll trace le coup de pinceau ET fait défiler les couleurs de la palette le long du trait
  useScrollVar(ref, 'pinned', (p) => {
    strokeGrad.current?.setAttribute('gradientTransform', `translate(${(-p * 2000).toFixed(1)} 0)`);
  });
  return (
    <section ref={ref} className="story" aria-label={t('story.label')}>
      <div className="story__sticky">
        <svg className="story__stroke" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient ref={strokeGrad} id="story-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="0" spreadMethod="repeat">
              {loop.map((c, i) => <stop key={i} offset={i / (loop.length - 1)} stopColor={c} />)}
            </linearGradient>
          </defs>
          <path pathLength="1" stroke="url(#story-grad)" d="M-20 500 C 220 320, 380 580, 560 400 S 860 160, 1040 240" />
        </svg>
        <div className="container story__stage">
          <div className="story__steps">
            {steps.map((s, i) => (
              <div key={s.title} className={`story__step story__step--${i + 1}`}>
                <h2>{s.title}</h2>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
          <div className="pebble" role="img" aria-label={t('story.alt')}>
            <div className="pebble__paint">
              <div className="pebble__sky" />
              <svg className="pebble__wave pebble__wave--far" viewBox="0 0 800 100" preserveAspectRatio="none"><path d={wave} /></svg>
              <svg className="pebble__wave pebble__wave--mid" viewBox="0 0 800 100" preserveAspectRatio="none"><path d={wave} /></svg>
              <svg className="pebble__wave pebble__wave--near" viewBox="0 0 800 100" preserveAspectRatio="none"><path d={wave} /></svg>
            </div>
            <div className="pebble__gloss" />
          </div>
        </div>
      </div>
    </section>
  );
}
