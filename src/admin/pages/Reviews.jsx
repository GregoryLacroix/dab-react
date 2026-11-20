import { Fragment, useState } from 'react';
import { api } from '../../services/api.js';
import usePaged, { useDebounced } from '../usePaged.js';
import { Btn, Card, ConfirmDialog, ErrorBox, Loading, PageHeader, Pagination, formatDate, inputCls } from '../ui.jsx';

const td = 'px-4 py-3';
const FILTERS = [['pending', 'À modérer'], ['approved', 'Publiés'], ['rejected', 'Refusés'], ['all', 'Tous']];
const STATUS = {
  pending: ['À modérer', 'bg-black text-white'],
  approved: ['Publié', 'bg-green-100 text-green-800'],
  rejected: ['Refusé', 'bg-sand-200 text-black'],
};
const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
const notify = () => window.dispatchEvent(new Event('dab:reviews'));

export default function Reviews() {
  const [filter, setFilter] = useState('pending');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const [reply, setReply] = useState('');
  const [target, setTarget] = useState(null);
  const [actionError, setActionError] = useState(null);
  const search = useDebounced(q);

  // GET /api/admin/reviews?status=…&q=…&page=…
  const paged = usePaged((params) => api.reviews.adminList(params), { status: filter === 'all' ? undefined : filter, q: search || undefined });

  const refresh = () => { paged.reload(); notify(); };
  const update = async (r, body) => {
    try {
      await api.reviews.adminUpdate(r.id, body); // PATCH /api/admin/reviews/{id}
      setActionError(null);
      refresh();
    } catch (err) { setActionError(err); }
  };
  const remove = async () => {
    try {
      await api.reviews.adminRemove(target.id); // DELETE /api/admin/reviews/{id}
      refresh();
    } catch (err) { setActionError(err); }
    setTarget(null);
  };
  const toggle = (r) => { setOpen(open === r.id ? null : r.id); setReply(r.reply ?? ''); };

  return (
    <>
      <PageHeader title="Avis clients" />
      <p className="mb-4 text-sm text-black/80">Un avis n'apparaît sur le site qu'une fois publié. Seuls les clients ayant acheté le produit peuvent en déposer un.</p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map(([key, label]) => (
          <button key={key} type="button" aria-pressed={filter === key} onClick={() => { setFilter(key); paged.resetPage(); }}
            className={`rounded-full border px-3 py-1 text-sm font-medium ${filter === key ? 'border-black bg-black text-white' : 'border-sand-400 hover:bg-sand-200'}`}>
            {label}
          </button>
        ))}
        <input className={`${inputCls} ml-auto max-w-xs`} placeholder="Rechercher (produit, auteur, texte)" aria-label="Rechercher un avis"
          value={q} onChange={(e) => { setQ(e.target.value); paged.resetPage(); }} />
      </div>
      {actionError && <div className="mb-4"><ErrorBox error={actionError} /></div>}
      {paged.error && <div className="mb-4"><ErrorBox error={paged.error} onRetry={paged.reload} /></div>}

      <Card className={paged.loading && paged.items.length > 0 ? 'opacity-60 transition-opacity' : ''} aria-busy={paged.loading}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="text-black/70">
                <th className="px-4 py-3 font-medium">Produit</th>
                <th className="px-4 py-3 font-medium">Auteur</th>
                <th className="px-4 py-3 font-medium">Note</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {paged.items.map((r) => (
                <Fragment key={r.id}>
                  <tr className="border-t border-sand-200">
                    <td className={td}>
                      <button type="button" aria-expanded={open === r.id} onClick={() => toggle(r)} className="text-left font-medium hover:underline">{r.productName}</button>
                    </td>
                    <td className={td}>{r.author}<span className="block text-xs text-black/70">{r.email}</span></td>
                    <td className={td}><span aria-label={`${r.rating} sur 5`}>{stars(r.rating)}</span></td>
                    <td className={td}>{formatDate(r.createdAt)}</td>
                    <td className={td}><span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS[r.status][1]}`}>{STATUS[r.status][0]}</span></td>
                  </tr>
                  {open === r.id && (
                    <tr className="bg-sand-50">
                      <td colSpan={5} className="px-4 py-4">
                        {r.title && <p className="font-semibold">{r.title}</p>}
                        <p className="whitespace-pre-line">{r.body}</p>
                        <label className="mt-4 block text-sm font-medium" htmlFor={`reply-${r.id}`}>Réponse publique de la boutique (facultatif)</label>
                        <textarea id={`reply-${r.id}`} className={`${inputCls} mt-1`} rows={3} maxLength={1000} value={reply} onChange={(e) => setReply(e.target.value)} />
                        <div className="mt-4 flex flex-wrap gap-2">
                          {r.status !== 'approved' && <Btn onClick={() => update(r, { status: 'approved', reply })}>Publier</Btn>}
                          {r.status === 'approved' && <Btn variant="secondary" onClick={() => update(r, { reply })}>Enregistrer la réponse</Btn>}
                          {r.status !== 'rejected' && <Btn variant="secondary" onClick={() => update(r, { status: 'rejected' })}>Refuser</Btn>}
                          {r.status !== 'pending' && <Btn variant="ghost" onClick={() => update(r, { status: 'pending' })}>Remettre à modérer</Btn>}
                          <Btn variant="ghost" className="text-red-700" onClick={() => setTarget(r)}>Supprimer</Btn>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {!paged.loading && paged.items.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center">Aucun avis.</td></tr>}
            </tbody>
          </table>
        </div>
        {paged.loading && paged.items.length === 0 && <Loading />}
        <Pagination {...paged.pager} />
      </Card>

      {target && (
        <ConfirmDialog title="Supprimer cet avis ?" message={`L'avis de ${target.author} sur « ${target.productName} » sera supprimé définitivement.`}
          onCancel={() => setTarget(null)} onConfirm={remove} />
      )}
    </>
  );
}
