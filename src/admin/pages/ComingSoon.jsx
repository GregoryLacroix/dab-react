import { useState } from 'react';
import { api, fieldErrors } from '../../services/api.js';
import useQuery from '../../services/useQuery.js';
import { setContentCache } from '../../store/store.js';
import { Btn, Card, ErrorBox, Field, Loading, PageHeader, inputCls } from '../ui.jsx';

// Réglages de la page « Bientôt disponible » : GET /api/content -> comingSoon ; enregistrement : PUT /api/content { comingSoon }
export default function ComingSoonAdmin() {
  const { data, error, loading, reload } = useQuery(() => api.content.get(), []);
  if (loading && !data) return <><PageHeader title="Bientôt disponible" /><Loading /></>;
  if (error && !data) return <><PageHeader title="Bientôt disponible" /><ErrorBox error={error} onRetry={reload} /></>;
  return <Editor initial={data.comingSoon} />;
}

function Editor({ initial }) {
  const [cs, setCs] = useState(initial);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ ok: true, text: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => { setCs((c) => ({ ...c, [k]: e.target.value })); setStatus({ ok: true, text: '' }); };

  const save = async (next, okText) => {
    setSaving(true);
    setErrors({});
    try {
      const saved = await api.content.save({ comingSoon: next }); // PUT /api/content (seule la clé comingSoon est envoyée)
      setContentCache(saved);                                     // le site réagit tout de suite
      setCs(saved.comingSoon);
      setStatus({ ok: true, text: okText });
    } catch (err) {
      setErrors(fieldErrors(err, {}));
      setStatus({ ok: false, text: err.status === 422 ? 'Certains champs sont invalides : voir les messages en rouge.' : err.message });
    } finally {
      setSaving(false);
    }
  };
  const toggle = () => save({ ...cs, enabled: !cs.enabled }, cs.enabled ? 'Le site est ouvert au public.' : 'Le site est en « Bientôt disponible » : les visiteurs voient la page d’attente.');

  return (
    <>
      <PageHeader title="Bientôt disponible" />

      <Card className={`mb-6 flex flex-wrap items-center justify-between gap-4 p-6 ${cs.enabled ? 'border-amber-400 bg-amber-50' : ''}`}>
        <div>
          <p className="text-sm">État du site</p>
          <p className="text-2xl font-bold text-black">{cs.enabled ? 'En « Bientôt disponible »' : 'Ouvert au public'}</p>
          <p className="mt-1 max-w-xl text-sm text-black/80">
            {cs.enabled
              ? 'Les visiteurs voient seulement la page d’attente (les mentions légales et la confidentialité restent accessibles). Vous, connecté en administrateur, voyez le site normalement, avec un bandeau orange.'
              : 'Activez ce mode pour remplacer tout le site par une page « Bientôt disponible », par exemple avant le lancement ou pendant des travaux.'}
          </p>
        </div>
        <Btn variant={cs.enabled ? 'primary' : 'secondary'} loading={saving} onClick={toggle}>
          {cs.enabled ? 'Ouvrir le site maintenant' : 'Activer « Bientôt disponible »'}
        </Btn>
      </Card>

      <form className="grid max-w-3xl gap-6" onSubmit={(e) => { e.preventDefault(); save(cs, 'Modifications enregistrées.'); }}>
        <Card className="grid gap-4 p-6">
          <h2 className="text-lg font-semibold text-black">Texte de la page d’attente</h2>
          <Field label="Titre" error={errors['comingSoon.title']}><input className={inputCls} maxLength={80} value={cs.title} onChange={set('title')} /></Field>
          <Field label="Texte" error={errors['comingSoon.text']}><textarea className={inputCls} rows={3} maxLength={400} value={cs.text} onChange={set('text')} /></Field>
          <Field label="Date d’ouverture (facultatif)" hint="Affichée sur la page avec le nombre de jours restants. Laissez vide pour ne rien afficher." error={errors['comingSoon.date']}>
            <input className={`${inputCls} max-w-xs`} type="date" value={cs.date} onChange={set('date')} />
          </Field>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-black" checked={cs.autoOpen} disabled={!cs.date}
              onChange={(e) => { setCs((c) => ({ ...c, autoOpen: e.target.checked })); setStatus({ ok: true, text: '' }); }} />
            <span><strong>Ouvrir le site automatiquement à cette date</strong><span className="mt-0.5 block text-black/80">Le jour J à minuit, les visiteurs voient le site sans aucune action de votre part.</span></span>
          </label>
          <p className="text-sm text-black/80">L’adresse e-mail et le lien Instagram affichés viennent de la page « Contenu du site » (rubrique Contact). Le logo est celui du site.</p>
          <p className="text-sm text-black/80">Pour voir la page comme un visiteur : ouvrez le site dans une fenêtre de navigation privée.</p>
          {status.text && <p role={status.ok ? 'status' : 'alert'} className={`rounded-lg px-4 py-3 text-sm ${status.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{status.text}</p>}
          <div><Btn type="submit" loading={saving}>Enregistrer les textes</Btn></div>
        </Card>
      </form>
    </>
  );
}
