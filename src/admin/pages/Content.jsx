import { useState } from 'react';
import { api, fieldErrors } from '../../services/api.js';
import useQuery from '../../services/useQuery.js';
import { setContentCache } from '../../store/store.js';
import { Btn, Card, ConfirmDialog, ErrorBox, Field, LinkBtn, Loading, PageHeader, inputCls } from '../ui.jsx';

const getIn = (o, path) => path.reduce((x, k) => x[k], o);
const setIn = (o, [k, ...rest], v) => {
  const copy = Array.isArray(o) ? [...o] : { ...o };
  copy[k] = rest.length ? setIn(o[k], rest, v) : v;
  return copy;
};

// GET /api/content -> formulaire ; enregistrement : PUT /api/content
export default function Content() {
  const { data, error, loading, reload } = useQuery(() => api.content.get(), []);
  if (loading && !data) return <><PageHeader title="Contenu du site" /><Loading /></>;
  if (error && !data) return <><PageHeader title="Contenu du site" /><ErrorBox error={error} onRetry={reload} /></>;
  return <ContentEditor initial={data} />;
}

function ContentEditor({ initial }) {
  const [draft, setDraft] = useState(() => structuredClone(initial));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ ok: true, text: '' });
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const update = (path, value) => { setDraft((d) => setIn(d, path, value)); setStatus({ ok: true, text: '' }); };
  // Fonction (et non composant) pour ne pas perdre le focus à chaque frappe
  const t = (label, path, { rows, hint } = {}) => {
    const props = { className: inputCls, value: getIn(draft, path) ?? '', onChange: (e) => update(path, e.target.value) };
    return (
      <Field key={path.join('.')} label={label} hint={hint} error={errors[path.join('.')]}>
        {rows ? <textarea rows={rows} {...props} /> : <input {...props} />}
      </Field>
    );
  };
  const section = (title, children) => (
    <Card className="grid gap-4 p-5 md:grid-cols-2">
      <h2 className="text-lg font-semibold text-black md:col-span-2">{title}</h2>
      {children}
    </Card>
  );
  const linkHint = 'Lien interne, par exemple /produits ou /produits?categorie=fresques';

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      // Le slider se règle dans sa propre page : on ne l'envoie pas ici
      const { slider, ...rest } = draft; // eslint-disable-line no-unused-vars
      const saved = await api.content.save(rest); // PUT /api/content
      setContentCache(saved);                     // le site public affiche tout de suite les nouveaux textes
      setDraft(structuredClone(saved));
      setStatus({ ok: true, text: 'Modifications enregistrées. Elles sont visibles sur le site.' });
    } catch (err) {
      setErrors(fieldErrors(err));
      setStatus({ ok: false, text: err.status === 422 ? 'Certains champs sont invalides : voir les messages en rouge.' : err.message });
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setConfirmReset(false);
    try {
      const content = await api.content.reset(); // POST /api/content/reset
      setContentCache(content);
      setDraft(structuredClone(content));
      setErrors({});
      setStatus({ ok: true, text: 'Textes d’origine rétablis.' });
    } catch (err) {
      setStatus({ ok: false, text: err.message });
    }
  };

  return (
    <>
      <PageHeader title="Contenu du site">
        <LinkBtn to="/" variant="secondary" target="_blank">Voir le site</LinkBtn>
      </PageHeader>

      <div className="grid gap-6">
        {section('Accueil : bandeau d’introduction', <>
          <div className="md:col-span-2">{t('Titre', ['hero', 'title'], { rows: 2 })}</div>
          <div className="md:col-span-2">{t('Texte', ['hero', 'text'], { rows: 3 })}</div>
          {t('Bouton principal : texte', ['hero', 'primaryLabel'])}
          {t('Bouton principal : lien', ['hero', 'primaryTo'], { hint: linkHint })}
          {t('Bouton secondaire : texte', ['hero', 'secondaryLabel'])}
          {t('Bouton secondaire : lien', ['hero', 'secondaryTo'], { hint: linkHint })}
        </>)}

        {section('Accueil : mots qui défilent', draft.marquee.map((_, i) => t(`Mot ${i + 1}`, ['marquee', i])))}

        {section('Accueil : le galet qui se peint (3 étapes)', draft.story.map((_, i) => (
          <div key={i} className="grid gap-3 md:col-span-2">
            {t(`Étape ${i + 1} : titre`, ['story', i, 'title'])}
            {t(`Étape ${i + 1} : texte`, ['story', i, 'text'], { rows: 2 })}
          </div>
        )))}

        {section('Accueil : dernières créations', <>
          {t('Titre de la section', ['latest', 'title'])}
          <Field label="Nombre de produits affichés" error={errors['latest.count']}>
            <select className={inputCls} value={draft.latest.count} onChange={(e) => update(['latest', 'count'], Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
        </>)}

        {section('Accueil : les deux blocs du bas', draft.blocks.map((_, i) => (
          <div key={i} className="grid gap-3 md:col-span-2 md:grid-cols-2">
            <div className="md:col-span-2">{t(`Bloc ${i + 1} : titre`, ['blocks', i, 'title'])}</div>
            <div className="md:col-span-2">{t(`Bloc ${i + 1} : texte`, ['blocks', i, 'text'], { rows: 2 })}</div>
            {t(`Bloc ${i + 1} : bouton`, ['blocks', i, 'cta'])}
            {t(`Bloc ${i + 1} : lien`, ['blocks', i, 'to'], { hint: linkHint })}
          </div>
        )))}

        {section('Page Contact', <>
          <div className="md:col-span-2">{t('Titre', ['contact', 'title'])}</div>
          <div className="md:col-span-2">{t('Texte d’introduction', ['contact', 'text'], { rows: 3 })}</div>
          {t('Adresse e-mail affichée', ['contact', 'email'])}
          {t('Lien Instagram', ['contact', 'instagram'], { hint: 'Adresse complète, par exemple https://www.instagram.com/votre_compte/' })}
        </>)}

        {section('Informations légales (mentions légales, confidentialité, CGV)', <>
          <p className="text-sm md:col-span-2">Ces informations alimentent les pages légales du site. Tant qu’un champ est vide, la page affiche « à compléter » en surbrillance. Faites relire ces pages par un professionnel du droit.</p>
          {t('Nom ou raison sociale', ['legal', 'company'])}
          {t('Forme juridique', ['legal', 'status'], { hint: 'Ex. entrepreneur individuel, micro-entreprise, SAS…' })}
          {t('Numéro SIRET', ['legal', 'siret'])}
          {t('Adresse', ['legal', 'address'])}
          {t('E-mail de contact légal', ['legal', 'email'], { hint: 'Si vide, l’e-mail de la page Contact est utilisé.' })}
          {t('Téléphone', ['legal', 'phone'])}
          {t('Directeur de la publication', ['legal', 'publisher'])}
          {t('Hébergeur', ['legal', 'host'])}
          <div className="md:col-span-2">{t('Adresse de l’hébergeur', ['legal', 'hostAddress'])}</div>
          <div className="md:col-span-2">{t('Médiateur de la consommation (nom et coordonnées)', ['legal', 'mediator'], { rows: 2, hint: 'Obligatoire pour vendre à des particuliers.' })}</div>
          <div className="md:col-span-2">{t('Mention sur les prix / la TVA', ['legal', 'vatNote'], { rows: 2, hint: 'Ex. « Prix en euros TTC » ou « TVA non applicable, art. 293 B du CGI ».' })}</div>
          {t('Délai de livraison', ['legal', 'deliveryDelay'])}
          <div className="md:col-span-2">{t('Frais et modalités de livraison', ['legal', 'shippingTerms'], { rows: 2 })}</div>
        </>)}

        {section('Pied de page', <div className="md:col-span-2">{t('Texte (l’année est ajoutée automatiquement)', ['footer', 'text'])}</div>)}
      </div>

      <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-3 border-t border-sand-200 bg-sand-50/95 py-3">
        <Btn onClick={save} loading={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Btn>
        <Btn variant="ghost" onClick={() => setConfirmReset(true)}>Rétablir les textes d’origine</Btn>
        {status.text && <p role="status" className={`text-sm font-medium ${status.ok ? 'text-black' : 'text-red-700'}`}>{status.text}</p>}
      </div>

      {confirmReset && (
        <ConfirmDialog title="Rétablir les textes d’origine ?" confirmLabel="Rétablir"
          message="Tous les textes du site reviennent à leur version de départ."
          onCancel={() => setConfirmReset(false)} onConfirm={reset} />
      )}
    </>
  );
}
