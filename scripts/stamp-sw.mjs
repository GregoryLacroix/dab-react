// Après « vite build » : donne à dist/sw.js un numéro de version unique (date de construction).
// Le fichier change à chaque mise en ligne : les navigateurs installent la nouvelle version et suppriment les anciens caches.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const file = 'dist/sw.js';
if (!existsSync(file)) {
  console.warn('stamp-sw : dist/sw.js introuvable, ignoré.');
  process.exit(0);
}
const id = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
writeFileSync(file, readFileSync(file, 'utf8').replaceAll('__BUILD_ID__', id));
console.log(`stamp-sw : version ${id}.`);
