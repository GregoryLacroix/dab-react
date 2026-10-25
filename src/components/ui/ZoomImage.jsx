import { useRef } from 'react';
import ProductImage from './ProductImage.jsx';
import { useI18n } from '../../i18n/I18nProvider.jsx';
import { useContent } from '../../store/store.js';
import { zoomSettings } from '../../services/defaultContent.js';

// Image principale d'une fiche produit : une loupe suit la souris (ordinateur), un clic / une touche ouvre l'agrandissement plein écran.
// Les images provisoires (dégradés, sans photo) n'ont rien à agrandir : elles s'affichent normalement.
export default function ZoomImage({ image, label, priority, sizes, onOpen }) {
  const { t } = useI18n();
  const zoom = zoomSettings(useContent().zoom); // réglages du back-office : loupe active ? grossissement ?
  const box = useRef(null);
  if (!image.src) return <ProductImage tone={image.tone} label={label} priority={priority} sizes={sizes} />;

  // La loupe n'apparaît qu'à la souris : au doigt, un appui ouvre directement l'agrandissement
  const follow = (e) => {
    if (e.pointerType !== 'mouse' || !zoom.lens) return;
    const el = box.current;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--x', `${e.clientX - r.left}px`);
    el.style.setProperty('--y', `${e.clientY - r.top}px`);
    el.style.setProperty('--w', `${r.width}px`);
    el.style.setProperty('--h', `${r.height}px`);
    el.classList.add('is-zooming');
  };
  const stop = () => box.current?.classList.remove('is-zooming');

  return (
    <button type="button" ref={box} className="zoom" onPointerEnter={follow} onPointerMove={follow} onPointerLeave={stop}
      onClick={onOpen} aria-label={`${t('zoom.open')} : ${label}`} style={{ '--zoom': zoom.lensLevel }}>
      <ProductImage tone={image.tone} src={image.src} label="" priority={priority} sizes={sizes} />
      {zoom.lens && <span className="zoom__lens" aria-hidden="true"><img src={image.src} alt="" /></span>}
      <span className="zoom__hint" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5M11 8v6M8 11h6" />
        </svg>
      </span>
    </button>
  );
}
