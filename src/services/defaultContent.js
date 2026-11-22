// Textes affichés tant que l'API n'a pas répondu (ou si elle est injoignable).
// Les vrais textes viennent de GET /api/content et se modifient dans le back-office.
export const DEFAULT_CONTENT = {
  hero: {
    title: 'Des galets peints à la main, des murs qui prennent vie.',
    text: 'Chaque galet est peint à la main et verni, chaque fresque est pensée pour votre mur. Choisissez une pièce unique ou demandez la vôtre.',
    primaryLabel: 'Voir la boutique', primaryTo: '/produits',
    secondaryLabel: 'Demander une fresque', secondaryTo: '/devis',
  },
  marquee: ['Peinture sur galet', 'Fresque murale', 'Boutique en ligne'],
  // Bandeau de réassurance (un titre vide masque l'élément)
  trust: {
    enabled: true,
    items: [
      { icon: 'hand', title: 'Peint à la main', text: 'Chaque pièce est unique', titleEn: 'Hand-painted', textEn: 'Every piece is unique' },
      { icon: 'varnish', title: 'Vernis protecteur', text: 'Une peinture faite pour durer', titleEn: 'Protective varnish', textEn: 'Paint made to last' },
      { icon: 'ship', title: 'Expédition soignée', text: 'Colis protégé, suivi par e-mail', titleEn: 'Careful shipping', textEn: 'Protected parcel, tracked by e-mail' },
      { icon: 'pay', title: 'Paiement sécurisé', text: 'Par carte, via Stripe', titleEn: 'Secure payment', textEn: 'By card, through Stripe' },
    ],
  },
  // Page « À propos » (masquée tant qu'elle n'est pas activée dans le back-office)
  about: {
    enabled: false,
    title: 'À propos', lead: 'Des galets et des murs peints à la main, un par un.',
    text: 'Chaque galet est peint à la main à l’acrylique, puis verni pour durer. Chaque pièce est unique.\n\nLes fresques murales sont pensées pour votre mur : on échange sur votre projet, puis je peins sur place.',
    titleEn: 'About', leadEn: 'Pebbles and walls painted by hand, one at a time.',
    textEn: 'Every pebble is hand-painted in acrylic, then varnished to last. Every piece is unique.\n\nMurals are designed for your wall: we talk about your project, then I paint on site.',
    image: '', signature: '',
  },
  // Galet de l'accueil : 'animation' (peinture au scroll) ou 'photos' (une photo par étape)
  storyView: { mode: 'animation', images: ['', '', ''] },
  story: [
    { title: 'Le galet nu', text: 'Je choisis une pierre sur la plage. Sa forme décide du motif.' },
    { title: 'Les couleurs prennent forme', text: 'À l’acrylique, couche après couche, les fleurs, les mandalas et les points apparaissent.' },
    { title: 'Le vernis', text: 'Un vernis brillant protège la peinture. Votre galet est prêt à vivre chez vous.' },
  ],
  slider: { enabled: true, mode: 'auto', count: 5, delay: 5, productIds: [] },
  latest: { title: 'Les dernières créations', count: 3 },
  // Zoom des photos (fiche produit) : réglé dans le back-office, « Contenu du site »
  zoom: { lens: true, lensLevel: 2.5, fullLevel: 2.5 },
  blocks: [
    { title: 'Peinture sur galet', text: 'Des galets ramassés, peints à l’acrylique, vernis pour durer. Chacun est unique.', cta: 'Voir les galets', to: '/produits?categorie=galets' },
    { title: 'Fresque murale', text: 'Intérieur ou extérieur : on échange sur votre projet, puis je peins sur place.', cta: 'Demander un devis', to: '/devis' },
  ],
  contact: {
    title: 'Contactez-nous',
    text: 'Une question sur un galet, une commande sur mesure ou une fresque ? Écrivez-nous, nous répondons en général sous 48 h ouvrées.',
    email: 'contact@dab-boutique.fr',
    instagram: 'https://www.instagram.com/piloute_s/',
  },
  // Informations légales : à compléter dans le back-office (Contenu du site). Elles alimentent les pages légales.
  legal: {
    company: '', status: '', siret: '', address: '', email: '', phone: '', publisher: '',
    host: '', hostAddress: '', mediator: '',
    vatNote: 'Les prix sont indiqués en euros, toutes taxes comprises (TTC).',
    deliveryDelay: '1 à 2 semaines après la commande pour les galets en stock',
    shippingTerms: 'Les frais de livraison sont indiqués avant la validation de la commande.',
  },
  comingSoon: {
    enabled: false,
    title: 'Bientôt disponible',
    text: 'La boutique de galets peints à la main et de décoration murale ouvre très prochainement. Revenez nous voir !',
    date: '', autoOpen: false,
  },
  footer: { text: 'Les galets d’Ambre – Peinture sur galets & décoration murale' },
};

/** Réglages du zoom, complétés par les valeurs par défaut (une API plus ancienne n'envoie pas encore `zoom`) */
/** Réglage du galet de l'accueil, complété par les valeurs par défaut (une API plus ancienne n'envoie pas encore `storyView`) */
export const storyViewSettings = (v) => ({ ...DEFAULT_CONTENT.storyView, ...v, images: [0, 1, 2].map((i) => v?.images?.[i] ?? '') });
export const zoomSettings = (zoom) => ({ ...DEFAULT_CONTENT.zoom, ...zoom });

// Version anglaise des textes par défaut. Les liens (`to`), l'e-mail, Instagram, le slider et les champs légaux ne sont pas des textes à traduire.
export const DEFAULT_CONTENT_EN = {
  hero: {
    title: 'Hand-painted pebbles, walls that come to life.',
    text: 'Every pebble is painted by hand and varnished, every mural is designed for your wall. Choose a unique piece or ask for one of your own.',
    primaryLabel: 'Browse the shop', secondaryLabel: 'Request a mural',
  },
  marquee: ['Pebble painting', 'Wall murals', 'Online shop'],
  story: [
    { title: 'The bare pebble', text: 'I choose a stone on the beach. Its shape decides the design.' },
    { title: 'Colours take shape', text: 'In acrylic, layer after layer, flowers, mandalas and dots appear.' },
    { title: 'The varnish', text: 'A glossy varnish protects the paint. Your pebble is ready to make itself at home.' },
  ],
  latest: { title: 'Latest creations' },
  blocks: [
    { title: 'Pebble painting', text: 'Pebbles gathered by hand, painted in acrylic and varnished to last. Each one is unique.', cta: 'See the pebbles' },
    { title: 'Wall murals', text: 'Indoors or outdoors: we talk through your project, then I paint on site.', cta: 'Request a quote' },
  ],
  contact: {
    title: 'Get in touch',
    text: 'A question about a pebble, a made-to-measure order or a mural? Write to us — we usually reply within 48 working hours.',
  },
  legal: {
    vatNote: 'Prices are shown in euros, including all taxes (VAT).',
    deliveryDelay: '1 to 2 weeks after ordering for pebbles in stock',
    shippingTerms: 'Delivery costs are shown before the order is confirmed.',
  },
  comingSoon: {
    title: 'Coming soon',
    text: 'Our shop of hand-painted pebbles and wall decor opens very soon. Come back and visit us!',
  },
  footer: { text: 'Les galets d’Ambre – Pebble painting & wall decor' },
};

// Parcourt le contenu reçu de l'API en parallèle des textes par défaut : tout texte encore identique au texte français par défaut
// passe en anglais ; un texte modifié dans le back-office est conservé tel quel (français) tant qu'il n'a pas de version anglaise.
function swap(actual, fr, en) {
  if (typeof fr === 'string') return actual === fr && typeof en === 'string' ? en : actual;
  if (Array.isArray(fr)) return Array.isArray(actual) ? actual.map((a, i) => (i < fr.length ? swap(a, fr[i], en?.[i]) : a)) : actual;
  if (fr && typeof fr === 'object' && actual && typeof actual === 'object') {
    const out = { ...actual };
    for (const k of Object.keys(fr)) if (k in actual) out[k] = swap(actual[k], fr[k], en?.[k]);
    return out;
  }
  return actual;
}
const merge = (base, over) => {
  if (Array.isArray(over)) return over.map((o, i) => (base?.[i] && typeof o === 'object' ? merge(base[i], o) : o));
  if (over && typeof over === 'object' && base && typeof base === 'object' && !Array.isArray(base)) {
    const out = { ...base };
    for (const k of Object.keys(over)) out[k] = merge(base[k], over[k]);
    return out;
  }
  return over ?? base;
};

/**
 * Contenu du site dans la langue demandée.
 * 1. textes par défaut non modifiés -> version anglaise ;
 * 2. si l'API renvoie un objet `en` dans le contenu (ex. { hero: { title: '…' } }), il l'emporte sur le reste.
 */
export function localizeContent(content, lang) {
  if (lang !== 'en' || !content) return content;
  const { en, ...rest } = content;
  return en ? merge(swap(rest, DEFAULT_CONTENT, DEFAULT_CONTENT_EN), en) : swap(rest, DEFAULT_CONTENT, DEFAULT_CONTENT_EN);
}

/** Compléments par défaut pour une API plus ancienne qui n'enverrait pas encore `trust` / `about` */
export const withContentDefaults = (c) => ({
  ...c,
  trust: { ...DEFAULT_CONTENT.trust, ...c?.trust, items: DEFAULT_CONTENT.trust.items.map((d, i) => ({ ...d, ...c?.trust?.items?.[i] })) },
  about: { ...DEFAULT_CONTENT.about, ...c?.about },
});
