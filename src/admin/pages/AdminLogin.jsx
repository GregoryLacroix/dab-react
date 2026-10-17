import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card, Field, inputCls } from '../ui.jsx';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, loading, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!loading && user?.isAdmin) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(email.trim(), password); // POST /api/auth/login
      if (u.isAdmin) navigate('/admin', { replace: true });
      else { await logout(); setError('Ce compte n’a pas accès à l’administration.'); }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-sand-50 p-4 text-black">
      <Card className="w-full max-w-sm p-6">
        <img src={logo} alt="Les galets d’Ambre" className="mx-auto h-40 w-40 object-contain" />
        <h1 className="mt-2 text-center text-3xl font-bold text-black">Back-office</h1>
        <form onSubmit={submit} className="mt-5 grid gap-4">
          <Field label="E-mail">
            <input className={inputCls} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Mot de passe" error={error}>
            <input className={inputCls} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <button type="submit" disabled={busy} className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50">
            {busy && <span className="spinner spinner--inline" aria-hidden="true" />}{busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </Card>
    </div>
  );
}
