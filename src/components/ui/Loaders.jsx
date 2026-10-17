import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider.jsx';

// Rond qui tourne. Prend la couleur du texte autour (blanc dans un bouton noir, noir ailleurs).
export const Spinner = ({ size = '', label }) => (
  <span className={`spinner ${size ? `spinner--${size}` : ''}`} role={label ? 'status' : undefined}
    aria-label={label} aria-hidden={label ? undefined : 'true'} />
);

// Chargement d'une page entière
export function PageLoader({ label }) {
  const { t } = useI18n();
  return (
    <div className="page-loader" role="status">
      <Spinner size="lg" />
      <p>{label ?? t('loading')}</p>
    </div>
  );
}

// Cartes "fantômes" des listes de produits (à placer dans <div className="product-grid">)
export function ProductSkeleton({ count = 3 }) {
  return Array.from({ length: count }, (_, i) => (
    <article key={i} className="pcard pcard--skeleton" aria-hidden="true">
      <div className="skeleton skeleton--img" />
      <div className="pcard__body">
        <span className="skeleton skeleton--title" />
        <span className="skeleton skeleton--line skeleton--short" />
        <span className="skeleton skeleton--btn" />
      </div>
    </article>
  ));
}

// Fiche produit en cours de chargement (même disposition que la vraie fiche)
export const ProductViewSkeleton = () => {
  const { t } = useI18n();
  return (
  <section className="section" aria-busy="true">
    <span className="sr-only" role="status">{t('loading.product')}</span>
    <div className="container pview" aria-hidden="true">
      <div className="skeleton skeleton--img skeleton--round" />
      <div className="pview__info pview__skeleton">
        <span className="skeleton skeleton--line skeleton--short" />
        <span className="skeleton skeleton--heading" />
        <span className="skeleton skeleton--title" />
        <span className="skeleton skeleton--line" />
        <span className="skeleton skeleton--line" />
        <span className="skeleton skeleton--line skeleton--short" />
        <span className="skeleton skeleton--btn" />
      </div>
    </div>
  </section>
  );
};

// Slider d'accueil en cours de chargement : réserve la place pour éviter que la page « saute »
export const SliderSkeleton = () => {
  const { t } = useI18n();
  return (
  <section className="slider slider--skeleton" aria-busy="true" aria-label={t('loading.featured')}>
    <div className="slide" aria-hidden="true">
      <div className="slide__text">
        <span className="skeleton skeleton--line skeleton--short" />
        <span className="skeleton skeleton--heading" />
        <span className="skeleton skeleton--line" />
        <span className="skeleton skeleton--line skeleton--short" />
        <span className="skeleton skeleton--btn" />
      </div>
      <div className="slide__media"><div className="skeleton skeleton--fill" /></div>
    </div>
  </section>
  );
};

// Fine barre en haut de l'écran tant qu'une requête vers l'API est en cours (jamais pour les réponses rapides)
export function NetworkBar() {
  const { t } = useI18n();
  const [on, setOn] = useState(false);
  useEffect(() => {
    let timer = 0;
    const update = (e) => {
      clearTimeout(timer);
      if (e.detail > 0) timer = setTimeout(() => setOn(true), 350);
      else setOn(false);
    };
    window.addEventListener('dab:network', update);
    return () => { clearTimeout(timer); window.removeEventListener('dab:network', update); };
  }, []);
  return <div className={`netbar ${on ? 'is-on' : ''}`} role="progressbar" aria-label={t('loading.bar')} aria-hidden={!on} />;
}
