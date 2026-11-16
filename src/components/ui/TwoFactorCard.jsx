import { useEffect, useState } from 'react';
import Button from './Button.jsx';
import FormField from './FormField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api, fieldErrors } from '../../services/api.js';
import { saveBlob } from '../../services/download.js';
import { useI18n } from '../../i18n/I18nProvider.jsx';

// Carte « Double authentification » de la page Mon compte : activation (QR code), codes de secours, désactivation.
// stage : idle (état) | password (confirmer le mot de passe) | scan (QR code + premier code) | codes (codes de secours, affichés une seule fois)
export default function TwoFactorCard() {
  const { t, date } = useI18n();
  const { user, refresh } = useAuth();
  const [status, setStatus] = useState(null);     // { enabled, enabledAt, recoveryCodesLeft }
  const [stage, setStage] = useState('idle');
  const [action, setAction] = useState(null);     // 'disable' | 'regenerate' : confirmation mot de passe + code
  const [setup, setSetup] = useState(null);       // { secret, qr }
  const [codes, setCodes] = useState([]);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ password: '', code: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.twoFactor.status().then(setStatus, (err) => setErrors({ form: err.message })); // GET /api/auth/2fa
  }, []);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const fail = (err) => setErrors(Object.keys(fieldErrors(err)).length ? fieldErrors(err) : { form: err.message });
  const reloadStatus = async () => { setStatus(await api.twoFactor.status()); await refresh(); };
  const reset = () => { setStage('idle'); setAction(null); setSetup(null); setCodes([]); setSaved(false); setErrors({}); setForm({ password: '', code: '' }); };

  // Étape 1 : mot de passe confirmé (si le compte en a un) -> secret + QR code
  const startSetup = async (e) => {
    e?.preventDefault();
    if (user.hasPassword && !form.password) return setErrors({ password: t('login.errPassword') });
    setBusy(true); setErrors({});
    try {
      const res = await api.twoFactor.setup(user.hasPassword ? form.password : undefined); // POST /api/auth/2fa/setup
      const QRCode = (await import('qrcode')).default; // chargé seulement ici (bibliothèque de génération du QR code)
      setSetup({ secret: res.secret, qr: await QRCode.toDataURL(res.otpauthUrl, { width: 224, margin: 1 }) });
      setForm({ password: '', code: '' });
      setStage('scan');
    } catch (err) { fail(err); }
    setBusy(false);
  };

  // Étape 2 : premier code de l'application -> activée, codes de secours affichés
  const confirm = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) return setErrors({ code: t('twofa.errCode') });
    setBusy(true); setErrors({});
    try {
      const res = await api.twoFactor.enable(form.code.trim()); // POST /api/auth/2fa/enable
      setCodes(res.recoveryCodes); setStage('codes'); setSetup(null); setForm({ password: '', code: '' });
      await reloadStatus();
    } catch (err) { fail(err); }
    setBusy(false);
  };

  // Désactivation ou nouveaux codes : mot de passe (si le compte en a un) ET code
  const confirmAction = async (e) => {
    e.preventDefault();
    const err = {};
    if (user.hasPassword && !form.password) err.password = t('login.errPassword');
    if (!form.code.trim()) err.code = t('twofa.errCode');
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    try {
      if (action === 'disable') {
        await api.twoFactor.disable(user.hasPassword ? form.password : undefined, form.code.trim()); // POST /api/auth/2fa/disable
        reset();
      } else {
        const res = await api.twoFactor.recoveryCodes(user.hasPassword ? form.password : undefined, form.code.trim()); // POST /api/auth/2fa/recovery-codes
        setCodes(res.recoveryCodes); setStage('codes'); setAction(null); setForm({ password: '', code: '' });
      }
      await reloadStatus();
    } catch (error) { fail(error); }
    setBusy(false);
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(codes.join('\n')); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* copie impossible : le bouton « Télécharger » reste disponible */ }
  };
  const download = () => saveBlob(new Blob([`${t('twofa.card.codesTitle')}\n\n${codes.join('\n')}\n`], { type: 'text/plain' }), 'codes-de-secours-galets-dambre.txt');

  return (
    <div className="account__card">
      <h2>{t('twofa.card.title')}</h2>
      {errors.form && <p className="notice notice--error" role="alert">{errors.form}</p>}
      {!status && !errors.form && <p role="status">{t('loading')}</p>}

      {status && stage === 'idle' && !action && (
        <>
          <p>{t('twofa.card.intro')}</p>
          {status.enabled ? (
            <>
              <p className="notice" role="status">
                {t('twofa.card.on', { date: status.enabledAt ? date(status.enabledAt) : '' })} {t('twofa.card.left', { count: status.recoveryCodesLeft })}
              </p>
              <div className="hero__actions">
                <Button variant="ghost" onClick={() => setAction('regenerate')}>{t('twofa.card.regenerate')}</Button>
                <Button variant="ghost" onClick={() => setAction('disable')}>{t('twofa.card.disable')}</Button>
              </div>
            </>
          ) : (
            <>
              <p>{t('twofa.card.off')}</p>
              {user.hasPassword
                ? <Button onClick={() => setStage('password')}>{t('twofa.card.enable')}</Button>
                : <Button onClick={startSetup} loading={busy}>{t('twofa.card.enable')}</Button>}
            </>
          )}
        </>
      )}

      {stage === 'password' && (
        <form onSubmit={startSetup} noValidate>
          <p>{t('twofa.card.passwordHint')}</p>
          <FormField label={t('field.password')} name="password" type="password" autoComplete="current-password" autoFocus
            value={form.password} onChange={change} error={errors.password} />
          <div className="hero__actions">
            <Button type="submit" loading={busy}>{t('twofa.card.continue')}</Button>
            <Button variant="ghost" onClick={reset}>{t('account.cancel')}</Button>
          </div>
        </form>
      )}

      {stage === 'scan' && setup && (
        <form onSubmit={confirm} noValidate>
          <h3>{t('twofa.card.scanTitle')}</h3>
          <p>{t('twofa.card.scanText')}</p>
          <img className="twofa__qr" src={setup.qr} width="224" height="224" alt={t('twofa.card.qrAlt')} />
          <p className="twofa__secret">{setup.secret.match(/.{1,4}/g).join(' ')}</p>
          <h3>{t('twofa.card.codeTitle')}</h3>
          <FormField label={t('twofa.code')} name="code" autoComplete="one-time-code" inputMode="numeric" autoFocus spellCheck={false}
            value={form.code} onChange={change} error={errors.code} />
          <div className="hero__actions">
            <Button type="submit" loading={busy}>{t('twofa.card.verify')}</Button>
            <Button variant="ghost" onClick={reset}>{t('account.cancel')}</Button>
          </div>
        </form>
      )}

      {stage === 'codes' && (
        <>
          <h3>{t('twofa.card.codesTitle')}</h3>
          <p>{t('twofa.card.codesText')}</p>
          <ul className="twofa__codes">{codes.map((c) => <li key={c}>{c}</li>)}</ul>
          <div className="hero__actions">
            <Button variant="ghost" onClick={copy}>{copied ? t('twofa.card.copied') : t('twofa.card.copy')}</Button>
            <Button variant="ghost" onClick={download}>{t('twofa.card.download')}</Button>
          </div>
          <label className="check">
            <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
            <span>{t('twofa.card.saved')}</span>
          </label>
          <Button onClick={reset} disabled={!saved}>{t('twofa.card.done')}</Button>
        </>
      )}

      {action && stage === 'idle' && (
        <form onSubmit={confirmAction} noValidate>
          <p>{t('twofa.card.confirmText')}</p>
          {user.hasPassword && (
            <FormField label={t('field.password')} name="password" type="password" autoComplete="current-password"
              value={form.password} onChange={change} error={errors.password} />
          )}
          <FormField label={t('twofa.code')} name="code" autoComplete="one-time-code" spellCheck={false}
            value={form.code} onChange={change} error={errors.code} />
          <div className="hero__actions">
            <Button type="submit" loading={busy}>{action === 'disable' ? t('twofa.card.disable') : t('twofa.card.regenerate')}</Button>
            <Button variant="ghost" onClick={reset}>{t('account.cancel')}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
