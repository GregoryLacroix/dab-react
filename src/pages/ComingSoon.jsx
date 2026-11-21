import { Link } from 'react-router-dom';
import logo from '../assets/logo.svg';
import useSeo from '../services/seo.js';
import { useContent, useSiteMode } from '../store/store.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

// Page d'attente affichée à la place du site quand « Bientôt disponible » est activé dans le back-office.
export default function ComingSoon() {
  const { t, l, lang, date, switchPath } = useI18n();
  const { config } = useSiteMode();
  const { contact } = useContent();
  useSeo({ title: config.title, description: config.text, path: '/', noindex: true }); // les moteurs de recherche n'indexent pas la page d'attente

  // Jours restants avant l'ouverture (date facultative)
  const open = config.date ? new Date(`${config.date}T00:00:00`) : null;
  const days = open && open.getTime() > Date.now() ? Math.ceil((open.getTime() - Date.now()) / 86400000) : null;
  const other = lang === 'fr' ? 'EN' : 'FR';

  return (
    <main className="soon" id="contenu">
      <div className="soon__lang"><Link to={switchPath()} hrefLang={lang === 'fr' ? 'en' : 'fr'} lang={lang === 'fr' ? 'en' : 'fr'}>{other}</Link></div>
      <img className="soon__logo" src={logo} alt={t('home.logoAlt')} width="360" height="360" decoding="async" />
      <h1>{config.title}</h1>
      <p className="soon__text">{config.text}</p>
      {days !== null && (
        <p className="soon__date">
          <strong>{t('soon.openOn', { date: date(config.date) })}</strong>
          <span>{t('soon.inDays', { count: days })}</span>
        </p>
      )}
      {(contact?.email || contact?.instagram) && (
        <p className="soon__links">
          {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
          {contact.instagram && <a href={contact.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
        </p>
      )}
      <nav className="soon__legal" aria-label={t('footer.legalNav')}>
        <Link to={l('/mentions-legales')}>{t('footer.legal')}</Link>
        <Link to={l('/politique-de-confidentialite')}>{t('footer.privacy')}</Link>
      </nav>
    </main>
  );
}
