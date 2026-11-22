import { useState } from 'react';
import Button from './ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, fieldErrors } from '../services/api.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

// « Prévenez-moi » : sous un produit épuisé, un e-mail suffit
export default function StockAlertForm({ productId }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) return setError(t('alert.errEmail'));
    setBusy(true);
    setError('');
    try {
      await api.stockAlert(productId, email.trim());
      setDone(true);
    } catch (err) {
      const v = fieldErrors(err);
      setError(v.email ?? v.product ?? err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) return <p className="notice" role="status">{t('alert.done')}</p>;
  return (
    <form className="stock-alert" onSubmit={submit} noValidate>
      <h3>{t('alert.title')}</h3>
      <p className="note">{t('alert.text')}</p>
      <div className="stock-alert__row">
        <input type="email" value={email} autoComplete="email" placeholder={t('alert.email')} aria-label={t('alert.email')} aria-invalid={!!error} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" loading={busy}>{t('alert.submit')}</Button>
      </div>
      {error && <p className="field__error" role="alert">{error}</p>}
    </form>
  );
}
