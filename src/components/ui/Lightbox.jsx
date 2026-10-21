import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../i18n/I18nProvider.jsx';
import { useContent } from '../../store/store.js';
import { zoomSettings } from '../../services/defaultContent.js';

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

// Agrandissement plein écran : clic (ou bouton +/−) pour zoomer ; à la souris, le déplacement fait défiler l'image ;
// au doigt, on la fait glisser. Échap ferme, ← → changent de photo, le focus reste dans la fenêtre.
export default function Lightbox({ images, index, onIndex, onClose, label }) {
  const { t } = useI18n();
  const { fullLevel } = zoomSettings(useContent().zoom); // grossissement choisi dans le back-office
  const [zoomed, setZoomed] = useState(false);
  const dialog = useRef(null);
  const scroller = useRef(null);
  const closeBtn = useRef(null);

  const usable = images.map((im, i) => (im.src ? i : -1)).filter((i) => i >= 0); // photos réelles seulement
  const pos = usable.indexOf(index);
  const image = images[index];
  const many = usable.length > 1;
  const step = (d) => {
    if (!many) return;
    setZoomed(false);
    onIndex(usable[(pos + d + usable.length) % usable.length]);
  };

  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // la page derrière ne défile plus
    closeBtn.current?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus?.(); };
  }, []);

  // Une fois zoomée, l'image démarre centrée
  useEffect(() => {
    const el = scroller.current;
    if (zoomed && el) {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
      el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
    }
  }, [zoomed, index]);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'Tab') { // le focus ne sort pas de la fenêtre
      const f = dialog.current.querySelectorAll('button');
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
    e.stopPropagation(); // le carrousel derrière ne réagit pas à ces touches
  };

  const pan = (e) => {
    if (!zoomed || e.pointerType !== 'mouse') return;
    const el = scroller.current;
    const r = el.getBoundingClientRect();
    el.scrollLeft = ((e.clientX - r.left) / r.width) * (el.scrollWidth - el.clientWidth);
    el.scrollTop = ((e.clientY - r.top) / r.height) * (el.scrollHeight - el.clientHeight);
  };

  return createPortal(
    <div className="lightbox" ref={dialog} role="dialog" aria-modal="true" aria-label={t('zoom.dialog')}
      onKeyDown={onKeyDown} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lightbox__bar">
        {many && <span className="lightbox__count" aria-live="polite">{pos + 1} / {usable.length}</span>}
        <button type="button" className="lightbox__btn" onClick={() => setZoomed((z) => !z)} aria-pressed={zoomed}
          aria-label={zoomed ? t('zoom.out') : t('zoom.in')}>
          <Icon d={zoomed ? 'M5 12h14' : 'M12 5v14M5 12h14'} />
        </button>
        <button type="button" className="lightbox__btn" ref={closeBtn} onClick={onClose} aria-label={t('zoom.close')}><Icon d="M6 6l12 12M18 6L6 18" /></button>
      </div>
      <div className={`lightbox__stage ${zoomed ? 'is-zoomed' : ''}`} ref={scroller} onPointerMove={pan} style={{ '--full': `${fullLevel * 100}%` }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <img src={image.src} alt={image.alt || label} onClick={() => setZoomed((z) => !z)} draggable="false" />
      </div>
      {many && (
        <>
          <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={() => step(-1)} aria-label={t('carousel.prev')}><Icon d="M15 5l-7 7 7 7" /></button>
          <button type="button" className="lightbox__nav lightbox__nav--next" onClick={() => step(1)} aria-label={t('carousel.next')}><Icon d="M9 5l7 7-7 7" /></button>
        </>
      )}
    </div>,
    document.body,
  );
}
