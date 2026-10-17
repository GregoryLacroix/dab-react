import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { LogoMark } from '../components/ui/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { RouteErrorBoundary } from '../components/ErrorBoundary.jsx';
import { AdminCrash } from './AdminErrors.jsx';
import { Btn, Loading } from './ui.jsx';

const links = [
  ['/admin', 'Tableau de bord', true],
  ['/admin/produits', 'Produits'],
  ['/admin/categories', 'Catégories'],
  ['/admin/commandes', 'Commandes'],
  ['/admin/messages', 'Messages'],
  ['/admin/slider', 'Slider d’accueil'],
  ['/admin/contenu', 'Contenu du site'],
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const [unread, setUnread] = useState(0);

  // Pastille « messages non lus » : GET /api/messages?read=0 (on ne garde que le total)
  useEffect(() => {
    if (!user?.isAdmin) return undefined;
    let alive = true;
    const load = () => api.messages.list({ read: 0, perPage: 1 }).then((r) => { if (alive) setUnread(r.meta.total); }, () => {});
    load();
    window.addEventListener('dab:messages', load);
    return () => { alive = false; window.removeEventListener('dab:messages', load); };
  }, [user]);

  if (loading) return <div className="min-h-screen bg-sand-50"><Loading label="Vérification de la session…" /></div>;
  if (!user?.isAdmin) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen bg-sand-50 text-black md:flex">
      <aside className="border-b border-sand-200 bg-sand-100 md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
        <Link to="/admin" className="flex items-center gap-3 px-4 py-3 md:py-6">
          <LogoMark className="h-12 w-12" />
          <span className="text-xl font-bold text-black">Back-office</span>
        </Link>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0" aria-label="Administration">
          {links.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-black text-white' : 'hover:bg-sand-200'}`}>
              {({ isActive }) => (
                <>
                  {label}
                  {to === '/admin/messages' && unread > 0 && (
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${isActive ? 'bg-white text-black' : 'bg-black text-white'}`}>{unread}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="hidden flex-col gap-1 border-t border-sand-200 p-3 md:mt-auto md:flex">
          <p className="truncate px-3 py-1 text-xs text-black/70">{user.email}</p>
          <Link to="/" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-sand-200">Voir le site</Link>
          <Btn variant="ghost" className="justify-start" onClick={async () => { await logout(); navigate('/admin/login'); }}>Se déconnecter</Btn>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <RouteErrorBoundary fallback={(error) => <AdminCrash error={error} />}>
          <Outlet />
        </RouteErrorBoundary>
      </main>
    </div>
  );
}
