import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProductImage from '../../components/ui/ProductImage.jsx';
import { api, fieldErrors } from '../../services/api.js';
import useQuery from '../../services/useQuery.js';
import { useCategories } from '../../store/store.js';
import { Btn, Card, ConfirmDialog, ErrorBox, Field, LinkBtn, Loading, PageHeader, inputCls } from '../ui.jsx';

const MIN_SLOTS = 4; // emplacements photo toujours affichés
const MAX_SLOTS = 8;
const MAX_BYTES = 5 * 1024 * 1024;
const normalize = (list) => Array.from({ length: Math.max(MIN_SLOTS, list.length) }, (_, i) => list[i] ?? null);
const trim = (list) => { const out = [...list]; while (out.length > MIN_SLOTS && out[out.length - 1] === null) out.pop(); return out; };

// Place les images : la première à l'emplacement "start" (si donné), les autres dans les emplacements vides
function fill(list, imgs, start) {
  const out = [...list];
  imgs.forEach((img, k) => {
    let i = k === 0 && start != null ? start : out.findIndex((s) => s === null);
    if (i === -1) { if (out.length >= MAX_SLOTS) return; i = out.length; }
    out[i] = img;
  });
  return out;
}

function PhotoSlot({ index, img, onPick, onRemove, onMakeMain, disabled }) {
  const fileInput = <input type="file" accept="image/*" className="sr-only" onChange={onPick} disabled={disabled} />;
  return (
    <div className="rounded-xl border border-sand-200 bg-sand-50 p-3">
      <p className="mb-2 text-sm font-semibold text-black">{index === 0 ? 'Photo principale' : `Photo ${index + 1}`}</p>
      {img ? (
        <>
          <div className="overflow-hidden rounded-lg"><ProductImage tone={img.tone} src={img.src} label={img.alt || ''} /></div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
            <label className="cursor-pointer text-black underline hover:no-underline">Remplacer{fileInput}</label>
            {index > 0 && <button type="button" className="text-black underline hover:no-underline" onClick={onMakeMain}>Mettre en principale</button>}
            <button type="button" className="text-red-700 hover:underline" onClick={onRemove}>Retirer</button>
          </div>
        </>
      ) : (
        <label className="grid aspect-square cursor-pointer place-items-center rounded-lg border-2 border-dashed border-sand-400 text-center text-sm hover:border-black hover:bg-sand-100">
          <span><span className="block text-3xl leading-none text-black">+</span><span className="mt-1 block">Ajouter une photo</span></span>
          {fileInput}
        </label>
      )}
    </div>
  );
}

// /admin/produits/nouveau -> formulaire vide ; /admin/produits/:id -> charge le produit (GET /api/products/{id})
export default function ProductForm() {
  const { id } = useParams();
  return id ? <ProductLoader id={id} /> : <ProductEditor initial={null} />;
}

function ProductLoader({ id }) {
  const { data, error, loading, reload } = useQuery(() => api.products.get(id), [id]);
  if (loading && !data) return <><PageHeader title="Modifier le produit" /><Loading /></>;
  if (error?.status === 404) {
    return <><PageHeader title="Produit introuvable" /><LinkBtn to="/admin/produits" variant="secondary">Retour aux produits</LinkBtn></>;
  }
  if (error && !data) return <><PageHeader title="Modifier le produit" /><ErrorBox error={error} onRetry={reload} /></>;
  return <ProductEditor key={data.id} initial={data} />;
}

function ProductEditor({ initial }) {
  const isNew = !initial;
  const categories = useCategories();
  const navigate = useNavigate();

  const [form, setForm] = useState(() =>
    initial
      ? { ...initial, price: String(initial.price), stock: String(initial.stock ?? 1), images: initial.images ?? [] }
      : { name: '', categoryId: '', price: '', stock: '1', description: '', published: true, images: [] }
  );
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);   // envoi de photos
  const [saving, setSaving] = useState(false);
  const [url, setUrl] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Nouveau produit : première catégorie choisie par défaut dès que la liste est chargée
  useEffect(() => {
    if (isNew && !form.categoryId && categories.length) setForm((f) => ({ ...f, categoryId: categories[0].id }));
  }, [isNew, form.categoryId, categories]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const patchImages = (fn) => setForm((f) => ({ ...f, images: trim(fn(normalize(f.images))) }));

  // Envoi des photos sur le serveur : POST /api/uploads -> { src }
  const load = async (files, start = null) => {
    if (!files.length) return;
    if (files.some((f) => f.size > MAX_BYTES)) return setMessage('Une image dépasse 5 Mo.');
    setBusy(true);
    setMessage('');
    try {
      const imgs = [];
      for (const file of files) imgs.push({ src: (await api.upload(file)).src, alt: '' });
      patchImages((l) => fill(l, imgs, start));
    } catch (err) {
      setMessage(err.violations?.file ?? err.message);
    } finally {
      setBusy(false);
    }
  };
  const pick = (start) => (e) => { const files = [...e.target.files]; e.target.value = ''; load(files, start); };
  const addUrl = () => {
    if (!/^(https?:\/\/|\/)/.test(url.trim())) return setMessage('Saisissez une adresse commençant par http(s):// ou /.');
    patchImages((l) => fill(l, [{ src: url.trim(), alt: '' }], null));
    setUrl('');
    setMessage('');
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    const price = Number(String(form.price).replace(',', '.'));
    if (!form.name.trim()) err.name = 'Saisissez le nom du produit.';
    if (!form.categoryId) err.categoryId = 'Choisissez une catégorie (créez-en une si besoin).';
    if (form.price === '' || !(price >= 0)) err.price = 'Saisissez un prix valide.';
    const stock = Number(form.stock);
    if (form.stock === '' || !Number.isInteger(stock) || stock < 0 || stock > 9999) err.stock = 'Quantité entière de 0 à 9999.';
    setErrors(err);
    if (Object.keys(err).length) return;

    const payload = {
      name: form.name.trim(), categoryId: form.categoryId, price, stock,
      description: form.description.trim(), published: form.published,
      images: form.images.filter(Boolean),
    };
    setSaving(true);
    setMessage('');
    try {
      if (isNew) await api.products.create(payload);          // POST /api/products
      else await api.products.update(initial.id, payload);    // PATCH /api/products/{id}
      navigate('/admin/produits');
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(fields);
      const others = Object.entries(fields).filter(([k]) => !['name', 'categoryId', 'price', 'stock', 'description'].includes(k)).map(([, v]) => v);
      setMessage(error.status === 422 ? (others.join(' ') || 'Corrigez les champs indiqués.') : error.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await api.products.remove(initial.id); // DELETE /api/products/{id}
      navigate('/admin/produits');
    } catch (error) {
      setConfirmDelete(false);
      setMessage(error.message);
    }
  };

  return (
    <>
      <PageHeader title={isNew ? 'Nouveau produit' : 'Modifier le produit'}>
        <LinkBtn to="/admin/produits" variant="ghost">Retour aux produits</LinkBtn>
      </PageHeader>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="grid gap-6 lg:col-span-2">
          <Card className="grid gap-6 p-6">
            <h2 className="text-lg font-semibold text-black">Informations</h2>
            <Field label="Nom du produit" error={errors.name}>
              <input className={inputCls} value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Description" hint="Affichée sur la fiche produit et dans le slider d’accueil." error={errors.description}>
              <textarea className={inputCls} rows={7} value={form.description} onChange={set('description')} />
            </Field>
          </Card>

          <Card className="grid gap-5 p-6">
            <div>
              <h2 className="text-lg font-semibold text-black">Photos</h2>
              <p className="mt-1 text-sm">Jusqu’à {MAX_SLOTS} photos (5 Mo maximum chacune, envoyées sur le serveur). La première est celle des cartes produit et du slider ; toutes apparaissent dans le carrousel de la fiche produit.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {normalize(form.images).map((img, i) => (
                <PhotoSlot key={i} index={i} img={img} disabled={busy} onPick={pick(i)}
                  onRemove={() => patchImages((l) => l.map((x, k) => (k === i ? null : x)))}
                  onMakeMain={() => patchImages((l) => [l[i], ...l.filter((_, k) => k !== i)])} />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-sand-200 pt-5">
              <label className={`cursor-pointer rounded-lg border border-black px-4 py-2 text-sm font-semibold text-black hover:bg-sand-200 ${busy ? 'opacity-50' : ''}`}>
                {busy && <span className="spinner spinner--inline" aria-hidden="true" />}{busy ? 'Envoi en cours…' : 'Ajouter plusieurs photos d’un coup'}
                <input type="file" accept="image/*" multiple className="sr-only" disabled={busy} onChange={pick(null)} />
              </label>
              <div className="flex min-w-[260px] flex-1 gap-2">
                <input className={inputCls} placeholder="ou une adresse d’image (https://…)" aria-label="Adresse d’une image"
                  value={url} onChange={(e) => setUrl(e.target.value)} />
                <Btn variant="secondary" onClick={addUrl}>Ajouter</Btn>
              </div>
            </div>
          </Card>
        </div>

        <aside className="grid gap-6 lg:sticky lg:top-6">
          <Card className="grid gap-6 p-6">
            <h2 className="text-lg font-semibold text-black">Classement et prix</h2>
            <Field label="Catégorie" error={errors.categoryId}>
              <select className={inputCls} value={form.categoryId} onChange={set('categoryId')}>
                <option value="" disabled>Choisir…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Prix (€)" error={errors.price}>
              <input className={inputCls} type="number" min="0" step="0.01" value={form.price} onChange={set('price')} />
            </Field>
            <Field label="Quantité en stock" hint="Un galet est une pièce unique : 1. Mettez 0 pour l'afficher « Vendu »." error={errors.stock}>
              <input className={inputCls} type="number" min="0" max="9999" step="1" value={form.stock} onChange={set('stock')} />
            </Field>
          </Card>

          <Card className="grid gap-5 p-6">
            <h2 className="text-lg font-semibold text-black">Publication</h2>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-black" checked={form.published}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
              <span><strong>Publié sur le site</strong><span className="mt-0.5 block text-black/80">Décochez pour garder ce produit en brouillon, invisible des visiteurs.</span></span>
            </label>
            {message && <p role="alert" className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800">{message}</p>}
            <div className="grid gap-2">
              <button type="submit" disabled={saving || busy} className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50">
                {saving && <span className="spinner spinner--inline" aria-hidden="true" />}{saving ? 'Enregistrement…' : isNew ? 'Créer le produit' : 'Enregistrer les modifications'}
              </button>
              <LinkBtn to="/admin/produits" variant="ghost">Annuler</LinkBtn>
              {!isNew && <Btn variant="ghost" className="text-red-700" onClick={() => setConfirmDelete(true)}>Supprimer ce produit</Btn>}
            </div>
          </Card>
        </aside>
      </form>

      {confirmDelete && (
        <ConfirmDialog title="Supprimer ce produit ?" message="Il sera retiré de la boutique. Cette action est définitive."
          onCancel={() => setConfirmDelete(false)} onConfirm={remove} />
      )}
    </>
  );
}
