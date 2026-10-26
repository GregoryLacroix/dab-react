import { Fragment, useState } from 'react';
import { api, fieldErrors } from '../../services/api.js';
import { QUOTE_STATUSES } from '../../store/store.js';
import usePaged, { useDebounced } from '../usePaged.js';
import { Btn, Card, ConfirmDialog, ErrorBox, Field, Loading, PageHeader, Pagination, StatusBadge, euro, formatDate, inputCls } from '../ui.jsx';

const td = 'px-4 py-3';
const BUDGETS = { 'moins-500': 'Moins de 500 €', '500-1000': '500 à 1 000 €', '1000-2500': '1 000 à 2 500 €', 'plus-2500': 'Plus de 2 500 €', 'ne-sais-pas': 'Ne sait pas encore' };
const TYPES = { interieur: 'Intérieur', exterieur: 'Extérieur' };

// Détail d'une demande : projet, photos, note interne, devis (montant, acompte, message) et envoi au client
function QuoteDetail({ q, onChanged, onDeleted }) {
  const [amount, setAmount] = useState(q.amount == null ? '' : String(q.amount));
  const [percent, setPercent] = useState(String(q.depositPercent ?? 30));
  const [message, setMessage] = useState(q.quoteMessage ?? '');
  const [note, setNote] = useState(q.adminNote ?? '');
  const [busy, setBusy] = useState('');
  const [errors, setErrors] = useState({});
  const [info, setInfo] = useState('');
  const [confirm, setConfirm] = useState(null); // 'send' | 'delete'
  const locked = !!q.depositPaidAt; // acompte réglé : le devis ne bouge plus

  const run = async (kind, action, okText) => {
    setBusy(kind); setErrors({}); setInfo('');
    try {
      await action();
      setInfo(okText);
      onChanged();
    } catch (err) {
      const fields = fieldErrors(err);
      setErrors(Object.keys(fields).length ? fields : { form: err.message });
    }
    setBusy(''); setConfirm(null);
  };
  const body = () => ({ amount: Number(String(amount).replace(',', '.')), depositPercent: Number(percent), quoteMessage: message });
  const deposit = Number(String(amount).replace(',', '.')) * Number(percent) / 100;

  return (
    <div className="grid gap-5 bg-sand-50 px-4 py-5 text-sm md:px-6">
      {confirm === 'send' && (
        <ConfirmDialog title={`Envoyer le devis ${q.id} ?`} confirmLabel={busy === 'send' ? 'Envoi…' : 'Envoyer'}
          message={`${q.name} recevra par e-mail un devis de ${euro(Number(String(amount).replace(',', '.')) || 0)}${Number(percent) > 0 ? `, avec un lien pour régler un acompte de ${euro(deposit)} (${percent} %)` : ''}.`}
          onConfirm={() => run('send', () => api.quotes.send(q.id, body()), 'Devis envoyé au client.')} onCancel={() => busy !== 'send' && setConfirm(null)} />
      )}
      {confirm === 'delete' && (
        <ConfirmDialog title={`Supprimer ${q.id} ?`} message="La demande et ses photos seront supprimées définitivement."
          onConfirm={() => run('delete', async () => { await api.quotes.remove(q.id); onDeleted(); }, '')} onCancel={() => setConfirm(null)} />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="font-semibold">Contact</p>
          <p><a className="underline" href={`mailto:${q.email}`}>{q.email}</a>{q.phone && <> · <a className="underline" href={`tel:${q.phone}`}>{q.phone}</a></>}</p>
          <p className="mt-3 font-semibold">Projet</p>
          <p>{TYPES[q.projectType] ?? q.projectType}{q.widthCm && q.heightCm ? ` · ${q.widthCm} × ${q.heightCm} cm` : ''}{q.location ? ` · ${q.location}` : ''}</p>
          <p>Budget : {q.budget ? BUDGETS[q.budget] ?? q.budget : 'non précisé'} · Pour : {q.desiredBy || 'non précisé'}</p>
          <p className="mt-3 whitespace-pre-wrap rounded-lg border border-sand-200 bg-white p-3">{q.description}</p>
        </div>
        <div>
          <p className="font-semibold">Photos du mur</p>
          {q.photos.length === 0 ? <p>Aucune photo.</p> : (
            <div className="mt-2 flex flex-wrap gap-2">
              {q.photos.map((src, i) => (
                <a key={src} href={src} target="_blank" rel="noreferrer noopener" aria-label={`Photo ${i + 1} (nouvel onglet)`}>
                  <img src={src} alt={`Photo ${i + 1} du mur`} className="h-24 w-24 rounded-lg object-cover" loading="lazy" />
                </a>
              ))}
            </div>
          )}
          <Field label="Note interne (jamais montrée au client)" className="mt-4" error={errors.adminNote}>
            <textarea className={inputCls} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <Btn variant="ghost" loading={busy === 'note'} onClick={() => run('note', () => api.quotes.update(q.id, { adminNote: note }), 'Note enregistrée.')}>Enregistrer la note</Btn>
        </div>
      </div>

      <div className="rounded-xl border border-sand-200 bg-white p-4">
        <p className="mb-3 font-semibold">Devis{q.quoteSentAt ? ` — envoyé le ${formatDate(q.quoteSentAt)}` : ''}{q.depositPaidAt ? ` — acompte payé le ${formatDate(q.depositPaidAt)}` : ''}</p>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Montant total TTC (€)" error={errors.amount}>
            <input className={inputCls} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={locked} />
          </Field>
          <Field label="Acompte (% du total)" hint={Number(amount) > 0 && Number(percent) > 0 ? `Soit ${euro(deposit)}` : '0 = aucun acompte en ligne'} error={errors.depositPercent}>
            <input className={inputCls} inputMode="numeric" value={percent} onChange={(e) => setPercent(e.target.value)} disabled={locked} />
          </Field>
        </div>
        <Field label="Message au client (affiché dans l'e-mail et sur la page du devis)" className="mt-3" error={errors.quoteMessage}>
          <textarea className={inputCls} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} disabled={locked}
            placeholder="Détail de la prestation, délais, ce qui est inclus…" />
        </Field>
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn onClick={() => setConfirm('send')} disabled={locked} loading={busy === 'send'}>{q.quoteSentAt ? 'Renvoyer le devis' : 'Envoyer le devis au client'}</Btn>
        </div>
      </div>

      {errors.form && <p className="text-red-700" role="alert">{errors.form}</p>}
      {info && <p className="text-emerald-800" role="status">{info}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">
          <span className="font-medium">Statut</span>
          <select className={inputCls} value={q.status} onChange={(e) => run('status', () => api.quotes.update(q.id, { status: e.target.value }), 'Statut modifié.')}>
            {QUOTE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <Btn variant="danger" className="ml-auto" onClick={() => setConfirm('delete')}>Supprimer</Btn>
      </div>
    </div>
  );
}

export default function Quotes() {
  const [status, setStatus] = useState('toutes');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const search = useDebounced(q);
  // GET /api/quotes?status=…&q=…&page=…&perPage=…
  const paged = usePaged((params) => api.quotes.list(params), { status: status === 'toutes' ? undefined : status, q: search || undefined });

  return (
    <>
      <PageHeader title="Devis" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {['toutes', ...QUOTE_STATUSES].map((s) => (
          <button key={s} type="button" aria-pressed={status === s} onClick={() => { setStatus(s); paged.resetPage(); }}
            className={`rounded-full border px-3 py-1 text-sm font-medium ${status === s ? 'border-black bg-black text-white' : 'border-sand-400 hover:bg-sand-200'}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <input className={`${inputCls} ml-auto max-w-xs`} placeholder="Rechercher (nom, e-mail, lieu…)" aria-label="Rechercher un devis"
          value={q} onChange={(e) => { setQ(e.target.value); paged.resetPage(); }} />
      </div>
      {paged.error && <div className="mb-4"><ErrorBox error={paged.error} onRetry={paged.reload} /></div>}

      <Card className={paged.loading && paged.items.length > 0 ? 'opacity-60 transition-opacity' : ''} aria-busy={paged.loading}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="text-black/70">
                <th className="px-4 py-3 font-medium">Demande</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Projet</th>
                <th className="px-4 py-3 font-medium">Devis</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {paged.items.map((r) => (
                <Fragment key={r.id}>
                  <tr className="border-t border-sand-200">
                    <td className={td}>
                      <button type="button" aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)}
                        className="font-semibold text-black hover:underline">{r.id}</button>
                    </td>
                    <td className={td}>{formatDate(r.date)}</td>
                    <td className={td}>{r.name}<br /><span className="text-black/60">{r.email}</span></td>
                    <td className={td}>{TYPES[r.projectType] ?? r.projectType}{r.widthCm && r.heightCm ? ` · ${r.widthCm}×${r.heightCm} cm` : ''}</td>
                    <td className={td}>{r.amount == null ? '—' : euro(r.amount)}</td>
                    <td className={td}><StatusBadge status={r.status} /></td>
                  </tr>
                  {open === r.id && (
                    <tr className="border-t border-sand-200">
                      <td colSpan={6} className="p-0">
                        <QuoteDetail q={r} onChanged={paged.reload} onDeleted={() => { setOpen(null); paged.reload(); }} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {!paged.loading && paged.items.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-black/60">Aucune demande de devis.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {paged.loading && paged.items.length === 0 && <Loading />}
        <Pagination {...paged.pager} />
      </Card>
    </>
  );
}
