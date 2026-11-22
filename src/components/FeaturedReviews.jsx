import { Link } from 'react-router-dom';
import Reveal from './effects/Reveal.jsx';
import { Stars } from './ProductReviews.jsx';
import { api } from '../services/api.js';
import useQuery from '../services/useQuery.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

// Accueil : les derniers avis 4 étoiles et plus (publiés), avec la note moyenne de la boutique. Rien n'est affiché tant qu'il n'y en a pas.
export default function FeaturedReviews() {
  const { t, l, lang } = useI18n();
  const { data } = useQuery(() => api.reviews.featured(), []);
  const items = (data?.data ?? []).slice(0, 3);
  if (items.length === 0) return null;
  const s = data.summary;

  return (
    <section className="section featured" aria-labelledby="featured-title">
      <div className="container">
        <Reveal as="h2" id="featured-title">{t('featured.title')}</Reveal>
        {s?.count > 0 && (
          <p className="featured__summary">
            <Stars value={s.average} label={t('reviews.averageLabel', { avg: s.average, count: s.count })} />
            <span>{t('featured.summary', { avg: s.average.toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR'), count: s.count })}</span>
          </p>
        )}
        <ul className="featured__grid">
          {items.map((r, i) => (
            <Reveal as="li" key={r.id} delay={i * 120} className="featured__card">
              <Stars value={r.rating} label={t('reviews.ratingLabel', { n: r.rating })} />
              {r.title && <h3>{r.title}</h3>}
              <blockquote>{r.body}</blockquote>
              <footer>
                <strong>{r.author}</strong> · {t('reviews.verified')}
                <br />
                <Link to={l(`/produits/${r.productId}`)}>{t('featured.about', { name: (lang === 'en' && r.productNameEn) || r.productName })}</Link>
              </footer>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
