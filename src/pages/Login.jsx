import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import FormField from '../components/ui/FormField.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import useSeo from '../services/seo.js';
import SocialLogin, { oauthBanner } from '../components/ui/SocialLogin.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';

export default function Login() {
  const { t, l } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [info, setInfo] = useState('');
  const [resending, setResending] = useState(false);
  useSeo({ title: t('login.title'), path: '/connexion', noindex: true });
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Retour du lien reçu par e-mail : /connexion?verified=1 (ou verified=0&reason=expired|invalid)
  const verified = params.get('verified');
  const social = oauthBanner(params.get('oauth'), t); // retour d'un échec / d'une annulation chez Google ou Facebook
  const banner = social ?? (params.get('reset') === '1' ? { ok: true, text: t('login.resetDone') } : verified === '1'
    ? { ok: true, text: t('login.verified') }
    : verified === '0'
      ? { ok: false, text: params.get('reason') === 'expired'
        ? t('login.expired')
        : t('login.invalidLink') }
      : null);

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (!/\S+@\S+\.\S+/.test(form.email)) err.email = t('validation.email');
    if (!form.password) err.password = t('login.errPassword');
    setErrors(err);
    setInfo('');
    setUnverified(false);
    if (Object.keys(err).length) return;

    setBusy(true);
    try {
      const user = await login(form.email.trim(), form.password);
      navigate(user.isAdmin ? '/admin' : l('/'));
    } catch (error) {
      setUnverified(error.code === 'email_not_verified');
      setErrors({ form: error.message });
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const res = await api.resendVerification(form.email.trim());
      setErrors({});
      setInfo(res.message);
    } catch (error) {
      setErrors({ form: error.message });
    } finally {
      setResending(false);
    }
  };

  return (
    <section className="section">
      <form className="auth" onSubmit={submit} noValidate>
        <h1>{t('login.title')}</h1>
        {banner && <p className={`notice ${banner.ok ? '' : 'notice--error'}`} role="status">{banner.text}</p>}
        <FormField label={t('field.email')} name="email" type="email" autoComplete="email"
          value={form.email} onChange={change} error={errors.email} />
        <FormField label={t('field.password')} name="password" type="password" autoComplete="current-password"
          value={form.password} onChange={change} error={errors.password} />
        <p className="auth__alt"><Link to={l('/mot-de-passe-oublie')}>{t('login.forgot')}</Link></p>
        {errors.form && <p className="notice notice--error" role="alert">{errors.form}</p>}
        {info && <p className="notice" role="status">{info}</p>}
        {unverified && <Button variant="ghost" onClick={resend} loading={resending}>{t('login.resend')}</Button>}
        <Button type="submit" loading={busy}>{busy ? t('login.busy') : t('login.submit')}</Button>
        <SocialLogin />
        <p className="auth__alt">{t('login.noAccount', {}, [(c) => <Link to={l('/inscription')}>{c}</Link>])}</p>
      </form>
    </section>
  );
}
