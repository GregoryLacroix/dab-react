import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button.jsx';
import FormField from './FormField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { fieldErrors } from '../../services/api.js';
import { useI18n } from '../../i18n/I18nProvider.jsx';

// 2e étape de la connexion : code à 6 chiffres de l'application d'authentification, ou code de secours (XXXXX-XXXXX).
// onDone(user) est appelé une fois le code accepté (la session est alors ouverte).
export default function TwoFactorForm({ challenge, onDone }) {
  const { t, l } = useI18n();
  const { verifyTwoFactor } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return setError(t('twofa.errCode'));
    setBusy(true);
    setError('');
    try {
      onDone(await verifyTwoFactor(challenge, code.trim())); // POST /api/auth/2fa/verify
    } catch (err) {
      if (err.status === 400) setExpired(true); // la minute de grâce de 5 minutes est écoulée
      else setError(fieldErrors(err).code ?? err.message);
      setBusy(false);
    }
  };

  if (expired) {
    return (
      <>
        <p className="notice notice--error" role="alert">{t('twofa.expired')}</p>
        <p className="auth__alt"><Link to={l('/connexion')} reloadDocument>{t('forgot.back')}</Link></p>
      </>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="twofa">
      <p>{t('twofa.intro')}</p>
      <FormField label={t('twofa.code')} name="code" autoComplete="one-time-code" inputMode="text" autoFocus spellCheck={false}
        value={code} onChange={(e) => setCode(e.target.value)} error={error} />
      <Button type="submit" loading={busy}>{busy ? t('twofa.busy') : t('twofa.submit')}</Button>
      <p className="note">{t('twofa.recoveryHint')}</p>
    </form>
  );
}
