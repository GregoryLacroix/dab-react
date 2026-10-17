import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useI18n } from '../../i18n/I18nProvider.jsx';

// Logos officiels (Google : 4 couleurs ; Facebook : « f » bleu), dessinés en SVG pour ne charger aucune ressource externe
const LOGOS = {
  google: (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  ),
};

// Une seule requête pour toute la session de navigation : { providers: [{ id, label }] } (vide si l'API n'a aucune clé configurée)
let providersPromise;
const loadProviders = () => (providersPromise ??= api.oauth.providers().then((r) => r.providers ?? [], () => { providersPromise = undefined; return []; }));

/** Texte du bandeau affiché sur /connexion?oauth=<raison> après un retour de Google / Facebook (null s'il n'y en a pas) */
export function oauthBanner(reason, t) {
  if (!reason) return null;
  const known = ['cancelled', 'invalid_state', 'failed', 'disabled', 'email_missing', 'account_exists', 'verify_email'];
  const key = known.includes(reason) ? reason : 'failed';
  return { ok: key === 'verify_email', text: t(`oauth.err.${key}`) };
}

/** Boutons « Continuer avec Google / Facebook » : n'affiche rien tant qu'aucun fournisseur n'est configuré côté API. */
export default function SocialLogin() {
  const { t, l } = useI18n();
  const [providers, setProviders] = useState([]);
  useEffect(() => {
    let alive = true;
    loadProviders().then((list) => { if (alive) setProviders(list); });
    return () => { alive = false; };
  }, []);

  if (providers.length === 0) return null;
  return (
    <div className="social">
      <p className="social__or"><span>{t('oauth.or')}</span></p>
      {providers.map((p) => (
        // Lien normal (pas de JavaScript) : le navigateur quitte le site pour la page du fournisseur
        <a key={p.id} className="social__btn" href={api.oauth.startUrl(p.id)} rel="nofollow">
          {LOGOS[p.id]}
          <span>{t(`oauth.${p.id}`)}</span>
        </a>
      ))}
      <p className="note social__note">
        {t('oauth.consent', {}, [
          (c) => <Link to={l('/politique-de-confidentialite')}>{c}</Link>,
          (c) => <Link to={l('/conditions-generales-de-vente')}>{c}</Link>,
        ])}
      </p>
    </div>
  );
}
