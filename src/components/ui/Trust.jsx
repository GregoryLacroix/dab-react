import { useI18n } from '../../i18n/I18nProvider.jsx';

const svg = (children) => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{children}</svg>
);
const ICONS = {
  hand: svg(<><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-.7-1.6-.7-2.6c0-1 .8-1.4 1.7-1.4H18a3 3 0 0 0 3-3C21 6.5 17 3 12 3Z" /><circle cx="7.5" cy="11" r=".9" fill="currentColor" /><circle cx="10" cy="7.5" r=".9" fill="currentColor" /><circle cx="14.5" cy="7.5" r=".9" fill="currentColor" /></>),
  varnish: svg(<><path d="M12 3 4.5 6v5.5c0 4.5 3 8 7.5 9.5 4.5-1.5 7.5-5 7.5-9.5V6L12 3Z" /><path d="m9 12 2 2 4-4" /></>),
  ship: svg(<><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z" /><path d="m3.5 7.5 8.5 4.5 8.5-4.5M12 12v9" /></>),
  pay: svg(<><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18M7 15h4" /></>),
};
const KEYS = ['hand', 'varnish', 'ship', 'pay'];

// Réassurance : « band » = bandeau de l'accueil (4 arguments avec texte), « list » = petite liste sous le bouton d'achat de la fiche produit
export default function Trust({ variant = 'band' }) {
  const { t } = useI18n();
  if (variant === 'list') {
    return (
      <ul className="trust trust--list" aria-label={t('trust.label')}>
        {['hand', 'pay', 'ship'].map((k) => <li key={k}><span className="trust__icon">{ICONS[k]}</span>{t(`trust.${k}.short`)}</li>)}
      </ul>
    );
  }
  return (
    <section className="trust trust--band" aria-label={t('trust.label')}>
      <ul className="container trust__grid">
        {KEYS.map((k) => (
          <li key={k}>
            <span className="trust__icon">{ICONS[k]}</span>
            <strong>{t(`trust.${k}.title`)}</strong>
            <span>{t(`trust.${k}.text`)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
