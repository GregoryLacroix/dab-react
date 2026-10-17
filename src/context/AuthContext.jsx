import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../services/api.js';

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

  const value = useMemo(() => ({
    user: state.user,
    loading: state.loading,
    async login(email, password) {
      const user = await api.login(email, password);
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
