import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Button from '../components/ui/Button.jsx';
import ProductImage, { srcSetFor } from '../components/ui/ProductImage.jsx';
import { PageLoader } from '../components/ui/Loaders.jsx';
import { api } from '../services/api.js';
import useQuery from '../services/useQuery.js';
import useSeo from '../services/seo.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

// Galerie de réalisations : /realisations (anglais : /en/gallery). Filtre par catégorie, visionneuse plein écran avec « avant / après ».
export default function Gallery() {
  const { t, l, lang, date } = useI18n();
  const { data, error, loading, reload } = useQuery(() => api.realisations.list(), []);
  const [tag, setTag] = useState('');
  const [open, setOpen] = useState(null); // réalisation ouverte
  useSeo({ title: t('gallery.seoTitle'), description: t('gallery.seoDesc'), path: '/realisations' });

  const pick = (r, fr, en) => (lang === 'en' && r[en] ? r[en] : r[fr]);
  const works = data?.data ?? [];
  const tags = useMemo(() => [...new Set(works.map((r) => pick(r, 'tag', 'tagEn')).filter(Boolean))], [works, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = tag ? works.filter((r) => pick(r, 'tag', 'tagEn') === tag) : works;

  if (loading && !data) return <PageLoader label={t('loading')} />;

  return (
    <section className="section">
      <div className="container">
        <h1>{t('gallery.title')}</h1>
        <p className="lead">{t('gallery.intro')}</p>
        {error && <p className="notice notice--error" role="alert">{error.message} <button className="link-btn" onClick={reload}>{t('retry')}</button></p>}
        {tags.length > 1 && (
          <div className="gallery__filters" role="group" aria-label={t('gallery.title')}>
            <button type="button" aria-pressed={tag === ''} onClick={() => setTag('')}>{t('gallery.all')}</button>
            {tags.map((x) => <button key={x} type="button" aria-pressed={tag === x} onClick={() => setTag(x)}>{x}</button>)}
          </div>
        )}
        {!error && works.length === 0 && <p>{t('gallery.empty')}</p>}
        <ul className="gallery__grid">
          {shown.map((r) => {
            const title = pick(r, 'title', 'titleEn');
            return (
              <li key={r.id} className="gallery__card">
                <button type="button" className="gallery__open" aria-label={t('gallery.open', { title })} onClick={() => setOpen(r)}>
                  <span className="gallery__img">
                    <ProductImage src={r.images[0]} label={title} tone="sea" sizes="(min-width: 900px) 33vw, 92vw" />
                    {r.images.length > 1 && <span className="gallery__count">{t('gallery.photos', { count: r.images.length })}</span>}
                  </span>
                  <span className="gallery__title">{title}</span>
                  <span className="gallery__meta">{[r.location, r.completedAt && date(r.completedAt)].filter(Boolean).join(' · ')}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="gallery__cta">
          <h2>{t('gallery.ctaTitle')}</h2>
          <p>{t('gallery.ctaText')}</p>
          <Button to={l('/devis')}>{t('gallery.ctaButton')}</Button>
        </div>
      </div>
      {open && <Viewer work={open} title={pick(open, 'title', 'titleEn')} text={pick(open, 'description', 'descriptionEn')} onClose={() => setOpen(null)} />}
    </section>
  );
}

function Viewer({ work, title, text, onClose }) {
  const { t } = useI18n();
  const [i, setI] = useState(0);
  const closeBtn = useRef(null);
  const n = work.images.length;
  const go = (d) => setI((x) => (x + d + n) % n);
  // « Avant / après » : la photo d'avant s'affiche à côté de la première photo
  const compare = work.beforeImage && i === 0;

  useEffect(() => {
    const prev = document.activeElement;
    closeBtn.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && n > 1) go(1);
      else if (e.key === 'ArrowLeft' && n > 1) go(-1);
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; prev?.focus?.(); };
  }, [n]); // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <div className="gallery__viewer" role="dialog" aria-modal="true" aria-label={title}>
      <div className="gallery__viewer-top">
        <div>
          <h2>{title}</h2>
          {(work.location || text) && <p>{[work.location, text].filter(Boolean).join(' — ')}</p>}
        </div>
        <button ref={closeBtn} type="button" className="gallery__close" onClick={onClose}>{t('gallery.close')}</button>
      </div>
      <div className="gallery__stage">
        {compare ? (
          <div className="gallery__compare">
            <figure><img src={work.beforeImage} alt={`${title} – ${t('gallery.before')}`} /><figcaption>{t('gallery.before')}</figcaption></figure>
            <figure><img src={work.images[0]} srcSet={srcSetFor(work.images[0])} sizes="50vw" alt={`${title} – ${t('gallery.after')}`} /><figcaption>{t('gallery.after')}</figcaption></figure>
          </div>
        ) : (
          <img src={work.images[i]} srcSet={srcSetFor(work.images[i])} sizes="100vw" alt={`${title} (${i + 1}/${n})`} />
        )}
        {n > 1 && <button type="button" className="gallery__nav gallery__nav--prev" aria-label={t('gallery.prev')} onClick={() => go(-1)}>‹</button>}
        {n > 1 && <button type="button" className="gallery__nav gallery__nav--next" aria-label={t('gallery.next')} onClick={() => go(1)}>›</button>}
      </div>
      {n > 1 && (
        <div className="gallery__thumbs">
          {work.images.map((src, k) => (
            <button key={src} type="button" aria-current={k === i} aria-label={`${k + 1}/${n}`} onClick={() => setI(k)}><img src={src} alt="" loading="lazy" /></button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
