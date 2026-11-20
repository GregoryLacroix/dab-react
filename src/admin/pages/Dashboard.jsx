import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import useQuery from '../../services/useQuery.js';
import { Card, ErrorBox, Loading, PageHeader, StatusBadge, euro, formatDate, statusStyle } from '../ui.jsx';
import { BarChart, Delta, HBars, ShareBar, Stars } from '../charts.jsx';

const PERIODS = [['7', '7 jours'], ['30', '30 jours'], ['90', '90 jours'], ['365', '12 mois'], ['all', 'Depuis le début']];
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const euro0 = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);
const dayLabel = (iso) => { const [, m, d] = iso.split('-'); return `${Number(d)} ${MONTHS[Number(m) - 1]}`; };
const monthLabel = (iso) => { const [y, m] = iso.split('-'); return `${MONTHS[Number(m) - 1]} ${y}`; };
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

function Section({ title, hint, children, className = '' }) {
  return (
    <Card className={`p-5 ${className}`}>
      <h2 className="text-lg font-semibold text-black">{title}</h2>
      {hint && <p className="mb-3 text-xs text-black/70">{hint}</p>}
      <div className={hint ? '' : 'mt-3'}>{children}</div>
    </Card>
  );
}

function Kpi({ label, value, change, sub }) {
  return (
    <Card className="p-5">
      <p className="text-sm">{label}</p>
      <p className="mt-1 flex flex-wrap items-center text-3xl font-bold text-black">{value}<Delta value={change} /></p>
      {sub && <p className="mt-1 text-xs text-black/70">{sub}</p>}
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('30');
  const { data: s, error, loading, reload } = useQuery(() => api.stats(), []);                 // GET /api/admin/stats
  const a = useQuery(() => api.analytics(period), [period]);                                   // GET /api/admin/analytics?period=…

  if (loading && !s) return <><PageHeader title="Tableau de bord" /><Loading /></>;
  if (error && !s) return <><PageHeader title="Tableau de bord" /><ErrorBox error={error} onRetry={reload} /></>;

  const todo = [
    ['Commandes à traiter', s.orders.toHandle, '/admin/commandes'],
    ['Messages non lus', s.messages.unread, '/admin/messages'],
    ['Avis à modérer', s.reviews?.pending ?? 0, '/admin/avis'],
  ];
  const d = a.data;

  return (
    <>
      <PageHeader title="Tableau de bord" />
      {!user?.twoFactor && (
        <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm" role="note">
          <strong>Sécurité :</strong> la double authentification n’est pas activée sur votre compte. Elle protège l’administration même si votre mot de passe est volé.{' '}
          <Link to="/mon-compte" className="font-semibold underline">Activer maintenant</Link>
        </p>
      )}

      {/* À faire maintenant */}
      <div className="grid gap-3 sm:grid-cols-3">
        {todo.map(([label, n, to]) => (
          <Link key={label} to={to} className={`flex items-center justify-between rounded-xl border px-5 py-4 transition hover:shadow-sm ${n > 0 ? 'border-black bg-black text-white' : 'border-sand-200 bg-white/70 text-black'}`}>
            <span className="text-sm font-medium">{label}</span>
            <span className="text-3xl font-bold">{n}</span>
          </Link>
        ))}
      </div>

      {/* Période */}
      <div className="mb-4 mt-8 flex flex-wrap items-center gap-2">
        <h2 className="mr-2 text-xl font-bold text-black">Statistiques</h2>
        {PERIODS.map(([key, label]) => (
          <button key={key} type="button" aria-pressed={period === key} onClick={() => setPeriod(key)}
            className={`rounded-full border px-3 py-1 text-sm font-medium ${period === key ? 'border-black bg-black text-white' : 'border-sand-400 hover:bg-sand-200'}`}>{label}</button>
        ))}
        {d && <span className="ml-auto text-xs text-black/70">du {formatDate(d.period.from)} au {formatDate(d.period.to)}</span>}
      </div>

      {a.error && !d && <ErrorBox error={a.error} onRetry={a.reload} />}
      {a.loading && !d && <Loading />}
      {d && <Stats d={d} s={s} busy={a.loading} />}

      <Card className="mt-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black">Dernières commandes</h2>
          <Link to="/admin/commandes" className="text-sm font-medium text-black underline hover:no-underline">Tout voir</Link>
        </div>
        {s.recentOrders.length === 0 && <p className="text-sm">Aucune commande pour le moment.</p>}
        <ul className="divide-y divide-sand-200">
          {s.recentOrders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span><strong className="text-black">{o.id}</strong> · {o.customer.name} · {formatDate(o.date)}</span>
              <span className="flex items-center gap-3"><StatusBadge status={o.status} /><strong>{euro(o.total)}</strong></span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

function Stats({ d, s, busy }) {
  const k = d.kpis;
  const monthly = d.series.unit === 'month';
  const points = d.series.points.map((p) => ({
    label: monthly ? monthLabel(p.date) : dayLabel(p.date),
    value: p.revenue,
    tip: `${monthly ? monthLabel(p.date) : dayLabel(p.date)} : ${euro0(p.revenue)} · ${plural(p.orders, 'commande', 'commandes')}`,
  }));
  const best = d.topProducts.best;
  const maxDay = Math.max(...d.weekdays, 0);
  const bestWeekday = maxDay > 0 ? DAYS[d.weekdays.indexOf(maxDay)] : null;
  const statusRows = Object.entries(d.statuses).filter(([, n]) => n > 0);
  const q = d.quotes;

  return (
    <div className={busy ? 'opacity-60 transition-opacity' : 'transition-opacity'} aria-busy={busy}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Chiffre d’affaires" value={euro0(k.revenue.value)} change={k.revenue.change} sub="commandes payées, hors annulées" />
        <Kpi label="Commandes" value={k.orders.value} change={k.orders.change} sub={`${k.itemsSold.value} article${k.itemsSold.value > 1 ? 's' : ''} vendu${k.itemsSold.value > 1 ? 's' : ''}`} />
        <Kpi label="Panier moyen" value={euro0(k.avgBasket.value)} change={k.avgBasket.change} sub="par commande" />
        <Kpi label="Clients" value={k.customers.value} change={k.customers.change}
          sub={k.customers.value > 0 ? `${k.returning.share} % déjà clients · ${plural(k.newAccounts.value, 'nouveau compte', 'nouveaux comptes')}` : plural(k.newAccounts.value, 'nouveau compte', 'nouveaux comptes')} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Section title="Chiffre d’affaires" hint={monthly ? 'Par mois' : 'Par jour'} className="lg:col-span-2">
          {k.orders.value === 0
            ? <p className="py-10 text-center text-sm text-black/70">Aucune vente sur cette période.</p>
            : <BarChart points={points} ariaLabel="Chiffre d’affaires sur la période" format={euro0} />}
          {d.bestDay && <p className="mt-3 text-sm">Meilleur jour : <strong className="text-black">{dayLabel(d.bestDay.date)}</strong> avec {euro0(d.bestDay.revenue)}.</p>}
        </Section>

        <Section title="Meilleur produit">
          {best ? (
            <div>
              <Link to={`/admin/produits/${best.id}`} className="text-xl font-bold text-black hover:underline">{best.name}</Link>
              <p className="mt-1 text-sm">{euro0(best.revenue)} de ventes · {plural(best.qty, 'vendu', 'vendus')}</p>
              {d.topProducts.byQty[0] && d.topProducts.byQty[0].id !== best.id && (
                <p className="mt-3 text-sm">Le plus vendu en quantité : <strong className="text-black">{d.topProducts.byQty[0].name}</strong> ({d.topProducts.byQty[0].qty}).</p>
              )}
            </div>
          ) : <p className="text-sm text-black/70">Aucune vente sur cette période.</p>}
        </Section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Section title="Top 5 des produits" hint="Par chiffre d’affaires">
          <HBars format={euro0} rows={d.topProducts.byRevenue.map((p) => ({ key: p.id, label: p.name, value: p.revenue, right: `${euro0(p.revenue)} · ${p.qty}×` }))} />
        </Section>
        <Section title="Ventes par catégorie">
          <ShareBar rows={d.categories.map((c) => ({ label: c.name, value: c.revenue }))} format={euro0} />
        </Section>
        <Section title="Jours d’achat" hint={bestWeekday ? `Le plus actif : ${bestWeekday.toLowerCase()}` : 'Commandes par jour de la semaine'}>
          <BarChart height={110} points={d.weekdays.map((n, i) => ({ label: DAYS[i].slice(0, 3), value: n, tip: `${DAYS[i]} : ${plural(n, 'commande', 'commandes')}` }))}
            ariaLabel="Commandes par jour de la semaine" color="#1f2937" />
          <div className="mt-1 flex justify-between text-xs text-black/70" aria-hidden="true">{DAYS.map((x) => <span key={x} className="flex-1 text-center">{x[0]}</span>)}</div>
        </Section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Section title="Devis sur mesure" hint="Demandes reçues sur la période">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt>Reçues</dt><dd className="text-2xl font-bold text-black">{q.received}</dd></div>
            <div><dt>Devis envoyés</dt><dd className="text-2xl font-bold text-black">{q.sent}</dd></div>
            <div><dt>Acomptes payés</dt><dd className="text-2xl font-bold text-black">{q.depositPaid}</dd></div>
            <div><dt>Conversion</dt><dd className="text-2xl font-bold text-black">{q.conversion === null ? '—' : `${q.conversion} %`}</dd></div>
          </dl>
          {(q.depositTotal > 0 || q.quotedTotal > 0) && (
            <p className="mt-3 text-sm">{euro0(q.quotedTotal)} de devis envoyés, dont <strong className="text-black">{euro0(q.depositTotal)}</strong> d’acomptes encaissés.</p>
          )}
          <Link to="/admin/devis" className="mt-3 inline-block text-sm font-medium underline hover:no-underline">Voir les devis</Link>
        </Section>

        <Section title="Avis clients" hint="Toutes périodes">
          {d.reviews.count === 0 ? <p className="text-sm text-black/70">Aucun avis publié pour le moment.</p> : (
            <div>
              <p className="flex items-baseline gap-2"><span className="text-3xl font-bold text-black">{d.reviews.average.toLocaleString('fr-FR')}</span><span>/ 5</span><Stars value={d.reviews.average} /></p>
              <p className="text-sm">{plural(d.reviews.count, 'avis publié', 'avis publiés')}</p>
              <ul className="mt-3 grid gap-1 text-sm">
                {d.reviews.best.map((b) => (
                  <li key={b.id} className="flex justify-between gap-3"><Link to={`/admin/produits/${b.id}`} className="truncate hover:underline">{b.name}</Link><span className="shrink-0"><Stars value={b.average} /> ({b.count})</span></li>
                ))}
              </ul>
            </div>
          )}
          {d.reviews.pending > 0 && <Link to="/admin/avis" className="mt-3 inline-block text-sm font-medium underline hover:no-underline">{plural(d.reviews.pending, 'avis à modérer', 'avis à modérer')}</Link>}
        </Section>

        <Section title="Commandes par statut" hint="Passées sur la période">
          {statusRows.length === 0 ? <p className="text-sm text-black/70">Aucune commande.</p> : (
            <ul className="grid gap-2 text-sm">
              {statusRows.map(([status, n]) => (
                <li key={status} className="flex items-center justify-between"><span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[status]}`}>{status}</span><strong className="text-black">{n}</strong></li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Section title="Stock" hint="En direct, produits publiés">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt>Disponibles</dt><dd className="text-2xl font-bold text-black">{d.stock.inStock}</dd></div>
            <div><dt>Vendus</dt><dd className="text-2xl font-bold text-black">{d.stock.soldOut}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-black/70">{s.products.published} produit{s.products.published > 1 ? 's' : ''} publié{s.products.published > 1 ? 's' : ''}, {s.categories} catégorie{s.categories > 1 ? 's' : ''}.</p>
        </Section>
        <Section title="Pièces qui ne partent pas" hint={`Disponibles et sans vente sur la période (${d.stock.unsoldCount})`} className="lg:col-span-2">
          {d.stock.unsold.length === 0 ? <p className="text-sm text-black/70">Toutes vos pièces disponibles se sont vendues sur cette période.</p> : (
            <ul className="divide-y divide-sand-200 text-sm">
              {d.stock.unsold.map((p) => (
                <li key={p.id} className="flex justify-between gap-3 py-2">
                  <Link to={`/admin/produits/${p.id}`} className="truncate font-medium text-black hover:underline">{p.name}</Link>
                  <span className="shrink-0 text-black/70">en ligne depuis le {formatDate(p.since)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-black/70">Idée : refaire les photos, partager la pièce sur les réseaux, ou la mettre dans le slider d’accueil.</p>
        </Section>
      </div>
    </div>
  );
}
