import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button.jsx';
import { useConsent } from '../../context/ConsentContext.jsx';
import { useI18n } from '../../i18n/I18nProvider.jsx';

// Bandeau de consentement (CNIL) : « Tout refuser » aussi simple que « Tout accepter », rien de coché d'avance.
// N'apparaît que s'il existe au moins un service optionnel (voir src/config/consent.js).
export default function CookieBanner() {
  const { t, l, pick } = useI18n();
  const { services, decided, open, consent, acceptAll, refuseAll, save, closeSettings } = useConsent();
  const [custom, setCustom] = useState(false);
  const [choices, setChoices] = useState(() => ({ ...(consent?.choices ?? {}) }));

  if (!services.length || (decided && !open)) return null;

  return (
    <div className="cookie" role="dialog" aria-labelledby="cookie-title">
      <h2 id="cookie-title">{t('cookie.title')}</h2>
      <p>{t('cookie.text', {}, [(c) => <Link to={l('/politique-de-confidentialite')}>{c}</Link>])}</p>
      {custom && (
        <ul className="cookie__list">
          {services.map((s) => (
            <li key={s.id}>
              <label className="check">
                <input type="checkbox" checked={Boolean(choices[s.id])} onChange={(e) => setChoices({ ...choices, [s.id]: e.target.checked })} />
                <span><strong>{pick(s.label)}</strong><br />{pick(s.description)}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <div className="cookie__actions">
        <Button onClick={refuseAll}>{t('cookie.refuse')}</Button>
        <Button onClick={acceptAll}>{t('cookie.accept')}</Button>
        {custom
          ? <Button variant="ghost" onClick={() => save(choices)}>{t('cookie.save')}</Button>
          : <Button variant="ghost" onClick={() => setCustom(true)}>{t('cookie.customize')}</Button>}
        {decided && <Button variant="ghost" onClick={closeSettings}>{t('cookie.close')}</Button>}
      </div>
    </div>
  );
}
