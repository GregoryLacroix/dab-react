import { ServerErrorView } from '../components/ui/ErrorPages.jsx';

// /erreur-serveur : page 500 affichable directement (aperçu, ou redirection depuis l'hébergeur)
export default function ServerError() {
  return <ServerErrorView />;
}
