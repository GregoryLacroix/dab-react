import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import FormField from '../components/ui/FormField.jsx';
import { api } from '../services/api.js';
import useSeo from '../services/seo.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

// « Mot de passe oublié » : demande d'un lien par e-mail (la réponse est la même que le compte existe ou non)
export default function ForgotPassword() {
  const { t, l } = useI18n();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');
  useSeo({ title: t('forgot.title'), path: '/mot-de-passe-oublie', noindex: true });

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t('validation.email'));
    setError('');
    setBusy(true);
    try {
      await api.forgotPassword(email.trim()); // POST /api/auth/forgot-password
      setSentTo(email.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (sentTo) {
    return (
      <section className="section">
        <div className="auth">
          <h1>{t('forgot.title')}</h1>
          <p className="notice" role="status">{t('forgot.sent', { email: sentTo })}</p>
          <p className="auth__alt"><Link to={l('/connexion')}>{t('forgot.back')}</Link></p>
        </div>
      </section>
    );
  }
  return (
    <section className="section">
      <form className="auth" onSubmit={submit} noValidate>
        <h1>{t('forgot.title')}</h1>
        <p>{t('forgot.intro')}</p>
        <FormField label={t('field.email')} name="email" type="email" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} error={error} />
        <Button type="submit" loading={busy}>{busy ? t('sending') : t('forgot.submit')}</Button>
        <p className="auth__alt"><Link to={l('/connexion')}>{t('forgot.back')}</Link></p>
      </form>
    </section>
  );
}
