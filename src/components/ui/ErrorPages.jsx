import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button.jsx';
import useSeo from '../../services/seo.js';
import { PALETTE } from '../../config/palette.js';
import { Gradient, OUTLINE, ring } from './pebbleArt.jsx';
import { useCategories } from '../../store/store.js';
import { useI18n } from '../../i18n/I18nProvider.jsx';

// Ligne de cassure (page 500)
const CRACK = 'M170 34 L158 70 L180 100 L156 130 L176 160 L150 190';

// 404 : un galet peint avec un point d'interrogation
const LostPebble = () => {
  const { t } = useI18n();
  return (
  <svg viewBox="0 0 320 220" className="errpage__svg" role="img" aria-label={t('err.lostAlt')}>
    <defs><Gradient id="g404" colors={PALETTE} /></defs>
    <ellipse cx="165" cy="198" rx="108" ry="11" fill="rgba(0,0,0,.12)" />
    <g className="errpage__stone">
      <path d={OUTLINE} fill="url(#g404)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      {ring(165, 112, 66, 16, 4.5, 'rgba(255,255,255,.92)')}
      {ring(165, 112, 47, 12, 3.4, 'rgba(0,0,0,.55)')}
      <circle cx="165" cy="112" r="32" fill="#faf6ef" />
      <text x="165" y="134" textAnchor="middle" fontSize="60" fontFamily="'Instrument Serif', Georgia, serif" fill="#000">?</text>
    </g>
  </svg>
  );
};

// 500 : un galet fendu en deux
const CrackedPebble = () => {
  const { t } = useI18n();
  return (
  <svg viewBox="0 0 320 220" className="errpage__svg" role="img" aria-label={t('err.crackedAlt')}>
    <defs>
      <Gradient id="g500l" colors={[PALETTE[3], PALETTE[4], PALETTE[5]]} />
      <Gradient id="g500r" colors={[PALETTE[0], PALETTE[1], PALETTE[2]]} />
      <clipPath id="c500l"><path d="M170 34 L158 70 L180 100 L156 130 L176 160 L150 190 C100 188 66 165 60 120 C52 70 110 30 170 34 Z" /></clipPath>
      <clipPath id="c500r"><path d="M170 34 C235 38 280 78 270 128 C262 170 200 192 150 190 L176 160 L156 130 L180 100 L158 70 Z" /></clipPath>
    </defs>
    <ellipse cx="165" cy="198" rx="112" ry="11" fill="rgba(0,0,0,.12)" />
    <g className="errpage__half errpage__half--l">
      <g clipPath="url(#c500l)">
        <path d={OUTLINE} fill="url(#g500l)" stroke="#000" strokeWidth="6" />
        {ring(165, 112, 66, 16, 4.5, 'rgba(255,255,255,.92)')}
        {ring(165, 112, 47, 12, 3.4, 'rgba(0,0,0,.55)')}
      </g>
      <path d={CRACK} fill="none" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
    </g>
    <g className="errpage__half errpage__half--r">
      <g clipPath="url(#c500r)">
        <path d={OUTLINE} fill="url(#g500r)" stroke="#000" strokeWidth="6" />
        {ring(165, 112, 66, 16, 4.5, 'rgba(255,255,255,.92)')}
        {ring(165, 112, 47, 12, 3.4, 'rgba(0,0,0,.55)')}
      </g>
      <path d={CRACK} fill="none" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
    </g>
    <path d="M166 18 l-5 -12 M181 22 l7 -11 M150 26 l-10 -8" stroke="#000" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
  );
};

/** Erreur « nouvelle version mise en ligne » : un fichier de l'ancienne version n'existe plus sur le serveur */
export const isChunkError = (e) => /dynamically imported module|Importing a module script failed|Loading chunk/i.test(e?.message ?? '');

/** Page 404 (adresse inconnue, produit supprimé…). compact : version réduite à l'intérieur d'une page. */
export function NotFoundView({ title, text, compact = false }) {
  const { t, l } = useI18n();
  const categories = useCategories();
  useSeo({ title: t('err.seoNotFound'), noindex: true });
  return (
    <section className={`errpage ${compact ? 'errpage--compact' : ''}`}>
      {!compact && <p className="errpage__code" aria-hidden="true">404</p>}
      <div className="errpage__art"><LostPebble /></div>
      <h1>{title ?? t('err.404.title')}</h1>
      <p>{text ?? t('err.404.text')}</p>
      <div className="errpage__actions">
        <Button to={l('/')}>{t('err.home')}</Button>
        <Button to={l('/produits')} variant="ghost">{t('cart.seeShop')}</Button>
      </div>
      {categories.length > 0 && (
        <nav className="errpage__links" aria-label={t('err.browse')}>
          <span>{t('err.orBrowse')}</span>
          {categories.map((c) => <Link key={c.id} to={l(`/produits?categorie=${c.id}`)}>{c.name}</Link>)}
        </nav>
      )}
      <p className="note">{t('err.question', {}, [(c) => <Link to={l('/contact')}>{c}</Link>])}</p>
    </section>
  );
}

/**
 * Page 500 : erreur du serveur (API en panne), serveur injoignable (réseau), ou plantage d'affichage.
 * error : ApiError ou Error (le détail technique est replié) ; onRetry : relance l'action (sinon recharge la page).
 */
export function ServerErrorView({ error, onRetry, compact = false }) {
  const { t, l } = useI18n();
  const status = error?.status;
  const offline = status === 0;
  const stale = isChunkError(error);
  const server = !offline && !stale && (status === undefined || status >= 500);
  const [busy, setBusy] = useState(false);
  useSeo({ title: offline ? t('err.seoOffline') : t('err.seoError'), noindex: true });

  const code = server ? String(status ?? 500) : t('err.oops');
  const kind = stale ? 'stale' : offline ? 'offline' : server ? 'server' : 'other';
  const title = t(`err.${kind}.title`);
  const text = kind === 'other' && error?.message ? error.message : t(`err.${kind}.text`);

  const retry = async () => {
    setBusy(true);
    try { await (onRetry && !stale ? onRetry() : window.location.reload()); } finally { setBusy(false); }
  };

  return (
    <section className={`errpage ${compact ? 'errpage--compact' : ''}`} role="alert">
      {!compact && <p className="errpage__code" aria-hidden="true">{code}</p>}
      <div className="errpage__art"><CrackedPebble /></div>
      <h1>{title}</h1>
      <p>{text}</p>
      <div className="errpage__actions">
        <Button onClick={retry} loading={busy}>{stale ? t('err.reload') : t('retry')}</Button>
        <Button to={l('/')} variant="ghost">{t('err.home')}</Button>
      </div>
      <p className="note">{t('err.help', {}, [(c) => <Link to={l('/contact')}>{c}</Link>])}</p>
      {error?.message && !stale && (
        <details className="errpage__details">
          <summary>{t('err.details')}</summary>
          <p>{status != null ? t('err.code', { status }) : ''}{error.message}</p>
        </details>
      )}
    </section>
  );
}
