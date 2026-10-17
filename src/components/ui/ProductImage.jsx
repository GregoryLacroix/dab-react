// Affiche une vraie photo (src) ou, à défaut, un dégradé provisoire (tone).
// priority : première image visible de la page (chargée tout de suite, pour un affichage rapide).
export default function ProductImage({ tone, src, label, priority = false }) {
  return src
    ? <img className="pimg" src={src} alt={label} loading={priority ? 'eager' : 'lazy'} decoding="async" {...(priority ? { fetchpriority: 'high' } : {})} />
    : <div className={`pimg pimg--${tone}`} role="img" aria-label={label} />;
}
