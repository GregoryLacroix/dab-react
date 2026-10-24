import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import FormField from '../components/ui/FormField.jsx';
import { api, fieldErrors } from '../services/api.js';
import useSeo from '../services/seo.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

// Le jeton arrive dans le FRAGMENT de l'adresse (#token=…) : jamais envoyé à un serveur. On l'efface de l'adresse dès qu'il est lu ;
// la variable partagée évite de le perdre quand React exécute deux fois l'effet en mode développement.
let savedToken = '';

// Lien reçu par e-mail : /nouveau-mot-de-passe#token=…  (anglais : /en/reset-password)
export default function ResetPassword() {
  const { t, l } = useI18n();
  const navigate = useNavigate();
  const [token, setToken] = useState(savedToken);
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState(false);
  useSeo({ title: t('reset.title'), path: '/nouveau-mot-de-passe', noindex: true });

  useEffect(() => {
    const found = window.location.hash.match(/token=([a-f0-9]{64})/);
    if (found) {
      savedToken = found[1];
      window.history.replaceState(null, '', window.location.pathname);
      setToken(found[1]);
    }
  }, []);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (form.password.length < 8) err.password = t('register.errPassword');
    if (form.confirm !== form.password) err.confirm = t('register.errConfirm');
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    try {
      await api.resetPassword({ token, password: form.password, confirm: form.confirm }); // POST /api/auth/reset-password
      savedToken = '';
      navigate(`${l('/connexion')}?reset=1`, { replace: true });
    } catch (error) {
      if (error.status === 400 || error.status === 410) setInvalid(true);
      else setErrors(fieldErrors(error).password || fieldErrors(error).confirm ? fieldErrors(error) : { form: error.message });
    } finally {
      setBusy(false);
    }
  };

  if (!token || invalid) {
    return (
      <section className="section">
        <div className="auth">
          <h1>{t('reset.invalidTitle')}</h1>
          <p>{t('reset.invalidText')}</p>
          <Button to={l('/mot-de-passe-oublie')}>{t('reset.again')}</Button>
          <p className="auth__alt"><Link to={l('/connexion')}>{t('forgot.back')}</Link></p>
        </div>
      </section>
    );
  }
  return (
    <section className="section">
      <form className="auth" onSubmit={submit} noValidate>
        <h1>{t('reset.title')}</h1>
        <FormField label={t('reset.password')} name="password" type="password" autoComplete="new-password"
          value={form.password} onChange={change} error={errors.password} />
        <FormField label={t('register.confirm')} name="confirm" type="password" autoComplete="new-password"
          value={form.confirm} onChange={change} error={errors.confirm} />
        {errors.form && <p className="notice notice--error" role="alert">{errors.form}</p>}
        <Button type="submit" loading={busy}>{busy ? t('reset.busy') : t('reset.submit')}</Button>
      </form>
    </section>
  );
}
