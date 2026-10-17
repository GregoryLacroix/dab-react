import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { I18nProvider } from './i18n/I18nProvider.jsx';
import { ConsentProvider } from './context/ConsentContext.jsx';
import { RouteErrorBoundary } from './components/ErrorBoundary.jsx';
import { ServerErrorView } from './components/ui/ErrorPages.jsx';
// Polices hébergées avec le site (aucune requête vers Google Fonts : respect de la vie privée et plus rapide)
import '@fontsource/figtree/400.css';
import '@fontsource/figtree/500.css';
import '@fontsource/figtree/600.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import './styles/main.scss';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <RouteErrorBoundary fallback={(error) => <main><ServerErrorView error={error} /></main>}>
          <ConsentProvider>
            <AuthProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </AuthProvider>
          </ConsentProvider>
        </RouteErrorBoundary>
      </I18nProvider>
    </BrowserRouter>
  </React.StrictMode>
);
