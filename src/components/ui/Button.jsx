import { Link } from 'react-router-dom';

// variant : "primary" | "ghost" ; si "to" est fourni, rend un lien ;
// loading : affiche un rond qui tourne, désactive le bouton et évite le double clic
export default function Button({ to, variant = 'primary', className = '', loading = false, disabled, children, ...props }) {
  const cls = `btn btn--${variant} ${loading ? 'is-loading' : ''} ${className}`.trim();
  return to ? (
    <Link to={to} className={cls} {...props}>{children}</Link>
  ) : (
    <button className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <span className="spinner spinner--inline" aria-hidden="true" />}
      {children}
    </button>
  );
}
