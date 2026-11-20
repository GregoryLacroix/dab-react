import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider.jsx';

// Déconnexion automatique après une période d'inactivité (aucun clic, frappe, défilement ni toucher).
// - Avertissement 30 s avant la fin, avec un bouton « Rester connecté ».
// - L'activité est partagée entre les onglets (localStorage) ; un ordinateur mis en veille est déconnecté au réveil.
export const IDLE_LIMIT_MS = 5 * 60 * 1000;        // clients
export const ADMIN_IDLE_LIMIT_MS = 10 * 60 * 1000; // administrateur (formulaires plus longs)
const WARN_MS = 30 * 1000;
const KEY = 'dab-last-activity';
const EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'wheel'];

const readLast = () => { try { return Number(localStorage.getItem(KEY)) || 0; } catch { return 0; } };
const writeLast = (t) => { try { localStorage.setItem(KEY, String(t)); } catch { /* stockage indisponible */ } };

export default function IdleLogout({ active, onIdle, limitMs = IDLE_LIMIT_MS }) {
  const { t } = useI18n();
  const [secondsLeft, setSecondsLeft] = useState(null); // null = pas d'avertissement
  const last = useRef(Date.now());
  const lastWrite = useRef(0);

  const touch = useCallback(() => {
    const now = Date.now();
    last.current = now;
    if (now - lastWrite.current > 5000) { lastWrite.current = now; writeLast(now); } // pas d'écriture à chaque mouvement
    setSecondsLeft((s) => (s === null ? s : null));
  }, []);

  useEffect(() => {
    if (!active) { setSecondsLeft(null); return undefined; }
    touch();
    const onActivity = () => { if (Date.now() - last.current > 1000) touch(); };
    EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    const tick = () => {
      const idle = Date.now() - Math.max(last.current, readLast());
      if (idle >= limitMs) { setSecondsLeft(null); onIdle(); return; }
      setSecondsLeft(idle >= limitMs - WARN_MS ? Math.ceil((limitMs - idle) / 1000) : null);
    };
    const timer = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick); // réveil de l'ordinateur ou retour sur l'onglet
    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener('visibilitychange', tick);
      clearInterval(timer);
    };
  }, [active, onIdle, touch, limitMs]);

  if (!active || secondsLeft === null) return null;
  return (
    <div className="idle" role="alertdialog" aria-modal="true" aria-labelledby="idle-title">
      <div className="idle__box">
        <h2 id="idle-title">{t('idle.title')}</h2>
        <p>{t('idle.text', { seconds: secondsLeft })}</p>
        <button type="button" className="btn btn--primary" onClick={touch} autoFocus>{t('idle.stay')}</button>
      </div>
    </div>
  );
}
