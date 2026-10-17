import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductImage from '../../components/ui/ProductImage.jsx';
import { api } from '../../services/api.js';
import { cover, useCategories } from '../../store/store.js';
import usePaged, { useDebounced } from '../usePaged.js';
import { Btn, Card, ConfirmDialog, ErrorBox, LinkBtn, Loading, PageHeader, Pagination, euro, inputCls } from '../ui.jsx';

export default function ProductsAdmin() {
  const categories = useCategories();
  const [q, setQ] = useState('');
  const search = useDebounced(q);
  // GET /api/products : en tant qu'administrateur, les brouillons sont inclus
  const paged = usePaged((params) => api.products.list(params), { q: search || undefined });
  const [target, setTarget] = useState(null);
  const [actionError, setActionError] = useState(null);
  const catName = (id) => categories.find((c) => c.id === id)?.name ?? 'Sans catégorie';

  const togglePublished = async (p) => {
    try {
      await api.products.update(p.id, { published: !p.published }); // PATCH /api/products/{id}
      paged.reload();
    } catch (err) { setActionError(err); }
  };
  const remove = async () => {
    try {
      await api.products.remove(target.id); // DELETE /api/products/{id}
      paged.reload();
    } catch (err) { setActionError(err); }
    setTarget(null);
  };

  return (
    <>
      <PageHeader title="Produits">
        <LinkBtn to="/admin/produits/nouveau">Nouveau produit</LinkBtn>
      </PageHeader>
      <input className={`${inputCls} mb-4 max-w-sm`} placeholder="Rechercher un produit" aria-label="Rechercher un produit"
        value={q} onChange={(e) => { setQ(e.target.value); paged.resetPage(); }} />
      {actionError && <div className="mb-4"><ErrorBox error={actionError} /></div>}
      {paged.error && <div className="mb-4"><ErrorBox error={paged.error} onRetry={paged.reload} /></div>}

      <Card className={paged.loading && paged.items.length > 0 ? 'opacity-60 transition-opacity' : ''} aria-busy={paged.loading}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-black/70">
                <th className="px-4 py-3 font-medium">Produit</th>
                <th className="px-4 py-3 font-medium">Catégorie</th>
                <th className="px-4 py-3 font-medium">Prix</th>
                <th className="px-4 py-3 font-medium">État</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.items.map((p) => {
                const img = cover(p);
                return (
                  <tr key={p.id} className="border-t border-sand-200">
                    <td className="px-4 py-3">
                      <Link to={`/admin/produits/${p.id}`} className="flex items-center gap-3 font-medium text-black hover:underline">
                        <span className="block h-12 w-12 shrink-0 overflow-hidden rounded-md"><ProductImage tone={img.tone} src={img.src} label="" /></span>
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{catName(p.categoryId)}</td>
                    <td className="px-4 py-3">{euro(p.price)}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => togglePublished(p)}
                        aria-label={p.published ? 'Passer en brouillon' : 'Publier'}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${p.published ? 'bg-emerald-100 text-emerald-800' : 'bg-sand-200 text-black'}`}>
                        {p.published ? 'Publié' : 'Brouillon'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <LinkBtn variant="secondary" to={`/admin/produits/${p.id}`}>Modifier</LinkBtn>
                        <Btn variant="ghost" className="text-red-700" onClick={() => setTarget(p)}>Supprimer</Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!paged.loading && paged.items.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center">Aucun produit trouvé.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {paged.loading && paged.items.length === 0 && <Loading />}
        <Pagination {...paged.pager} />
      </Card>

      {target && (
        <ConfirmDialog title="Supprimer ce produit ?" message={`« ${target.name} » sera retiré de la boutique. Cette action est définitive.`}
          onCancel={() => setTarget(null)} onConfirm={remove} />
      )}
    </>
  );
}
