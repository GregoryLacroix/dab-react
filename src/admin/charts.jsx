// Petits graphiques en HTML/CSS (aucune bibliothèque) pour le tableau de bord.
import { euro } from './ui.jsx';

const ACCENT = '#c8891a';

/** Évolution en % par rapport à la période précédente (null = pas de comparaison) */
export function Delta({ value }) {
  if (value === null || value === undefined) return null;
  const up = value >= 0;
  return (
    <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${up ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
      title="Par rapport à la période précédente de même durée">
      {up ? '▲' : '▼'} {Math.abs(value).toLocaleString('fr-FR')} %
    </span>
  );
}

/** Histogramme : points = [{ label, value, tip }] ; affiche 3 repères de date sous les barres */
export function BarChart({ points, height = 160, color = ACCENT, ariaLabel, format = (v) => v }) {
  const max = Math.max(...points.map((p) => p.value), 0);
  const marks = points.length > 1 ? [0, Math.floor((points.length - 1) / 2), points.length - 1] : [0];
  return (
    <figure className="m-0">
      <div role="img" aria-label={ariaLabel} className="flex items-end gap-px border-b border-sand-200" style={{ height }}>
        {points.map((p, i) => (
          <div key={i} className="group relative flex h-full min-w-0 flex-1 items-end" title={p.tip ?? `${p.label} : ${format(p.value)}`}>
            <div className="w-full rounded-t-sm transition-opacity group-hover:opacity-70"
              style={{ height: max > 0 ? `${Math.max(p.value > 0 ? 2 : 0, (p.value / max) * 100)}%` : 0, background: color }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-black/70" aria-hidden="true">
        {marks.map((i) => <span key={i}>{points[i]?.label}</span>)}
      </div>
      {max > 0 && <p className="mt-1 text-right text-xs text-black/60">Maximum : {format(max)}</p>}
    </figure>
  );
}

/** Barres horizontales : rows = [{ label, value, right?, to? }] */
export function HBars({ rows, color = ACCENT, format = (v) => v, empty = 'Aucune donnée sur cette période.' }) {
  const max = Math.max(...rows.map((r) => r.value), 0);
  if (rows.length === 0 || max === 0) return <p className="text-sm text-black/70">{empty}</p>;
  return (
    <ul className="grid gap-3">
      {rows.map((r) => (
        <li key={r.key ?? r.label} className="text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate font-medium text-black">{r.label}</span>
            <span className="shrink-0 text-black/80">{r.right ?? format(r.value)}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-sand-200" aria-hidden="true">
            <div className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Barre empilée (parts d'un total) + légende */
const PALETTE = ['#c8891a', '#1f2937', '#6b8f71', '#b45f5f', '#7c8db5', '#a3a3a3'];
export function ShareBar({ rows, format = euro }) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (total <= 0) return <p className="text-sm text-black/70">Aucune vente sur cette période.</p>;
  return (
    <div>
      <div className="flex h-4 overflow-hidden rounded-full bg-sand-200" role="img"
        aria-label={rows.map((r) => `${r.label} ${Math.round((r.value / total) * 100)} %`).join(', ')}>
        {rows.map((r, i) => <div key={r.label} style={{ width: `${(r.value / total) * 100}%`, background: PALETTE[i % PALETTE.length] }} title={`${r.label} : ${format(r.value)}`} />)}
      </div>
      <ul className="mt-3 grid gap-1 text-sm">
        {rows.map((r, i) => (
          <li key={r.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2"><i className="inline-block h-3 w-3 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />{r.label}</span>
            <span className="text-black/80">{format(r.value)} · {Math.round((r.value / total) * 100)} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const Stars = ({ value }) => (
  <span aria-label={`${value} sur 5`} className="whitespace-nowrap" style={{ color: ACCENT }}>
    {'★'.repeat(Math.round(value))}<span className="text-sand-400">{'★'.repeat(5 - Math.round(value))}</span>
  </span>
);
