import { useState } from 'react';
import FormField from '../components/ui/FormField.jsx';
import Button from '../components/ui/Button.jsx';
import { Link } from 'react-router-dom';
import { api, fieldErrors } from '../services/api.js';
import useSeo, { SITE_URL } from '../services/seo.js';
import { SUBJECTS, useContent } from '../store/store.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

const EMPTY = { name: '', email: '', subject: 'produit', message: '', consent: false, website: '' };

export default function Contact() {
  const { t, l, lang } = useI18n();
  const { contact } = useContent();
  useSeo({
    title: t('contact.seoTitle'),
    description: contact.text,
    path: '/contact',
    jsonLd: { '@context': 'https://schema.org', '@type': 'ContactPage', name: contact.title, url: `${SITE_URL}${l('/contact')}`, inLanguage: lang === 'en' ? 'en-GB' : 'fr-FR' },
  });
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(null); // message de remerciement renvoyé par l'API
  const [busy, setBusy] = useState(false);

  const change = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (!form.name.trim()) err.name = t('validation.name');
    if (!/\S+@\S+\.\S+/.test(form.email)) err.email = t('validation.email');
    if (form.message.trim().length < 10) err.message = t('contact.errMessage');
    if (!form.consent) err.consent = t('contact.errConsent');
    setErrors(err);
    if (Object.keys(err).length) return;

    setBusy(true);
    try {
      // POST /api/contact (le champ caché "website" sert de piège à robots : il doit rester vide)
      const res = await api.contact.send({ ...form, name: form.name.trim(), email: form.email.trim(), message: form.message.trim() });
      setSent(res.message);
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(Object.keys(fields).length ? fields : { form: error.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <h1>{contact.title}</h1>
        <div className="contact">
          <aside className="contact__info">
            <p>{contact.text}</p>
            <p>
              {t('contact.email')}<br />
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </p>
            {contact.instagram && (
              <p>
                {t('contact.instagram')}<br />
                <a href={contact.instagram} target="_blank" rel="noreferrer">{t('contact.instagramLink')}</a>
              </p>
            )}
          </aside>

          {sent ? (
            <div className="contact__form contact__ok" role="status">
              <h2>{t('contact.thanksTitle')}</h2>
              <p>{sent}</p>
              <Button variant="ghost" onClick={() => { setForm(EMPTY); setSent(null); }}>{t('contact.another')}</Button>
            </div>
          ) : (
            <form className="contact__form" onSubmit={submit} noValidate>
              <FormField label={t('field.name')} name="name" autoComplete="name" value={form.name} onChange={change} error={errors.name} />
              <FormField label={t('field.email')} name="email" type="email" autoComplete="email" value={form.email} onChange={change} error={errors.email} />
              <FormField label={t('contact.subject')} name="subject" as="select" value={form.subject} onChange={change}>
                {Object.entries(SUBJECTS).map(([key, label]) => <option key={key} value={key}>{lang === 'fr' ? label : t(`contact.subject.${key}`)}</option>)}
              </FormField>
              <FormField label={t('contact.message')} name="message" as="textarea" rows={7} value={form.message} onChange={change} error={errors.message} />

              {/* piège à robots : invisible pour les visiteurs */}
              <div className="hp" aria-hidden="true">
                <label>{t('contact.honeypot')}<input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={change} /></label>
              </div>

              <div>
                <label className="check">
                  <input type="checkbox" name="consent" checked={form.consent} onChange={change} aria-invalid={!!errors.consent} />
                  <span>{t('contact.consent', {}, [(c) => <Link to={l('/politique-de-confidentialite')}>{c}</Link>])}</span>
                </label>
                {errors.consent && <p className="field__error" role="alert">{errors.consent}</p>}
              </div>
              {errors.form && <p className="notice notice--error" role="alert">{errors.form}</p>}
              <p className="note">{t('contact.note')}</p>
              <Button type="submit" loading={busy}>{busy ? t('sending') : t('contact.send')}</Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
