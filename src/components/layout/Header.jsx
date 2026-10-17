import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from '../ui/Logo.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/I18nProvider.jsx';

export default function Header() {
  const { t, l, otherLang, switchPath } = useI18n();
  const { count } = useCart();
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false); // menu déroulant (smartphone)
  const headerRef = useRef(null);

  // Le header reste toujours visible ; il rétrécit dès qu'on descend.
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  // Le menu se referme quand on change de page
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // ... et avec Échap ou en touchant à l'extérieur du header
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onPointer = (e) => { if (headerRef.current && !headerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <header ref={headerRef} className={`header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="header__inner">
        <Link to={l('/')} className="header__brand" aria-label={t('brand.home')}>
          <Logo />
        </Link>

        <button type="button" className="header__toggle" aria-expanded={open} aria-controls="main-nav"
          aria-label={open ? t('header.menuClose') : t('header.menuOpen')} onClick={() => setOpen((o) => !o)}>
          <span /><span /><span />
          {count > 0 && !open && <b className="header__dot" aria-hidden="true">{count}</b>}
        </button>

        <nav id="main-nav" className={`header__nav ${open ? 'is-open' : ''}`} aria-label={t('header.nav')}>
          <NavLink to={l('/')} end>{t('nav.home')}</NavLink>
          <NavLink to={l('/produits')}>{t('nav.shop')}</NavLink>
          <NavLink to={l('/contact')}>{t('nav.contact')}</NavLink>
          {user ? (
            <>
              <NavLink to={l('/mon-compte')}>{t('nav.account')}</NavLink>
              {user.isAdmin && <NavLink to="/admin">{t('nav.admin')}</NavLink>}
              <button type="button" className="header__logout" onClick={logout}>{t('nav.logout')}</button>
            </>
          ) : (
            <NavLink to={l('/connexion')}>{t('nav.login')}</NavLink>
          )}
          <NavLink to={l('/panier')} className="header__cart">
            {t('nav.cart')}{count > 0 && <span className="badge">{count}</span>}
          </NavLink>
          {/* Sélecteur de langue : mène à la même page dans l'autre langue (lien normal, donc indexable) */}
          <Link to={switchPath()} className="header__lang" lang={otherLang} hrefLang={otherLang}
            aria-label={t('lang.switchLabel')} title={t('lang.switchName')}>{t('lang.switchShort')}</Link>
        </nav>
      </div>
    </header>
  );
}
