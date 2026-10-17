import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import useQuery from '../../services/useQuery.js';
import { Card, ErrorBox, Loading, PageHeader, StatusBadge, euro, formatDate } from '../ui.jsx';

export default function Dashboard() {
  const { data: s, error, loading, reload } = useQuery(() => api.stats(), []); // GET /api/admin/stats

  if (loading && !s) return <><PageHeader title="Tableau de bord" /><Loading /></>;
  if (error && !s) return <><PageHeader title="Tableau de bord" /><ErrorBox error={error} onRetry={reload} /></>;

  const stats = [
    ['Produits', s.products.total, `${s.products.published} publiés`],
    ['Catégories', s.categories, 'dans la boutique'],
    ['Commandes', s.orders.total, `${s.orders.toHandle} à traiter`],
    ['Messages', s.messages.total, `${s.messages.unread} non lu${s.messages.unread > 1 ? 's' : ''}`],
    ['Chiffre d’affaires', euro(s.revenue), 'commandes payées, hors annulées'],
  ];

  return (
    <>
      <PageHeader title="Tableau de bord" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map(([label, value, sub]) => (
          <Card key={label} className="p-5">
            <p className="text-sm">{label}</p>
            <p className="mt-1 text-4xl font-bold text-black">{value}</p>
            <p className="mt-1 text-xs text-black/70">{sub}</p>
          </Card>
        ))}
      </div>

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
