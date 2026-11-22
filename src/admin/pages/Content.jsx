import { useState } from 'react';
import { api, fieldErrors } from '../../services/api.js';
import useQuery from '../../services/useQuery.js';
import { setContentCache } from '../../store/store.js';
import { zoomSettings, storyViewSettings, withContentDefaults } from '../../services/defaultContent.js';
import { shrinkImage } from '../../services/imageResize.js';
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
  const [draft, setDraft] = useState(() => withContentDefaults({ ...structuredClone(initial), zoom: zoomSettings(initial.zoom), storyView: storyViewSettings(initial.storyView) }));
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
  // Curseur de réglage du grossissement (×1,5 à ×5)
  const level = (label, key, hint) => (
    <Field key={key} label={`${label} : ×${String(draft.zoom[key]).replace('.', ',')}`} hint={hint} error={errors[`zoom.${key}`]}>
      <input type="range" min="1.5" max="5" step="0.5" value={draft.zoom[key]} className="w-full accent-black"
        onChange={(e) => update(['zoom', key], Number(e.target.value))} />
    </Field>
  );
  // Photo d'une étape du galet : envoi vers /api/uploads (photo réduite avant l'envoi)
  const [uploading, setUploading] = useState(-1);
  const [photoError, setPhotoError] = useState('');
  const pickAbout = async (file) => {
    if (!file) return;
    setUploading(10);
    setPhotoError('');
    try {
      const { src } = await api.upload(await shrinkImage(file));
      update(['about', 'image'], src);
    } catch (err) {
      setPhotoError(err.violations?.file ?? err.message);
    } finally {
      setUploading(-1);
    }
  };
  const pickPhoto = async (i, file) => {
    if (!file) return;
    setUploading(i);
    setPhotoError('');
    try {
      const { src } = await api.upload(await shrinkImage(file));
      update(['storyView', 'images'], draft.storyView.images.map((x, k) => (k === i ? src : x)));
    } catch (err) {
      setPhotoError(err.violations?.file ?? err.message);
    } finally {
      setUploading(-1);
    }
  };
  const linkHint = 'Lien interne, par exemple /produits ou /produits?categorie=fresques';

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      // Le slider se règle dans sa propre page : on ne l'envoie pas ici
      const { slider, ...rest } = draft; // eslint-disable-line no-unused-vars
      const saved = await api.content.save(rest); // PUT /api/content
      setContentCache(saved);                     // le site public affiche tout de suite les nouveaux textes
      setDraft(withContentDefaults({ ...structuredClone(saved), zoom: zoomSettings(saved.zoom), storyView: storyViewSettings(saved.storyView) }));
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
      setDraft(withContentDefaults({ ...structuredClone(content), zoom: zoomSettings(content.zoom), storyView: storyViewSettings(content.storyView) }));
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

        {section('Accueil : le galet (3 étapes)', <>
          <Field label="Affichage du galet" hint="« Animation » : le galet se peint tout seul en faisant défiler la page. « Photos » : une photo par étape, dans la même forme de galet, qui se fondent l’une dans l’autre." error={errors['storyView.mode']}>
            <select className={inputCls} value={draft.storyView.mode} onChange={(e) => update(['storyView', 'mode'], e.target.value)}>
              <option value="animation">Animation (galet qui se peint)</option>
              <option value="photos">Photos (une par étape)</option>
            </select>
          </Field>
          {draft.storyView.mode === 'photos' && (
            <div className="md:col-span-2">
              <p className="mb-2 text-sm text-black/80">Format conseillé : horizontal (environ 4/3). La photo est recadrée dans la forme du galet. Une étape sans photo reprend la précédente ; sans aucune photo, l’animation reste affichée.</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {draft.storyView.images.map((src, i) => (
                  <div key={i} className="grid gap-2">
                    <span className="text-sm font-medium">Photo de l’étape {i + 1}</span>
                    {src ? <img src={src} alt="" className="h-28 w-full rounded-lg object-cover" /> : <div className="grid h-28 place-items-center rounded-lg bg-sand-200 text-xs">Aucune photo</div>}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="text-xs" disabled={uploading !== -1} onChange={(e) => { pickPhoto(i, e.target.files?.[0]); e.target.value = ''; }} />
                    {uploading === i && <span className="text-xs">Envoi…</span>}
                    {src && <button type="button" className="justify-self-start text-xs text-red-700 underline" onClick={() => update(['storyView', 'images'], draft.storyView.images.map((x, k) => (k === i ? '' : x)))}>Retirer</button>}
                    {errors[`storyView.images.${i}`] && <span role="alert" className="text-xs text-red-700">{errors[`storyView.images.${i}`]}</span>}
                  </div>
                ))}
              </div>
              {photoError && <p role="alert" className="mt-2 text-sm text-red-700">{photoError}</p>}
            </div>
          )}
          {draft.story.map((_, i) => (
            <div key={i} className="grid gap-3 md:col-span-2">
              {t(`Étape ${i + 1} : titre`, ['story', i, 'title'])}
              {t(`Étape ${i + 1} : texte`, ['story', i, 'text'], { rows: 2 })}
            </div>
          ))}
        </>)}

        {section('Bandeau de réassurance', <>
          <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
            <input type="checkbox" checked={draft.trust.enabled} onChange={(e) => update(['trust', 'enabled'], e.target.checked)} />
            Afficher le bandeau (accueil) et la liste courte (fiche produit)
          </label>
          <p className="text-sm text-black/80 md:col-span-2">Quatre arguments. Laissez le titre vide pour masquer un élément. La fiche produit affiche les titres des 3 premiers.</p>
          {draft.trust.items.map((it, i) => (
            <div key={i} className="grid gap-3 rounded-lg border border-black/10 p-3 md:col-span-2 md:grid-cols-2">
              <Field label={`Élément ${i + 1} : icône`}>
                <select className={inputCls} value={it.icon} onChange={(e) => update(['trust', 'items', i, 'icon'], e.target.value)}>
                  <option value="hand">Palette (fait main)</option>
                  <option value="varnish">Bouclier (vernis, qualité)</option>
                  <option value="ship">Colis (expédition)</option>
                  <option value="pay">Carte (paiement)</option>
                </select>
              </Field>
              <span />
              {t('Titre', ['trust', 'items', i, 'title'])}
              {t('Titre (anglais)', ['trust', 'items', i, 'titleEn'])}
              {t('Texte', ['trust', 'items', i, 'text'])}
              {t('Texte (anglais)', ['trust', 'items', i, 'textEn'])}
            </div>
          ))}
        </>)}

        {section('Page « À propos »', <>
          <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
            <input type="checkbox" checked={draft.about.enabled} onChange={(e) => update(['about', 'enabled'], e.target.checked)} />
            Afficher la page « À propos » (lien dans le pied de page)
          </label>
          <p className="text-sm text-black/80 md:col-span-2">Racontez votre histoire : qui vous êtes, comment vous peignez, pourquoi les galets. Séparez les paragraphes par une ligne vide. Le texte de départ est volontairement neutre : personnalisez-le avant d’activer la page.</p>
          {t('Titre', ['about', 'title'])}
          {t('Titre (anglais)', ['about', 'titleEn'])}
          {t('Phrase d’accroche', ['about', 'lead'], { rows: 2 })}
          {t('Phrase d’accroche (anglais)', ['about', 'leadEn'], { rows: 2 })}
          {t('Texte', ['about', 'text'], { rows: 8 })}
          {t('Texte (anglais)', ['about', 'textEn'], { rows: 8 })}
          {t('Signature (facultatif)', ['about', 'signature'])}
          <div className="grid gap-2">
            <span className="text-sm font-medium">Photo (vous, l’atelier…)</span>
            {draft.about.image ? <img src={draft.about.image} alt="" className="h-32 w-48 rounded-lg object-cover" /> : <div className="grid h-32 w-48 place-items-center rounded-lg bg-sand-200 text-xs">Logo affiché à défaut</div>}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="text-xs" disabled={uploading !== -1} onChange={(e) => { pickAbout(e.target.files?.[0]); e.target.value = ''; }} />
            {uploading === 10 && <span className="text-xs">Envoi…</span>}
            {draft.about.image && <button type="button" className="justify-self-start text-xs text-red-700 underline" onClick={() => update(['about', 'image'], '')}>Retirer</button>}
            {errors['about.image'] && <span role="alert" className="text-xs text-red-700">{errors['about.image']}</span>}
          </div>
        </>)}

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

        {section('Page produit : zoom des photos', <>
          <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
            <input type="checkbox" checked={draft.zoom.lens} onChange={(e) => update(['zoom', 'lens'], e.target.checked)} />
            Activer la loupe à la souris (une pastille ronde qui suit le curseur sur la photo principale)
          </label>
          {level('Grossissement de la loupe', 'lensLevel', 'Ordinateur seulement. ×2,5 par défaut ; plus c’est élevé, plus la photo doit être de bonne qualité.')}
          {level('Grossissement en plein écran', 'fullLevel', 'Au clic sur la photo (ordinateur et mobile). ×2,5 = l’image devient 2,5 fois plus large que l’écran.')}
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
