import { useState } from 'react';
import { api } from '../../services/api.js';
import usePaged, { useDebounced } from '../usePaged.js';
import { Btn, Card, ConfirmDialog, ErrorBox, Field, Loading, PageHeader, Pagination, euro, formatDate, inputCls } from '../ui.jsx';

const td = 'px-4 py-3';
const empty = { code: '', kind: 'percent', value: '10', minOrder: '', startsAt: '', endsAt: '', maxUses: '', onePerCustomer: false, active: true };
const GIFT_STATUS = { active: ['Active', 'bg-green-100 text-green-800'], cancelled: ['Annulée', 'bg-sand-200 text-black'] };
const day = (iso) => (iso ? iso.slice(0, 10) : '');

// Codes promo (création, activation, suivi des utilisations) et cartes cadeau vendues (solde, annulation)
export default function Promos() {
  const [tab, setTab] = useState('promo');
  return (
    <>
      <PageHeader title="Codes promo & cartes cadeau" />
      <div className="mb-4 flex gap-2">
        {[['promo', 'Codes promo'], ['gift', 'Cartes cadeau']].map(([k, label]) => (
          <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${tab === k ? 'border-black bg-black text-white' : 'border-sand-400 hover:bg-sand-200'}`}>{label}</button>
        ))}
      </div>
      {tab === 'promo' ? <PromoCodes /> : <GiftCards />}
    </>
  );
}

function PromoCodes() {
  const [q, setQ] = useState('');
  const search = useDebounced(q);
  const [form, setForm] = useState(null);   // null = formulaire fermé ; { id?, … }
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState(null);
  const [actionError, setActionError] = useState(null);
  const paged = usePaged((p) => api.promos.list(p), { q: search || undefined }, 10);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const edit = (p) => setForm({ id: p.id, code: p.code, kind: p.kind, value: String(p.value), minOrder: p.minOrder ? String(p.minOrder) : '', startsAt: day(p.startsAt), endsAt: day(p.endsAt), maxUses: p.maxUses ?? '', onePerCustomer: p.onePerCustomer, active: p.active });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const body = {
      code: form.code, kind: form.kind, value: Number(String(form.value).replace(',', '.')),
      minOrder: form.minOrder === '' ? null : Number(String(form.minOrder).replace(',', '.')),
      startsAt: form.startsAt || null,
      // La date de fin couvre toute la journée choisie
      endsAt: form.endsAt ? `${form.endsAt}T23:59:59` : null,
      maxUses: form.maxUses === '' ? null : Number(form.maxUses), onePerCustomer: form.onePerCustomer, active: form.active,
    };
    try {
      await (form.id ? api.promos.update(form.id, body) : api.promos.create(body));
      setForm(null);
      paged.reload();
    } catch (err) {
      setErrors(Object.keys(err.violations ?? {}).length ? err.violations : { form: err.message });
    } finally {
      setBusy(false);
    }
  };
  const toggle = async (p) => {
    try { await api.promos.update(p.id, { active: !p.active }); setActionError(null); paged.reload(); } catch (err) { setActionError(err); }
  };
  const remove = async () => {
    try { await api.promos.remove(target.id); paged.reload(); } catch (err) { setActionError(err); }
    setTarget(null);
  };

  return (
    <>
      <p className="mb-4 text-sm text-black/80">La remise porte sur les articles (pas sur la livraison) et laisse toujours au moins 0,50 € à payer. Les codes sont insensibles à la casse.</p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Btn onClick={() => { setForm({ ...empty }); setErrors({}); }}>Nouveau code</Btn>
        <input className={`${inputCls} ml-auto max-w-xs`} placeholder="Rechercher un code" aria-label="Rechercher un code promo" value={q} onChange={(e) => { setQ(e.target.value); paged.resetPage(); }} />
      </div>
      {actionError && <div className="mb-4"><ErrorBox error={actionError} /></div>}
      {paged.error && <div className="mb-4"><ErrorBox error={paged.error} onRetry={paged.reload} /></div>}

      {form && (
        <Card className="mb-4 p-4">
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Field label="Code" error={errors.code}><input className={inputCls} value={form.code} onChange={set('code')} maxLength={40} placeholder="BIENVENUE10" /></Field>
            <Field label="Type de remise">
              <select className={inputCls} value={form.kind} onChange={set('kind')}>
                <option value="percent">Pourcentage (%)</option>
                <option value="fixed">Montant fixe (€)</option>
              </select>
            </Field>
            <Field label={form.kind === 'percent' ? 'Pourcentage (1 à 100)' : 'Montant (€)'} error={errors.value}><input className={inputCls} inputMode="decimal" value={form.value} onChange={set('value')} /></Field>
            <Field label="Achat minimum (€, facultatif)" error={errors.minOrder}><input className={inputCls} inputMode="decimal" value={form.minOrder} onChange={set('minOrder')} /></Field>
            <Field label="Valable à partir du (facultatif)" error={errors.startsAt}><input type="date" className={inputCls} value={form.startsAt} onChange={set('startsAt')} /></Field>
            <Field label="Valable jusqu’au (inclus, facultatif)" error={errors.endsAt}><input type="date" className={inputCls} value={form.endsAt} onChange={set('endsAt')} /></Field>
            <Field label="Nombre d’utilisations maximum (facultatif)" error={errors.maxUses}><input className={inputCls} inputMode="numeric" value={form.maxUses} onChange={set('maxUses')} /></Field>
            <div className="flex flex-col justify-end gap-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.onePerCustomer} onChange={set('onePerCustomer')} /> Une seule utilisation par adresse e-mail</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={set('active')} /> Code actif</label>
            </div>
            {errors.form && <p className="text-sm text-red-700 sm:col-span-2" role="alert">{errors.form}</p>}
            <div className="flex gap-2 sm:col-span-2">
              <Btn type="submit" loading={busy}>{form.id ? 'Enregistrer' : 'Créer le code'}</Btn>
              <Btn variant="ghost" onClick={() => setForm(null)}>Annuler</Btn>
            </div>
          </form>
        </Card>
      )}

      <Card className={paged.loading && paged.items.length > 0 ? 'opacity-60 transition-opacity' : ''} aria-busy={paged.loading}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="text-black/70">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Remise</th>
                <th className="px-4 py-3 font-medium">Conditions</th>
                <th className="px-4 py-3 font-medium">Utilisations</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {paged.items.map((p) => {
                const expired = p.endsAt && new Date(p.endsAt) < new Date();
                return (
                  <tr key={p.id} className="border-t border-sand-200">
                    <td className={`${td} font-mono font-semibold`}>{p.code}</td>
                    <td className={td}>{p.kind === 'percent' ? `${p.value} %` : euro(p.value)}</td>
                    <td className={`${td} text-xs text-black/80`}>
                      {p.minOrder > 0 && <div>Dès {euro(p.minOrder)}</div>}
                      {p.startsAt && <div>Du {formatDate(p.startsAt)}</div>}
                      {p.endsAt && <div>Jusqu’au {formatDate(p.endsAt)}</div>}
                      {p.onePerCustomer && <div>1 fois par e-mail</div>}
                    </td>
                    <td className={td}>{p.usedCount}{p.maxUses ? ` / ${p.maxUses}` : ''}</td>
                    <td className={td}>
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${!p.active ? 'bg-sand-200 text-black' : expired ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                        {!p.active ? 'Désactivé' : expired ? 'Expiré' : 'Actif'}
                      </span>
                    </td>
                    <td className={`${td} whitespace-nowrap text-right`}>
                      <Btn variant="ghost" onClick={() => edit(p)}>Modifier</Btn>
                      <Btn variant="ghost" onClick={() => toggle(p)}>{p.active ? 'Désactiver' : 'Activer'}</Btn>
                      <Btn variant="ghost" className="text-red-700" onClick={() => setTarget(p)}>Supprimer</Btn>
                    </td>
                  </tr>
                );
              })}
              {!paged.loading && paged.items.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center">Aucun code promo.</td></tr>}
            </tbody>
          </table>
        </div>
        {paged.loading && paged.items.length === 0 && <Loading />}
        <Pagination {...paged.pager} />
      </Card>
      {target && <ConfirmDialog title="Supprimer ce code ?" message={`Le code ${target.code} ne pourra plus être utilisé. Les commandes déjà passées ne sont pas modifiées.`} onCancel={() => setTarget(null)} onConfirm={remove} />}
    </>
  );
}

function GiftCards() {
  const [q, setQ] = useState('');
  const search = useDebounced(q);
  const [actionError, setActionError] = useState(null);
  const paged = usePaged((p) => api.giftCards.adminList(p), { q: search || undefined }, 10);

  const setStatus = async (g, status) => {
    try { await api.giftCards.adminUpdate(g.id, status); setActionError(null); paged.reload(); } catch (err) { setActionError(err); }
  };

  return (
    <>
      <p className="mb-4 text-sm text-black/80">Les cartes apparaissent ici une fois payées. Annuler une carte la rend inutilisable (utile en cas de fraude ou de litige) ; vous pouvez la réactiver.</p>
      <div className="mb-4 flex">
        <input className={`${inputCls} ml-auto max-w-xs`} placeholder="Code ou e-mail" aria-label="Rechercher une carte cadeau" value={q} onChange={(e) => { setQ(e.target.value); paged.resetPage(); }} />
      </div>
      {actionError && <div className="mb-4"><ErrorBox error={actionError} /></div>}
      {paged.error && <div className="mb-4"><ErrorBox error={paged.error} onRetry={paged.reload} /></div>}
      <Card className={paged.loading && paged.items.length > 0 ? 'opacity-60 transition-opacity' : ''} aria-busy={paged.loading}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="text-black/70">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Acheteur</th>
                <th className="px-4 py-3 font-medium">Destinataire</th>
                <th className="px-4 py-3 font-medium">Solde / initial</th>
                <th className="px-4 py-3 font-medium">Validité</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {paged.items.map((g) => (
                <tr key={g.id} className="border-t border-sand-200">
                  <td className={`${td} font-mono text-xs font-semibold`}>{g.code}</td>
                  <td className={td}>{g.buyer.name}<span className="block text-xs text-black/70">{g.buyer.email}</span></td>
                  <td className={td}>{g.recipient.email ? <>{g.recipient.name}<span className="block text-xs text-black/70">{g.recipient.email}</span></> : '—'}</td>
                  <td className={td}><strong>{euro(g.balance)}</strong> / {euro(g.initial)}</td>
                  <td className={td}>{g.expiresAt ? formatDate(g.expiresAt) : '—'}</td>
                  <td className={td}><span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${GIFT_STATUS[g.status]?.[1]}`}>{GIFT_STATUS[g.status]?.[0]}</span></td>
                  <td className={`${td} text-right`}>
                    {g.status === 'active' ? <Btn variant="ghost" className="text-red-700" onClick={() => setStatus(g, 'cancelled')}>Annuler</Btn> : <Btn variant="ghost" onClick={() => setStatus(g, 'active')}>Réactiver</Btn>}
                  </td>
                </tr>
              ))}
              {!paged.loading && paged.items.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center">Aucune carte cadeau vendue.</td></tr>}
            </tbody>
          </table>
        </div>
        {paged.loading && paged.items.length === 0 && <Loading />}
        <Pagination {...paged.pager} />
      </Card>
    </>
  );
}
