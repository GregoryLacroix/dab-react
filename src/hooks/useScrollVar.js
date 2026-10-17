import { useEffect, useRef } from 'react';

/**
 * Écrit la variable CSS --p (0 → 1) sur l'élément selon le scroll.
 *  - 'pinned' : section haute avec un contenu "sticky" (progression pendant l'épinglage)
 *  - 'pass'   : de l'entrée à la sortie de l'élément dans l'écran
 *  - 'leave'  : de 0 (haut de page) à 1 (élément entièrement sorti)
 * Le CSS fait ensuite tout le travail avec calc(var(--p) * …).
 * onUpdate(p) (facultatif) : appelé à chaque mise à jour, pour animer ce que le CSS ne sait pas faire (dégradés SVG).
 */
export default function useScrollVar(ref, mode = 'pass', onUpdate) {
  const callback = useRef(onUpdate);
  callback.current = onUpdate;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--p', mode === 'leave' ? 0 : 1);
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      let p;
      if (mode === 'pinned') p = -r.top / (r.height - vh);
      else if (mode === 'leave') p = -r.top / r.height;
      else p = (vh - r.top) / (r.height + vh);
      const value = Math.min(1, Math.max(0, p));
      el.style.setProperty('--p', value.toFixed(4));
      callback.current?.(value);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [ref, mode]);
}
