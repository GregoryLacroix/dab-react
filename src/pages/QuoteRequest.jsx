import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import FormField from '../components/ui/FormField.jsx';
import { api, fieldErrors } from '../services/api.js';
import { shrinkImage } from '../services/imageResize.js';
import useSeo from '../services/seo.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

const BUDGETS = ['moins-500', '500-1000', '1000-2500', 'plus-2500', 'ne-sais-pas'];
const MAX_PHOTOS = 4;
const MAX_INPUT_BYTES = 30 * 1024 * 1024; // photo d'origine ; réduite dans le navigateur avant l'envoi
const MAX_SENT_BYTES = 8 * 1024 * 1024;   // limite du serveur

const empty = { name: '', email: '', phone: '', projectType: 'interieur', widthCm: '', heightCm: '', location: '', description: '', budget: '', desiredBy: '', consent: false, website: '' };

// Demande de devis pour une fresque murale : projet, dimensions, photos du mur, budget -> e-mail de confirmation + devis sous 3 jours
export default function QuoteRequest() {
  const { t, l, lang } = useI18n();
  const [form, setForm] = useState(empty);
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const fileInput = useRef(null);
  useSeo({ title: t('quote.seoTitle'), description: t('quote.seoDesc'), path: '/devis' });

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const addPhotos = (e) => {
    const chosen = [...e.target.files];
    e.target.value = ''; // permet de rechoisir le même fichier
    if (photos.length + chosen.length > MAX_PHOTOS) return setErrors((x) => ({ ...x, photos: t('quote.errPhotosMax', { max: MAX_PHOTOS }) }));
    if (chosen.some((f) => !/^image\/(jpeg|png|webp)$/.test(f.type))) return setErrors((x) => ({ ...x, photos: t('quote.errPhotosType') }));
    if (chosen.some((f) => f.size > MAX_INPUT_BYTES)) return setErrors((x) => ({ ...x, photos: t('quote.errPhotosSize') }));
    setErrors((x) => ({ ...x, photos: undefined }));
    setPhotos((p) => [...p, ...chosen]);
  };

  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = t('validation.name');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) err.email = t('validation.email');
    if (form.description.trim().length < 10) err.description = t('quote.errDescription');
    for (const k of ['widthCm', 'heightCm']) {
      if (form[k] !== '' && !(/^\d+$/.test(form[k]) && Number(form[k]) >= 1 && Number(form[k]) <= 5000)) err[k] = t('quote.errSize');
    }
    if (!form.consent) err.consent = t('contact.errConsent');
    return err;
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = validate();
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    try {
      const data = new FormData();
      Object.entries({ ...form, name: form.name.trim(), email: form.email.trim(), consent: form.consent ? '1' : '', lang }).forEach(([k, v]) => data.append(k, v));
      for (const original of photos) {
        const file = await shrinkImage(original); // photo de téléphone : réduite avant l'envoi
        if (file.size > MAX_SENT_BYTES) throw Object.assign(new Error(t('quote.errPhotosSize')), { field: 'photos' });
        data.append('photos[]', file, file.name);
      }
      setDone(await api.quotes.create(data)); // POST /api/quotes
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(Object.keys(fields).length ? fields : { [error.field ?? 'form']: error.message });
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <section className="section container empty">
        <h1>{t('quote.thanksTitle')}</h1>
        <p>{t('quote.thanksText', { ref: done.reference })}</p>
        <Button to={l('/produits')}>{t('cart.continue')}</Button>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container contact">
        <div>
          <h1>{t('quote.title')}</h1>
          <p>{t('quote.intro')}</p>
          <ul className="quote__steps">
            <li>{t('quote.step1')}</li>
            <li>{t('quote.step2')}</li>
            <li>{t('quote.step3')}</li>
          </ul>
        </div>
        <form onSubmit={submit} noValidate className="auth contact__form">
          <FormField label={t('field.name')} name="name" autoComplete="name" value={form.name} onChange={change} error={errors.name} />
          <FormField label={t('field.email')} name="email" type="email" autoComplete="email" value={form.email} onChange={change} error={errors.email} />
          <FormField label={t('quote.phone')} name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={change} error={errors.phone} />

          <fieldset className="quote__type">
            <legend>{t('quote.projectType')}</legend>
            {['interieur', 'exterieur'].map((v) => (
              <label key={v} className="check">
                <input type="radio" name="projectType" value={v} checked={form.projectType === v} onChange={change} />
                <span>{t(`quote.type.${v}`)}</span>
              </label>
            ))}
          </fieldset>

          <div className="quote__dims">
            <FormField label={t('quote.width')} name="widthCm" inputMode="numeric" value={form.widthCm} onChange={change} error={errors.widthCm} />
            <FormField label={t('quote.height')} name="heightCm" inputMode="numeric" value={form.heightCm} onChange={change} error={errors.heightCm} />
          </div>
          <FormField label={t('quote.location')} name="location" value={form.location} onChange={change} error={errors.location} />
          <FormField label={t('quote.description')} name="description" as="textarea" rows={6} value={form.description} onChange={change} error={errors.description} />
          <FormField label={t('quote.budget')} name="budget" as="select" value={form.budget} onChange={change} error={errors.budget}>
            <option value="">{t('quote.budgetNone')}</option>
            {BUDGETS.map((b) => <option key={b} value={b}>{t(`quote.budget.${b}`)}</option>)}
          </FormField>
          <FormField label={t('quote.desiredBy')} name="desiredBy" value={form.desiredBy} onChange={change} error={errors.desiredBy} />

          <div className="field">
            <label htmlFor="quote-photos">{t('quote.photos', { max: MAX_PHOTOS })}</label>
            <input id="quote-photos" ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addPhotos}
              disabled={photos.length >= MAX_PHOTOS} aria-describedby="quote-photos-hint" />
            <p id="quote-photos-hint" className="note">{t('quote.photosHint')}</p>
            {photos.length > 0 && (
              <ul className="quote__files">
                {photos.map((f, i) => (
                  <li key={`${f.name}-${i}`}>
                    <span>{f.name}</span>
                    <button type="button" className="link-btn" onClick={() => setPhotos((p) => p.filter((_, k) => k !== i))}>{t('cart.remove')}</button>
                  </li>
                ))}
              </ul>
            )}
            {errors.photos && <p className="field__error" role="alert">{errors.photos}</p>}
          </div>

          {/* Champ piège à robots : invisible pour les personnes, il doit rester vide */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
            <label>{t('contact.honeypot')}<input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={change} /></label>
          </div>

          <label className="check">
            <input type="checkbox" name="consent" checked={form.consent} onChange={change} />
            <span>{t('quote.consent', {}, [(c) => <Link to={l('/politique-de-confidentialite')}>{c}</Link>])}</span>
          </label>
          {errors.consent && <p className="field__error" role="alert">{errors.consent}</p>}
          <p className="note">{t('quote.note')}</p>
          {errors.form && <p className="notice notice--error" role="alert">{errors.form}</p>}
          <Button type="submit" loading={busy}>{busy ? t('sending') : t('quote.send')}</Button>
        </form>
      </div>
    </section>
  );
}
