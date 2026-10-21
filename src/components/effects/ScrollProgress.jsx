import { useEffect, useRef } from 'react';

// Trait de pinceau bleu en haut de page : avance avec la lecture.
export default function ScrollProgress() {
  const bar = useRef(null);
  useEffect(() => {
    const update = () => {
      const h = document.documentElement;
      const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      if (!bar.current) return; // l'élément peut être détaché pendant un changement de page (chargement de /admin)
      bar.current.style.transform = `scaleX(${p})`;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return <div className="progress" aria-hidden="true"><div ref={bar} /></div>;
}
