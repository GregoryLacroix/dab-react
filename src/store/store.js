import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { api } from '../services/api.js';
import { DEFAULT_CONTENT, localizeContent } from '../services/defaultContent.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

/**
 * Petit cache partagé pour les deux données utilisées partout dans le site :
 * les catégories (filtres, slider, formulaires) et le contenu éditable (accueil, contact, pied de page).
 * Produits, commandes et messages sont chargés page par page directement depuis l'API.
 */
export const ORDER_STATUSES = ['en attente', 'payée', 'expédiée', 'livrée', 'annulée'];
export const QUOTE_STATUSES = ['nouvelle', 'devis envoyé', 'acompte payé', 'refusée', 'archivée']; // demandes de devis (mêmes valeurs que l'API)
// Noms anglais des catégories d'origine (ids de l'API) ; l'API peut aussi fournir category.translations.en.name
const CATEGORY_NAMES_EN = { galets: 'Pebbles', fresques: 'Murals' };
// Sujets du formulaire de contact (mêmes clés que l'API ; français pour le back-office, le site public traduit via 'contact.subject.<clé>')
export const SUBJECTS = { produit: 'Question sur un produit', commande: 'Suivi de commande', 'sur-mesure': 'Galet ou fresque sur mesure', autre: 'Autre demande' };

/** Photo de couverture d'un produit (ou visuel bleu provisoire) */
export const cover = (p) => p.images?.[0] ?? { tone: 'sea', alt: p.name };

let state = { categories: null, content: null }; // null = pas encore chargé
const listeners = new Set();
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const set = (patch) => { state = { ...state, ...patch }; listeners.forEach((l) => l()); };

/** Recharge les catégories (à appeler après une création, un renommage ou une suppression) */
export function refreshCategories() {
  return api.categories.list().then(
    (res) => set({ categories: res.data }),
    () => { if (state.categories === null) set({ categories: [] }); }
  );
}
export const setContentCache = (content) => set({ content });
function refreshContent() {
  return api.content.get().then(
    (content) => set({ content }),
    () => { if (state.content === null) set({ content: DEFAULT_CONTENT }); }
  );
}
let catLoading = null;
let contentLoading = null;
const EMPTY = [];

export function useCategories() {
  const categories = useSyncExternalStore(subscribe, () => state.categories);
  const { lang, loc } = useI18n();
  useEffect(() => { catLoading ??= refreshCategories(); }, []);
  return useMemo(() => {
    if (!categories) return EMPTY;
    if (lang === 'fr') return categories;
    return categories.map((c) => { const t = loc(c); return t === c && CATEGORY_NAMES_EN[c.id] ? { ...c, name: CATEGORY_NAMES_EN[c.id] } : t; });
  }, [categories, lang]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useContent() {
  const content = useSyncExternalStore(subscribe, () => state.content);
  const { lang } = useI18n();
  useEffect(() => { contentLoading ??= refreshContent(); }, []);
  return useMemo(() => localizeContent(content ?? DEFAULT_CONTENT, lang), [content, lang]);
}

/** Prévient le menu du back-office que les messages ont changé (pastille « non lus ») */
export const notifyMessagesChanged = () => window.dispatchEvent(new Event('dab:messages'));
