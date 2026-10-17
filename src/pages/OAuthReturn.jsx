import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import { PageLoader } from '../components/ui/Loaders.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useSeo from '../services/seo.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

// Mémoire partagée entre les deux exécutions de l'effet en mode développement (React StrictMode) : le jeton n'est lu qu'une fois
let attempt; // { token, promise }
function consumeToken() {
  const found = window.location.hash.match(/token=([a-f0-9]{64})/);
  if (found) {
    // Le jeton ne doit pas rester dans l'adresse (historique, copier-coller) : on l'efface tout de suite
    window.history.replaceState(null, '', window.location.pathname);
    attempt = { token: found[1] };
  }
  return attempt;
}

// Retour de Google / Facebook : /connexion/retour#token=…  (anglais : /en/login/callback)
export default function OAuthReturn() {
  const { t, l } = useI18n();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  useSeo({ title: t('login.title'), path: '/connexion/retour', noindex: true });

  useEffect(() => {
    const current = consumeToken();
    if (!current) { setFailed(true); return undefined; }
    let alive = true;
    current.promise ??= loginWithToken(current.token);
    current.promise.then(
      (user) => { if (alive) navigate(user.isAdmin ? '/admin' : l('/'), { replace: true }); },
      () => { if (alive) setFailed(true); },
    );
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!failed) return <PageLoader label={t('oauth.signing')} />;
  return (
    <section className="section container empty">
      <h1>{t('oauth.failTitle')}</h1>
      <p>{t('oauth.failText')}</p>
      <Button to={l('/connexion')}>{t('oauth.backToLogin')}</Button>
    </section>
  );
}
