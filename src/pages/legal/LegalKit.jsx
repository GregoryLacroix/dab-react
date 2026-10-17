import useSeo from '../../services/seo.js';
import { useContent } from '../../store/store.js';
import { useI18n } from '../../i18n/I18nProvider.jsx';

/**
 * Données légales saisies dans le back-office + `val(valeur, clé)` : la valeur, sinon un repère bien visible « à compléter »
 * (clé = nom du champ dans le dictionnaire : legal.f.<clé>).
 */
export function useLegal() {
  const { t } = useI18n();
  const l = useContent().legal ?? {};
  const val = (v, key) => (v && String(v).trim() ? v : <mark className="todo">{t('legal.todo', { label: t(`legal.f.${key}`) })}</mark>);
  return { l, val };
}

export function LegalPage({ title, path, description, children }) {
  const { t } = useI18n();
  useSeo({ title, description, path });
  const courtesy = t('legal.courtesy'); // vide en français ; en anglais : « traduction de courtoisie, la version française prévaut »
  return (
    <section className="section">
      <div className="container legal">
        <h1>{title}</h1>
        <p className="note">{t('legal.updated')}</p>
        {courtesy && <p className="note"><em>{courtesy}</em></p>}
        {children}
      </div>
    </section>
  );
}
