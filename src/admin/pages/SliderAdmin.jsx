import { useState } from 'react';
import ProductImage from '../../components/ui/ProductImage.jsx';
import { api, fieldErrors } from '../../services/api.js';
import useQuery from '../../services/useQuery.js';
import { cover } from '../../store/store.js';
import { Btn, Card, ErrorBox, Field, LinkBtn, Loading, PageHeader, euro, inputCls } from '../ui.jsx';

const Thumb = ({ p }) => {
  const img = cover(p);
  return <span className="block h-12 w-12 shrink-0 overflow-hidden rounded-md"><ProductImage tone={img.tone} src={img.src} label="" /></span>;
};

// Mêmes règles que l'API (GET /api/slider) : quels produits sont affichés, dans quel ordre
function pick(cfg, published) {
  if (!cfg.enabled) return [];
  if (cfg.mode === 'manual') return cfg.productIds.map((id) => published.find((p) => p.id === id)).filter(Boolean);
  return published.slice(0, cfg.count);
}

export default function SliderAdmin() {
  const settingsQ = useQuery(() => api.slider.get(), []);                                    // réglages actuels
  const productsQ = useQuery(() => api.products.list({ published: 1, perPage: 100 }), []);   // produits publiés
  if ((settingsQ.loading && !settingsQ.data) || (productsQ.loading && !productsQ.data)) {
    return <><PageHeader title="Slider d’accueil" /><Loading /></>;
  }
  const error = settingsQ.error || productsQ.error;
  if (error && (!settingsQ.data || !productsQ.data)) {
    return <><PageHeader title="Slider d’accueil" /><ErrorBox error={error} onRetry={() => { settingsQ.reload(); productsQ.reload(); }} /></>;
  }
  return <SliderEditor initial={settingsQ.data.settings} published={productsQ.data.data} />;
}

function SliderEditor({ initial, published }) {
  const [cfg, setCfg] = useState({ ...initial, productIds: initial.productIds.filter((id) => published.some((p) => p.id === id)) });
  const [status, setStatus] = useState({ ok: true, text: '' });
  const [saving, setSaving] = useState(false);

  const set = (patch) => { setCfg((c) => ({ ...c, ...patch })); setStatus({ ok: true, text: '' }); };
  const byId = (id) => published.find((p) => p.id === id);
  const available = published.filter((p) => !cfg.productIds.includes(p.id));
  const preview = pick(cfg, published);
  const move = (i, d) => {
    const ids = [...cfg.productIds];
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    set({ productIds: ids });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.slider.save(cfg); // PUT /api/slider
      setStatus({ ok: true, text: 'Slider enregistré. Les changements sont visibles sur l’accueil.' });
    } catch (err) {
      const fields = Object.values(fieldErrors(err));
      setStatus({ ok: false, text: fields.length ? fields.join(' ') : err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Slider d’accueil">
        <LinkBtn to="/" variant="secondary" target="_blank">Voir le site</LinkBtn>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="grid content-start gap-6">
          <Card className="grid gap-5 p-6">
            <h2 className="text-lg font-semibold text-black">Affichage</h2>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-black" checked={cfg.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
              Afficher le slider en haut de la page d’accueil
            </label>
            <Field label="Durée entre deux produits (secondes)">
              <select className={inputCls} value={cfg.delay} onChange={(e) => set({ delay: Number(e.target.value) })}>
                {[3, 4, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n} s</option>)}
              </select>
            </Field>
            <fieldset className="grid gap-2 text-sm">
              <legend className="mb-1 font-medium">Choix des produits</legend>
              <label className="flex items-start gap-3">
                <input type="radio" name="mode" className="mt-1 accent-black" checked={cfg.mode === 'auto'} onChange={() => set({ mode: 'auto' })} />
                <span><strong>Automatique</strong> : les premiers produits publiés de la boutique</span>
              </label>
              <label className="flex items-start gap-3">
                <input type="radio" name="mode" className="mt-1 accent-black" checked={cfg.mode === 'manual'} onChange={() => set({ mode: 'manual' })} />
                <span><strong>Manuel</strong> : je choisis les produits et leur ordre</span>
              </label>
            </fieldset>
            {cfg.mode === 'auto' && (
              <Field label="Nombre de produits">
                <select className={inputCls} value={cfg.count} onChange={(e) => set({ count: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
            )}
          </Card>

          {cfg.mode === 'manual' && (
            <Card className="grid gap-5 p-6">
              <div>
                <h2 className="text-lg font-semibold text-black">Produits du slider</h2>
                <p className="mt-1 text-sm">Dans l’ordre d’affichage. Seuls les produits publiés peuvent être choisis.</p>
              </div>
              <ul className="grid gap-2">
                {cfg.productIds.map((id, i) => {
                  const p = byId(id);
                  return (
                    <li key={id} className="flex flex-wrap items-center gap-3 rounded-lg border border-sand-200 bg-sand-50 p-2 text-sm">
                      <span className="w-5 text-center font-semibold text-black">{i + 1}</span>
                      <Thumb p={p} />
                      <span className="min-w-0 flex-1 font-medium">{p.name}</span>
                      <Btn variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Monter ${p.name}`}>Monter</Btn>
                      <Btn variant="ghost" onClick={() => move(i, 1)} disabled={i === cfg.productIds.length - 1} aria-label={`Descendre ${p.name}`}>Descendre</Btn>
                      <Btn variant="ghost" className="text-red-700" onClick={() => set({ productIds: cfg.productIds.filter((x) => x !== id) })}>Retirer</Btn>
                    </li>
                  );
                })}
                {cfg.productIds.length === 0 && <li className="text-sm text-red-800">Aucun produit sélectionné : le slider sera masqué.</li>}
              </ul>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Produits disponibles</h3>
                <ul className="grid gap-2">
                  {available.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-sand-200 p-2 text-sm">
                      <Thumb p={p} />
                      <span className="min-w-0 flex-1"><span className="font-medium">{p.name}</span> <span className="text-black/70">· {euro(p.price)}</span></span>
                      <Btn variant="secondary" onClick={() => set({ productIds: [...cfg.productIds, p.id] })}>Ajouter</Btn>
                    </li>
                  ))}
                  {available.length === 0 && <li className="text-sm">Tous les produits publiés sont dans le slider.</li>}
                </ul>
              </div>
            </Card>
          )}
        </div>

        <Card className="content-start p-6 xl:sticky xl:top-6">
          <h2 className="text-lg font-semibold text-black">Aperçu de l’ordre d’affichage</h2>
          {!cfg.enabled && <p className="mt-3 text-sm">Le slider est masqué sur le site.</p>}
          {cfg.enabled && preview.length === 0 && <p className="mt-3 text-sm">Aucun produit à afficher : le slider sera masqué.</p>}
          <ol className="mt-3 grid gap-2">
            {cfg.enabled && preview.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 text-sm">
                <span className="w-5 text-center font-semibold text-black">{i + 1}</span>
                <Thumb p={p} />
                <span className="font-medium">{p.name}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-3 border-t border-sand-200 bg-sand-50/95 py-3">
        <Btn onClick={save} loading={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Btn>
        {status.text && <p role="status" className={`text-sm font-medium ${status.ok ? 'text-black' : 'text-red-700'}`}>{status.text}</p>}
      </div>
    </>
  );
}
