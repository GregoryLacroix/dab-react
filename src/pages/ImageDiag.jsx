import { useEffect, useState } from 'react';
import useSeo from '../services/seo.js';
import ProductImage from '../components/ui/ProductImage.jsx';
import ProductCard from '../components/ui/ProductCard.jsx';
import Reveal from '../components/effects/Reveal.jsx';

// Page de diagnostic (non référencée) : /diag-images
// Teste le chargement des photos sur l'appareil qui l'ouvre et affiche un rapport à copier ou à capturer.
const API = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

const loadImg = (src, attrs = {}) => new Promise((resolve) => {
  const img = new Image();
  Object.assign(img, attrs);
  const t = setTimeout(() => resolve('délai dépassé (15 s)'), 15000);
  img.onload = () => { clearTimeout(t); resolve(`OK ${img.naturalWidth}×${img.naturalHeight}`); };
  img.onerror = () => { clearTimeout(t); resolve('ÉCHEC (image refusée ou introuvable)'); };
  img.src = src;
});

const probe = async (url) => {
  const out = {};
  try {
    const r = await fetch(url, { mode: 'cors', cache: 'no-store' });
    out.cors = `HTTP ${r.status}, type ${r.headers.get('content-type')}, ${r.headers.get('content-length') ?? '?'} octets`;
  } catch (e) { out.cors = `bloqué ou erreur réseau (${e.message})`; }
  try { await fetch(url, { mode: 'no-cors', cache: 'no-store' }); out.noCors = 'réponse reçue'; } catch (e) { out.noCors = `ÉCHEC réseau (${e.message})`; }
  return out;
};

// Une variante d'affichage : l'état (chargée / échec) est écrit sous la vignette
function Probe({ label, children }) {
  return <figure style={{ margin: 0, width: 120, fontSize: '.7rem' }}>{children}<figcaption>{label}</figcaption></figure>;
}
function Img({ src, label, ...attrs }) {
  const [state, setState] = useState('…');
  return (
    <Probe label={`${label} : ${state}`}>
      <img src={src} alt="alt" width="100" height="100" style={{ objectFit: 'cover', display: 'block' }} {...attrs}
        onLoad={() => setState('OK')} onError={() => setState('ÉCHEC')} />
    </Probe>
  );
}

export default function ImageDiag() {
  useSeo({ title: 'Diagnostic des images', noindex: true });
  const [lines, setLines] = useState(['Test en cours…']);
  const [sample, setSample] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const L = [];
      const push = (s) => L.push(s);
      const c = navigator.connection;
      push(`Page : ${location.href}`);
      push(`Appareil : ${navigator.userAgent}`);
      push(`Écran : ${innerWidth}×${innerHeight}, densité ${devicePixelRatio}`);
      push(`Connexion : ${navigator.onLine ? 'en ligne' : 'hors ligne'}, type ${c?.effectiveType ?? '?'}, économie de données ${c?.saveData ? 'OUI' : 'non'}`);
      push(`API : ${API}`);
      push('');
      push('— Témoin : images du site lui-même —');
      push(`/favicon.png : ${await loadImg(`${location.origin}/favicon.png`)}`);
      push(`/logo.png : ${await loadImg(`${location.origin}/logo.png`)}`);
      push('');
      let products = [];
      try {
        const r = await fetch(`${API}/api/products?perPage=4`, { cache: 'no-store' });
        push(`Liste des produits : HTTP ${r.status}`);
        products = (await r.json()).data ?? [];
        if (alive) setSample(products[0] ?? null);
      } catch (e) { push(`Liste des produits : ÉCHEC (${e.message})`); }
      for (const p of products) {
        const src = p.images?.[0]?.src;
        push('');
        push(`— Produit ${p.id} « ${p.name} » —`);
        if (!src) { push('pas de photo'); continue; }
        push(`Adresse : ${src}`);
        push(`Image normale : ${await loadImg(src)}`);
        push(`Image sans Referer : ${await loadImg(src, { referrerPolicy: 'no-referrer' })}`);
        push(`Image avec crossOrigin : ${await loadImg(src, { crossOrigin: 'anonymous' })}`);
        const pr = await probe(src);
        push(`Requête fetch (lecture) : ${pr.cors}`);
        push(`Requête fetch (sans lecture) : ${pr.noCors}`);
      }
      push('');
      push('Fin du test.');
      if (alive) setLines(L);
    })();
    return () => { alive = false; };
  }, []);

  const text = lines.join('\n');
  return (
    <main style={{ padding: '1rem', fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.3rem' }}>Diagnostic des images</h1>
      <p>Laissez la page terminer (quelques secondes), puis faites une capture d’écran ou copiez le rapport.</p>
      <button type="button" onClick={() => navigator.clipboard?.writeText(text)} style={{ padding: '.6rem 1rem', marginBottom: '.8rem' }}>Copier le rapport</button>
      {sample?.images?.[0]?.src && (
        <section>
          <h2 style={{ fontSize: '1.05rem' }}>Variantes d’affichage (même photo)</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.8rem', margin: '.6rem 0 1rem' }}>
            <Img src={sample.images[0].src} label="A simple" />
            <Img src={sample.images[0].src} label="B lazy" loading="lazy" />
            <Img src={sample.images[0].src} label="C lazy+async" loading="lazy" decoding="async" />
            <Img src={sample.images[0].src} label="D classe pimg" className="pimg" />
            <Probe label="E ProductImage"><div style={{ width: 100 }}><ProductImage src={sample.images[0].src} label="alt" /></div></Probe>
            <Probe label="F ProductImage eager"><div style={{ width: 100 }}><ProductImage src={sample.images[0].src} label="alt" eager /></div></Probe>
          </div>
          <h2 style={{ fontSize: '1.05rem' }}>Carte produit du site</h2>
          <div style={{ maxWidth: 300 }}><ProductCard product={sample} /></div>
          <h2 style={{ fontSize: '1.05rem' }}>Même carte dans l’animation d’apparition</h2>
          <div style={{ maxWidth: 300, marginBottom: '1rem' }}><Reveal><ProductCard product={sample} /></Reveal></div>
        </section>
      )}
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '.8rem', background: '#f4f4f4', color: '#000', padding: '.8rem', borderRadius: 8 }}>{text}</pre>
    </main>
  );
}
