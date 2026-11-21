import { lazy, Suspense } from 'react';
import { Routes, Route, matchPath, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { useSiteMode } from './store/store.js';
import ComingSoon from './pages/ComingSoon.jsx';
import SoonBar from './components/ui/SoonBar.jsx';
import Layout from './components/layout/Layout.jsx';
import { NetworkBar, PageLoader } from './components/ui/Loaders.jsx';
import Home from './pages/Home.jsx';
import OrderResult from './pages/OrderResult.jsx';
import OAuthReturn from './pages/OAuthReturn.jsx';
import TwoFactorVerify from './pages/TwoFactorVerify.jsx';
import QuoteRequest from './pages/QuoteRequest.jsx';
import QuotePay from './pages/QuotePay.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import { LANGS, ROUTES } from './i18n/routes.js';

// Chaque page est téléchargée seulement quand on la visite : le premier affichage est plus léger (bon pour Google)
const Products = lazy(() => import('./pages/Products.jsx'));
const ProductView = lazy(() => import('./pages/ProductView.jsx'));
const Cart = lazy(() => import('./pages/Cart.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Account = lazy(() => import('./pages/Account.jsx'));
const LegalNotice = lazy(() => import('./pages/legal/LegalNotice.jsx'));
const Privacy = lazy(() => import('./pages/legal/Privacy.jsx'));
const Terms = lazy(() => import('./pages/legal/Terms.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const ServerError = lazy(() => import('./pages/ServerError.jsx'));
// Le back-office (et Tailwind) ne se charge que si on visite /admin
const AdminRoutes = lazy(() => import('./admin/AdminRoutes.jsx'));

// Chaque page existe en français (/produits) et en anglais (/en/shop) : les adresses viennent de i18n/routes.js
const PAGES = {
  home: <Home />, shop: <Products />, product: <ProductView />, cart: <Cart />, order: <OrderResult />, contact: <Contact />,
  login: <Login />, oauth: <OAuthReturn />, twofactor: <TwoFactorVerify />, quote: <QuoteRequest />, quotePay: <QuotePay />, forgot: <ForgotPassword />, reset: <ResetPassword />, register: <Register />, account: <Account />,
  legal: <LegalNotice />, privacy: <Privacy />, terms: <Terms />, error: <ServerError />,
};

// Pages qui restent accessibles même quand le site est en « Bientôt disponible » (obligations légales, retour de paiement)
const OPEN_KEYS = ['legal', 'privacy', 'terms', 'order'];
const isOpenPath = (pathname) => ROUTES.some((r) => OPEN_KEYS.includes(r.key) && LANGS.some((lang) => matchPath({ path: r[lang], end: true }, pathname)));

// Mode « Bientôt disponible » : les visiteurs voient la page d'attente ; l'administrateur connecté voit le site avec un bandeau d'information
function Gate() {
  const { pathname } = useLocation();
  const { user, loading } = useAuth();
  const { loaded, active } = useSiteMode();
  if (!loaded || loading) return <PageLoader />;
  if (active && !user?.isAdmin && !isOpenPath(pathname)) return <ComingSoon />;
  return (
    <>
      {active && user?.isAdmin && <SoonBar />}
      <Layout />
    </>
  );
}

export default function App() {
  return (
    <>
      <NetworkBar />
      <Routes>
        <Route path="/admin/*" element={<Suspense fallback={<PageLoader />}><AdminRoutes /></Suspense>} />
        <Route element={<Gate />}>
          {ROUTES.flatMap((r) => LANGS.map((lang) => <Route key={`${r.key}-${lang}`} path={r[lang]} element={PAGES[r.key]} />))}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
