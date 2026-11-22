// Client de l'API REST Symfony (voir dab-api/README.md). Toutes les requêtes du site et du back-office passent ici.
const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');
const TOKEN_KEY = 'dab-token';

// Langue du site (réglée par I18nProvider) : envoyée à l'API dans l'en-tête Accept-Language, et utilisée pour les messages d'erreur d'ici
let lang = 'fr';
export const setApiLang = (l) => { lang = l; };
const MESSAGES = {
  fr: { generic: 'Une erreur est survenue.', network: 'Serveur injoignable. Vérifiez votre connexion et réessayez.' },
  en: { generic: 'Something went wrong.', network: 'Server unreachable. Check your connection and try again.' },
};

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message ?? MESSAGES[lang].generic);
    this.status = status;                  // 0 = API injoignable
    this.code = body?.error;               // "validation_failed", "email_not_verified", "invalid_credentials", "conflict"…
    this.violations = body?.violations ?? {}; // { champ: "message" } pour les erreurs de formulaire (HTTP 422)
  }
}

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (t) => { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch { /* stockage indisponible */ } };

/** { "customer.name": "…" } -> { name: "…" } (rename = correspondances de noms de champs) */
export function fieldErrors(err, rename = {}) {
  const out = {};
  for (const [k, v] of Object.entries(err?.violations ?? {})) out[rename[k] ?? k] = v;
  return out;
}

async function send(path, { method = 'GET', body, query, form } = {}) {
  const url = new URL(BASE + path);
  Object.entries(query ?? {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v); });
  const headers = { Accept: 'application/json', 'Accept-Language': lang };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(url, { method, headers, body: form ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  } catch {
    throw new ApiError(0, { error: 'network', message: MESSAGES[lang].network });
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token && data?.error === 'invalid_token') {
      setToken(null); // session expirée : on prévient l'application
      window.dispatchEvent(new Event('dab:auth-expired'));
    }
    throw new ApiError(res.status, data);
  }
  return data;
}

// Téléchargement d'un fichier (facture PDF) : même authentification que le reste de l'API, mais la réponse est un Blob
async function download(path) {
  const headers = { 'Accept-Language': lang };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(BASE + path, { headers });
  } catch {
    throw new ApiError(0, { error: 'network', message: MESSAGES[lang].network });
  }
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null));
  return res.blob();
}

// Nombre de requêtes en cours : la barre de chargement (NetworkBar) écoute l'évènement "dab:network"
let pending = 0;
async function request(path, options) {
  pending += 1;
  window.dispatchEvent(new CustomEvent('dab:network', { detail: pending }));
  try {
    return await send(path, options);
  } finally {
    pending -= 1;
    window.dispatchEvent(new CustomEvent('dab:network', { detail: pending }));
  }
}

export const api = {
  // --- Authentification
  register: (d) => request('/api/auth/register', { method: 'POST', body: d }),     // { name, email, password, confirm }
  // --- Devis de fresque : formulaire public (FormData avec photos), page du devis (clé reçue par e-mail), gestion admin
  quotes: {
    create: (form) => request('/api/quotes', { method: 'POST', form }),                                   // { reference, message }
    get: (token) => request(`/api/quotes/${token}`),                                                       // devis + { payable }
    checkout: (token) => request(`/api/quotes/${token}/checkout`, { method: 'POST' }),                     // { checkoutUrl } (acompte)
    list: (q = {}) => request('/api/quotes', { query: q }),                                               // admin
    update: (ref, body) => request(`/api/quotes/${ref}`, { method: 'PATCH', body }),                       // admin : statut, note, montant…
    send: (ref, body) => request(`/api/quotes/${ref}/send`, { method: 'POST', body }),                     // admin : envoie le devis au client
    remove: (ref) => request(`/api/quotes/${ref}`, { method: 'DELETE' }),                                  // admin
  },
  forgotPassword: (email) => request('/api/auth/forgot-password', { method: 'POST', body: { email } }),          // lien de réinitialisation par e-mail
  resetPassword: (data) => request('/api/auth/reset-password', { method: 'POST', body: data }),               // { token, password, confirm }
  resendVerification: (email) => request('/api/auth/resend-verification', { method: 'POST', body: { email } }),
  // Renvoie l'utilisateur { id, name, email, roles, isAdmin, verified, twoFactor }, OU { challenge } si la double authentification est
  // activée : aucun jeton n'est remis avant la saisie du code (verifyTwoFactor).
  async login(email, password) {
    const res = await request('/api/auth/login', { method: 'POST', body: { email, password } });
    if (res.challenge) return { challenge: res.challenge };
    setToken(res.token);
    return res.user;
  },
  // 2e étape de la connexion : code à 6 chiffres de l'application, ou code de secours
  async verifyTwoFactor(challenge, code) {
    const res = await request('/api/auth/2fa/verify', { method: 'POST', body: { challenge, code } });
    setToken(res.token);
    return res.user;
  },
  // Gestion de la double authentification (page Mon compte)
  twoFactor: {
    status: () => request('/api/auth/2fa'),                                                          // { enabled, enabledAt, recoveryCodesLeft }
    setup: (password) => request('/api/auth/2fa/setup', { method: 'POST', body: { password } }),      // { secret, otpauthUrl }
    enable: (code) => request('/api/auth/2fa/enable', { method: 'POST', body: { code } }),             // { recoveryCodes }
    disable: (password, code) => request('/api/auth/2fa/disable', { method: 'POST', body: { password, code } }),
    recoveryCodes: (password, code) => request('/api/auth/2fa/recovery-codes', { method: 'POST', body: { password, code } }), // { recoveryCodes }
  },
  async logout() {
    try { await request('/api/auth/logout', { method: 'POST' }); } finally { setToken(null); }
  },
  me: () => request('/api/auth/me'),

  // --- Connexion avec Google / Facebook : le navigateur change de page (pas d'appel AJAX), puis revient sur /connexion/retour#token=…
  oauth: {
    providers: () => request('/api/auth/oauth/providers'),                                   // { providers: [{ id: 'google', label: 'Google' }] } (seulement ceux configurés)
    startUrl: (provider) => `${BASE}/api/auth/oauth/${provider}/start?lang=${lang}`,       // adresse vers laquelle envoyer le navigateur
    async complete(token) {                                                                  // jeton reçu au retour -> profil de la personne
      setToken(token);
      try { return await request('/api/auth/me'); } catch (err) { setToken(null); throw err; }
    },
  },

  // --- Droits RGPD de la personne connectée
  account: {
    orders: () => request('/api/auth/me/orders'),                                            // mes commandes : { items: [commande…] }
    export: () => request('/api/auth/me/export'),                                          // copie de mes données
    remove: (credentials) => request('/api/auth/me', { method: 'DELETE', body: credentials }), // supprimer mon compte : { password } (ou { email } pour un compte Google/Facebook)
  },

  // --- Boutique (listes : { data, meta: { page, perPage, total, pageCount } })
  products: {
    list: (q = {}) => request('/api/products', { query: q }),      // { category, q, page, perPage, published (admin) }
    get: (id) => request(`/api/products/${id}`),
    create: (p) => request('/api/products', { method: 'POST', body: p }),
    update: (id, p) => request(`/api/products/${id}`, { method: 'PATCH', body: p }),
    remove: (id) => request(`/api/products/${id}`, { method: 'DELETE' }),
  },
  categories: {
    list: () => request('/api/categories', { query: { perPage: 100 } }),
    create: (name, nameEn = '') => request('/api/categories', { method: 'POST', body: { name, translations: { en: { name: nameEn } } } }),
    rename: (id, name, nameEn = '') => request(`/api/categories/${id}`, { method: 'PATCH', body: { name, translations: { en: { name: nameEn } } } }),
    remove: (id) => request(`/api/categories/${id}`, { method: 'DELETE' }),
  },
  orders: {
    create: ({ customer, items, acceptTerms, codes = [], country }) => request('/api/orders', { method: 'POST', body: { customer, acceptTerms, codes, country, items: items.map((i) => ({ productId: i.id, qty: i.qty })) } }),
    list: (q = {}) => request('/api/orders', { query: q }),         // admin : { status, q, page, perPage }
    get: (ref) => request(`/api/orders/${ref}`),
    // extra (« expédiée ») : { tracking: { carrier, number, url }, notify } -> suivi enregistré et e-mail au client
    setStatus: (ref, status, extra = {}) => request(`/api/orders/${ref}/status`, { method: 'PATCH', body: { status, ...extra } }),
    // Paiement Stripe : create() renvoie { …commande, checkoutUrl } ; au retour de Stripe, checkoutStatus() dit où en est le paiement
    checkoutStatus: (sessionId) => request(`/api/payments/checkout/${encodeURIComponent(sessionId)}`), // { id, status, paid, refunded, total, customer: { email } }
    creditNote: (ref) => download(`/api/orders/${ref}/credit-note`),                          // avoir PDF (Blob) d'une commande remboursée
    invoice: (ref) => download(`/api/orders/${ref}/invoice`),                                // facture PDF (Blob) de ma commande (ou de n'importe laquelle pour un admin)
    refund: (ref) => request(`/api/orders/${ref}/refund`, { method: 'POST' }),                      // admin : remboursement total
  },

  // --- Contact (public) et messages reçus (admin)
  contact: { send: (f) => request('/api/contact', { method: 'POST', body: f }) },
  messages: {
    list: (q = {}) => request('/api/messages', { query: q }),       // { read: 0|1, q, page, perPage }
    setRead: (id, read) => request(`/api/messages/${id}`, { method: 'PATCH', body: { read } }),
    remove: (id) => request(`/api/messages/${id}`, { method: 'DELETE' }),
  },

  // --- Avis clients : lecture publique, dépôt (acheteur connecté) et modération (admin)
  stockAlert: (productId, email) => request(`/api/products/${productId}/stock-alert`, { method: 'POST', body: { email } }), // « prévenez-moi »
  stockAlertCounts: () => request('/api/products/stock-alerts'),                                                     // admin
  faq: {
    list: () => request('/api/faq', { query: { perPage: 100 } }),                              // { data }
    adminList: (q = {}) => request('/api/admin/faq', { query: q }),
    create: (body) => request('/api/admin/faq', { method: 'POST', body }),
    update: (id, body) => request(`/api/admin/faq/${id}`, { method: 'PUT', body }),
    remove: (id) => request(`/api/admin/faq/${id}`, { method: 'DELETE' }),
  },
  orderTrack: ({ reference, email }) => request('/api/orders/track', { method: 'POST', body: { reference, email } }), // page publique de suivi
  // --- Frais de port (par poids et par zone)
  shipping: {
    info: () => request('/api/shipping'),                                                        // { enabled, zones: [{ name, countries, freeFrom }] }
    quote: ({ country, items, codes }) => request('/api/shipping/quote', { method: 'POST', body: { country, codes, items: items.map((i) => ({ productId: i.id, qty: i.qty })) } }), // { enabled, shipping, zone, freeFrom }
    adminGet: () => request('/api/admin/shipping'),
    adminSave: (body) => request('/api/admin/shipping', { method: 'PUT', body }),
  },
  // --- Codes promo, cartes cadeau
  codes: {
    check: ({ codes, items, email }) => request('/api/codes/check', { method: 'POST', body: { codes, email, items: items.map((i) => ({ productId: i.id, qty: i.qty })) } }), // { promo, gift, discount }
  },
  giftCards: {
    buy: (body) => request('/api/gift-cards', { method: 'POST', body }),                         // { checkoutUrl }
    checkoutStatus: (sessionId) => request(`/api/gift-cards/checkout/${sessionId}`),            // { paid, amount, buyerEmail, recipientEmail }
    adminList: (q = {}) => request('/api/admin/gift-cards', { query: q }),                      // admin
    adminUpdate: (id, status) => request(`/api/admin/gift-cards/${id}`, { method: 'PATCH', body: { status } }),
  },
  promos: {
    list: (q = {}) => request('/api/admin/promo-codes', { query: q }),                          // admin
    create: (body) => request('/api/admin/promo-codes', { method: 'POST', body }),
    update: (id, body) => request(`/api/admin/promo-codes/${id}`, { method: 'PUT', body }),
    remove: (id) => request(`/api/admin/promo-codes/${id}`, { method: 'DELETE' }),
  },
  // --- Galerie de réalisations
  realisations: {
    list: () => request('/api/realisations', { query: { perPage: 100 } }),                     // { data }
    adminList: (q = {}) => request('/api/admin/realisations', { query: q }),
    create: (body) => request('/api/admin/realisations', { method: 'POST', body }),
    update: (id, body) => request(`/api/admin/realisations/${id}`, { method: 'PUT', body }),
    remove: (id) => request(`/api/admin/realisations/${id}`, { method: 'DELETE' }),
  },
  reviews: {
    featured: () => request('/api/reviews/featured'),                                          // accueil : { data: [avis + productId, productName], summary }
    list: (productId, q = {}) => request(`/api/products/${productId}/reviews`, { query: q }),   // { data, meta, summary }
    mine: (productId) => request(`/api/products/${productId}/reviews/mine`),                    // { eligible, reason, review }
    create: (productId, body) => request(`/api/products/${productId}/reviews`, { method: 'POST', body }), // { rating, title, body }
    removeOwn: (id) => request(`/api/reviews/${id}`, { method: 'DELETE' }),
    adminList: (q = {}) => request('/api/admin/reviews', { query: q }),                         // { status, q, page, perPage }
    adminUpdate: (id, body) => request(`/api/admin/reviews/${id}`, { method: 'PATCH', body }),  // { status?, reply? }
    adminRemove: (id) => request(`/api/admin/reviews/${id}`, { method: 'DELETE' }),
  },

  // --- Contenu du site et slider
  content: {
    get: () => request('/api/content'),
    save: (content) => request('/api/content', { method: 'PUT', body: content }),
    reset: () => request('/api/content/reset', { method: 'POST' }),
  },
  slider: {
    get: () => request('/api/slider'),                               // { settings, products }
    save: (settings) => request('/api/slider', { method: 'PUT', body: settings }),
  },

  // --- Photos et tableau de bord (admin)
  upload: (file) => { const form = new FormData(); form.append('file', file); return request('/api/uploads', { method: 'POST', form }); },
  stats: () => request('/api/admin/stats'),
  analyticsPdf: (period = '30') => download(`/api/admin/analytics/pdf?period=${encodeURIComponent(period)}`), // statistiques en PDF (Blob)
  analytics: (period = '30') => request('/api/admin/analytics', { query: { period } }), // statistiques détaillées (tableau de bord)
};
