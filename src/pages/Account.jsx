import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import FormField from '../components/ui/FormField.jsx';
import { PageLoader } from '../components/ui/Loaders.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, fieldErrors } from '../services/api.js';
import useSeo from '../services/seo.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

// Droits RGPD : accès / portabilité (export JSON) et effacement (suppression du compte)
export default function Account() {
  const { t, l } = useI18n();
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState({ ok: true, text: '' });
  const [askDelete, setAskDelete] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  useSeo({ title: t('account.title'), path: '/mon-compte', noindex: true });

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to={l('/connexion')} replace />;

  const exportData = async () => {
    setExporting(true);
    setMessage({ ok: true, text: '' });
    try {
      const data = await api.account.export(); // GET /api/auth/me/export
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = t('account.fileName');
      a.click();
      URL.revokeObjectURL(a.href);
      setMessage({ ok: true, text: t('account.downloaded') });
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async (e) => {
    e.preventDefault();
    const social = !user.hasPassword; // compte créé avec Google / Facebook : pas de mot de passe, on confirme avec l'adresse e-mail
    if (!password) return setError(t(social ? 'account.emailRequired' : 'account.passwordRequired'));
    setDeleting(true);
    setError('');
    try {
      await api.account.remove(social ? { email: password } : { password }); // DELETE /api/auth/me
      await logout();
      navigate(l('/'), { replace: true });
    } catch (err) {
      setError(fieldErrors(err).password ?? err.message);
      setDeleting(false);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <h1>{t('account.title')}</h1>
        <div className="account">
          <div className="account__card">
            <h2>{t('account.infoTitle')}</h2>
            <p><strong>{t('account.nameLabel')}</strong> {user.name}</p>
            <p><strong>{t('account.emailLabel')}</strong> {user.email}</p>
          </div>

          <div className="account__card">
            <h2>{t('account.dataTitle')}</h2>
            <p>{t('account.dataText')}</p>
            <Button variant="ghost" onClick={exportData} loading={exporting}>{t('account.download')}</Button>
            {message.text && <p className={`notice ${message.ok ? '' : 'notice--error'}`} role="status">{message.text}</p>}
          </div>

          <div className="account__card">
            <h2>{t('account.deleteTitle')}</h2>
            {user.isAdmin ? (
              <p>{t('account.adminNoDelete')}</p>
            ) : !askDelete ? (
              <>
                <p>{t('account.deleteWarning')}</p>
                <Button variant="ghost" onClick={() => setAskDelete(true)}>{t('account.deleteAsk')}</Button>
              </>
            ) : (
              <form onSubmit={deleteAccount} noValidate>
                <FormField label={t(user.hasPassword ? 'account.passwordConfirm' : 'account.emailConfirm')} name="password"
                  type={user.hasPassword ? 'password' : 'email'} autoComplete={user.hasPassword ? 'current-password' : 'email'}
                  value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
                <div className="hero__actions">
                  <Button type="submit" loading={deleting}>{t('account.deleteNow')}</Button>
                  <Button variant="ghost" onClick={() => { setAskDelete(false); setPassword(''); setError(''); }}>{t('account.cancel')}</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
