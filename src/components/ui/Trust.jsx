import { useI18n } from '../../i18n/I18nProvider.jsx';
import { useContent } from '../../store/store.js';
import { withContentDefaults } from '../../services/defaultContent.js';

const svg = (children) => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{children}</svg>
);
const ICONS = {
  hand: svg(<><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-.7-1.6-.7-2.6c0-1 .8-1.4 1.7-1.4H18a3 3 0 0 0 3-3C21 6.5 17 3 12 3Z" /><circle cx="7.5" cy="11" r=".9" fill="currentColor" /><circle cx="10" cy="7.5" r=".9" fill="currentColor" /><circle cx="14.5" cy="7.5" r=".9" fill="currentColor" /></>),
  varnish: svg(<><path d="M12 3 4.5 6v5.5c0 4.5 3 8 7.5 9.5 4.5-1.5 7.5-5 7.5-9.5V6L12 3Z" /><path d="m9 12 2 2 4-4" /></>),
  ship: svg(<><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z" /><path d="m3.5 7.5 8.5 4.5 8.5-4.5M12 12v9" /></>),
  pay: svg(<><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18M7 15h4" /></>),
};

// Réassurance : « band » = bandeau de l'accueil (arguments avec texte), « list » = petite liste sous le bouton d'achat de la fiche produit.
// Textes modifiables dans Admin → Contenu du site → « Bandeau de réassurance » (titre vide = élément masqué).
export default function Trust({ variant = 'band' }) {
  const { t, lang } = useI18n();
  const { trust } = withContentDefaults(useContent());
  if (!trust.enabled) return null;
  const en = lang === 'en';
  const items = trust.items
    .map((it) => ({ icon: it.icon, title: (en && it.titleEn) || it.title, text: (en && it.textEn) || it.text }))
    .filter((it) => it.title?.trim());
  if (!items.length) return null;
  if (variant === 'list') {
    return (
      <ul className="trust trust--list" aria-label={t('trust.label')}>
        {items.slice(0, 3).map((it, i) => <li key={i}><span className="trust__icon">{ICONS[it.icon] ?? ICONS.hand}</span>{it.title}</li>)}
      </ul>
    );
  }
  return (
    <section className="trust trust--band" aria-label={t('trust.label')}>
      <ul className="container trust__grid">
        {items.map((it, i) => (
          <li key={i}>
            <span className="trust__icon">{ICONS[it.icon] ?? ICONS.hand}</span>
            <strong>{it.title}</strong>
            {it.text && <span>{it.text}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
