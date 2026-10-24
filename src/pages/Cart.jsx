import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import FormField from '../components/ui/FormField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useContent } from '../store/store.js';
import { api, fieldErrors } from '../services/api.js';
import { maxQty } from '../services/stock.js';
import useSeo from '../services/seo.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

export default function Cart() {
  const { t, l, loc, money } = useI18n();
  const { items, total, setQty, remove, clear } = useCart();
  const { user } = useAuth();
  const { legal } = useContent();
  const [accept, setAccept] = useState(false);
  useSeo({ title: t('cart.seoTitle'), path: '/panier', noindex: true });
  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [params] = useSearchParams();
  const cancelled = params.get('cancelled') === '1'; // retour du bouton « Retour » de la page Stripe

  // Retour arrière depuis Stripe : le navigateur peut restaurer cette page telle quelle, bouton encore en chargement
  useEffect(() => {
    const reset = (e) => { if (e.persisted) setRedirecting(false); };
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const order = async () => {
    const err = {};
    if (!form.name.trim()) err.name = t('validation.name');
    if (!/\S+@\S+\.\S+/.test(form.email)) err.email = t('validation.email');
    if (!accept) err.terms = t('cart.errTerms');
    setErrors(err);
    if (Object.keys(err).length) return;

    setBusy(true);
    try {
      // POST /api/orders : le serveur recalcule les prix et le total, et renvoie l'adresse de la page de paiement Stripe
      const res = await api.orders.create({ customer: { name: form.name.trim(), email: form.email.trim() }, items, acceptTerms: true });
      if (res.checkoutUrl) {
        // Le panier reste intact : il ne sera vidé qu'une fois le paiement confirmé (page /commande)
        setRedirecting(true);
        window.location.assign(res.checkoutUrl);
        return;
      }
      // Paiement en ligne désactivé côté API : commande simplement enregistrée
      setPlaced(res);
      clear();
    } catch (error) {
      const v = fieldErrors(error, { 'customer.name': 'name', 'customer.email': 'email', acceptTerms: 'terms' });
      const itemMessage = Object.entries(v).find(([key]) => key.startsWith('items'))?.[1];
      setErrors({ name: v.name, email: v.email, terms: v.terms, form: itemMessage ?? (v.name || v.email ? undefined : error.message) });
    } finally {
      setBusy(false);
    }
  };

  if (placed) {
    return (
      <section className="section container empty">
        <h1>{t('cart.thanksTitle')}</h1>
        <p>{t('cart.thanksText', { id: placed.id, total: money(placed.total), email: placed.customer.email })}</p>
        <Button to={l('/produits')}>{t('cart.continue')}</Button>
      </section>
    );
  }
  if (items.length === 0) {
    return (
      <section className="section container empty">
        <h1>{t('cart.emptyTitle')}</h1>
        <p>{t('cart.emptyText')}</p>
        <Button to={l('/produits')}>{t('cart.seeShop')}</Button>
      </section>
    );
  }
  return (
    <section className="section">
      <div className="container">
        <h1>{t('cart.title')}</h1>
        {cancelled && <p className="notice" role="status">{t('cart.cancelled')}</p>}
        <ul className="cart">
          {items.map((item) => {
            const i = loc(item); // nom traduit si l'API le fournit (le panier garde le produit d'origine)
            return (
              <li key={i.id} className="cart__row">
                <span className="cart__name">{i.name}</span>
                <input type="number" min="1" max={maxQty(i)} value={i.qty} aria-label={t('cart.qtyOf', { name: i.name })}
                  onChange={(e) => setQty(i.id, Number(e.target.value))} />
                <span className="price">{money(i.qty * i.price)}</span>
                <button className="link-btn" onClick={() => remove(i.id)}>{t('cart.remove')}</button>
              </li>
            );
          })}
        </ul>
        <div className="cart__checkout">
          <FormField label={t('field.name')} name="name" autoComplete="name" value={form.name} onChange={change} error={errors.name} />
          <FormField label={t('field.email')} name="email" type="email" autoComplete="email" value={form.email} onChange={change} error={errors.email} />
        </div>
        <p className="note">{t('cart.privacyNote', { vat: legal?.vatNote }, [(c) => <Link to={l('/politique-de-confidentialite')}>{c}</Link>])}</p>
        <div className="cart__terms">
          <label className="check">
            <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} aria-invalid={!!errors.terms} />
            <span>{t('cart.terms', {}, [(c) => <Link to={l('/conditions-generales-de-vente')}>{c}</Link>])}</span>
          </label>
          {errors.terms && <p className="field__error" role="alert">{errors.terms}</p>}
        </div>
        {errors.form && <p className="notice notice--error" role="alert">{errors.form}</p>}
        <div className="cart__summary">
          <p>{t('cart.total')} <strong>{money(total)}</strong></p>
          <div className="hero__actions">
            <Button variant="ghost" onClick={clear}>{t('cart.clear')}</Button>
            <Button onClick={order} loading={busy || redirecting}>{redirecting ? t('cart.redirecting') : busy ? t('sending') : t('cart.order')}</Button>
          </div>
        </div>
        <p className="note">{t('cart.paymentNote')}</p>
      </div>
    </section>
  );
}
