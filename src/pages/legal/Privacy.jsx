import { Link } from 'react-router-dom';
import { LegalPage, useLegal } from './LegalKit.jsx';
import { useContent } from '../../store/store.js';
import { useI18n } from '../../i18n/I18nProvider.jsx';
import { OPTIONAL_SERVICES } from '../../config/consent.js';

export default function Privacy() {
  const { t, l: path, pick } = useI18n();
  const { l, val } = useLegal();
  const { contact } = useContent();
  const mail = val(l.email || contact.email, 'email');
  const rows = [1, 2, 3, 4];
  return (
    <LegalPage title={t('pp.title')} path="/politique-de-confidentialite" description={t('pp.desc')}>
      <h2>{t('pp.h.controller')}</h2>
      <p>{t('pp.controller', { company: val(l.company, 'company'), address: val(l.address, 'address'), mail })}</p>

      <h2>{t('pp.h.what')}</h2>
      <p>{t('pp.what')}</p>
      <div className="legal__table">
        <table>
          <thead>
            <tr><th>{t('pp.th.use')}</th><th>{t('pp.th.data')}</th><th>{t('pp.th.basis')}</th><th>{t('pp.th.retention')}</th></tr>
          </thead>
          <tbody>
            {rows.map((n) => (
              <tr key={n}>
                <td>{t(`pp.r${n}.use`)}</td>
                <td>{t(`pp.r${n}.data`)}</td>
                <td>{t(`pp.r${n}.basis`)}</td>
                <td>{t(`pp.r${n}.retention`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>{t('pp.noSale')}</p>

      <h2>{t('pp.h.recipients')}</h2>
      <p>{t('pp.recipients', { host: val(l.host, 'host') })}</p>

      <h2>{t('pp.h.rights')}</h2>
      <p>{t('pp.rights')}</p>
      <ul>
        <li>{t('pp.rights.account', {}, [(c) => <Link to={path('/mon-compte')}>{c}</Link>])}</li>
        <li>{t('pp.rights.mail', { mail })}</li>
        <li>{t('pp.rights.cnil', {}, [() => <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noreferrer">cnil.fr/fr/plaintes</a>])}</li>
      </ul>
      <p>{t('pp.rights.orders')}</p>

      <h2>{t('pp.h.cookies')}</h2>
      <div className="legal__table">
        <table>
          <thead>
            <tr><th>{t('pp.th.name')}</th><th>{t('pp.th.role')}</th><th>{t('pp.th.duration')}</th><th>{t('pp.th.consent')}</th></tr>
          </thead>
          <tbody>
            <tr><td><code>dab-token</code></td><td>{t('pp.token.role')}</td><td>{t('pp.token.duration')}</td><td>{t('pp.token.consent')}</td></tr>
            <tr><td><code>dab-cart</code></td><td>{t('pp.cart.role')}</td><td>{t('pp.cart.duration')}</td><td>{t('pp.cart.consent')}</td></tr>
            <tr><td><code>dab_oauth</code></td><td>{t('pp.oauth.role')}</td><td>{t('pp.oauth.duration')}</td><td>{t('pp.token.consent')}</td></tr>
            {OPTIONAL_SERVICES.map((s) => (
              <tr key={s.id}><td>{pick(s.label)}</td><td>{pick(s.description)}</td><td>—</td><td>{t('pp.optional.consent')}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {OPTIONAL_SERVICES.length === 0 && <p>{t('pp.noTrackers', {}, [(c) => <strong>{c}</strong>])}</p>}

      <h2>{t('pp.h.security')}</h2>
      <p>{t('pp.security')}</p>

      <h2>{t('pp.h.changes')}</h2>
      <p>{t('pp.changes')}</p>
    </LegalPage>
  );
}
