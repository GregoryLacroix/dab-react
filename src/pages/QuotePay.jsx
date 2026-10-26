import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import { PageLoader } from '../components/ui/Loaders.jsx';
import { api } from '../services/api.js';
import useSeo from '../services/seo.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

const POLL_MS = 2000;
const POLL_MAX = 8; // après le paiement : le webhook de Stripe arrive en général en moins d'une seconde

// Page du devis, reçue par e-mail : /devis/<clé>  (anglais : /en/quote/<clé>). La clé de l'adresse tient lieu de mot de passe.
export default function QuotePay() {
  const { token } = useParams();
  const [params] = useSearchParams();
  const { t, l, money, date } = useI18n();
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState('');
  useSeo({ title: t('quote.pay.seoTitle'), path: '/devis', noindex: true });

  const justPaid = params.get('paid') === '1'; // retour de la page de paiement de Stripe
  useEffect(() => {
    let stop = false;
    let timer;
    let tries = 0;
    const load = async () => {
      try {
        const res = await api.quotes.get(token);
        if (stop) return;
        setQuote(res);
        if (justPaid && !res.depositPaid && ++tries < POLL_MAX) timer = setTimeout(load, POLL_MS); // paiement en cours de confirmation
      } catch (err) {
        if (!stop) setError(err);
      }
    };
    load();
    return () => { stop = true; clearTimeout(timer); };
  }, [token, justPaid]);

  const pay = async () => {
    setBusy(true);
    setPayError('');
    try {
      const res = await api.quotes.checkout(token); // POST /api/quotes/{clé}/checkout
      window.location.assign(res.checkoutUrl);       // la page de paiement Stripe
    } catch (err) {
      setPayError(err.message);
      setBusy(false);
    }
  };

  if (error) {
    return (
      <section className="section container empty">
        <h1>{t('quote.pay.notFoundTitle')}</h1>
        <p>{t('quote.pay.notFoundText')}</p>
        <Button to={l('/devis')}>{t('quote.pay.newRequest')}</Button>
      </section>
    );
  }
  if (!quote) return <PageLoader />;

  const size = quote.widthCm && quote.heightCm ? `${quote.widthCm} × ${quote.heightCm} cm` : null;
  const summary = (
    <ul className="quote__summary">
      <li><strong>{t('quote.pay.reference')}</strong> {quote.reference}</li>
      <li><strong>{t('quote.projectType')}</strong> {t(`quote.type.${quote.projectType}`)}</li>
      {size && <li><strong>{t('quote.pay.size')}</strong> {size}</li>}
      {quote.location && <li><strong>{t('quote.location')}</strong> {quote.location}</li>}
    </ul>
  );

  if (quote.depositPaid) {
    return (
      <section className="section container empty">
        <h1>{t('quote.pay.paidTitle')}</h1>
        <p>{t('quote.pay.paidText', { amount: money(quote.deposit ?? 0), date: quote.depositPaidAt ? date(quote.depositPaidAt) : '' })}</p>
        {summary}
        <Button to={l('/')}>{t('err.home')}</Button>
      </section>
    );
  }
  if (justPaid) {
    return (
      <section className="section container empty">
        <h1>{t('quote.pay.pendingTitle')}</h1>
        <p>{t('quote.pay.pendingText')}</p>
      </section>
    );
  }
  if (quote.status === 'nouvelle') {
    return (
      <section className="section container empty">
        <h1>{t('quote.pay.studyTitle')}</h1>
        <p>{t('quote.pay.studyText')}</p>
        {summary}
      </section>
    );
  }
  if (quote.status !== 'devis envoyé' || quote.amount == null) {
    return (
      <section className="section container empty">
        <h1>{t('quote.pay.closedTitle')}</h1>
        <p>{t('quote.pay.closedText')}</p>
        <Button to={l('/devis')}>{t('quote.pay.newRequest')}</Button>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container quote__pay">
        <h1>{t('quote.pay.title')}</h1>
        {summary}
        <p className="quote__amount">{t('quote.pay.amount')} <strong>{money(quote.amount)}</strong> <span>{t('quote.pay.vat')}</span></p>
        {quote.message && <blockquote className="quote__message">{quote.message}</blockquote>}
        {quote.payable ? (
          <>
            <p>{t('quote.pay.depositText', { deposit: money(quote.deposit), percent: quote.depositPercent })}</p>
            <Button onClick={pay} loading={busy}>{busy ? t('cart.redirecting') : t('quote.pay.button', { deposit: money(quote.deposit) })}</Button>
            {payError && <p className="notice notice--error" role="alert">{payError}</p>}
            <p className="note">{t('quote.pay.secure')}</p>
          </>
        ) : (
          <p>{t('quote.pay.noDeposit')}</p>
        )}
      </div>
    </section>
  );
}
