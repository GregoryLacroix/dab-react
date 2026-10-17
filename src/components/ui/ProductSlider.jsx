import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductImage from './ProductImage.jsx';
import Button from './Button.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { cover, useCategories } from '../../store/store.js';
import { useI18n } from '../../i18n/I18nProvider.jsx';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const Arrow = ({ dir }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
  </svg>
);

// Slider plein écran des produits à la une : défilement tactile, flèches, points,
// lecture automatique (en pause au survol / focus, et bouton pause).
export default function ProductSlider({ products, delay = 5 }) { // delay en secondes
  const { t, l, loc, money } = useI18n();
  const track = useRef(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(() => !reduced());
  const [held, setHeld] = useState(false);
  const categories = useCategories();
  const { add } = useCart();
  const count = products.length;

  const goTo = useCallback((i) => {
    const el = track.current;
    el.scrollTo({ left: ((i + count) % count) * el.clientWidth, behavior: reduced() ? 'auto' : 'smooth' });
  }, [count]);

  // L'index actif suit le défilement réel (doigt, flèches, points, lecture auto)
  useEffect(() => {
    const el = track.current;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setIndex(Math.round(el.scrollLeft / el.clientWidth)));
    };
    el.addEventListener('scroll', on, { passive: true });
    return () => { el.removeEventListener('scroll', on); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    if (!playing || held || count < 2) return;
    const id = setInterval(() => { if (!document.hidden) goTo(index + 1); }, delay * 1000);
    return () => clearInterval(id);
  }, [playing, held, index, count, goTo, delay]);

  const catName = (p) => categories.find((c) => c.id === p.categoryId)?.name ?? '';

  return (
    <section className="slider" role="region" aria-roledescription={t('carousel.role')} aria-label={t('slider.label')}
      onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}>
      <div className="slider__track" ref={track}>
        {products.map((raw, i) => {
          const p = loc(raw); // textes traduits si l'API les fournit
          const img = cover(p);
          const tab = i === index ? 0 : -1;
          return (
            <article key={p.id} className="slide" role="group" aria-roledescription={t('slide.role')}
              aria-label={t('slide.of', { n: i + 1, count })} aria-hidden={i !== index}>
              <div className="slide__text">
                {catName(p) && <p className="slide__eyebrow">{catName(p)}</p>}
                <h2 className="slide__title">{p.name}</h2>
                <p className="slide__desc">{p.description}</p>
                <p className="price price--lg">{money(p.price)}</p>
                <div className="hero__actions">
                  <Button to={l(`/produits/${p.id}`)} tabIndex={tab}>{t('product.view')}</Button>
                  <Button variant="ghost" tabIndex={tab} onClick={() => add(raw)}>{t('product.add')}</Button>
                </div>
              </div>
              <Link to={l(`/produits/${p.id}`)} className="slide__media" tabIndex={-1} aria-hidden="true">
                <ProductImage tone={img.tone} src={img.src} label="" priority={i === 0} />
              </Link>
            </article>
          );
        })}
      </div>

      {count > 1 && (
        <div className="slider__controls">
          <button type="button" className="slider__btn" onClick={() => goTo(index - 1)} aria-label={t('slider.prev')}><Arrow dir="left" /></button>
          <div className="slider__dots">
            {products.map((p, i) => (
              <button type="button" key={p.id} className={`slider__dot ${i === index ? 'is-active' : ''}`}
                onClick={() => goTo(i)} aria-label={t('slider.goTo', { n: i + 1 })} aria-current={i === index} />
            ))}
          </div>
          <button type="button" className="slider__btn" onClick={() => goTo(index + 1)} aria-label={t('slider.next')}><Arrow dir="right" /></button>
          <button type="button" className="slider__btn" onClick={() => setPlaying((v) => !v)}
            aria-label={playing ? t('slider.pause') : t('slider.play')}>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              {playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5l11 7-11 7z" />}
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
