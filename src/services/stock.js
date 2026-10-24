// Pièces uniques : un produit dont le stock est à 0 est « vendu ». `stock` absent (ancienne API) = disponible.
export const soldOut = (product) => Number.isInteger(product?.stock) && product.stock <= 0;
/** Quantité maximale commandable : le stock restant (99 au plus) */
export const maxQty = (product) => (Number.isInteger(product?.stock) ? Math.max(1, Math.min(99, product.stock)) : 99);
