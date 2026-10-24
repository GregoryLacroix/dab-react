import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import FormField from '../components/ui/FormField.jsx';
import { PageLoader } from '../components/ui/Loaders.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, fieldErrors } from '../services/api.js';
import { saveBlob } from '../services/download.js';
import useSeo from '../services/seo.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

// Statut de l'API (français) -> clé de traduction
const STATUS = { 'en attente': 'pending', 'payée': 'paid', 'expédiée': 'shipped', 'livrée': 'delivered', 'annulée': 'cancelled' };

// Historique des commandes + factures ; droits RGPD : accès / portabilité (export JSON) et effacement (suppression du compte)
export default function Account() {
  const { t, l, money, date } = useI18n();
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState({ ok: true, text: '' });
  const [askDelete, setAskDelete] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState(null);       // null = chargement ; [] = aucune commande
  const [ordersError, setOrdersError] = useState('');
  const [invoiceBusy, setInvoiceBusy] = useState(''); // référence de la commande dont la facture se télécharge
  const [invoiceError, setInvoiceError] = useState('');
  useSeo({ title: t('account.title'), path: '/mon-compte', noindex: true });

  // Historique des commandes : GET /api/auth/me/orders
  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    api.account.orders().then(
      (res) => { if (alive) setOrders(res.items ?? []); },
      (err) => { if (alive) { setOrders([]); setOrdersError(err.message); } },
    );
    return () => { alive = false; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to={l('/connexion')} replace />;

  const downloadInvoice = async (order) => {
    setInvoiceBusy(order.id);
    setInvoiceError('');
    try {
      saveBlob(await api.orders.invoice(order.id), `${order.invoice.number ?? order.id}.pdf`); // GET /api/orders/{ref}/invoice
      // Le numéro de facture est attribué à la première demande pour les anciennes commandes : on rafraîchit la liste
      if (!order.invoice.number) api.account.orders().then((res) => setOrders(res.items ?? []), () => {});
    } catch (err) {
      setInvoiceError(order.id);
    } finally {
      setInvoiceBusy('');
    }
  };

  const exportData = async () => {
    setExporting(true);
    setMessage({ ok: true, text: '' });
    try {
      const data = await api.account.export(); // GET /api/auth/me/export
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = t('account.fileName');
      a.click();
      URL.revokeObjectURL(a.href);
      setMessage({ ok: true, text: t('account.downloaded') });
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async (e) => {
    e.preventDefault();
    const social = !user.hasPassword; // compte créé avec Google / Facebook : pas de mot de passe, on confirme avec l'adresse e-mail
    if (!password) return setError(t(social ? 'account.emailRequired' : 'account.passwordRequired'));
    setDeleting(true);
    setError('');
    try {
      await api.account.remove(social ? { email: password } : { password }); // DELETE /api/auth/me
      await logout();
      navigate(l('/'), { replace: true });
    } catch (err) {
      setError(fieldErrors(err).password ?? err.message);
      setDeleting(false);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <h1>{t('account.title')}</h1>
        <div className="account">
          <div className="account__card account__card--orders">
            <h2>{t('account.ordersTitle')}</h2>
            {orders === null && <p role="status">{t('account.ordersLoading')}</p>}
            {ordersError && <p className="notice notice--error" role="alert">{ordersError}</p>}
            {orders?.length === 0 && !ordersError && <p>{t('account.noOrders')}</p>}
            {orders?.length > 0 && (
              <ul className="orders">
                {orders.map((o) => (
                  <li key={o.id}>
                    <details className="order">
                      <summary>
                        <span className="order__ref">{o.id}</span>
                        <span className="order__date">{date(o.date)}</span>
                        <span className={`order__status order__status--${STATUS[o.status] ?? 'pending'}`}>{t(`order.status.${STATUS[o.status] ?? 'pending'}`)}</span>
                        <span className="order__total">{money(o.total)}</span>
                      </summary>
                      <div className="order__body">
                        <ul className="order__items">
                          {o.items.map((i, k) => (
                            <li key={k}><span>{i.qty} × {i.name}</span><span>{money(i.qty * i.price)}</span></li>
                          ))}
                          <li className="order__sum"><span>{t('account.orderTotal')}</span><span>{money(o.total)}</span></li>
                        </ul>
                        <div className="order__cols">
                          <div>
                            <h3>{t('account.orderPayment')}</h3>
                            {o.payment?.refundedAt ? <p>{t('account.refundedOn', { date: date(o.payment.refundedAt) })}</p>
                              : o.payment?.paidAt ? <p>{t('account.paidOn', { date: date(o.payment.paidAt) })}</p>
                                : <p>{t(`order.status.${STATUS[o.status] ?? 'pending'}`)}</p>}
                          </div>
                          {o.tracking && (
                            <div>
                              <h3>{t('account.orderTracking')}</h3>
                              <p>{[o.tracking.carrier, o.tracking.number && t('account.trackNumber', { number: o.tracking.number })].filter(Boolean).join(' · ')}</p>
                              {o.tracking.shippedAt && <p>{t('account.shippedOn', { date: date(o.tracking.shippedAt) })}</p>}
                              {/^https?:\/\//i.test(o.tracking.url ?? '') && <p><a href={o.tracking.url} target="_blank" rel="noreferrer noopener">{t('account.trackLink')}</a></p>}
                            </div>
                          )}
                          {o.shipping && (
                            <div>
                              <h3>{t('account.orderShipping')}</h3>
                              <address>
                                {[o.shipping.name, o.shipping.line1, o.shipping.line2, `${o.shipping.postalCode ?? ''} ${o.shipping.city ?? ''}`.trim(), o.shipping.state, o.shipping.country]
                                  .filter(Boolean).map((line, k) => <span key={k}>{line}</span>)}
                              </address>
                            </div>
                          )}
                        </div>
                        {o.invoice?.available && (
                          <div className="order__invoice">
                            <Button variant="ghost" onClick={() => downloadInvoice(o)} loading={invoiceBusy === o.id}>
                              {o.invoice.number ? t('account.invoiceBtnNumber', { number: o.invoice.number }) : t('account.invoiceBtn')}
                            </Button>
                            {invoiceError === o.id && <p className="notice notice--error" role="alert">{t('account.invoiceError')}</p>}
                            {t('account.invoiceNote') && <p className="note">{t('account.invoiceNote')}</p>}
                          </div>
                        )}
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="account__card">
            <h2>{t('account.infoTitle')}</h2>
            <p><strong>{t('account.nameLabel')}</strong> {user.name}</p>
            <p><strong>{t('account.emailLabel')}</strong> {user.email}</p>
          </div>

          <div className="account__card">
            <h2>{t('account.dataTitle')}</h2>
            <p>{t('account.dataText')}</p>
            <Button variant="ghost" onClick={exportData} loading={exporting}>{t('account.download')}</Button>
            {message.text && <p className={`notice ${message.ok ? '' : 'notice--error'}`} role="status">{message.text}</p>}
          </div>

          <div className="account__card">
            <h2>{t('account.deleteTitle')}</h2>
            {user.isAdmin ? (
              <p>{t('account.adminNoDelete')}</p>
            ) : !askDelete ? (
              <>
                <p>{t('account.deleteWarning')}</p>
                <Button variant="ghost" onClick={() => setAskDelete(true)}>{t('account.deleteAsk')}</Button>
              </>
            ) : (
              <form onSubmit={deleteAccount} noValidate>
                <FormField label={t(user.hasPassword ? 'account.passwordConfirm' : 'account.emailConfirm')} name="password"
                  type={user.hasPassword ? 'password' : 'email'} autoComplete={user.hasPassword ? 'current-password' : 'email'}
                  value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
                <div className="hero__actions">
                  <Button type="submit" loading={deleting}>{t('account.deleteNow')}</Button>
                  <Button variant="ghost" onClick={() => { setAskDelete(false); setPassword(''); setError(''); }}>{t('account.cancel')}</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
