import { useState } from 'react';
import { Link } from 'react-router-dom';
import FormField from '../components/ui/FormField.jsx';
import Button from '../components/ui/Button.jsx';
import { api, fieldErrors } from '../services/api.js';
import useSeo from '../services/seo.js';
import SocialLogin from '../components/ui/SocialLogin.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';

export default function Register() {
  const { t, l } = useI18n();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', accept: false });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // réponse de l'API après l'inscription
  const [info, setInfo] = useState('');
  const [resending, setResending] = useState(false);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  useSeo({ title: t('register.title'), path: '/inscription', noindex: true });

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (!form.name.trim()) err.name = t('validation.name');
    if (!/\S+@\S+\.\S+/.test(form.email)) err.email = t('validation.email');
    if (form.password.length < 8) err.password = t('register.errPassword');
    if (form.confirm !== form.password) err.confirm = t('register.errConfirm');
    if (!form.accept) err.accept = t('register.errAccept');
    setErrors(err);
    if (Object.keys(err).length) return;

    setBusy(true);
    try {
      const { accept, ...fields } = form; // eslint-disable-line no-unused-vars
      setDone(await api.register({ ...fields, consent: true, name: form.name.trim(), email: form.email.trim() }));
    } catch (error) {
      // 422 : messages par champ renvoyés par l'API ; autres erreurs (429 trop de demandes, réseau…) : message général
      const fields = fieldErrors(error, { consent: 'accept' });
      setErrors(Object.keys(fields).length ? fields : { form: error.message });
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      setInfo((await api.resendVerification(form.email.trim())).message);
    } catch (error) {
      setInfo(error.message);
    } finally {
      setResending(false);
    }
  };

  if (done) {
    return (
      <section className="section">
        <div className="auth">
          <h1>{t('register.checkTitle')}</h1>
          <p>{done.message}</p>
          <p className="note">{t('register.checkNote', { email: form.email })}</p>
          {info && <p className="notice" role="status">{info}</p>}
          <Button variant="ghost" onClick={resend} loading={resending}>{t('register.resend')}</Button>
          <p className="auth__alt">{t('register.confirmed', {}, [(c) => <Link to={l('/connexion')}>{c}</Link>])}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <form className="auth" onSubmit={submit} noValidate>
        <h1>{t('register.title')}</h1>
        <FormField label={t('field.name')} name="name" autoComplete="name"
          value={form.name} onChange={change} error={errors.name} />
        <FormField label={t('field.email')} name="email" type="email" autoComplete="email"
          value={form.email} onChange={change} error={errors.email} />
        <FormField label={t('field.password')} name="password" type="password" autoComplete="new-password"
          value={form.password} onChange={change} error={errors.password} />
        <FormField label={t('register.confirm')} name="confirm" type="password" autoComplete="new-password"
          value={form.confirm} onChange={change} error={errors.confirm} />
        <div>
          <label className="check">
            <input type="checkbox" name="accept" checked={form.accept} onChange={change} aria-invalid={!!errors.accept} />
            <span>{t('register.accept', {}, [(c) => <Link to={l('/politique-de-confidentialite')}>{c}</Link>, (c) => <Link to={l('/conditions-generales-de-vente')}>{c}</Link>])}</span>
          </label>
          {errors.accept && <p className="field__error" role="alert">{errors.accept}</p>}
        </div>
        <p className="note">{t('register.note')}</p>
        {errors.form && <p className="notice notice--error" role="alert">{errors.form}</p>}
        <Button type="submit" loading={busy}>{busy ? t('register.busy') : t('register.submit')}</Button>
        <SocialLogin />
        <p className="auth__alt">{t('register.already', {}, [(c) => <Link to={l('/connexion')}>{c}</Link>])}</p>
      </form>
    </section>
  );
}
