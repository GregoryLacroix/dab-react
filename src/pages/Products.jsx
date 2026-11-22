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
  const [qInput, setQInput] = useState(params.get('q') ?? '');   // champ de recherche (saisie)
  const [q, setQ] = useState(params.get('q') ?? '');             // valeur envoyée à l'API (après une courte pause de frappe)
  const [sort, setSort] = useState('');
  const [available, setAvailable] = useState(false);
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

  const restart = () => { setPage(1); setItems([]); setMeta(null); };
  const reset = (id) => { setCat(id); restart(); };
  const filtered = q !== '' || sort !== '' || available;
  // La recherche part 350 ms après la dernière frappe
  useEffect(() => {
    const v = qInput.trim();
    if (v === q) return undefined;
    const id = setTimeout(() => { setQ(v); restart(); }, 350);
    return () => clearTimeout(id);
  }, [qInput]); // eslint-disable-line react-hooks/exhaustive-deps
  const clearFilters = () => { setQInput(''); setQ(''); setSort(''); setAvailable(false); restart(); };
  useEffect(() => { reset(wanted); }, [wanted]);

  // Charge une page de produits ; les suivantes s'ajoutent à la liste
  useEffect(() => {
    let alive = true;
    setStatus({ loading: true, error: null });
    api.products.list({ category: cat === 'tous' ? undefined : cat, q: q || undefined, sort: sort || undefined, available: available ? 1 : undefined, page, perPage: PAGE }).then(
      (res) => {
        if (!alive) return;
        setItems((prev) => (page === 1 ? res.data : [...prev, ...res.data]));
        setMeta(res.meta);
        setStatus({ loading: false, error: null });
      },
      (error) => { if (alive) setStatus({ loading: false, error }); }
    );
    return () => { alive = false; };
  }, [cat, q, sort, available, page, tick]);

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

        <div className="shop-tools">
          <label className="shop-tools__search">
            <span className="sr-only">{t('shop.search')}</span>
            <input type="search" value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder={t('shop.search')} maxLength={80} autoComplete="off" />
          </label>
          <label className="shop-tools__sort">
            <span>{t('shop.sort')}</span>
            <select value={sort} onChange={(e) => { setSort(e.target.value); restart(); }}>
              <option value="">{t('shop.sort.default')}</option>
              <option value="new">{t('shop.sort.new')}</option>
              <option value="price_asc">{t('shop.sort.priceAsc')}</option>
              <option value="price_desc">{t('shop.sort.priceDesc')}</option>
            </select>
          </label>
          <label className="shop-tools__avail">
            <input type="checkbox" checked={available} onChange={(e) => { setAvailable(e.target.checked); restart(); }} />
            {t('shop.available')}
          </label>
        </div>

        {status.error && items.length === 0 && <ServerErrorView error={status.error} onRetry={() => setTick((n) => n + 1)} compact />}
        {status.error && items.length > 0 && (
          <p className="notice notice--error" role="alert">
            {status.error.message} <button type="button" className="link-btn" onClick={() => setTick((n) => n + 1)}>{t('retry')}</button>
          </p>
        )}
        {!status.loading && !status.error && items.length === 0 && (
          <p className="note" role="status">
            {filtered ? t('shop.noResults') : t('shop.empty')}{' '}
            {filtered && <button type="button" className="link-btn" onClick={clearFilters}>{t('shop.resetFilters')}</button>}
          </p>
        )}

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
