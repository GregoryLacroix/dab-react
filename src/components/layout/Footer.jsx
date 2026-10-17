import { Link } from 'react-router-dom';
import { useConsent } from '../../context/ConsentContext.jsx';
import { useContent } from '../../store/store.js';
import { useI18n } from '../../i18n/I18nProvider.jsx';

export default function Footer() {
  const { t, l } = useI18n();
  const { footer } = useContent();
  const { services, openSettings } = useConsent();
  return (
    <footer className="footer">
      <div className="footer__inner">
        <p>© {new Date().getFullYear()} {footer.text}</p>
        <nav aria-label={t('footer.nav')}>
          <Link to={l('/produits')}>{t('nav.shop')}</Link>
          <Link to={l('/contact')}>{t('nav.contact')}</Link>
          <Link to={l('/inscription')}>{t('footer.register')}</Link>
          <Link to={l('/panier')}>{t('nav.cart')}</Link>
          <Link to="/admin">{t('nav.admin')}</Link>
        </nav>
        <nav aria-label={t('footer.legalNav')}>
          <Link to={l('/mentions-legales')}>{t('footer.legal')}</Link>
          <Link to={l('/politique-de-confidentialite')}>{t('footer.privacy')}</Link>
          <Link to={l('/conditions-generales-de-vente')}>{t('footer.terms')}</Link>
          {services.length > 0 && <button type="button" className="link-btn" onClick={openSettings}>{t('footer.cookies')}</button>}
        </nav>
      </div>
    </footer>
  );
}
