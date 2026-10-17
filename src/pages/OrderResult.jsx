import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import { PageLoader } from '../components/ui/Loaders.jsx';
import { useCart } from '../context/CartContext.jsx';
import { api } from '../services/api.js';
import useSeo from '../services/seo.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

const POLL_MS = 2000;
const POLL_MAX = 8; // ~16 s : le webhook de Stripe arrive en général en moins d'une seconde

// Page de retour de Stripe : /commande?session_id=cs_…  (anglais : /en/order)
// Interroge l'API jusqu'à ce que le paiement soit confirmé (l'API vérifie elle-même auprès de Stripe si le webhook tarde).
export default function OrderResult() {
  const { t, l, money } = useI18n();
  const { clear } = useCart();
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const [result, setResult] = useState(null);   // { id, status, paid, total, customer }
  const [failed, setFailed] = useState(false);
  useSeo({ title: t('order.seoTitle'), path: '/commande', noindex: true });

  useEffect(() => {
    if (!sessionId) return undefined;
    let stop = false;
    let timer;
    let tries = 0;
    const check = async () => {
      try {
        const res = await api.orders.checkoutStatus(sessionId);
        if (stop) return;
        setResult(res);
        if (!res.paid && res.status === 'en attente' && ++tries < POLL_MAX) timer = setTimeout(check, POLL_MS);
      } catch {
        if (!stop) setFailed(true);
      }
    };
    check();
    return () => { stop = true; clearTimeout(timer); };
  }, [sessionId]);

  // Le client a payé (ou le paiement est en cours de confirmation) : on peut vider le panier
  useEffect(() => {
    if (result && result.status !== 'annulée') clear();
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  const shop = <Button to={l('/produits')}>{t('cart.continue')}</Button>;

  if (!sessionId || failed) {
    return (
      <section className="section container empty">
        <h1>{t('order.unknownTitle')}</h1>
        <p>{t('order.unknownText')}</p>
        {shop}
      </section>
    );
  }
  if (!result) return <PageLoader label={t('order.checking')} />;

  if (result.refunded) {
    return (
      <section className="section container empty">
        <h1>{t('order.refundedTitle')}</h1>
        <p>{t('order.refundedText', { id: result.id })}</p>
        {shop}
      </section>
    );
  }
  if (result.paid) {
    return (
      <section className="section container empty">
        <h1>{t('cart.thanksTitle')}</h1>
        <p>{t('order.paidText', { id: result.id, total: money(result.total), email: result.customer.email })}</p>
        {shop}
      </section>
    );
  }
  if (result.status === 'annulée') {
    return (
      <section className="section container empty">
        <h1>{t('order.failedTitle')}</h1>
        <p>{t('order.failedText')}</p>
        <Button to={l('/panier')}>{t('order.backToCart')}</Button>
      </section>
    );
  }
  // Toujours « en attente » : paiement différé ou confirmation lente. L'e-mail de confirmation partira dès réception.
  return (
    <section className="section container empty">
      <h1>{t('order.pendingTitle')}</h1>
      <p>{t('order.pendingText', { id: result.id, email: result.customer.email })}</p>
      {shop}
    </section>
  );
}
