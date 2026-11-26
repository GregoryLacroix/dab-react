/* Service worker du site (PWA). Volontairement prudent :
 *  - les pages (HTML) sont toujours demandées au réseau : prix, stock et panier ne sont jamais périmés ;
 *    sans réseau, on affiche /offline.html ;
 *  - seuls les fichiers de l'interface de /assets/ (scripts, styles, polices : leur nom change à chaque version) sont gardés sur
 *    l'appareil, pour que le site s'ouvre plus vite ;
 *  - l'API, Stripe et les photos (autres domaines) ne passent jamais par ici.
 * 20261126120641 est remplacé à chaque « npm run build » (scripts/stamp-sw.mjs) : le fichier change, donc le navigateur
 * installe la nouvelle version et les anciens caches sont supprimés. */
const BUILD = '20261126120641';
const ASSETS = `dab-assets-${BUILD}`;
const PAGES = `dab-pages-${BUILD}`;
const OFFLINE = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGES).then((cache) => cache.addAll([OFFLINE, '/icon-192.png'])).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('dab-') && k !== ASSETS && k !== PAGES).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // API, Stripe, photos : réseau direct

  // Pages : réseau d'abord ; hors connexion, page de secours
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.open(PAGES).then((cache) => cache.match(OFFLINE)).then((r) => r || Response.error()))
    );
    return;
  }

  // Fichiers de l'interface : déjà en mémoire si possible, sinon réseau puis mémorisation
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(ASSETS).then((cache) =>
        cache.match(request).then((hit) => hit || fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        }))
      )
    );
  }
});
