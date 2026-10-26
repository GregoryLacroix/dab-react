// Table des adresses : la version française est la référence (celle utilisée partout dans le code),
// la version anglaise vit sous /en. Ce fichier ne dépend de rien : le script du plan du site le lit aussi.
export const LANGS = ['fr', 'en'];
export const DEFAULT_LANG = 'fr';

export const ROUTES = [
  { key: 'home',    fr: '/',                              en: '/en' },
  { key: 'shop',    fr: '/produits',                      en: '/en/shop' },
  { key: 'product', fr: '/produits/:id',                  en: '/en/shop/:id' },
  { key: 'quote',   fr: '/devis',                         en: '/en/quote' },          // demande de devis (fresques)
  { key: 'quotePay',fr: '/devis/:token',                  en: '/en/quote/:token' },   // page du devis reçue par e-mail
  { key: 'cart',    fr: '/panier',                        en: '/en/cart' },
  { key: 'order',   fr: '/commande',                      en: '/en/order' }, // retour de Stripe après le paiement
  { key: 'contact', fr: '/contact',                       en: '/en/contact' },
  { key: 'login',   fr: '/connexion',                     en: '/en/login' },
  { key: 'forgot',  fr: '/mot-de-passe-oublie',          en: '/en/forgot-password' },
  { key: 'reset',   fr: '/nouveau-mot-de-passe',          en: '/en/reset-password' }, // lien reçu par e-mail
  { key: 'oauth',   fr: '/connexion/retour',              en: '/en/login/callback' }, // retour de Google / Facebook
  { key: 'register',fr: '/inscription',                   en: '/en/register' },
  { key: 'account', fr: '/mon-compte',                    en: '/en/account' },
  { key: 'legal',   fr: '/mentions-legales',              en: '/en/legal-notice' },
  { key: 'privacy', fr: '/politique-de-confidentialite',  en: '/en/privacy-policy' },
  { key: 'terms',   fr: '/conditions-generales-de-vente', en: '/en/terms-and-conditions' },
  { key: 'error',   fr: '/erreur-serveur',                en: '/en/server-error' },
];

// Paramètres d'adresse qui changent de nom d'une langue à l'autre (?categorie=… / ?category=…)
const QUERY = { fr: { category: 'categorie' }, en: { categorie: 'category' } };

export const isEnglishPath = (pathname) => pathname === '/en' || pathname.startsWith('/en/');
export const langFromPath = (pathname) => (isEnglishPath(pathname) ? 'en' : 'fr');

const toRegex = (pattern) => new RegExp(`^${pattern.replace(/:[^/]+/g, '([^/]+)')}/?$`);
const MATCHERS = ROUTES.flatMap((r) => LANGS.map((lang) => ({ ...r, lang, re: toRegex(r[lang]) })));

/** Convertit une adresse (avec ?requête et #ancre éventuels) d'une langue à l'autre. Les adresses inconnues (/admin, liens externes…) ne changent pas. */
export function convertPath(path, to) {
  if (typeof path !== 'string' || !path.startsWith('/')) return path;
  const [, pathname, rest = ''] = path.match(/^([^?#]*)(.*)$/);
  const m = MATCHERS.find((x) => x.re.test(pathname));
  if (!m) return path;
  const values = pathname.match(m.re).slice(1);
  let i = 0;
  const target = m[to === 'en' ? 'en' : 'fr'].replace(/:[^/]+/g, () => values[i++]);
  let query = rest;
  const rename = QUERY[to === 'en' ? 'en' : 'fr'];
  if (rest.startsWith('?')) {
    const hashAt = rest.indexOf('#');
    const q = new URLSearchParams(hashAt === -1 ? rest.slice(1) : rest.slice(1, hashAt));
    const renamed = new URLSearchParams();
    for (const [k, v] of q) renamed.append(rename[k] ?? k, v);
    const s = renamed.toString();
    query = (s ? `?${s}` : '') + (hashAt === -1 ? '' : rest.slice(hashAt));
  }
  return target + query;
}

/** Adresse française de référence à partir d'une adresse dans n'importe quelle langue */
export const toFrench = (path) => convertPath(path, 'fr');
/** Adresse dans la langue demandée, à partir d'une adresse française de référence */
export const localizePath = (path, lang) => (lang === 'en' ? convertPath(path, 'en') : path);
