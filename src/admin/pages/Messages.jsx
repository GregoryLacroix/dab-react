import { Fragment, useState } from 'react';
import { api } from '../../services/api.js';
import useQuery from '../../services/useQuery.js';
import { SUBJECTS, notifyMessagesChanged } from '../../store/store.js';
import usePaged, { useDebounced } from '../usePaged.js';
import { Btn, Card, ConfirmDialog, ErrorBox, Loading, PageHeader, Pagination, formatDate, inputCls } from '../ui.jsx';

const td = 'px-4 py-3';

export default function Messages() {
  const [filter, setFilter] = useState('tous'); // tous | non-lus
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const [target, setTarget] = useState(null);
  const [actionError, setActionError] = useState(null);
  const search = useDebounced(q);

  // GET /api/messages?read=0&q=…&page=…&perPage=…
  const paged = usePaged((params) => api.messages.list(params), { read: filter === 'non-lus' ? 0 : undefined, q: search || undefined });
  const unreadQ = useQuery(() => api.messages.list({ read: 0, perPage: 1 }), []);
  const unread = unreadQ.data?.meta.total ?? 0;

  const refresh = () => { paged.reload(); unreadQ.reload(); notifyMessagesChanged(); };
  const setRead = async (m, read) => {
    try {
      await api.messages.setRead(m.id, read); // PATCH /api/messages/{id}
      setActionError(null);
      refresh();
    } catch (err) { setActionError(err); }
  };
  // Ouvrir un message le marque comme lu
  const toggle = (m) => {
    const opening = open !== m.id;
    setOpen(opening ? m.id : null);
    if (opening && !m.read) setRead(m, true);
  };
  const remove = async () => {
    try {
      await api.messages.remove(target.id); // DELETE /api/messages/{id}
      refresh();
    } catch (err) { setActionError(err); }
    setTarget(null);
  };

  return (
    <>
      <PageHeader title="Messages" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[['tous', 'Tous'], ['non-lus', `Non lus (${unread})`]].map(([key, label]) => (
          <button key={key} type="button" aria-pressed={filter === key} onClick={() => { setFilter(key); paged.resetPage(); }}
            className={`rounded-full border px-3 py-1 text-sm font-medium ${filter === key ? 'border-black bg-black text-white' : 'border-sand-400 hover:bg-sand-200'}`}>
            {label}
          </button>
        ))}
        <input className={`${inputCls} ml-auto max-w-xs`} placeholder="Rechercher (nom, e-mail, texte)" aria-label="Rechercher un message"
          value={q} onChange={(e) => { setQ(e.target.value); paged.resetPage(); }} />
      </div>
      {actionError && <div className="mb-4"><ErrorBox error={actionError} /></div>}
      {paged.error && <div className="mb-4"><ErrorBox error={paged.error} onRetry={paged.reload} /></div>}

      <Card className={paged.loading && paged.items.length > 0 ? 'opacity-60 transition-opacity' : ''} aria-busy={paged.loading}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="text-black/70">
                <th className="px-4 py-3 font-medium">Expéditeur</th>
                <th className="px-4 py-3 font-medium">Sujet</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {paged.items.map((m) => (
                <Fragment key={m.id}>
                  <tr className="border-t border-sand-200">
                    <td className={td}>
                      <button type="button" aria-expanded={open === m.id} onClick={() => toggle(m)}
                        className={`text-left hover:underline ${m.read ? 'font-medium' : 'font-bold'}`}>{m.name}</button>
                      <span className="block text-xs text-black/70">{m.email}</span>
                    </td>
                    <td className={td}>{SUBJECTS[m.subject] ?? m.subject}</td>
                    <td className={td}>{formatDate(m.date)}</td>
                    <td className={td}>
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${m.read ? 'bg-sand-200 text-black' : 'bg-black text-white'}`}>
                        {m.read ? 'Lu' : 'Nouveau'}
                      </span>
                    </td>
                  </tr>
                  {open === m.id && (
                    <tr className="bg-sand-50">
                      <td colSpan={4} className="px-4 py-4">
                        <p className="whitespace-pre-line">{m.message}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <a className="inline-flex items-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700"
                            href={`mailto:${m.email}?subject=${encodeURIComponent('Re : ' + (SUBJECTS[m.subject] ?? 'votre message'))}`}>Répondre par e-mail</a>
                          <Btn variant="secondary" onClick={() => setRead(m, !m.read)}>{m.read ? 'Marquer comme non lu' : 'Marquer comme lu'}</Btn>
                          <Btn variant="ghost" className="text-red-700" onClick={() => setTarget(m)}>Supprimer</Btn>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {!paged.loading && paged.items.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center">Aucun message.</td></tr>}
            </tbody>
          </table>
        </div>
        {paged.loading && paged.items.length === 0 && <Loading />}
        <Pagination {...paged.pager} />
      </Card>

      {target && (
        <ConfirmDialog title="Supprimer ce message ?" message={`Le message de ${target.name} sera supprimé définitivement.`}
          onCancel={() => setTarget(null)} onConfirm={remove} />
      )}
    </>
  );
}
