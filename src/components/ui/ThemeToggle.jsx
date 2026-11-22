import { useTheme } from '../../services/theme.js';
import { useI18n } from '../../i18n/I18nProvider.jsx';

// Bouton clair / sombre du menu
export default function ThemeToggle() {
  const { t } = useI18n();
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  const label = dark ? t('theme.toLight') : t('theme.toDark');
  return (
    <button type="button" className="header__theme" onClick={toggle} aria-label={label} title={label}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {dark
          ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>
          : <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />}
      </svg>
    </button>
  );
}
