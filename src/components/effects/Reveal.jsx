import { useEffect, useRef, useState } from 'react';

// Apparition douce quand l'élément entre dans l'écran. delay en millisecondes (effet d'escalier).
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${seen ? 'is-in' : ''} ${className}`} style={{ '--d': delay }} {...rest}>
      {children}
    </Tag>
  );
}
