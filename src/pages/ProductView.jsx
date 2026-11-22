import { useParams, Link } from 'react-router-dom';
import Carousel from '../components/ui/Carousel.jsx';
import Button from '../components/ui/Button.jsx';
import { soldOut } from '../services/stock.js';
import { ProductViewSkeleton } from '../components/ui/Loaders.jsx';
import { NotFoundView, ServerErrorView } from '../components/ui/ErrorPages.jsx';
import Trust from '../components/ui/Trust.jsx';
import StockAlertForm from '../components/StockAlertForm.jsx';
import ProductReviews from '../components/ProductReviews.jsx';
import { api } from '../services/api.js';
import useSeo, { SITE_URL, absoluteUrl } from '../services/seo.js';
import useQuery from '../services/useQuery.js';
import { cover } from '../store/store.js';
import { useCart } from '../context/CartContext.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';

// Caractéristiques renseignées (taille, largeur, hauteur, épaisseur, poids), formatées selon la langue
export function productSpecs(p, t, lang) {
  const n = (v) => Number(v).toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR', { maximumFractionDigits: 1 });
  const rows = [];
  if (p.sizeLabel) rows.push([t('pview.size'), p.sizeLabel]);
  if (p.heightCm) rows.push([t('pview.height'), `${n(p.heightCm)} cm`]);
  if (p.widthCm) rows.push([t('pview.width'), `${n(p.widthCm)} cm`]);
  if (p.depthCm) rows.push([t('pview.depth'), `${n(p.depthCm)} cm`]);
  if (p.weightG) rows.push([t('pview.weight'), p.weightG >= 1000 ? `${n(p.weightG / 1000)} kg` : `${n(p.weightG)} g`]);
  return rows;
}

export default function ProductView() {
  const { id } = useParams();
  const { t, l, loc, money, lang } = useI18n();
  const { add } = useCart();
  const { data: raw, error, loading, reload } = useQuery(() => api.products.get(id), [id]);
  const product = raw ? loc(raw) : raw; // textes traduits si l'API les fournit
  // Avis publiés (note moyenne pour les moteurs de recherche, liste sous la fiche) : un échec n'empêche pas d'afficher le produit
  const reviewsQ = useQuery(() => api.reviews.list(id), [id]);
  const reviews = reviewsQ.data;
  const photos = (product?.images ?? []).filter((i) => i.src).map((i) => absoluteUrl(i.src));
  const specs = product ? productSpecs(product, t, lang) : [];
  useSeo(product ? {
    title: product.name,
    description: product.description,
    path: `/produits/${product.id}`,
    image: photos[0],
    type: 'product',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Product', name: product.name, description: product.description, sku: String(product.id),
          image: photos.length ? photos : undefined,
          width: product.widthCm ? { '@type': 'QuantitativeValue', value: product.widthCm, unitCode: 'CMT' } : undefined,
          height: product.heightCm ? { '@type': 'QuantitativeValue', value: product.heightCm, unitCode: 'CMT' } : undefined,
          depth: product.depthCm ? { '@type': 'QuantitativeValue', value: product.depthCm, unitCode: 'CMT' } : undefined,
          weight: product.weightG ? { '@type': 'QuantitativeValue', value: product.weightG, unitCode: 'GRM' } : undefined,
          aggregateRating: reviews?.summary?.count > 0 ? { '@type': 'AggregateRating', ratingValue: reviews.summary.average, reviewCount: reviews.summary.count, bestRating: 5, worstRating: 1 } : undefined,
          review: reviews?.data?.slice(0, 5).map((r) => ({ '@type': 'Review', author: { '@type': 'Person', name: r.author }, datePublished: r.createdAt.slice(0, 10), name: r.title || undefined, reviewBody: r.body, reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 } })),
          brand: { '@type': 'Brand', name: 'Les galets d’Ambre' },
          offers: { '@type': 'Offer', url: `${SITE_URL}${l(`/produits/${product.id}`)}`, priceCurrency: 'EUR', price: String(product.price), availability: 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition' } },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('crumb.home'), item: `${SITE_URL}${l('/')}` },
          { '@type': 'ListItem', position: 2, name: t('crumb.shop'), item: `${SITE_URL}${l('/produits')}` },
          { '@type': 'ListItem', position: 3, name: product.name, item: `${SITE_URL}${l(`/produits/${product.id}`)}` },
        ] },
      ],
    },
  } : { title: error?.status === 404 ? t('pview.seoNotFound') : t('pview.seoProduct'), noindex: true });

  if (loading && !product) return <ProductViewSkeleton />;
  if (error || !product) {
    // 404 : produit supprimé, retiré de la vente ou adresse erronée ; sinon l'API ne répond pas correctement
    if (!error || error.status === 404) {
      return <NotFoundView title={t('pview.notFoundTitle')} text={t('pview.notFoundText')} />;
    }
    return <ServerErrorView error={error} onRetry={reload} />;
  }
  const images = product.images?.length ? product.images : [cover(product)];
  return (
    <section className="section">
      <div className="container pview">
        <Carousel key={product.id} images={images} label={t('carousel.photos', { name: product.name })} />
        <div className="pview__info">
          <Link to={l('/produits')} className="back">{t('pview.back')}</Link>
          <h1>{product.name}</h1>
          <p className="price price--lg">{money(product.price)}</p>
          <p>{product.description}</p>
          {specs.length > 0 && (
            <dl className="specs" aria-label={t('pview.specs')}>
              {specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
          )}
          {soldOut(product)
            ? <>
                <p className="notice" role="status"><strong>{t('product.soldOut')}</strong> — {t('product.soldOutText')}</p>
                <StockAlertForm productId={product.id} />
                <Button to={l('/produits')} variant="ghost">{t('cart.seeShop')}</Button>
              </>
            : <><Button onClick={() => add(raw)}>{t('product.add')}</Button><Trust variant="list" /></>}
        </div>
      </div>
      {reviews && (
        <div className="container">
          <ProductReviews productId={product.id} first={reviews} onChanged={reviewsQ.reload} />
        </div>
      )}
    </section>
  );
}
