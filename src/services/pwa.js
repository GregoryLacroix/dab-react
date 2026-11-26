// PWA : enregistrement du service worker (public/sw.js) et bouton « Installer l'application »
import { useEffect, useState } from 'react';

let deferred = null;           // invitation d'installation fournie par Chrome / Edge / Android (absente sur iPhone)
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());

export function initPwa() {
  if (typeof window === 'undefined') return;
  // Installation : on garde l'invitation du navigateur pour l'offrir via notre propre bouton (pied de page)
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; notify(); });
  window.addEventListener('appinstalled', () => { deferred = null; notify(); });
  // Service worker : uniquement sur le site en ligne (pas en développement, où il gênerait le rechargement automatique)
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => { /* sans conséquence : le site fonctionne sans */ }); });
  }
}

/** { canInstall, install } : canInstall est vrai quand le navigateur propose l'installation et que le site n'est pas déjà installé */
export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => { const l = () => force((n) => n + 1); listeners.add(l); return () => listeners.delete(l); }, []);
  const standalone = typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);
  return {
    canInstall: !!deferred && !standalone,
    install: async () => {
      if (!deferred) return;
      deferred.prompt();
      await deferred.userChoice.catch(() => {});
      deferred = null;
      notify();
    },
  };
}
