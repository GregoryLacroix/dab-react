// Pré-rendu pour Google : après « vite build », écrit dans dist/ une copie de index.html pour chaque page importante
// (accueil, boutique, chaque fiche produit, FAQ, réalisations, etc.), en français et en anglais.
// Chaque copie contient déjà, dans le HTML : <title>, description, URL canonique, liens hreflang, aperçus de partage,
// données structurées (JSON-LD) et un contenu texte (titre, photo, prix, description, liens). Google et les robots de
// partage n'ont donc pas besoin d'exécuter le JavaScript. Dès que le navigateur a chargé le site, React remplace ce
// contenu par la vraie page (aucune différence pour le visiteur).
//
// Lancé automatiquement après « npm run build » ; à relancer à la main avec « npm run prerender » si dist/ existe déjà.
// IMPORTANT : le catalogue est lu dans l'API au moment de la construction. Après avoir ajouté, modifié le prix ou retiré
// des produits, refaites « npm run build » et mettez dist/ en ligne pour que Google voie la même chose que vos clients.
// Si l'API est injoignable, seules les pages sans catalogue sont écrites : le build n'échoue jamais à cause de ce script.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { convertPath } from '../src/i18n/routes.js';
import fr from '../src/i18n/fr.js';
import en from '../src/i18n/en.js';

// --- Configuration (mêmes sources que scripts/generate-seo-files.mjs) -------------------------------------------------
const fileEnv = {};
for (const file of ['.env', '.env.production']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) fileEnv[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
const get = (key, fallback) => process.env[key] ?? fileEnv[key] ?? fallback;
const SITE = get('VITE_SITE_URL', 'http://localhost:5173').replace(/\/$/, '');
const API = get('VITE_API_URL', 'http://localhost:8000').replace(/\/$/, '');
const SITE_NAME = 'Les galets d’Ambre';
const DIST = 'dist';

if (!existsSync(join(DIST, 'index.html'))) {
  console.warn('Pré-rendu ignoré : dist/index.html est introuvable (lancez d’abord « npm run build »).');
  process.exit(0);
}
const template = readFileSync(join(DIST, 'index.html'), 'utf8');

// --- Outils ----------------------------------------------------------------------------------------------------------
const DICT = { fr, en };
const t = (lang, key, vars = {}) => String(DICT[lang][key] ?? DICT.fr[key] ?? '').replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const truncate = (text, n = 158) => { const s = String(text ?? '').replace(/\s+/g, ' ').trim(); return s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`; };
const localized = (path, lang) => (lang === 'en' ? convertPath(path, 'en') : path);
const money = (v, lang) => new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(v));
// Applique la traduction anglaise d'un produit ou d'une réalisation (champs « …En » ou translations.en)
const loc = (item, lang) => (lang === 'en' && item?.translations?.en ? { ...item, ...item.translations.en } : item);
const pick = (item, key, lang) => (lang === 'en' && item[`${key}En`]) || item[key];

async function getJson(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${path} : HTTP ${res.status}`);
  return res.json();
}

// --- Données de l'API (facultatives : sans elles, on écrit seulement les pages sans catalogue) -------------------------
let content = null;
const products = [];
let faq = [];
let works = [];
try { content = await getJson('/api/content'); } catch (e) { console.warn(`Contenu du site indisponible (${e.message}).`); }
try {
  for (let page = 1; ; page++) {
    const { data, meta } = await getJson(`/api/products?page=${page}&perPage=100`);
    products.push(...data);
    if (page >= meta.pageCount) break;
  }
} catch (e) { console.warn(`Produits indisponibles (${e.message}) : pas de pré-rendu des fiches produit.`); }
try { faq = (await getJson('/api/faq?perPage=100')).data ?? []; } catch (e) { console.warn(`FAQ indisponible (${e.message}).`); }
try { works = (await getJson('/api/realisations?perPage=100')).data ?? []; } catch (e) { console.warn(`Réalisations indisponibles (${e.message}).`); }

// --- Fabrication d'une page ------------------------------------------------------------------------------------------
// Remplace une balise existante (repérée par une expression) ou, à défaut, l'ajoute avant </head>
function setTag(html, re, tag) { return re.test(html) ? html.replace(re, () => tag) : html.replace('</head>', () => `    ${tag}\n  </head>`); }
const metaName = (html, name, value) => setTag(html, new RegExp(`<meta\\s+name="${name}"[^>]*>`, 'i'), `<meta name="${name}" content="${esc(value)}" />`);
const metaProp = (html, prop, value) => setTag(html, new RegExp(`<meta\\s+property="${prop}"[^>]*>`, 'i'), `<meta property="${prop}" content="${esc(value)}" />`);

/**
 * page : { path (adresse française), title, description, image, type, jsonLd, body (HTML du contenu) }
 * Écrit dist/<adresse>/index.html (dist/index.html pour l'accueil français).
 */
function writePage(page, lang) {
  const url = `${SITE}${localized(page.path, lang)}`;
  const fullTitle = `${page.title} | ${SITE_NAME}`;
  const desc = truncate(page.description);
  const image = page.image || `${SITE}/og-default.jpg`;
  let html = template.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(fullTitle)}</title>`);
  html = metaName(html, 'description', desc);
  html = metaName(html, 'robots', 'index, follow');
  html = setTag(html, /<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${esc(url)}" />`);
  html = html.replace(/\s*<link\s+rel="alternate"\s+hreflang[^>]*>/gi, '');
  const alternates = [['fr', page.path], ['en', convertPath(page.path, 'en')], ['x-default', page.path]]
    .map(([code, p]) => `<link rel="alternate" hreflang="${code}" href="${esc(`${SITE}${p}`)}" />`).join('\n    ');
  html = html.replace('</head>', () => `    ${alternates}\n  </head>`);
  html = metaProp(html, 'og:type', page.type ?? 'website');
  html = metaProp(html, 'og:locale', lang === 'en' ? 'en_GB' : 'fr_FR');
  html = metaProp(html, 'og:title', fullTitle);
  html = metaProp(html, 'og:description', desc);
  html = metaProp(html, 'og:url', url);
  html = metaProp(html, 'og:image', image);
  html = metaName(html, 'twitter:title', fullTitle);
  html = metaName(html, 'twitter:description', desc);
  html = metaName(html, 'twitter:image', image);
  if (page.jsonLd) {
    // id « seo-jsonld » : React met à jour ce même bloc au lieu d'en ajouter un deuxième
    const json = JSON.stringify(page.jsonLd).replace(/</g, '\\u003c');
    html = html.replace('</head>', () => `    <script type="application/ld+json" id="seo-jsonld">${json}</script>\n  </head>`);
  }
  html = html.replace('<div id="root"></div>', () => `<div id="root"><main style="max-width:56rem;margin:2rem auto;padding:0 1.25rem;font-family:Arial,sans-serif;line-height:1.6;color:#000">${page.body}</main></div>`);

  const clean = localized(page.path, lang).replace(/^\/+|\/+$/g, '');
  const file = clean === '' ? join(DIST, 'index.html') : join(DIST, clean, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

// Petits blocs de contenu
const link = (path, label, lang) => `<a href="${esc(localized(path, lang))}">${esc(label)}</a>`;
const productList = (list, lang) => `<ul>${list.map((p0) => { const p = loc(p0, lang); return `<li>${link(`/produits/${p.id}`, `${p.name} – ${money(p.price, lang)}`, lang)}</li>`; }).join('')}</ul>`;
const menu = (lang) => `<nav>${[['/produits', t(lang, 'nav.shop')], ['/realisations', t(lang, 'nav.gallery')], ['/faq', t(lang, 'faq.seoTitle')], ['/contact', t(lang, 'contact.seoTitle')]]
  .map(([p, label]) => link(p, label, lang)).join(' · ')}</nav>`;
const home = (lang) => `${link('/', SITE_NAME, lang)}`;

// --- Pages -----------------------------------------------------------------------------------------------------------
let count = 0;
const generate = (page, lang) => { writePage(page, lang); count++; };
const quotesOn = content?.features?.quotes !== false;

for (const lang of ['fr', 'en']) {
  const published = products.map((p) => loc(p, lang));
  const newest = [...products].sort((a, b) => b.id - a.id).slice(0, 8);

  // Accueil
  const hero = content?.hero;
  generate({
    path: '/',
    title: t(lang, 'seo.defaultTitle'),
    description: lang === 'fr' && hero?.text ? hero.text : t(lang, 'seo.defaultDescription'),
    jsonLd: { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Organization', '@id': `${SITE}/#organisation`, name: SITE_NAME, url: SITE, logo: `${SITE}/logo.png`,
        email: content?.contact?.email || undefined, sameAs: content?.contact?.instagram ? [content.contact.instagram] : undefined },
      { '@type': 'WebSite', '@id': `${SITE}/#site`, name: SITE_NAME, url: `${SITE}${localized('/', lang)}`, inLanguage: lang === 'en' ? 'en-GB' : 'fr-FR', publisher: { '@id': `${SITE}/#organisation` } },
    ] },
    body: `<h1>${esc(lang === 'fr' && hero?.title ? hero.title : `${SITE_NAME} – ${t(lang, 'seo.defaultTitle')}`)}</h1>
<p>${esc(lang === 'fr' && hero?.text ? hero.text : t(lang, 'seo.defaultDescription'))}</p>${menu(lang)}${newest.length ? productList(newest, lang) : ''}`,
  }, lang);

  // Boutique
  generate({
    path: '/produits',
    title: t(lang, 'shop.seo.title.all'),
    description: t(lang, 'shop.seo.desc.all'),
    body: `<h1>${esc(t(lang, 'shop.seo.title.all'))}</h1><p>${esc(t(lang, 'shop.seo.desc.all'))}</p>${productList(products, lang)}${menu(lang)}`,
  }, lang);

  // Fiches produit
  for (const p of published) {
    const photos = (p.images ?? []).filter((i) => i.src).map((i) => i.src);
    const inStock = Number(p.stock) > 0;
    generate({
      path: `/produits/${p.id}`,
      title: p.name,
      description: p.description,
      image: photos[0],
      type: 'product',
      jsonLd: { '@context': 'https://schema.org', '@graph': [
        { '@type': 'Product', name: p.name, description: p.description, sku: String(p.id), image: photos.length ? photos : undefined,
          brand: { '@type': 'Brand', name: SITE_NAME },
          offers: { '@type': 'Offer', url: `${SITE}${localized(`/produits/${p.id}`, lang)}`, priceCurrency: 'EUR', price: String(p.price),
            availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', itemCondition: 'https://schema.org/NewCondition' } },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: t(lang, 'crumb.home'), item: `${SITE}${localized('/', lang)}` },
          { '@type': 'ListItem', position: 2, name: t(lang, 'nav.shop'), item: `${SITE}${localized('/produits', lang)}` },
          { '@type': 'ListItem', position: 3, name: p.name },
        ] },
      ] },
      body: `<p>${link('/produits', `← ${t(lang, 'nav.shop')}`, lang)}</p><h1>${esc(p.name)}</h1>${photos[0] ? `<img src="${esc(photos[0])}" alt="${esc(p.name)}" width="400" style="max-width:100%;height:auto" />` : ''}
<p><strong>${esc(money(p.price, lang))}</strong></p><p>${esc(p.description)}</p>`,
    }, lang);
  }

  // FAQ (avec données structurées « FAQPage »)
  if (faq.length) {
    const items = faq.map((f) => ({ q: pick(f, 'question', lang), a: pick(f, 'answer', lang) }));
    generate({
      path: '/faq',
      title: t(lang, 'faq.seoTitle'),
      description: t(lang, 'faq.seoDesc'),
      jsonLd: { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })) },
      body: `<h1>${esc(t(lang, 'faq.seoTitle'))}</h1>${items.map((i) => `<h2>${esc(i.q)}</h2><p>${esc(i.a)}</p>`).join('')}${menu(lang)}`,
    }, lang);
  }

  // Réalisations
  generate({
    path: '/realisations',
    title: t(lang, 'gallery.seoTitle'),
    description: t(lang, 'gallery.seoDesc'),
    body: `<h1>${esc(t(lang, 'gallery.seoTitle'))}</h1><p>${esc(t(lang, 'gallery.seoDesc'))}</p>${works.length ? `<ul>${works.map((w) => `<li>${esc(pick(w, 'title', lang))}</li>`).join('')}</ul>` : ''}${menu(lang)}`,
  }, lang);

  // Pages simples (titre et description seulement ; le contenu complet s'affiche avec React)
  const simple = [
    ['/carte-cadeau', t(lang, 'gift.seoTitle'), t(lang, 'gift.seoDesc')],
    ['/contact', t(lang, 'contact.seoTitle'), lang === 'fr' && content?.contact?.text ? content.contact.text : t(lang, 'seo.defaultDescription')],
    ['/mentions-legales', t(lang, 'ln.title'), t(lang, 'ln.desc')],
    ['/politique-de-confidentialite', t(lang, 'pp.title'), t(lang, 'pp.desc')],
    ['/conditions-generales-de-vente', t(lang, 'tc.title'), t(lang, 'tc.desc')],
  ];
  if (quotesOn) simple.push(['/devis', t(lang, 'quote.seoTitle'), t(lang, 'quote.seoDesc')]);
  if (content?.about?.enabled) {
    const a = content.about;
    simple.push(['/a-propos', (lang === 'en' && a.titleEn) || a.title, (lang === 'en' && a.leadEn) || a.lead || t(lang, 'about.seoDesc')]);
  }
  for (const [path, title, description] of simple) {
    generate({ path, title, description, body: `<h1>${esc(title)}</h1><p>${esc(description)}</p>${menu(lang)}` }, lang);
  }
}
console.log(`Pré-rendu : ${count} pages écrites dans ${DIST}/ (${products.length} produits, API : ${API}).`);
