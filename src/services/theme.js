// Thème clair / sombre.
// Par défaut le site suit l'appareil (prefers-color-scheme). Si le visiteur clique sur le bouton, son choix est mémorisé
// (clé `dab-theme` du stockage local : préférence d'affichage demandée par le visiteur, sans donnée personnelle).
import { useSyncExternalStore } from 'react';

const KEY = 'dab-theme';
const BG = { light: '#faf6ef', dark: '#14120f' };
const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
const listeners = new Set();

const stored = () => {
  try { const v = localStorage.getItem(KEY); return v === 'dark' || v === 'light' ? v : null; } catch { return null; }
};
const resolve = () => stored() ?? (mq?.matches ? 'dark' : 'light');

// Applique le choix mémorisé (s'il y en a un) et la couleur de la barre du navigateur
function paint() {
  const root = document.documentElement;
  const choice = stored();
  if (choice) root.dataset.theme = choice; else delete root.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BG[resolve()]);
}
const notify = () => listeners.forEach((l) => l());

export function initTheme() {
  paint();
  mq?.addEventListener?.('change', () => { paint(); notify(); });
}

export function toggleTheme() {
  const next = resolve() === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem(KEY, next); } catch { /* stockage indisponible : le choix vaut pour cette page seulement */ document.documentElement.dataset.theme = next; }
  paint();
  notify();
}

export function useTheme() {
  const theme = useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, resolve, () => 'light');
  return { theme, toggle: toggleTheme };
}
