import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { Btn, Card, ErrorBox, Field, Loading, PageHeader, inputCls } from '../ui.jsx';

const blankBracket = { upToG: '', price: '' };
const blankZone = { name: '', countries: '', freeFrom: '', brackets: [{ upToG: 500, price: '' }] };

// Frais de port : tarifs par zone (pays) et par tranche de poids du colis
export default function Shipping() {
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const fromApi = (s) => ({
    enabled: s.enabled, defaultItemWeightG: String(s.defaultItemWeightG), packagingG: String(s.packagingG),
    zones: s.zones.map((z) => ({ name: z.name, countries: z.countries.join(', '), freeFrom: z.freeFrom ?? '', brackets: z.brackets.map((b) => ({ upToG: b.upToG, price: b.price })) })),
  });
  useEffect(() => { api.shipping.adminGet().then((s) => setForm(fromApi(s)), setError); }, []);

  const setZone = (i, patch) => setForm((f) => ({ ...f, zones: f.zones.map((z, k) => (k === i ? { ...z, ...patch } : z)) }));
  const setBracket = (i, j, patch) => setForm((f) => ({
    ...f, zones: f.zones.map((z, k) => (k === i ? { ...z, brackets: z.brackets.map((b, m) => (m === j ? { ...b, ...patch } : b)) } : z)),
  }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setSaved(false);
    const num = (v) => (v === '' ? '' : Number(String(v).replace(',', '.')));
    try {
      const res = await api.shipping.adminSave({
        enabled: form.enabled, defaultItemWeightG: num(form.defaultItemWeightG), packagingG: num(form.packagingG),
        zones: form.zones.map((z) => ({ name: z.name, countries: z.countries, freeFrom: num(z.freeFrom), brackets: z.brackets.map((b) => ({ upToG: num(b.upToG), price: num(b.price) })) })),
      });
      setForm(fromApi(res));
      setSaved(true);
    } catch (err) {
      setErrors(Object.keys(err.violations ?? {}).length ? err.violations : { form: err.message });
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorBox error={error} />;
  if (!form) return <Loading />;

  return (
    <>
      <PageHeader title="Frais de port" />
      <p className="mb-4 text-sm text-black/80">
        Le tarif dépend du pays de livraison (zone) et du poids du colis : poids des produits (renseigné dans chaque fiche produit) + emballage.
        Le client choisit son pays dans le panier ; le prix est recalculé par le serveur et envoyé tel quel à Stripe.
      </p>
      <form onSubmit={save} className="grid gap-4" noValidate>
        <Card className="grid gap-4 p-4 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm font-medium sm:col-span-3">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
            Calculer les frais de port sur le site (sinon aucun frais n’est ajouté par le site)
          </label>
          <Field label="Poids retenu si le produit n’a pas de poids (g)" error={errors.defaultItemWeightG}><input className={inputCls} inputMode="numeric" value={form.defaultItemWeightG} onChange={(e) => setForm({ ...form, defaultItemWeightG: e.target.value })} /></Field>
          <Field label="Poids de l’emballage (g)" error={errors.packagingG}><input className={inputCls} inputMode="numeric" value={form.packagingG} onChange={(e) => setForm({ ...form, packagingG: e.target.value })} /></Field>
        </Card>

        {errors.zones && <p className="text-sm text-red-700" role="alert">{errors.zones}</p>}
        {form.zones.map((z, i) => (
          <Card key={i} className="grid gap-4 p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Nom de la zone" error={errors[`zones.${i}.name`]}><input className={inputCls} value={z.name} onChange={(e) => setZone(i, { name: e.target.value })} maxLength={40} /></Field>
              <Field label="Pays (codes à 2 lettres)" error={errors[`zones.${i}.countries`]}><input className={inputCls} value={z.countries} placeholder="FR, BE, DE" onChange={(e) => setZone(i, { countries: e.target.value })} /></Field>
              <Field label="Livraison offerte dès (€, facultatif)" error={errors[`zones.${i}.freeFrom`]}><input className={inputCls} inputMode="decimal" value={z.freeFrom} onChange={(e) => setZone(i, { freeFrom: e.target.value })} /></Field>
            </div>
            <div>
              <span className="mb-1 block text-sm font-medium">Tarifs par tranche de poids du colis</span>
              {errors[`zones.${i}.brackets`] && <p className="text-xs text-red-700" role="alert">{errors[`zones.${i}.brackets`]}</p>}
              <div className="grid gap-2">
                {z.brackets.map((b, j) => (
                  <div key={j} className="flex flex-wrap items-start gap-2 text-sm">
                    <span className="pt-2">Jusqu’à</span>
                    <div><input className={`${inputCls} w-28`} inputMode="numeric" aria-label="Poids maximum en grammes" value={b.upToG} onChange={(e) => setBracket(i, j, { upToG: e.target.value })} />{errors[`zones.${i}.brackets.${j}.upToG`] && <span role="alert" className="block text-xs text-red-700">{errors[`zones.${i}.brackets.${j}.upToG`]}</span>}</div>
                    <span className="pt-2">g :</span>
                    <div><input className={`${inputCls} w-28`} inputMode="decimal" aria-label="Tarif en euros" value={b.price} onChange={(e) => setBracket(i, j, { price: e.target.value })} />{errors[`zones.${i}.brackets.${j}.price`] && <span role="alert" className="block text-xs text-red-700">{errors[`zones.${i}.brackets.${j}.price`]}</span>}</div>
                    <span className="pt-2">€</span>
                    <Btn variant="ghost" className="text-red-700" onClick={() => setZone(i, { brackets: z.brackets.filter((_, m) => m !== j) })}>Retirer</Btn>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <Btn variant="ghost" onClick={() => setZone(i, { brackets: [...z.brackets, { ...blankBracket }] })}>Ajouter une tranche</Btn>
                <Btn variant="ghost" className="text-red-700" onClick={() => setForm({ ...form, zones: form.zones.filter((_, k) => k !== i) })}>Supprimer la zone</Btn>
              </div>
            </div>
          </Card>
        ))}
        <div><Btn variant="ghost" onClick={() => setForm({ ...form, zones: [...form.zones, { ...blankZone, brackets: [{ ...blankBracket }] }] })}>Ajouter une zone</Btn></div>

        {errors.form && <p className="text-sm text-red-700" role="alert">{errors.form}</p>}
        <div className="flex items-center gap-3">
          <Btn type="submit" loading={busy}>Enregistrer</Btn>
          {saved && <span className="text-sm text-green-800" role="status">Enregistré.</span>}
        </div>
      </form>
    </>
  );
}
