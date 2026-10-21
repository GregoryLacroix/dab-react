import { Fragment, useState } from 'react';
import { api } from '../../services/api.js';
import { ORDER_STATUSES } from '../../store/store.js';
import usePaged, { useDebounced } from '../usePaged.js';
import { saveBlob } from '../../services/download.js';
import { Btn, Card, ConfirmDialog, ErrorBox, Loading, PageHeader, Pagination, euro, formatDate, inputCls, statusStyle } from '../ui.jsx';

const td = 'px-4 py-3';

export default function Orders() {
  const [status, setStatus] = useState('toutes');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [refunding, setRefunding] = useState(null); // commande dont on demande le remboursement
  const [refundBusy, setRefundBusy] = useState(false);
  const search = useDebounced(q);
  // GET /api/orders?status=…&q=…&page=…&perPage=…
  const paged = usePaged((params) => api.orders.list(params), { status: status === 'toutes' ? undefined : status, q: search || undefined });

  const changeStatus = async (order, value) => {
    try {
      await api.orders.setStatus(order.id, value); // PATCH /api/orders/{CMD-1001}/status
      setActionError(null);
      paged.reload();
    } catch (err) { setActionError(err); }
  };

  const downloadInvoice = async (order) => {
    try {
      saveBlob(await api.orders.invoice(order.id), `${order.invoice.number ?? order.id}.pdf`); // GET /api/orders/{CMD-1001}/invoice
      paged.reload(); // le numéro de facture est attribué à la première demande pour les anciennes commandes
    } catch (err) { setActionError(err); }
  };

  const refund = async () => {
    setRefundBusy(true);
    try {
      await api.orders.refund(refunding.id); // POST /api/orders/{CMD-1001}/refund : remboursement total chez Stripe
      setActionError(null);
      paged.reload();
    } catch (err) { setActionError(err); }
    setRefundBusy(false);
    setRefunding(null);
  };

  return (
    <>
      {refunding && (
        <ConfirmDialog title={`Rembourser ${refunding.id} ?`} confirmLabel={refundBusy ? 'Remboursement…' : 'Rembourser'}
          message={`Le client sera remboursé de ${euro(refunding.total)} par Stripe (remboursement total) et la commande passera à « annulée ». Cette action est définitive.`}
          onConfirm={refund} onCancel={() => !refundBusy && setRefunding(null)} />
      )}
      <PageHeader title="Commandes" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {['toutes', ...ORDER_STATUSES].map((s) => (
          <button key={s} type="button" aria-pressed={status === s} onClick={() => { setStatus(s); paged.resetPage(); }}
            className={`rounded-full border px-3 py-1 text-sm font-medium ${status === s ? 'border-black bg-black text-white' : 'border-sand-400 hover:bg-sand-200'}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <input className={`${inputCls} ml-auto max-w-xs`} placeholder="Rechercher (n°, nom, e-mail)" aria-label="Rechercher une commande"
          value={q} onChange={(e) => { setQ(e.target.value); paged.resetPage(); }} />
      </div>
      {actionError && <div className="mb-4"><ErrorBox error={actionError} /></div>}
      {paged.error && <div className="mb-4"><ErrorBox error={paged.error} onRetry={paged.reload} /></div>}

      <Card className={paged.loading && paged.items.length > 0 ? 'opacity-60 transition-opacity' : ''} aria-busy={paged.loading}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="text-black/70">
                <th className="px-4 py-3 font-medium">Commande</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {paged.items.map((o) => (
                <Fragment key={o.id}>
                  <tr className="border-t border-sand-200">
                    <td className={td}>
                      <button type="button" aria-expanded={open === o.id} onClick={() => setOpen(open === o.id ? null : o.id)}
                        className="font-semibold text-black hover:underline">{o.id}</button>
                    </td>
                    <td className={td}>{formatDate(o.date)}</td>
                    <td className={td}>{o.customer.name}<span className="block text-xs text-black/70">{o.customer.email}</span></td>
                    <td className={`${td} font-semibold`}>{euro(o.total)}</td>
                    <td className={td}>
                      <select aria-label={`Statut de ${o.id}`} value={o.status} onChange={(e) => changeStatus(o, e.target.value)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[o.status]}`}>
                        {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                  {open === o.id && (
                    <tr className="bg-sand-50">
                      <td colSpan={5} className="px-4 py-3">
                        <ul className="grid gap-1">
                          {o.items.map((i, k) => (
                            <li key={k} className="flex justify-between gap-4">
                              <span>{i.qty} × {i.name}</span><span>{euro(i.qty * i.price)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                          <div>
                            <p className="font-semibold">Paiement</p>
                            {!o.payment?.online && <p>Commande enregistrée sans paiement en ligne.</p>}
                            {o.payment?.online && !o.payment.paidAt && <p>{o.status === 'annulée' ? 'Paiement non abouti (page de paiement abandonnée ou expirée).' : 'En attente du paiement chez Stripe.'}</p>}
                            {o.payment?.paidAt && <p>Payée en ligne le {formatDate(o.payment.paidAt)}.</p>}
                            {o.payment?.refundedAt && <p>Remboursée le {formatDate(o.payment.refundedAt)}.</p>}
                            {o.invoice?.number && <p>Facture {o.invoice.number}</p>}
                            <div className="mt-2 flex flex-wrap gap-2">
                              {o.invoice?.available && <Btn variant="ghost" onClick={() => downloadInvoice(o)}>Facture PDF</Btn>}
                              {o.payment?.paidAt && !o.payment.refundedAt && <Btn variant="danger" onClick={() => setRefunding(o)}>Rembourser</Btn>}
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold">Adresse de livraison</p>
                            {o.shipping ? (
                              <address className="not-italic">
                                {[o.shipping.name, o.shipping.line1, o.shipping.line2, `${o.shipping.postalCode ?? ''} ${o.shipping.city ?? ''}`.trim(), o.shipping.state, o.shipping.country]
                                  .filter(Boolean).map((line, k) => <span key={k} className="block">{line}</span>)}
                              </address>
                            ) : <p>Non renseignée.</p>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {!paged.loading && paged.items.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center">Aucune commande.</td></tr>}
            </tbody>
          </table>
        </div>
        {paged.loading && paged.items.length === 0 && <Loading />}
        <Pagination {...paged.pager} />
      </Card>
    </>
  );
}
