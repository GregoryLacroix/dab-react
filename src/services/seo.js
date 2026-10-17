import { useEffect } from 'react';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { localizePath, toFrench } from '../i18n/routes.js';

export const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');
export const SITE_NAME = 'Les galets d’Ambre';
const DEFAULT_IMAGE = `${SITE_URL}/og-default.jpg`;

/** URL absolue (obligatoire pour les aperçus de partage et les données structurées) */
export const absoluteUrl = (u) => (!u ? DEFAULT_IMAGE : /^https?:/i.test(u) ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`);
const truncate = (t, n = 158) => { const s = String(t ?? '').replace(/\s+/g, ' ').trim(); return s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`; };

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', content);
}
const OG_LOCALES = { fr: 'fr_FR', en: 'en_GB' };

// Liens hreflang : indiquent à Google la version française et la version anglaise de la même page
function setAlternates(links) {
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
  links.forEach(([hreflang, href]) => {
    const el = document.createElement('link');
    el.setAttribute('rel', 'alternate');
    el.setAttribute('hreflang', hreflang);
    el.setAttribute('href', href);
    document.head.appendChild(el);
  });
}
function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
  el.setAttribute('href', href);
}

/**
 * Référencement d'une page : <title>, description, URL canonique, aperçus de partage (Open Graph / X),
 * robots, et données structurées JSON-LD (schema.org).
 *   useSeo({ title, description, path, image, type, noindex, jsonLd })
 * Sans title : titre de la page d'accueil. noindex : pages sans intérêt pour Google (panier, connexion…).
 * path : adresse FRANÇAISE de référence (ex. '/produits/3') ; l'adresse anglaise (/en/shop/3) en est déduite,
 * ce qui donne l'URL canonique de la langue courante et les liens hreflang des deux versions.
 */
export default function useSeo({ title, description, path, image, type = 'website', noindex = false, jsonLd } = {}) {
  const { lang, t } = useI18n();
  const ld = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    const fullTitle = `${title ?? t('seo.defaultTitle')} | ${SITE_NAME}`;
    const desc = truncate(description ?? t('seo.defaultDescription'));
    const frPath = path ?? toFrench(window.location.pathname);
    const url = `${SITE_URL}${localizePath(frPath, lang)}`;
    const img = absoluteUrl(image);

    document.title = fullTitle;
    setMeta('name', 'description', desc);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    setLink('canonical', url);
    setAlternates(noindex ? [] : [
      ['fr', `${SITE_URL}${frPath}`],
      ['en', `${SITE_URL}${localizePath(frPath, 'en')}`],
      ['x-default', `${SITE_URL}${frPath}`],
    ]);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:locale', OG_LOCALES[lang]);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', img);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', img);

    let script = document.getElementById('seo-jsonld');
    if (ld) {
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'seo-jsonld';
        document.head.appendChild(script);
      }
      script.textContent = ld;
    } else if (script) {
      script.remove();
    }
  }, [title, description, path, image, type, noindex, ld, lang]); // eslint-disable-line react-hooks/exhaustive-deps
}
