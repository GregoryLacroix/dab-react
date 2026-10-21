import { createContext, Fragment, isValidElement, useContext, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import fr from './fr.js';
import en from './en.js';
import { langFromPath, localizePath, toFrench } from './routes.js';
import { setApiLang } from '../services/api.js';

const DICTS = { fr, en };
const LOCALES = { fr: 'fr-FR', en: 'en-GB' };
const I18nContext = createContext(null);

// Remplace {variables} et <0>morceaux</0> ; renvoie du texte simple, ou du JSX si une variable / un morceau est un élément React.
function format(str, vars, tags) {
  if (!/[{<]/.test(str)) return str;
  let rich = false;
  const out = str.split(/(<\d+>[\s\S]*?<\/\d+>|\{\w+\})/g).map((part, i) => {
    let m = part.match(/^\{(\w+)\}$/);
    if (m) {
      const v = vars?.[m[1]];
      if (isValidElement(v)) { rich = true; return <Fragment key={i}>{v}</Fragment>; }
      return v ?? part;
    }
    m = part.match(/^<(\d+)>([\s\S]*?)<\/\1>$/);
    if (m) {
      rich = true;
      const wrap = tags?.[Number(m[1])];
      return <Fragment key={i}>{wrap ? wrap(m[2]) : m[2]}</Fragment>;
    }
    return part;
  });
  return rich ? <>{out}</> : out.join('');
}

const formatters = {};
const currency = (lang, whole) => (formatters[`${lang}${whole}`] ??= new Intl.NumberFormat(LOCALES[lang], {
  style: 'currency', currency: 'EUR', minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2,
}));

/**
 * La langue vient de l'adresse : /en/… = anglais, sinon français. Aucun cookie, aucun stockage.
 *   const { t, l, loc, money, lang } = useI18n();
 *   t('cart.title')                         texte
 *   t('cart.qtyOf', { name })               avec variable
 *   t('cart.terms', {}, [(c) => <Link to={l('/conditions-generales-de-vente')}>{c}</Link>])   avec lien (<0>…</0>)
 *   t('shop.done', { count })               pluriel (shop.done_one / shop.done_other)
 *   l('/produits?categorie=galets')         adresse française de référence -> adresse de la langue courante
 *   loc(produit)                            applique produit.translations[lang] s'il existe (API)
 *   money(12.5)                             « 12,50 € » / « €12.50 »
 */
export function I18nProvider({ children }) {
  const { pathname, search, hash } = useLocation();
  const lang = langFromPath(pathname);
  setApiLang(lang); // avant les effets des pages : leurs requêtes partent déjà avec la bonne langue

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const value = useMemo(() => {
    const plural = new Intl.PluralRules(LOCALES[lang]);
    const dict = DICTS[lang];
    const lookup = (key) => dict[key] ?? fr[key];
    const t = (key, vars, tags) => {
      let str;
      if (typeof vars?.count === 'number') str = lookup(`${key}_${plural.select(vars.count)}`);
      str ??= lookup(key);
      return str === undefined ? key : format(str, vars, tags);
    };
    const otherLang = lang === 'en' ? 'fr' : 'en';
    return {
      lang,
      otherLang,
      t,
      l: (path) => localizePath(path, lang),
      /** Adresse de la page courante dans l'autre langue (pour le sélecteur de langue) */
      switchPath: () => localizePath(toFrench(pathname + search + hash), otherLang),
      loc: (item) => (item?.translations?.[lang] ? { ...item, ...item.translations[lang] } : item),
      /** Texte qui peut être donné par langue : 'Texte' ou { fr: 'Texte', en: 'Text' } */
      pick: (v) => (v && typeof v === 'object' && !isValidElement(v) ? v[lang] ?? v.fr ?? Object.values(v)[0] : v),
      money: (n) => currency(lang, Number.isInteger(Number(n))).format(Number(n)),
      /** « 8 octobre 2026 » / « 8 October 2026 » à partir d'une date ISO */
      date: (iso) => new Intl.DateTimeFormat(LOCALES[lang], { dateStyle: 'long' }).format(new Date(iso)),
    };
  }, [lang, pathname, search, hash]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
