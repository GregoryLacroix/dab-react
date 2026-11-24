import { Link } from 'react-router-dom';
import Logo from '../ui/Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useConsent } from '../../context/ConsentContext.jsx';
import { useContent } from '../../store/store.js';
import { useI18n } from '../../i18n/I18nProvider.jsx';

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" focusable="false">
    <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" focusable="false">
    <rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7.5 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Pied de page : marque et contact à gauche, trois colonnes de liens, mentions légales en bas
export default function Footer() {
  const { t, l } = useI18n();
  const { footer, contact, about, features } = useContent();
  const quotes = features?.quotes !== false; // demandes de devis activées dans le back-office
  const { services, openSettings } = useConsent();
  const { user } = useAuth();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <Link to={l('/')} aria-label={t('brand.home')} className="footer__logo"><Logo /></Link>
          <p className="footer__about">{t('footer.about')}</p>
          <ul className="footer__social" aria-label={t('footer.follow')}>
            {contact?.instagram && (
              <li><a href={contact.instagram} target="_blank" rel="noopener noreferrer" aria-label={t('footer.instagram')}><InstagramIcon /><span>Instagram</span></a></li>
            )}
            {contact?.email && (
              <li><a href={`mailto:${contact.email}`} aria-label={t('footer.mail')}><MailIcon /><span>{contact.email}</span></a></li>
            )}
          </ul>
        </div>

        <nav className="footer__col" aria-labelledby="footer-shop">
          <h2 id="footer-shop" className="footer__title">{t('footer.shop')}</h2>
          <Link to={l('/produits')}>{t('nav.shop')}</Link>
          {about?.enabled && <Link to={l('/a-propos')}>{t('nav.about')}</Link>}
          <Link to={l('/realisations')}>{t('nav.gallery')}</Link>
          <Link to={l('/carte-cadeau')}>{t('nav.giftCard')}</Link>
          {quotes && <Link to={l('/devis')}>{t('footer.quote')}</Link>}
        </nav>

        <nav className="footer__col" aria-labelledby="footer-help">
          <h2 id="footer-help" className="footer__title">{t('footer.help')}</h2>
          <Link to={l('/faq')}>{t('nav.faq')}</Link>
          <Link to={l('/suivi-commande')}>{t('nav.tracking')}</Link>
          <Link to={l('/contact')}>{t('nav.contact')}</Link>
          <Link to={l('/panier')}>{t('nav.cart')}</Link>
          {!user && <Link to={l('/inscription')}>{t('footer.register')}</Link>}
        </nav>

        <nav className="footer__col" aria-labelledby="footer-info" >
          <h2 id="footer-info" className="footer__title">{t('footer.info')}</h2>
          <Link to={l('/mentions-legales')}>{t('footer.legal')}</Link>
          <Link to={l('/politique-de-confidentialite')}>{t('footer.privacy')}</Link>
          <Link to={l('/conditions-generales-de-vente')}>{t('footer.terms')}</Link>
          {services.length > 0 && <button type="button" className="link-btn" onClick={openSettings}>{t('footer.cookies')}</button>}
        </nav>
      </div>

      <div className="footer__bottom">
        <p>© {new Date().getFullYear()} {footer.text}</p>
        {/* Lien réservé aux administrateurs connectés (la sécurité réelle est côté API : ce test ne fait que masquer le lien) */}
        {user?.isAdmin && <Link to="/admin">{t('nav.admin')}</Link>}
      </div>
    </footer>
  );
}
