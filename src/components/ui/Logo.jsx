import { useId } from 'react';
import { PALETTE } from '../../config/palette.js';
import { Gradient, OUTLINE, ring } from './pebbleArt.jsx';
import { useI18n } from '../../i18n/I18nProvider.jsx';

// Le galet du logo « Les galets d'Ambre » (même dessin que public/favicon.svg)
export function LogoMark({ className = '' }) {
  const id = `logo-${useId().replace(/:/g, '')}`;
  return (
    <svg className={`logo__mark ${className}`} viewBox="45 -8 240 240" aria-hidden="true" focusable="false">
      <defs><Gradient id={id} colors={PALETTE} /></defs>
      <path d={OUTLINE} fill={`url(#${id})`} stroke="#000" strokeWidth="4.2" strokeLinejoin="round" />
      {ring(165, 112, 66, 16, 4.6, '#fff')}
      {ring(165, 112, 47, 12, 3.4, '#000')}
      <circle cx="165" cy="112" r="33" fill="#faf6ef" stroke="#000" strokeWidth="2.6" />
      {ring(165, 112, 15, 6, 8.5, (i) => PALETTE[(i + 3) % 6], '#000', 1.6, -Math.PI / 2)}
      <circle cx="165" cy="112" r="6" fill="#000" />
    </svg>
  );
}

// Logo horizontal du menu : galet + nom + sous-titre (le texte reste du vrai texte : lisible, net et référencé)
export default function Logo() {
  const { t } = useI18n();
  return (
    <span className="logo">
      <LogoMark />
      <span className="logo__text">
        <strong>Les galets d’Ambre</strong>
        <small>{t('brand.tagline')}</small>
      </span>
    </span>
  );
}
