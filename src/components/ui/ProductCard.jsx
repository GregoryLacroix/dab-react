import { useRef } from 'react';
import { Link } from 'react-router-dom';
import ProductImage from './ProductImage.jsx';
import Button from './Button.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { cover } from '../../store/store.js';
import { useI18n } from '../../i18n/I18nProvider.jsx';

export default function ProductCard({ product: raw }) {
  const { t, l, loc, money } = useI18n();
  const product = loc(raw); // nom traduit si l'API le fournit
  const { add } = useCart();
  const ref = useRef(null);
  const img = cover(product);

  // Inclinaison 3D qui suit la souris (souris uniquement, pas au toucher)
  const move = (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
    ref.current.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`);
  };
  const leave = () => {
    ref.current.style.setProperty('--rx', '0deg');
    ref.current.style.setProperty('--ry', '0deg');
  };

  return (
    <article className="pcard" ref={ref} onPointerMove={move} onPointerLeave={leave}>
      <Link to={l(`/produits/${product.id}`)} className="pcard__media">
        <ProductImage tone={img.tone} src={img.src} label={product.name} />
      </Link>
      <div className="pcard__body">
        <h3><Link to={l(`/produits/${product.id}`)}>{product.name}</Link></h3>
        <p className="price">{money(product.price)}</p>
        <Button variant="ghost" onClick={() => add(raw)}>{t('product.add')}</Button>
      </div>
    </article>
  );
}
