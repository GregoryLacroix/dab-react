import { Routes, Route } from 'react-router-dom';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './admin.css';
import AdminLayout from './AdminLayout.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProductsAdmin from './pages/ProductsAdmin.jsx';
import ProductForm from './pages/ProductForm.jsx';
import Categories from './pages/Categories.jsx';
import Orders from './pages/Orders.jsx';
import Content from './pages/Content.jsx';
import Messages from './pages/Messages.jsx';
import Quotes from './pages/Quotes.jsx';
import Faq from './pages/Faq.jsx';
import StockAlerts from './pages/StockAlerts.jsx';
import Shipping from './pages/Shipping.jsx';
import Promos from './pages/Promos.jsx';
import Realisations from './pages/Realisations.jsx';
import Reviews from './pages/Reviews.jsx';
import ComingSoonAdmin from './pages/ComingSoon.jsx';
import { AdminNotFound } from './AdminErrors.jsx';
import SliderAdmin from './pages/SliderAdmin.jsx';

export default function AdminRoutes() {
  return (
    <div className="admin-root font-sans">
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="produits" element={<ProductsAdmin />} />
          <Route path="produits/nouveau" element={<ProductForm />} />
          <Route path="produits/:id" element={<ProductForm />} />
          <Route path="categories" element={<Categories />} />
          <Route path="commandes" element={<Orders />} />
          <Route path="devis" element={<Quotes />} />
          <Route path="messages" element={<Messages />} />
          <Route path="faq" element={<Faq />} />
          <Route path="alertes-stock" element={<StockAlerts />} />
          <Route path="livraison" element={<Shipping />} />
          <Route path="promos" element={<Promos />} />
          <Route path="realisations" element={<Realisations />} />
          <Route path="avis" element={<Reviews />} />
 <Route path="bientot" element={<ComingSoonAdmin />} />
          <Route path="slider" element={<SliderAdmin />} />
          <Route path="contenu" element={<Content />} />
          <Route path="*" element={<AdminNotFound />} />
        </Route>
      </Routes>
    </div>
  );
}
