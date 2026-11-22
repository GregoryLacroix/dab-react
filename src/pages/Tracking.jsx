import { useState } from 'react';
import Button from '../components/ui/Button.jsx';
import FormField from '../components/ui/FormField.jsx';
import { api, fieldErrors } from '../services/api.js';
import useSeo from '../services/seo.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

const STEPS = ['paid', 'shipped', 'delivered'];
const REACHED = { payée: 1, expédiée: 2, livrée: 3 }; // nombre d'étapes atteintes

// Suivre une commande sans compte : numéro de commande + e-mail (/suivi-commande, anglais : /en/order-tracking)
export default function Tracking() {
  const { t, date, lang } = useI18n();
  const [form, setForm] = useState({ reference: '', email: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState(null);
  useSeo({ title: t('track.seoTitle'), description: t('track.seoDesc'), path: '/suivi-commande', noindex: true });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      setOrder(await api.orderTrack({ reference: form.reference.trim(), email: form.email.trim() }));
    } catch (err) {
      const v = fieldErrors(err);
      setErrors(Object.keys(v).length ? v : { form: err.status === 404 ? t('track.notFound') : err.message });
    } finally {
      setBusy(false);
    }
  };

  if (order) {
    const reached = REACHED[order.status] ?? 0;
    return (
      <section className="section">
        <div className="container track">
          <h1>{order.reference}</h1>
          {order.status === 'annulée' ? <p className="notice" role="status">{t('track.cancelled')}</p> : (
            <ol className="track__steps">
              {STEPS.map((s, i) => <li key={s} className={i < reached ? 'is-done' : ''} aria-current={i === reached - 1 ? 'step' : undefined}>{t(`track.step.${s}`)}</li>)}
            </ol>
          )}
          {order.status !== 'annulée' && (order.tracking ? (
            <div className="track__box">
              {order.tracking.shippedAt && <p>{t('track.shippedOn', { date: date(order.tracking.shippedAt) })}</p>}
              {order.tracking.carrier && <p><strong>{t('track.carrier')} :</strong> {order.tracking.carrier}</p>}
              {order.tracking.number && <p><strong>{t('track.number')} :</strong> {order.tracking.number}</p>}
              {order.tracking.url && <p><a className="btn btn--primary" href={order.tracking.url} target="_blank" rel="noopener noreferrer">{t('track.link')}</a></p>}
            </div>
          ) : <p>{t('track.preparing')}</p>)}
          <h2>{t('track.items')}</h2>
          <ul>{order.items.map((i, k) => <li key={k}>{i.qty} × {i.name}</li>)}</ul>
          <p><Button variant="ghost" onClick={() => { setOrder(null); setForm({ reference: '', email: '' }); }}>{t('track.another')}</Button></p>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container track">
        <h1>{t('track.title')}</h1>
        <p className="lead">{t('track.intro')}</p>
        <form onSubmit={submit} noValidate className="track__form" lang={lang}>
          <FormField label={t('track.reference')} name="reference" placeholder="CMD-1042" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} error={errors.reference} />
          <FormField label={t('track.email')} name="email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
          {errors.form && <p className="notice notice--error" role="alert">{errors.form}</p>}
          <div><Button type="submit" loading={busy}>{t('track.submit')}</Button></div>
        </form>
      </div>
    </section>
  );
}
