import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import FormField from '../components/ui/FormField.jsx';
import { PageLoader } from '../components/ui/Loaders.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, fieldErrors } from '../services/api.js';
import useSeo from '../services/seo.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

const PRESETS = [20, 30, 50, 100];
const POLL_MS = 2000;
const POLL_MAX = 8;

// Achat d'une carte cadeau : /carte-cadeau (anglais : /en/gift-card). Le même adresse sert de retour de Stripe (?session_id=…).
export default function GiftCard() {
  const { t, l, money } = useI18n();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  useSeo({ title: t('gift.seoTitle'), description: t('gift.seoDesc'), path: '/carte-cadeau', noindex: !!sessionId });

  if (sessionId) return <Result sessionId={sessionId} />;
  return <Form key={user?.id ?? 'guest'} user={user} cancelled={params.get('cancelled') === '1'} t={t} l={l} money={money} />;
}

function Form({ user, cancelled, t, l, money }) {
  const [preset, setPreset] = useState(50);
  const [custom, setCustom] = useState('');
  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '', rName: '', rEmail: '', message: '' });
  const [accept, setAccept] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const reset = (e) => { if (e.persisted) setRedirecting(false); }; // retour arrière depuis Stripe
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);

  const amount = custom !== '' ? Number(custom.replace(',', '.')) : preset;
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (!(amount >= 10 && amount <= 500)) err.amount = t('gift.errAmount');
    if (!form.name.trim()) err.name = t('validation.name');
    if (!/\S+@\S+\.\S+/.test(form.email)) err.email = t('validation.email');
    if (form.rEmail.trim() && !/\S+@\S+\.\S+/.test(form.rEmail)) err.rEmail = t('validation.email');
    if (!accept) err.terms = t('gift.errTerms');
    setErrors(err);
    if (Object.keys(err).length) return;

    setBusy(true);
    try {
      const res = await api.giftCards.buy({
        amount, acceptTerms: true, message: form.message.trim() || null,
        buyer: { name: form.name.trim(), email: form.email.trim() },
        recipient: { name: form.rName.trim() || null, email: form.rEmail.trim() || null },
      });
      setRedirecting(true);
      window.location.assign(res.checkoutUrl);
    } catch (error) {
      const v = fieldErrors(error, { 'buyer.name': 'name', 'buyer.email': 'email', 'recipient.email': 'rEmail', acceptTerms: 'terms' });
      setErrors(Object.keys(v).length ? v : { form: error.message });
      setBusy(false);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <h1>{t('gift.title')}</h1>
        <p className="lead">{t('gift.intro')}</p>
        {cancelled && <p className="notice" role="status">{t('gift.cancelled')}</p>}
        <div className="gift">
          <form className="gift__form" onSubmit={submit} noValidate>
            <fieldset className="gift__amounts">
              <legend>{t('gift.amount')}</legend>
              {PRESETS.map((v) => (
                <button key={v} type="button" aria-pressed={custom === '' && preset === v} onClick={() => { setPreset(v); setCustom(''); }}>{money(v)}</button>
              ))}
            </fieldset>
            <FormField label={t('gift.amountOther')} name="custom" inputMode="decimal" value={custom} onChange={(e) => setCustom(e.target.value)} error={errors.amount} />
            <FormField label={t('gift.yourName')} name="name" autoComplete="name" value={form.name} onChange={change} error={errors.name} />
            <FormField label={t('gift.yourEmail')} name="email" type="email" autoComplete="email" value={form.email} onChange={change} error={errors.email} />
            <FormField label={t('gift.recipientName')} name="rName" value={form.rName} onChange={change} maxLength={120} />
            <FormField label={t('gift.recipientEmail')} name="rEmail" type="email" value={form.rEmail} onChange={change} error={errors.rEmail} />
            <p className="note">{t('gift.recipientHint')}</p>
            <FormField as="textarea" rows={4} label={t('gift.message')} name="message" value={form.message} onChange={change} maxLength={500} />
            <label className="check">
              <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} aria-invalid={!!errors.terms} />
              <span>{t('gift.terms', {}, [(c) => <Link to={l('/conditions-generales-de-vente')}>{c}</Link>])}</span>
            </label>
            {errors.terms && <p className="field__error" role="alert">{errors.terms}</p>}
            {errors.form && <p className="notice notice--error" role="alert">{errors.form}</p>}
            <div><Button type="submit" loading={busy || redirecting}>{redirecting ? t('gift.redirecting') : t('gift.pay', { amount: money(amount >= 10 && amount <= 500 ? amount : 0) })}</Button></div>
          </form>
          <aside className="gift__how">
            <h2>{t('gift.howTitle')}</h2>
            <ol><li>{t('gift.how1')}</li><li>{t('gift.how2')}</li><li>{t('gift.how3')}</li></ol>
          </aside>
        </div>
      </div>
    </section>
  );
}

// Retour de Stripe : on interroge l'API jusqu'à ce que le paiement soit confirmé
function Result({ sessionId }) {
  const { t, l, money } = useI18n();
  const [res, setRes] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let stop = false;
    let timer;
    let tries = 0;
    const check = async () => {
      try {
        const r = await api.giftCards.checkoutStatus(sessionId);
        if (stop) return;
        setRes(r);
        if (!r.paid && ++tries < POLL_MAX) timer = setTimeout(check, POLL_MS);
      } catch {
        if (!stop) setFailed(true);
      }
    };
    check();
    return () => { stop = true; clearTimeout(timer); };
  }, [sessionId]);

  const shop = <Button to={l('/produits')}>{t('cart.continue')}</Button>;
  if (failed) return <section className="section container empty"><h1>{t('gift.unknownTitle')}</h1><p>{t('gift.unknownText')}</p>{shop}</section>;
  if (!res) return <PageLoader label={t('gift.checking')} />;
  if (!res.paid) return <section className="section container empty"><h1>{t('gift.pendingTitle')}</h1><p>{t('gift.pendingText')}</p></section>;
  return (
    <section className="section container empty">
      <h1>{t('gift.doneTitle')}</h1>
      <p>{t('gift.doneText', { amount: money(res.amount), email: res.buyerEmail })}</p>
      {res.recipientEmail && res.recipientEmail !== res.buyerEmail && <p>{t('gift.doneRecipient', { email: res.recipientEmail })}</p>}
      {shop}
    </section>
  );
}
