import { useState } from 'react';
import { api } from '../../services/api.js';
import usePaged from '../usePaged.js';
import { Btn, Card, ConfirmDialog, ErrorBox, Field, Loading, PageHeader, inputCls } from '../ui.jsx';

const empty = { question: '', questionEn: '', answer: '', answerEn: '', position: '0', published: true };

// Questions fréquentes affichées sur la page « FAQ » du site
export default function Faq() {
  const paged = usePaged((p) => api.faq.adminList(p), {}, 100);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState(null);
  const [actionError, setActionError] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const edit = (f) => { setErrors({}); setForm({ id: f.id, question: f.question, questionEn: f.questionEn ?? '', answer: f.answer, answerEn: f.answerEn ?? '', position: String(f.position), published: f.published }); };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const { id, ...body } = form;
    body.position = Number(body.position) || 0;
    try {
      await (id ? api.faq.update(id, body) : api.faq.create(body));
      setForm(null);
      paged.reload();
    } catch (err) {
      setErrors(Object.keys(err.violations ?? {}).length ? err.violations : { form: err.message });
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    try { await api.faq.remove(target.id); paged.reload(); } catch (err) { setActionError(err); }
    setTarget(null);
  };
  const toggle = async (f) => {
    try { await api.faq.update(f.id, { published: !f.published }); setActionError(null); paged.reload(); } catch (err) { setActionError(err); }
  };

  return (
    <>
      <PageHeader title="FAQ" />
      <p className="mb-4 text-sm text-black/80">Les questions de la page « FAQ » du site (français et anglais). Elles sont affichées par ordre croissant de position.</p>
      {!form && <div className="mb-4"><Btn onClick={() => { setErrors({}); setForm({ ...empty }); }}>Nouvelle question</Btn></div>}
      {actionError && <div className="mb-4"><ErrorBox error={actionError} /></div>}
      {paged.error && <div className="mb-4"><ErrorBox error={paged.error} onRetry={paged.reload} /></div>}

      {form && (
        <Card className="mb-6 p-4">
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Field label="Question" error={errors.question}><input className={inputCls} value={form.question} onChange={set('question')} maxLength={200} /></Field>
            <Field label="Question (anglais)" error={errors.questionEn}><input className={inputCls} value={form.questionEn} onChange={set('questionEn')} maxLength={200} /></Field>
            <Field label="Réponse" error={errors.answer}><textarea className={inputCls} rows={5} value={form.answer} onChange={set('answer')} /></Field>
            <Field label="Réponse (anglais)" error={errors.answerEn}><textarea className={inputCls} rows={5} value={form.answerEn} onChange={set('answerEn')} /></Field>
            <Field label="Position (0 = en premier)" error={errors.position}><input className={inputCls} inputMode="numeric" value={form.position} onChange={set('position')} /></Field>
            <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={form.published} onChange={set('published')} /> Affichée sur le site</label>
            {errors.form && <p className="text-sm text-red-700 sm:col-span-2" role="alert">{errors.form}</p>}
            <div className="flex gap-2 sm:col-span-2">
              <Btn type="submit" loading={busy}>{form.id ? 'Enregistrer' : 'Créer'}</Btn>
              <Btn variant="ghost" onClick={() => setForm(null)}>Annuler</Btn>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-3">
        {paged.items.map((f) => (
          <Card key={f.id} className="p-4">
            <p className="font-semibold">{f.position}. {f.question}</p>
            <p className="mt-1 line-clamp-2 text-sm text-black/80">{f.answer}</p>
            <p className="mt-2"><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${f.published ? 'bg-green-100 text-green-800' : 'bg-sand-200 text-black'}`}>{f.published ? 'Affichée' : 'Masquée'}</span></p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Btn variant="ghost" onClick={() => edit(f)}>Modifier</Btn>
              <Btn variant="ghost" onClick={() => toggle(f)}>{f.published ? 'Masquer' : 'Afficher'}</Btn>
              <Btn variant="ghost" className="text-red-700" onClick={() => setTarget(f)}>Supprimer</Btn>
            </div>
          </Card>
        ))}
      </div>
      {paged.loading && paged.items.length === 0 && <Loading />}
      {!paged.loading && paged.items.length === 0 && <p className="py-8 text-center">Aucune question pour l’instant.</p>}
      {target && <ConfirmDialog title="Supprimer cette question ?" message={`« ${target.question} » disparaîtra de la FAQ.`} onCancel={() => setTarget(null)} onConfirm={remove} />}
    </>
  );
}
