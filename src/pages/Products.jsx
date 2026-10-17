import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ui/ProductCard.jsx';
import Reveal from '../components/effects/Reveal.jsx';
import Button from '../components/ui/Button.jsx';
import { ProductSkeleton, Spinner } from '../components/ui/Loaders.jsx';
import { ServerErrorView } from '../components/ui/ErrorPages.jsx';
import { api } from '../services/api.js';
import useSeo from '../services/seo.js';
import { useCategories } from '../store/store.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

const PAGE = 6; // produits demandés à l'API à chaque lot (scroll infini)

export default function Products() {
  const { t } = useI18n();
  const categories = useCategories();
  const [params] = useSearchParams();
  const wanted = params.get('categorie') ?? params.get('category') ?? 'tous'; // /produits?categorie=fresques (en anglais : /en/shop?category=fresques)
  const [cat, setCat] = useState(wanted);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [status, setStatus] = useState({ loading: true, error: null });
  const [tick, setTick] = useState(0); // pour « Réessayer »
  const sentinel = useRef(null);
  const catName = categories.find((c) => c.id === cat)?.name;
  useSeo({
    title: catName ? t('shop.seo.title.cat', { name: catName, nameLower: catName.toLowerCase() }) : t('shop.seo.title.all'),
    description: catName ? t('shop.seo.desc.cat', { name: catName, nameLower: catName.toLowerCase() }) : t('shop.seo.desc.all'),
    path: cat === 'tous' ? '/produits' : `/produits?categorie=${cat}`,
  });

  const reset = (id) => { setCat(id); setPage(1); setItems([]); setMeta(null); };
  useEffect(() => { reset(wanted); }, [wanted]);

  // Charge une page de produits ; les suivantes s'ajoutent à la liste
  useEffect(() => {
    let alive = true;
    setStatus({ loading: true, error: null });
    api.products.list({ category: cat === 'tous' ? undefined : cat, page, perPage: PAGE }).then(
      (res) => {
        if (!alive) return;
        setItems((prev) => (page === 1 ? res.data : [...prev, ...res.data]));
        setMeta(res.meta);
        setStatus({ loading: false, error: null });
      },
      (error) => { if (alive) setStatus({ loading: false, error }); }
    );
    return () => { alive = false; };
  }, [cat, page, tick]);

  const hasMore = meta !== null && page < meta.pageCount;

  // Scroll infini : quand la sentinelle approche de l'écran, on demande la page suivante
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || status.loading) return undefined;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setPage((p) => p + 1); },
      { rootMargin: '300px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, status.loading, items.length]);

  return (
    <section className="section">
      <div className="container">
        <h1>{t('shop.title')}</h1>
        <div className="filters" role="group" aria-label={t('shop.filter')}>
          {[{ id: 'tous', name: t('shop.all') }, ...categories].map((c) => (
            <button key={c.id} className={`chip ${cat === c.id ? 'is-active' : ''}`}
              aria-pressed={cat === c.id} onClick={() => reset(c.id)}>{c.name}</button>
          ))}
        </div>

        {status.error && items.length === 0 && <ServerErrorView error={status.error} onRetry={() => setTick((n) => n + 1)} compact />}
        {status.error && items.length > 0 && (
          <p className="notice notice--error" role="alert">
            {status.error.message} <button type="button" className="link-btn" onClick={() => setTick((n) => n + 1)}>{t('retry')}</button>
          </p>
        )}
        {!status.loading && !status.error && items.length === 0 && <p className="note">{t('shop.empty')}</p>}

        <div className="product-grid" aria-busy={status.loading}>
          {items.map((p, i) => (
            <Reveal key={`${cat}-${p.id}`} delay={(i % 3) * 90}><ProductCard product={p} /></Reveal>
          ))}
          {status.loading && <ProductSkeleton count={items.length === 0 ? PAGE : 3} />}
        </div>

        <div className="infinite" ref={sentinel}>
          {status.loading && items.length > 0 && <p className="note" role="status"><Spinner size="inline" />{t('shop.loadingMore')}</p>}
          {status.loading && items.length === 0 && <span className="sr-only" role="status">{t('loading.products')}</span>}
          {!status.loading && meta && items.length > 0 && (
            <p className="note" role="status">
              {hasMore ? t('shop.progress', { shown: items.length, total: meta.total }) : t('shop.done', { count: meta.total })}
            </p>
          )}
          {hasMore && !status.loading && <Button variant="ghost" onClick={() => setPage((p) => p + 1)}>{t('shop.more')}</Button>}
        </div>
      </div>
    </section>
  );
}
