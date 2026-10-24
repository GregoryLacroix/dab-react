import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import { NetworkBar, PageLoader } from './components/ui/Loaders.jsx';
import Home from './pages/Home.jsx';
import OrderResult from './pages/OrderResult.jsx';
import OAuthReturn from './pages/OAuthReturn.jsx';
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
  login: <Login />, oauth: <OAuthReturn />, forgot: <ForgotPassword />, reset: <ResetPassword />, register: <Register />, account: <Account />,
  legal: <LegalNotice />, privacy: <Privacy />, terms: <Terms />, error: <ServerError />,
};

export default function App() {
  return (
    <>
      <NetworkBar />
      <Routes>
        <Route path="/admin/*" element={<Suspense fallback={<PageLoader />}><AdminRoutes /></Suspense>} />
        <Route element={<Layout />}>
          {ROUTES.flatMap((r) => LANGS.map((lang) => <Route key={`${r.key}-${lang}`} path={r[lang]} element={PAGES[r.key]} />))}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
