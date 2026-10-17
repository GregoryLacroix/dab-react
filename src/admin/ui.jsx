import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export const inputCls =
  'w-full rounded-lg border border-sand-400 bg-sand-50 px-3 py-2 text-sm text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10';

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';
const variants = {
  primary: 'bg-black text-white hover:bg-neutral-700',
  secondary: 'border border-black text-black hover:bg-sand-200',
  danger: 'bg-red-700 text-white hover:bg-red-800',
  ghost: 'text-black hover:bg-sand-200',
};
export const btnCls = (variant = 'primary', extra = '') => `${btnBase} ${variants[variant]} ${extra}`;

export function Btn({ variant = 'primary', className = '', loading = false, disabled, children, ...props }) {
  return (
    <button type="button" className={btnCls(variant, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <span className="spinner spinner--inline" aria-hidden="true" />}
      {children}
    </button>
  );
}
export function LinkBtn({ variant = 'primary', className = '', ...props }) {
  return <Link className={btnCls(variant, className)} {...props} />;
}

export const Card = ({ className = '', ...props }) => (
  <div className={`rounded-xl border border-sand-200 bg-white/70 ${className}`} {...props} />
);

export function PageHeader({ title, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-bold text-3xl text-black md:text-4xl">{title}</h1>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function Field({ label, hint, error, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-black">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-black/70">{hint}</span>}
      {error && <span role="alert" className="mt-1 block text-xs text-red-700">{error}</span>}
    </label>
  );
}

export const statusStyle = {
  'en attente': 'bg-amber-100 text-amber-800',
  'payée': 'bg-brand-100 text-black',
  'expédiée': 'bg-indigo-100 text-indigo-800',
  'livrée': 'bg-emerald-100 text-emerald-800',
  'annulée': 'bg-red-100 text-red-800',
};
export const StatusBadge = ({ status }) => (
  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[status]}`}>{status}</span>
);

export function ConfirmDialog({ title, message, confirmLabel = 'Supprimer', onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onCancel}>
      <div role="dialog" aria-modal="true" aria-labelledby="dlg-title"
        className="w-full max-w-sm rounded-xl bg-sand-50 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="dlg-title" className="text-lg font-semibold text-black">{title}</h2>
        <p className="mt-2 text-sm">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Btn variant="ghost" onClick={onCancel}>Annuler</Btn>
          <Btn variant="danger" onClick={onConfirm}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>
  );
}

export const euro = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
export const formatDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

// ----- Pagination (réutilisable pour tous les tableaux)
export function usePagination(items, initialSize = 10) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(initialSize);
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, pageCount);
  return {
    pageItems: items.slice((current - 1) * size, current * size),
    pager: { page: current, pageCount, size, total: items.length, onPage: setPage, onSize: (n) => { setSize(n); setPage(1); } },
    resetPage: () => setPage(1),
  };
}

function pageList(page, count) {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const nums = [...new Set([1, count, page - 1, page, page + 1])].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);
  return nums.flatMap((n, i) => (i && n - nums[i - 1] > 1 ? ['…', n] : [n]));
}

export function Pagination({ page, pageCount, size, total, onPage, onSize }) {
  const from = total === 0 ? 0 : (page - 1) * size + 1;
  const to = Math.min(total, page * size);
  const pill = 'rounded-md border border-sand-400 px-3 py-1 text-sm font-medium hover:bg-sand-200 disabled:cursor-not-allowed disabled:opacity-40';
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sand-200 px-4 py-3 text-sm">
      <p>{from}–{to} sur {total}</p>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">
          Lignes par page
          <select className="rounded-md border border-sand-400 bg-sand-50 px-2 py-1" value={size} onChange={(e) => onSize(Number(e.target.value))}>
            {[5, 10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1">
          <button type="button" className={pill} disabled={page === 1} onClick={() => onPage(page - 1)}>Précédent</button>
          {pageList(page, pageCount).map((n, i) => n === '…'
            ? <span key={`e${i}`} className="px-1">…</span>
            : <button type="button" key={n} aria-current={n === page ? 'page' : undefined} onClick={() => onPage(n)}
                className={`${pill} ${n === page ? 'border-black bg-black text-white hover:bg-black' : ''}`}>{n}</button>)}
          <button type="button" className={pill} disabled={page === pageCount} onClick={() => onPage(page + 1)}>Suivant</button>
        </nav>
      </div>
    </div>
  );
}

// ----- États de chargement et d'erreur des appels à l'API
export const Loading = ({ label = 'Chargement…' }) => (
  <div role="status" className="flex items-center justify-center gap-3 py-10 text-sm text-black/70">
    <span className="spinner" aria-hidden="true" />
    {label}
  </div>
);

export function ErrorBox({ error, onRetry }) {
  return (
    <div role="alert" className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800">
      {error?.message ?? 'Une erreur est survenue.'}
      {onRetry && <button type="button" onClick={onRetry} className="ml-3 font-semibold underline">Réessayer</button>}
    </div>
  );
}
