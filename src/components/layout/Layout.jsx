import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import ScrollProgress from '../effects/ScrollProgress.jsx';
import CookieBanner from '../ui/CookieBanner.jsx';
import { PageLoader } from '../ui/Loaders.jsx';
import { ServerErrorView } from '../ui/ErrorPages.jsx';
import { RouteErrorBoundary } from '../ErrorBoundary.jsx';
import { useI18n } from '../../i18n/I18nProvider.jsx';

export default function Layout() {
  const { pathname } = useLocation();
  const { t } = useI18n();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <>
      <a href="#contenu" className="skip-link">{t('skip')}</a>
      <ScrollProgress />
      <Header />
      <main id="contenu" tabIndex={-1}>
        <RouteErrorBoundary fallback={(error) => <ServerErrorView error={error} />}>
          <Suspense fallback={<PageLoader />}><Outlet /></Suspense>
        </RouteErrorBoundary>
      </main>
      <Footer />
      <CookieBanner />
    </>
  );
}
