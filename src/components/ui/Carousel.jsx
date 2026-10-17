import { useCallback, useEffect, useRef, useState } from 'react';
import ProductImage from './ProductImage.jsx';
import { useI18n } from '../../i18n/I18nProvider.jsx';

const Chevron = ({ dir }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
  </svg>
);

// Carrousel : défilement tactile (scroll-snap), flèches, clavier (← →), vignettes.
export default function Carousel({ images, label }) {
  const { t } = useI18n();
  const track = useRef(null);
  const [index, setIndex] = useState(0);
  const count = images.length;

  const goTo = useCallback((i) => {
    const el = track.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: ((i + count) % count) * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
  }, [count]);

  // L'index actif suit la position réelle du défilement (flèches, doigt, molette…)
  useEffect(() => {
    const el = track.current;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setIndex(Math.round(el.scrollLeft / el.clientWidth)));
    };
    el.addEventListener('scroll', on, { passive: true });
    return () => {
      el.removeEventListener('scroll', on);
      cancelAnimationFrame(raf);
    };
  }, []);

  const onKey = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
  };

  return (
    <div className="carousel" role="region" aria-roledescription={t('carousel.role')} aria-label={label} tabIndex={0} onKeyDown={onKey}>
      <div className="carousel__viewport">
        <div className="carousel__track" ref={track}>
          {images.map((img, i) => (
            <div className="carousel__slide" key={i} role="group" aria-roledescription={t('slide.role')} aria-label={t('slide.of', { n: i + 1, count })}>
              <ProductImage tone={img.tone} src={img.src} label={img.alt || label} priority={i === 0} />
            </div>
          ))}
        </div>
        {count > 1 && (
          <>
            <button type="button" className="carousel__nav carousel__nav--prev" onClick={() => goTo(index - 1)} aria-label={t('carousel.prev')}><Chevron dir="left" /></button>
            <button type="button" className="carousel__nav carousel__nav--next" onClick={() => goTo(index + 1)} aria-label={t('carousel.next')}><Chevron dir="right" /></button>
            <span className="carousel__count" aria-live="polite">{index + 1} / {count}</span>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="carousel__thumbs">
          {images.map((img, i) => (
            <button type="button" key={i} className={`carousel__thumb ${i === index ? 'is-active' : ''}`}
              onClick={() => goTo(i)} aria-label={t('carousel.thumb', { n: i + 1 })} aria-current={i === index}>
              <ProductImage tone={img.tone} src={img.src} label="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
