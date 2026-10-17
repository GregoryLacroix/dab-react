import { Link } from 'react-router-dom';
import { LegalPage, useLegal } from './LegalKit.jsx';
import { useContent } from '../../store/store.js';
import { useI18n } from '../../i18n/I18nProvider.jsx';

export default function LegalNotice() {
  const { t, l: path } = useI18n();
  const { l, val } = useLegal();
  const { contact } = useContent();
  const terms = [(c) => <Link to={path('/conditions-generales-de-vente')}>{c}</Link>];
  return (
    <LegalPage title={t('ln.title')} path="/mentions-legales" description={t('ln.desc')}>
      <h2>{t('ln.h.publisher')}</h2>
      <p>{t('ln.publisher', { company: val(l.company, 'company'), status: val(l.status, 'status'), siret: val(l.siret, 'siret') })}</p>
      <ul>
        <li>{t('ln.address', { v: val(l.address, 'address') })}</li>
        <li>{t('ln.email', { v: val(l.email || contact.email, 'email') })}</li>
        <li>{t('ln.phone', { v: val(l.phone, 'phone') })}</li>
        <li>{t('ln.director', { v: val(l.publisher, 'publisher') })}</li>
      </ul>

      <h2>{t('ln.h.host')}</h2>
      <p>{t('ln.host', { host: val(l.host, 'host'), address: val(l.hostAddress, 'hostAddress') })}</p>

      <h2>{t('ln.h.ip')}</h2>
      <p>{t('ln.ip')}</p>

      <h2>{t('ln.h.data')}</h2>
      <p>{t('ln.data', {}, [(c) => <Link to={path('/politique-de-confidentialite')}>{c}</Link>])}</p>

      <h2>{t('ln.h.links')}</h2>
      <p>{t('ln.links')}</p>

      <h2>{t('ln.h.mediation')}</h2>
      <p>{t('ln.mediation', { mediator: val(l.mediator, 'mediator') }, terms)}</p>
    </LegalPage>
  );
}
