// Génère public/sitemap.xml (pages + toutes les fiches produit publiées) et public/robots.txt.
// Lancé automatiquement avant `npm run build` ; à lancer à la main avec `npm run seo` après avoir ajouté des produits.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { convertPath } from '../src/i18n/routes.js';

// Le plan du site est fait pour la production : .env.production (s'il existe) l'emporte sur .env (adresses de développement)
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

// Adresses françaises de référence ; la version anglaise (/en/…) est déduite de src/i18n/routes.js
const paths = ['/', '/produits', '/contact', '/mentions-legales', '/politique-de-confidentialite', '/conditions-generales-de-vente'];
try {
  for (let page = 1; ; page++) {
    const res = await fetch(`${API}/api/products?page=${page}&perPage=100`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data, meta } = await res.json();
    data.forEach((p) => paths.push(`/produits/${p.id}`));
    if (page >= meta.pageCount) break;
  }
  console.log(`Plan du site : ${paths.length} adresses × 2 langues (produits récupérés depuis ${API}).`);
} catch (err) {
  console.warn(`API injoignable (${err.message}) : plan du site généré sans les fiches produit. Relancez « npm run seo » quand l'API tourne.`);
}

// Chaque page est listée en français et en anglais, avec les liens hreflang croisés (recommandation de Google)
const entry = (p, lang) => {
  const en = convertPath(p, 'en');
  const loc = lang === 'en' ? en : p;
  return `  <url>
    <loc>${SITE}${loc}</loc>
    <xhtml:link rel="alternate" hreflang="fr" href="${SITE}${p}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${en}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${p}"/>
  </url>`;
};
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${paths.flatMap((p) => [entry(p, 'fr'), entry(p, 'en')]).join('\n')}
</urlset>
`;
writeFileSync('public/sitemap.xml', xml);

// Pages sans intérêt pour Google, dans les deux langues
const hidden = ['/panier', '/commande', '/connexion', '/connexion/retour', '/inscription', '/mon-compte', '/erreur-serveur'];
writeFileSync('public/robots.txt', `User-agent: *
Allow: /
Disallow: /admin
${hidden.map((p) => `Disallow: ${p}`).join('\n')}
${hidden.map((p) => `Disallow: ${convertPath(p, 'en')}`).join('\n')}

Sitemap: ${SITE}/sitemap.xml
`);
console.log('public/sitemap.xml et public/robots.txt écrits.');
