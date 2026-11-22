import { api } from '../../services/api.js';
import useQuery from '../../services/useQuery.js';
import { Card, ErrorBox, Loading, PageHeader } from '../ui.jsx';
import { Link } from 'react-router-dom';

// Produits pour lesquels des visiteurs ont demandé « prévenez-moi » : un e-mail part automatiquement quand le stock repasse au-dessus de 0
export default function StockAlerts() {
  const { data, error, loading, reload } = useQuery(() => api.stockAlertCounts(), []);
  return (
    <>
      <PageHeader title="Alertes retour en stock" />
      <p className="mb-4 text-sm text-black/80">
        Quand vous remettez du stock sur un produit épuisé (fiche produit, champ « Stock »), les personnes inscrites reçoivent un seul e-mail, puis leur adresse est supprimée.
        Cette liste montre la demande : utile pour décider quoi repeindre en priorité.
      </p>
      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data && (
        <Card>
          <table className="w-full text-left text-sm">
            <thead><tr className="text-black/70"><th className="px-4 py-3 font-medium">Produit</th><th className="px-4 py-3 font-medium">Stock</th><th className="px-4 py-3 font-medium">Inscrits</th></tr></thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.productId} className="border-t border-sand-200">
                  <td className="px-4 py-3"><Link className="underline" to={`/admin/produits/${r.productId}`}>{r.name}</Link></td>
                  <td className="px-4 py-3">{r.stock}</td>
                  <td className="px-4 py-3 font-semibold">{r.count}</td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center">Aucune inscription pour l’instant.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
