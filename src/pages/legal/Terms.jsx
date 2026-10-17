import { Link } from 'react-router-dom';
import { LegalPage, useLegal } from './LegalKit.jsx';
import { useContent } from '../../store/store.js';
import { useI18n } from '../../i18n/I18nProvider.jsx';

export default function Terms() {
  const { t, l: path } = useI18n();
  const { l, val } = useLegal();
  const { contact } = useContent();
  const mail = val(l.email || contact.email, 'email');
  const mediator = val(l.mediator, 'mediator');
  return (
    <LegalPage title={t('tc.title')} path="/conditions-generales-de-vente" description={t('tc.desc')}>
      <h2>{t('tc.h1')}</h2>
      <p>{t('tc.p1', { company: val(l.company, 'company'), status: val(l.status, 'status'), siret: val(l.siret, 'siret'), address: val(l.address, 'address'), mail },
        [(c) => <Link to={path('/mentions-legales')}>{c}</Link>])}</p>

      <h2>{t('tc.h2')}</h2>
      <p>{t('tc.p2')}</p>

      <h2>{t('tc.h3')}</h2>
      <p>{t('tc.p3')}</p>

      <h2>{t('tc.h4')}</h2>
      <p>{t('tc.p4', { vat: val(l.vatNote, 'vat') })}</p>

      <h2>{t('tc.h5')}</h2>
      <p>{t('tc.p5')}</p>

      <h2>{t('tc.h6')}</h2>
      <p>{t('tc.p6')}</p>

      <h2>{t('tc.h7')}</h2>
      <p>{t('tc.p7', { delay: val(l.deliveryDelay, 'delivery'), shipping: val(l.shippingTerms, 'shipping') })}</p>

      <h2>{t('tc.h8')}</h2>
      <p>{t('tc.p8a', { mail })}</p>
      <p>{t('tc.p8b', {}, [(c) => <strong>{c}</strong>])}</p>

      <h2>{t('tc.h9')}</h2>
      <p>{t('tc.p9', { mail })}</p>

      <h2>{t('tc.h10')}</h2>
      <p>{t('tc.p10', { mail, mediator }, [() => <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer">ec.europa.eu/consumers/odr</a>])}</p>

      <h2>{t('tc.h11')}</h2>
      <p>{t('tc.p11', {}, [(c) => <Link to={path('/politique-de-confidentialite')}>{c}</Link>])}</p>

      <h2>{t('tc.h12')}</h2>
      <p>{t('tc.p12')}</p>
    </LegalPage>
  );
}
