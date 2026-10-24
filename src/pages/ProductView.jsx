import { useParams, Link } from 'react-router-dom';
import Carousel from '../components/ui/Carousel.jsx';
import Button from '../components/ui/Button.jsx';
import { soldOut } from '../services/stock.js';
import { ProductViewSkeleton } from '../components/ui/Loaders.jsx';
import { NotFoundView, ServerErrorView } from '../components/ui/ErrorPages.jsx';
import { api } from '../services/api.js';
import useSeo, { SITE_URL, absoluteUrl } from '../services/seo.js';
import useQuery from '../services/useQuery.js';
import { cover } from '../store/store.js';
import { useCart } from '../context/CartContext.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';

export default function ProductView() {
  const { id } = useParams();
  const { t, l, loc, money } = useI18n();
  const { add } = useCart();
  const { data: raw, error, loading, reload } = useQuery(() => api.products.get(id), [id]);
  const product = raw ? loc(raw) : raw; // textes traduits si l'API les fournit
  const photos = (product?.images ?? []).filter((i) => i.src).map((i) => absoluteUrl(i.src));
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
          image: photos.length ? photos : undefined, brand: { '@type': 'Brand', name: 'Les galets d’Ambre' },
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
          {soldOut(product)
            ? <>
                <p className="notice" role="status"><strong>{t('product.soldOut')}</strong> — {t('product.soldOutText')}</p>
                <Button to={l('/produits')} variant="ghost">{t('cart.seeShop')}</Button>
              </>
            : <Button onClick={() => add(raw)}>{t('product.add')}</Button>}
        </div>
      </div>
    </section>
  );
}
