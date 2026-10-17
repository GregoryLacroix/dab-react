import { Card, LinkBtn, PageHeader } from './ui.jsx';

export function AdminNotFound() {
  return (
    <>
      <PageHeader title="Page introuvable" />
      <Card className="grid justify-items-start gap-4 p-6">
        <p>Cette page n’existe pas dans l’administration.</p>
        <LinkBtn to="/admin">Retour au tableau de bord</LinkBtn>
      </Card>
    </>
  );
}

// Affiché à la place d'une page du back-office qui a planté (le menu reste utilisable)
export function AdminCrash({ error }) {
  return (
    <>
      <PageHeader title="Une erreur est survenue" />
      <Card className="grid justify-items-start gap-4 p-6">
        <p>Cette page n’a pas pu s’afficher. Rechargez-la ; si le problème persiste, revenez au tableau de bord.</p>
        <details className="text-sm text-black/70"><summary className="cursor-pointer">Détails techniques</summary><p className="mt-2 break-words">{error?.message}</p></details>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => window.location.reload()} className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700">Recharger la page</button>
          <LinkBtn to="/admin" variant="secondary">Tableau de bord</LinkBtn>
        </div>
      </Card>
    </>
  );
}
