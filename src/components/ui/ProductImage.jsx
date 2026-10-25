// Photos téléversées via l'API : /uploads/<32 caractères>.webp, accompagnées de -480, -800 et -1200 (voir ImageOptimizer côté API).
// Le navigateur choisit la plus légère adaptée à l'écran. Les autres adresses (photos d'exemple, liens externes) restent telles quelles.
const OPTIMIZED = /^(.*\/uploads\/[a-f0-9]{32})\.(webp|jpg)$/;
const WIDTHS = [480, 800, 1200];
export const srcSetFor = (src) => {
  const m = typeof src === 'string' ? src.match(OPTIMIZED) : null;
  return m ? [...WIDTHS.map((w) => `${m[1]}-${w}.${m[2]} ${w}w`), `${src} 1600w`].join(', ') : undefined;
};

// Affiche une vraie photo (src) ou, à défaut, un dégradé provisoire (tone).
// priority : première image visible de la page (chargée tout de suite, pour un affichage rapide).
// sizes : largeur occupée à l'écran (aide le navigateur à choisir la bonne version).
export default function ProductImage({ tone, src, label, priority = false, sizes = '(min-width: 900px) 33vw, 92vw' }) {
  const set = srcSetFor(src);
  return src
    ? <img className="pimg" src={src} {...(set ? { srcSet: set, sizes } : {})} alt={label} loading={priority ? 'eager' : 'lazy'} decoding="async" {...(priority ? { fetchpriority: 'high' } : {})} />
    : <div className={`pimg pimg--${tone}`} role="img" aria-label={label} />;
}
