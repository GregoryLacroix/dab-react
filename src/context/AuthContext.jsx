import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../services/api.js';
import IdleLogout, { ADMIN_IDLE_LIMIT_MS, IDLE_LIMIT_MS } from '../components/IdleLogout.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';

const AuthContext = createContext(null);

// Utilisateur connecté (site et back-office) : jeton conservé dans le navigateur, profil rechargé avec GET /api/auth/me
export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, loading: Boolean(getToken()) });

  useEffect(() => {
    if (!getToken()) return undefined;
    let alive = true;
    api.me().then(
      (user) => { if (alive) setState({ user, loading: false }); },
      (err) => {
        if (err.status === 401) setToken(null); // jeton refusé ; si l'API est simplement injoignable, on le garde
        if (alive) setState({ user: null, loading: false });
      }
    );
    return () => { alive = false; };
  }, []);

  // Session expirée détectée par n'importe quelle requête
  useEffect(() => {
    const onExpired = () => setState({ user: null, loading: false });
    window.addEventListener('dab:auth-expired', onExpired);
    return () => window.removeEventListener('dab:auth-expired', onExpired);
  }, []);

  // Inactivité : déconnexion automatique, puis message d'information
  const { t } = useI18n();
  const [idleNotice, setIdleNotice] = useState(false);
  const onIdle = useCallback(async () => {
    try { await api.logout(); } catch { /* déjà déconnecté côté serveur */ }
    setState({ user: null, loading: false });
    setIdleNotice(true);
  }, []);

  const value = useMemo(() => ({
    user: state.user,
    loading: state.loading,
    // Renvoie l'utilisateur connecté, ou { challenge } si un code de double authentification est encore à saisir
    async login(email, password) {
      const res = await api.login(email, password);
      if (res.challenge) return res;
      setState({ user: res, loading: false });
      return res;
    },
    // 2e étape (code de l'application ou code de secours)
    async verifyTwoFactor(challenge, code) {
      const user = await api.verifyTwoFactor(challenge, code);
      setState({ user, loading: false });
      return user;
    },
    // Recharge le profil (après activation ou désactivation de la double authentification)
    async refresh() {
      const user = await api.me();
      setState({ user, loading: false });
      return user;
    },
    // Connexion Google / Facebook : le jeton arrive dans l'adresse de retour (voir pages/OAuthReturn.jsx)
    async loginWithToken(token) {
      const user = await api.oauth.complete(token);
      setState({ user, loading: false });
      return user;
    },
    async logout() {
      try { await api.logout(); } catch { /* déjà déconnecté côté serveur */ }
      setState({ user: null, loading: false });
    },
  }), [state]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <IdleLogout active={Boolean(state.user)} onIdle={onIdle} limitMs={state.user?.isAdmin ? ADMIN_IDLE_LIMIT_MS : IDLE_LIMIT_MS} />
      {idleNotice && !state.user && (
        <div className="idle" role="alertdialog" aria-modal="true" aria-labelledby="idle-out-title">
          <div className="idle__box">
            <h2 id="idle-out-title">{t('idle.outTitle')}</h2>
            <p>{t('idle.outText')}</p>
            <button type="button" className="btn btn--primary" onClick={() => setIdleNotice(false)} autoFocus>{t('idle.ok')}</button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
