import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { setContentCache } from '../../store/store.js';

// Bandeau visible par l'administrateur quand le site est en « Bientôt disponible » (les visiteurs ne voient que la page d'attente)
export default function SoonBar() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const open = async () => {
    setBusy(true);
    setError('');
    try {
      const saved = await api.content.save({ comingSoon: { ...(await api.content.get()).comingSoon, enabled: false } });
      setContentCache(saved);
    } catch (e) { setError(e.message); setBusy(false); }
  };
  return (
    <div className="soonbar" role="status">
      <span><strong>Mode « Bientôt disponible » actif.</strong> Les visiteurs voient la page d’attente ; vous, connecté en administrateur, voyez le site.</span>
      <span className="soonbar__actions">
        <Link to="/admin/bientot">Réglages</Link>
        <button type="button" onClick={open} disabled={busy}>{busy ? 'Ouverture…' : 'Ouvrir le site maintenant'}</button>
      </span>
      {error && <span role="alert">{error}</span>}
    </div>
  );
}
