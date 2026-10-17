import { useState } from 'react';
import { api } from '../../services/api.js';
import { refreshCategories, useCategories } from '../../store/store.js';
import { Btn, Card, ConfirmDialog, ErrorBox, Field, PageHeader, Pagination, inputCls, usePagination } from '../ui.jsx';

export default function Categories() {
  const categories = useCategories();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [target, setTarget] = useState(null);
  const [actionError, setActionError] = useState(null);
  const { pageItems, pager } = usePagination(categories, 10);

  const add = async (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return setError('Saisissez un nom de catégorie.');
    try {
      await api.categories.create(n);   // POST /api/categories
      await refreshCategories();
      setName('');
      setError('');
    } catch (err) {
      setError(err.violations?.name ?? err.message);
    }
  };

  const saveEdit = async () => {
    const n = editName.trim();
    if (!n) return setEditError('Saisissez un nom de catégorie.');
    try {
      await api.categories.rename(editId, n); // PATCH /api/categories/{id}
      await refreshCategories();
      setEditId(null);
      setEditError('');
    } catch (err) {
      setEditError(err.violations?.name ?? err.message);
    }
  };

  const remove = async () => {
    try {
      await api.categories.remove(target.id); // DELETE /api/categories/{id} (409 si elle contient des produits)
      await refreshCategories();
    } catch (err) {
      setActionError(err);
    }
    setTarget(null);
  };

  return (
    <>
      <PageHeader title="Catégories" />
      <form onSubmit={add} className="mb-6 flex max-w-xl items-start gap-3">
        <Field label="Nouvelle catégorie" error={error} className="flex-1">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <button type="submit" className="mt-6 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700">Ajouter</button>
      </form>
      {actionError && <div className="mb-4"><ErrorBox error={actionError} /></div>}

      <Card>
        <ul className="divide-y divide-sand-200">
          {pageItems.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              {editId === c.id ? (
                <div>
                  <input className={`${inputCls} max-w-xs`} autoFocus aria-label="Nom de la catégorie" value={editName}
                    onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEdit()} />
                  {editError && <p role="alert" className="mt-1 text-xs text-red-700">{editError}</p>}
                </div>
              ) : (
                <span><strong className="text-black">{c.name}</strong> <span className="text-black/70">· {c.productCount} produit{c.productCount > 1 ? 's' : ''}</span></span>
              )}
              <div className="flex gap-2">
                {editId === c.id ? (
                  <>
                    <Btn onClick={saveEdit}>Enregistrer</Btn>
                    <Btn variant="ghost" onClick={() => { setEditId(null); setEditError(''); }}>Annuler</Btn>
                  </>
                ) : (
                  <>
                    <Btn variant="secondary" onClick={() => { setEditId(c.id); setEditName(c.name); setEditError(''); }}>Renommer</Btn>
                    <Btn variant="ghost" className="text-red-700" disabled={c.productCount > 0}
                      title={c.productCount > 0 ? 'Déplacez ou supprimez d’abord ses produits' : ''}
                      onClick={() => { setActionError(null); setTarget(c); }}>Supprimer</Btn>
                  </>
                )}
              </div>
            </li>
          ))}
          {categories.length === 0 && <li className="px-4 py-8 text-center text-sm">Aucune catégorie. Ajoutez-en une ci-dessus.</li>}
        </ul>
        <Pagination {...pager} />
      </Card>
      <p className="mt-3 text-xs text-black/70">Une catégorie qui contient encore des produits ne peut pas être supprimée.</p>

      {target && (
        <ConfirmDialog title="Supprimer cette catégorie ?" message={`La catégorie « ${target.name} » sera supprimée.`}
          onCancel={() => setTarget(null)} onConfirm={remove} />
      )}
    </>
  );
}
