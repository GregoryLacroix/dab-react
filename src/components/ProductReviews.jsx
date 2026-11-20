import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from './ui/Button.jsx';
import { api, fieldErrors } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';

export function Stars({ value, label }) {
  const full = Math.round(value);
  return (
    <span className="stars" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => <span key={n} className={n <= full ? 'is-on' : ''} aria-hidden="true">★</span>)}
    </span>
  );
}

// Avis clients d'un produit : note moyenne, liste (publiés seulement) et formulaire réservé aux acheteurs connectés.
// `first` = première page déjà chargée par la fiche produit : { data, meta, summary }.
export default function ProductReviews({ productId, first, onChanged }) {
  const { t, l, date, lang } = useI18n();
  const { user } = useAuth();
  const [items, setItems] = useState(first?.data ?? []);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [mine, setMine] = useState(null); // { eligible, reason, review } (connecté seulement)

  useEffect(() => { setItems(first?.data ?? []); setPage(1); }, [first]);
  const loadMine = () => api.reviews.mine(productId).then(setMine, () => setMine(null));
  useEffect(() => { if (user) loadMine(); else setMine(null); }, [user?.id, productId]); // eslint-disable-line react-hooks/exhaustive-deps

  const summary = first?.summary;
  const pageCount = first?.meta?.pageCount ?? 1;
  const loadMore = async () => {
    setMore(true);
    try {
      const res = await api.reviews.list(productId, { page: page + 1 });
      setItems((cur) => [...cur, ...res.data]);
      setPage(page + 1);
    } catch { /* la liste actuelle reste affichée */ } finally { setMore(false); }
  };

  return (
    <section className="reviews" aria-labelledby="reviews-title">
      <h2 id="reviews-title">{t('reviews.title')}</h2>

      {summary?.count > 0 ? (
        <div className="reviews__summary">
          <p className="reviews__avg">
            <strong>{summary.average.toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR')}</strong>
            <span>/ 5</span>
          </p>
          <div>
            <Stars value={summary.average} label={t('reviews.averageLabel', { avg: summary.average, count: summary.count })} />
            <p className="reviews__count">{t('reviews.count', { count: summary.count })}</p>
          </div>
          <ul className="reviews__bars" aria-hidden="true">
            {[5, 4, 3, 2, 1].map((n) => (
              <li key={n}><span>{n} ★</span><i><b style={{ width: `${Math.round((summary.distribution[n] / summary.count) * 100)}%` }} /></i><span>{summary.distribution[n]}</span></li>
            ))}
          </ul>
        </div>
      ) : <p className="reviews__empty">{t('reviews.none')}</p>}

      <ReviewForm productId={productId} user={user} mine={mine} loginTo={l('/connexion')}
        onDone={() => { loadMine(); onChanged?.(); }} />

      <ul className="reviews__list">
        {items.map((r) => (
          <li key={r.id}>
            <div className="reviews__head">
              <Stars value={r.rating} label={t('reviews.ratingLabel', { n: r.rating })} />
              <strong>{r.author}</strong>
              <span className="reviews__meta">{t('reviews.verified')} · {date(r.createdAt)}</span>
            </div>
            {r.title && <h3>{r.title}</h3>}
            <p className="reviews__body">{r.body}</p>
            {r.reply && <p className="reviews__reply"><strong>{t('reviews.reply')}</strong> {r.reply}</p>}
          </li>
        ))}
      </ul>
      {page < pageCount && <Button variant="ghost" onClick={loadMore} loading={more}>{t('reviews.more')}</Button>}
    </section>
  );
}

function ReviewForm({ productId, user, mine, loginTo, onDone }) {
  const { t } = useI18n();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user) return <p className="notice">{t('reviews.loginToReview', {}, [(c) => <Link to={loginTo}>{c}</Link>])}</p>;
  if (!mine) return null;
  if (sent) return <p className="notice" role="status">{t('reviews.thanks')}</p>;
  if (mine.reason === 'already') {
    const s = mine.review?.status;
    return <p className="notice" role="status">{s === 'approved' ? t('reviews.alreadyApproved') : s === 'rejected' ? t('reviews.alreadyRejected') : t('reviews.alreadyPending')}</p>;
  }
  if (!mine.eligible) return <p className="notice">{t('reviews.buyersOnly')}</p>;

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (!(rating >= 1)) err.rating = t('reviews.errRating');
    if (body.trim().length < 10) err.body = t('reviews.errBody');
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    try {
      await api.reviews.create(productId, { rating, title: title.trim(), body: body.trim() }); // POST /api/products/{id}/reviews
      setSent(true);
      onDone();
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(Object.keys(fields).length ? fields : { form: error.message });
    } finally { setBusy(false); }
  };

  return (
    <form className="reviews__form" onSubmit={submit} noValidate>
      <h3>{t('reviews.formTitle')}</h3>
      <fieldset className="rating-input">
        <legend>{t('reviews.yourRating')}</legend>
        <div>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={n <= rating ? 'is-on' : ''}>
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} />
              <span aria-hidden="true">★</span><span className="sr-only">{t('reviews.ratingLabel', { n })}</span>
            </label>
          ))}
        </div>
        {errors.rating && <p className="field__error" role="alert">{errors.rating}</p>}
      </fieldset>
      <div className="field">
        <label htmlFor="rv-title">{t('reviews.titleLabel')}</label>
        <input id="rv-title" maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="rv-body">{t('reviews.bodyLabel')}</label>
        <textarea id="rv-body" rows={5} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} aria-invalid={!!errors.body} />
        {errors.body && <p className="field__error" role="alert">{errors.body}</p>}
      </div>
      {errors.form && <p className="notice notice--error" role="alert">{errors.form}</p>}
      <p className="note">{t('reviews.note')}</p>
      <Button type="submit" loading={busy}>{t('reviews.submit')}</Button>
    </form>
  );
}
