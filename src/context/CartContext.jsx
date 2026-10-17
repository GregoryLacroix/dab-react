import { createContext, useContext, useEffect, useReducer, useMemo } from 'react';

const CartContext = createContext(null);

// Le panier survit à l'aller-retour chez Stripe (et à un rechargement de page) grâce au stockage de SESSION du navigateur :
// il disparaît à la fermeture de l'onglet et ne contient que les produits et quantités. Nécessaire au service demandé : pas de consentement requis.
const KEY = 'dab-cart';
const load = () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY));
    return Array.isArray(saved) ? saved.filter((i) => i && Number.isInteger(i.id) && Number.isInteger(i.qty) && i.qty > 0) : [];
  } catch {
    return [];
  }
};

function reducer(items, action) {
  switch (action.type) {
    case 'add': {
      const found = items.find((i) => i.id === action.product.id);
      return found
        ? items.map((i) => (i.id === found.id ? { ...i, qty: i.qty + 1 } : i))
        : [...items, { ...action.product, qty: 1 }];
    }
    case 'setQty':
      return items.map((i) => (i.id === action.id ? { ...i, qty: Math.max(1, action.qty) } : i));
    case 'remove':
      return items.filter((i) => i.id !== action.id);
    case 'clear':
      return [];
    default:
      return items;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      if (items.length) sessionStorage.setItem(KEY, JSON.stringify(items)); else sessionStorage.removeItem(KEY);
    } catch { /* stockage indisponible (navigation privée stricte) : le panier reste en mémoire */ }
  }, [items]);
  const value = useMemo(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      total: items.reduce((n, i) => n + i.qty * i.price, 0),
      add: (product) => dispatch({ type: 'add', product }),
      setQty: (id, qty) => dispatch({ type: 'setQty', id, qty }),
      remove: (id) => dispatch({ type: 'remove', id }),
      clear: () => dispatch({ type: 'clear' }),
    }),
    [items]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
