import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ProductImage from './ProductImage.jsx';
import Button from './Button.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { cover } from '../../store/store.js';
import { maxQty } from '../../services/stock.js';
import { useI18n } from '../../i18n/I18nProvider.jsx';

// Mini-panier latéral : s'ouvre après « Ajouter au panier » (sauf sur la page du panier), se ferme avec Échap, un clic à côté ou un changement de page.
export default function CartDrawer() {
  const { t, l, loc, money } = useI18n();
  const { items, total, count, drawer, closeDrawer, setQty, remove } = useCart();
  const { pathname } = useLocation();
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const onCartPage = pathname === l('/panier');
  const open = drawer && !onCartPage;

  useEffect(() => { closeDrawer(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    closeRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') { closeDrawer(); return; }
      if (e.key !== 'Tab') return;
      // le focus reste dans le panneau
      const f = panelRef.current?.querySelectorAll('a[href], button:not([disabled])');
      if (!f?.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement && document.contains(previous)) previous.focus();
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;
  return (
    <div className="drawer" onMouseDown={(e) => { if (e.target === e.currentTarget) closeDrawer(); }}>
      <aside className="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title" ref={panelRef}>
        <header className="drawer__head">
          <h2 id="drawer-title">{t('drawer.title')}{count > 0 && <span className="badge">{count}</span>}</h2>
          <button type="button" className="drawer__close" ref={closeRef} onClick={closeDrawer} aria-label={t('drawer.close')}>×</button>
        </header>
        {items.length === 0 ? (
          <p className="drawer__empty">{t('cart.emptyTitle')}</p>
        ) : (
          <ul className="drawer__list">
            {items.map((raw) => {
              const item = loc(raw);
              const img = cover(item);
              return (
                <li key={item.id} className="drawer__item">
                  <div className="drawer__thumb"><ProductImage tone={img.tone} src={img.src} label="" sizes="80px" /></div>
                  <div className="drawer__info">
                    <strong>{item.name}</strong>
                    <span>{money(item.price)}</span>
                    <div className="drawer__qty">
                      <button type="button" onClick={() => setQty(item.id, item.qty - 1)} disabled={item.qty <= 1} aria-label={`− ${item.name}`}>−</button>
                      <span aria-live="polite">{item.qty}</span>
                      <button type="button" onClick={() => setQty(item.id, item.qty + 1)} disabled={item.qty >= maxQty(item)} aria-label={`+ ${item.name}`}>+</button>
                      <button type="button" className="drawer__remove" onClick={() => remove(item.id)}>{t('cart.remove')}</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <footer className="drawer__foot">
          <p className="drawer__total"><span>{t('cart.total')}</span><strong>{money(total)}</strong></p>
          <Button to={l('/panier')}>{t('drawer.view')}</Button>
          <button type="button" className="drawer__continue" onClick={closeDrawer}>{t('cart.continue')}</button>
        </footer>
      </aside>
    </div>
  );
}
