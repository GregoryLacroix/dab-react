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
  const { t, l, loc, money, lang } = useI18n();
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
  // Codes promo / carte cadeau : le serveur calcule la remise (POST /api/codes/check), le navigateur ne fait que l'afficher
  const [codes, setCodes] = useState([]);
  const [promo, setPromo] = useState(null);       // { promo, gift, discount }
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeBusy, setCodeBusy] = useState(false);
  // Frais de port : pays choisi, tarif calculé par le serveur (poids du colis + zone)
  const [zones, setZones] = useState(null);       // null = pas encore chargé ; { enabled, zones }
  const [country, setCountry] = useState('FR');
  const [ship, setShip] = useState(null);         // { enabled, shipping, zone, freeFrom }
  const [shipError, setShipError] = useState('');
  const cancelled = params.get('cancelled') === '1'; // retour du bouton « Retour » de la page Stripe

  // Retour arrière depuis Stripe : le navigateur peut restaurer cette page telle quelle, bouton encore en chargement
  useEffect(() => {
    const reset = (e) => { if (e.persisted) setRedirecting(false); };
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);
  // Le panier change (quantité, retrait) : on recalcule la remise ; si le code ne s'applique plus, on le retire
  useEffect(() => {
    if (codes.length === 0 || items.length === 0) return undefined;
    let stop = false;
    api.codes.check({ codes, items, email: form.email }).then(
      (res) => { if (!stop) setPromo(res); },
      (err) => { if (!stop) { setCodes([]); setPromo(null); setCodeError(fieldErrors(err).code ?? err.message); } },
    );
    return () => { stop = true; };
  }, [total]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyCode = async () => {
    const code = codeInput.trim();
    if (!code) return;
    setCodeBusy(true);
    setCodeError('');
    try {
      const next = [...codes, code];
      const res = await api.codes.check({ codes: next, items, email: form.email });
      setCodes(next);
      setPromo(res);
      setCodeInput('');
    } catch (err) {
      setCodeError(fieldErrors(err).code ?? err.message);
    } finally {
      setCodeBusy(false);
    }
  };
  const removeCode = (code) => {
    const next = codes.filter((c) => c.replace(/\s+/g, '').toUpperCase() !== code);
    setCodes(next);
    if (next.length === 0) setPromo(null);
    else api.codes.check({ codes: next, items, email: form.email }).then(setPromo, () => { setCodes([]); setPromo(null); });
  };
  useEffect(() => { api.shipping.info().then(setZones, () => setZones({ enabled: false, zones: [] })); }, []);
  const countryCodes = zones?.enabled ? zones.zones.flatMap((z) => z.countries) : [];
  useEffect(() => { if (countryCodes.length && !countryCodes.includes(country)) setCountry(countryCodes[0]); }, [zones]); // eslint-disable-line react-hooks/exhaustive-deps
  const codesKey = codes.join('|');
  useEffect(() => {
    if (!zones?.enabled || items.length === 0 || !countryCodes.includes(country)) { setShip(null); return undefined; }
    let stop = false;
    const timer = setTimeout(() => {
      api.shipping.quote({ country, items, codes }).then(
        (r) => { if (!stop) { setShip(r); setShipError(''); } },
        (err) => { if (!stop) { setShip(null); setShipError(fieldErrors(err).country ?? err.message); } },
      );
    }, 250);
    return () => { stop = true; clearTimeout(timer); };
  }, [zones, country, total, codesKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const names = (() => { try { return new Intl.DisplayNames([lang], { type: 'region' }); } catch { return null; } })();
  const discount = promo?.discount ?? 0;
  const shipping = ship?.enabled ? ship.shipping : 0;
  const net = Math.max(0, Math.round((total - discount + shipping) * 100) / 100);

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
      const res = await api.orders.create({ customer: { name: form.name.trim(), email: form.email.trim() }, items, acceptTerms: true, codes, country: zones?.enabled ? country : undefined });
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
      if (v.code) setCodeError(v.code);
      const itemMessage = Object.entries(v).find(([key]) => key.startsWith('items'))?.[1];
      setErrors({ name: v.name, email: v.email, terms: v.terms, form: itemMessage ?? (v.name || v.email || v.code ? undefined : error.message) });
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
        <div className="cart__promo">
          <label htmlFor="promo-code">{t('promo.label')}</label>
          <div className="cart__promo-row">
            <input id="promo-code" value={codeInput} maxLength={40} placeholder={t('promo.placeholder')} autoComplete="off" aria-invalid={!!codeError}
              onChange={(e) => setCodeInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCode(); } }} />
            <Button variant="ghost" onClick={applyCode} loading={codeBusy}>{t('promo.apply')}</Button>
          </div>
          {codeError && <p className="field__error" role="alert">{codeError}</p>}
          {promo?.promo && (
            <p className="cart__applied">{t('promo.promoLine', { code: promo.promo.code })} : <strong>− {money(promo.promo.amount)}</strong>{' '}
              <button type="button" className="link-btn" onClick={() => removeCode(promo.promo.code)}>{t('promo.remove')}</button></p>
          )}
          {promo?.gift && (
            <p className="cart__applied">{t('promo.giftLine', { code: promo.gift.code })} : <strong>− {money(promo.gift.amount)}</strong>{' '}
              <small>({t('promo.giftBalance', { balance: money(promo.gift.balance) })})</small>{' '}
              <button type="button" className="link-btn" onClick={() => removeCode(promo.gift.code)}>{t('promo.remove')}</button></p>
          )}
        </div>
        {zones?.enabled && (
          <div className="cart__ship">
            <label htmlFor="ship-country">{t('ship.country')}</label>
            <select id="ship-country" value={country} onChange={(e) => setCountry(e.target.value)}>
              {countryCodes.map((c) => <option key={c} value={c}>{names?.of(c) ?? c}</option>)}
            </select>
            {shipError && <p className="field__error" role="alert">{shipError}</p>}
            {ship?.enabled && (
              <p className="cart__applied">
                {t('ship.line')} : <strong>{ship.shipping > 0 ? money(ship.shipping) : t('ship.free')}</strong>
                {ship.shipping > 0 && ship.freeFrom != null && total - discount < ship.freeFrom && <small> ({t('ship.freeFrom', { amount: money(ship.freeFrom) })})</small>}
              </p>
            )}
          </div>
        )}
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
          {(discount > 0 || shipping > 0) && <p className="note">{t('promo.subtotal')} {money(total)}{discount > 0 && !zones?.enabled ? ` · ${t('promo.shippingNote')}` : ''}</p>}
          <p>{t('cart.total')} <strong>{money(net)}</strong></p>
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
