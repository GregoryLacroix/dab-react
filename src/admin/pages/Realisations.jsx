import { useState } from 'react';
import { api } from '../../services/api.js';
import { shrinkImage } from '../../services/imageResize.js';
import usePaged from '../usePaged.js';
import { Btn, Card, ConfirmDialog, ErrorBox, Field, Loading, PageHeader, inputCls } from '../ui.jsx';

const MAX_BYTES = 5 * 1024 * 1024;
const empty = { title: '', titleEn: '', location: '', tag: '', tagEn: '', description: '', descriptionEn: '', completedAt: '', position: '0', published: true, images: [], beforeImage: '' };

// Galerie de réalisations : fresques et décors déjà peints (page publique « Réalisations »)
export default function Realisations() {
  const paged = usePaged((p) => api.realisations.adminList(p), {}, 50);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [target, setTarget] = useState(null);
  const [actionError, setActionError] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const edit = (r) => { setErrors({}); setForm({ ...empty, ...Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v ?? empty[k] ?? ''])), position: String(r.position), images: r.images ?? [], beforeImage: r.beforeImage ?? '' }); };

  // POST /api/uploads -> { src } (la photo est réduite puis optimisée)
  const upload = async (files) => {
    setUploading(true);
    setErrors((x) => ({ ...x, images: undefined }));
    try {
      const urls = [];
      for (const original of files) {
        const file = await shrinkImage(original);
        if (file.size > MAX_BYTES) throw new Error('Une image dépasse encore 5 Mo après réduction.');
        urls.push((await api.upload(file)).src);
      }
      return urls;
    } catch (err) {
      setErrors((x) => ({ ...x, images: err.violations?.file ?? err.message }));
      return [];
    } finally {
      setUploading(false);
    }
  };
  const addPhotos = async (e) => {
    const files = [...e.target.files]; e.target.value = '';
    const urls = await upload(files);
    if (urls.length) setForm((f) => ({ ...f, images: [...f.images, ...urls].slice(0, 12) }));
  };
  const setBefore = async (e) => {
    const files = [...e.target.files]; e.target.value = '';
    const [url] = await upload(files.slice(0, 1));
    if (url) setForm((f) => ({ ...f, beforeImage: url }));
  };
  const move = (i, d) => setForm((f) => {
    const imgs = [...f.images]; const j = i + d;
    if (j < 0 || j >= imgs.length) return f;
    [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
    return { ...f, images: imgs };
  });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const body = { ...form, position: Number(form.position) || 0, completedAt: form.completedAt || null, beforeImage: form.beforeImage || null };
    delete body.id;
    try {
      await (form.id ? api.realisations.update(form.id, body) : api.realisations.create(body));
      setForm(null);
      paged.reload();
    } catch (err) {
      setErrors(Object.keys(err.violations ?? {}).length ? err.violations : { form: err.message });
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    try { await api.realisations.remove(target.id); paged.reload(); } catch (err) { setActionError(err); }
    setTarget(null);
  };
  const togglePublished = async (r) => {
    try { await api.realisations.update(r.id, { published: !r.published }); setActionError(null); paged.reload(); } catch (err) { setActionError(err); }
  };

  return (
    <>
      <PageHeader title="Réalisations" />
      <p className="mb-4 text-sm text-black/80">Les fresques et décors affichés sur la page « Réalisations » du site. La première photo sert de couverture ; une photo « avant » est facultative.</p>
      {!form && <div className="mb-4"><Btn onClick={() => { setErrors({}); setForm({ ...empty }); }}>Nouvelle réalisation</Btn></div>}
      {actionError && <div className="mb-4"><ErrorBox error={actionError} /></div>}
      {paged.error && <div className="mb-4"><ErrorBox error={paged.error} onRetry={paged.reload} /></div>}

      {form && (
        <Card className="mb-6 p-4">
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Field label="Titre" error={errors.title}><input className={inputCls} value={form.title} onChange={set('title')} maxLength={160} /></Field>
            <Field label="Titre (anglais)" error={errors.titleEn}><input className={inputCls} value={form.titleEn} onChange={set('titleEn')} maxLength={160} /></Field>
            <Field label="Lieu (ex. Lyon)" error={errors.location}><input className={inputCls} value={form.location} onChange={set('location')} maxLength={160} /></Field>
            <Field label="Date de réalisation" error={errors.completedAt}><input type="date" className={inputCls} value={form.completedAt} onChange={set('completedAt')} /></Field>
            <Field label="Catégorie (filtre, ex. Chambre d’enfant)" error={errors.tag}><input className={inputCls} value={form.tag} onChange={set('tag')} maxLength={60} /></Field>
            <Field label="Catégorie (anglais)" error={errors.tagEn}><input className={inputCls} value={form.tagEn} onChange={set('tagEn')} maxLength={60} /></Field>
            <Field label="Description" error={errors.description} className="sm:col-span-1"><textarea className={inputCls} rows={4} value={form.description} onChange={set('description')} /></Field>
            <Field label="Description (anglais)" error={errors.descriptionEn}><textarea className={inputCls} rows={4} value={form.descriptionEn} onChange={set('descriptionEn')} /></Field>
            <Field label="Ordre d’affichage (0 = en premier)" error={errors.position}><input className={inputCls} inputMode="numeric" value={form.position} onChange={set('position')} /></Field>
            <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={form.published} onChange={set('published')} /> Publiée sur le site</label>

            <div className="sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">Photos (12 maximum)</span>
              <div className="flex flex-wrap gap-3">
                {form.images.map((src, i) => (
                  <div key={src} className="w-28 text-center">
                    <img src={src} alt="" className="h-20 w-28 rounded-lg object-cover" />
                    <div className="mt-1 flex justify-center gap-1 text-xs">
                      <button type="button" className="px-1" aria-label="Avancer" onClick={() => move(i, -1)}>←</button>
                      <button type="button" className="px-1 text-red-700" onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, k) => k !== i) }))}>Retirer</button>
                      <button type="button" className="px-1" aria-label="Reculer" onClick={() => move(i, 1)}>→</button>
                    </div>
                  </div>
                ))}
              </div>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="mt-3 text-sm" onChange={addPhotos} disabled={uploading || form.images.length >= 12} />
              {errors.images && <span role="alert" className="mt-1 block text-xs text-red-700">{errors.images}</span>}
              {uploading && <span className="ml-2 text-xs">Envoi…</span>}
            </div>
            <div className="sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">Photo « avant » (facultatif)</span>
              {form.beforeImage && (
                <div className="mb-2 flex items-center gap-3">
                  <img src={form.beforeImage} alt="" className="h-20 w-28 rounded-lg object-cover" />
                  <button type="button" className="text-xs text-red-700" onClick={() => setForm((f) => ({ ...f, beforeImage: '' }))}>Retirer</button>
                </div>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" onChange={setBefore} disabled={uploading} />
              {errors.beforeImage && <span role="alert" className="mt-1 block text-xs text-red-700">{errors.beforeImage}</span>}
            </div>
            {errors.form && <p className="text-sm text-red-700 sm:col-span-2" role="alert">{errors.form}</p>}
            <div className="flex gap-2 sm:col-span-2">
              <Btn type="submit" loading={busy} disabled={uploading}>{form.id ? 'Enregistrer' : 'Créer'}</Btn>
              <Btn variant="ghost" onClick={() => setForm(null)}>Annuler</Btn>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paged.items.map((r) => (
          <Card key={r.id} className="overflow-hidden">
            {r.images[0] ? <img src={r.images[0]} alt="" className="h-40 w-full object-cover" /> : <div className="grid h-40 place-items-center bg-sand-200 text-sm">Pas de photo</div>}
            <div className="p-4">
              <p className="font-semibold">{r.title}</p>
              <p className="text-xs text-black/70">{[r.tag, r.location].filter(Boolean).join(' · ') || '—'} · {r.images.length} photo{r.images.length > 1 ? 's' : ''}</p>
              <p className="mt-1"><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${r.published ? 'bg-green-100 text-green-800' : 'bg-sand-200 text-black'}`}>{r.published ? 'Publiée' : 'Masquée'}</span></p>
              <div className="mt-3 flex flex-wrap gap-1">
                <Btn variant="ghost" onClick={() => edit(r)}>Modifier</Btn>
                <Btn variant="ghost" onClick={() => togglePublished(r)}>{r.published ? 'Masquer' : 'Publier'}</Btn>
                <Btn variant="ghost" className="text-red-700" onClick={() => setTarget(r)}>Supprimer</Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {paged.loading && paged.items.length === 0 && <Loading />}
      {!paged.loading && paged.items.length === 0 && <p className="py-8 text-center">Aucune réalisation pour l’instant.</p>}
      {target && <ConfirmDialog title="Supprimer cette réalisation ?" message={`« ${target.title} » disparaîtra de la galerie.`} onCancel={() => setTarget(null)} onConfirm={remove} />}
    </>
  );
}
