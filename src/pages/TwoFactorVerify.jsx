import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TwoFactorForm from '../components/ui/TwoFactorForm.jsx';
import useSeo from '../services/seo.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

// Le « challenge » arrive dans le FRAGMENT de l'adresse (#challenge=…) après une connexion Google : jamais envoyé à un serveur.
// On l'efface de l'adresse dès qu'il est lu ; la variable partagée évite de le perdre quand React exécute deux fois l'effet (mode développement).
let savedChallenge = '';

// Après Google : /connexion/verification#challenge=…  (anglais : /en/login/verification)
export default function TwoFactorVerify() {
  const { t, l } = useI18n();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(savedChallenge);
  useSeo({ title: t('twofa.title'), path: '/connexion/verification', noindex: true });

  useEffect(() => {
    const found = window.location.hash.match(/challenge=([A-Za-z0-9_.-]+)/);
    if (found) {
      savedChallenge = found[1];
      window.history.replaceState(null, '', window.location.pathname);
      setChallenge(found[1]);
    }
  }, []);

  return (
    <section className="section">
      <div className="auth">
        <h1>{t('twofa.title')}</h1>
        {challenge ? (
          <TwoFactorForm challenge={challenge} onDone={(user) => { savedChallenge = ''; navigate(user.isAdmin ? '/admin' : l('/'), { replace: true }); }} />
        ) : (
          <>
            <p>{t('twofa.expired')}</p>
            <p className="auth__alt"><Link to={l('/connexion')}>{t('forgot.back')}</Link></p>
          </>
        )}
      </div>
    </section>
  );
}
