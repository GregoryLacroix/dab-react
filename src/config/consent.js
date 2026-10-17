// Services OPTIONNELS soumis au consentement (cookies / traceurs non indispensables).
// Aujourd'hui le site n'en utilise AUCUN : pas de mesure d'audience, pas de publicité, polices hébergées sur le site.
// Tant que cette liste est vide, aucune bannière n'est affichée (elle serait inutile).
// Pour ajouter un service, ajoutez-le ici : son script ne se chargera qu'APRÈS le "oui" du visiteur.
//
// Exemple (mesure d'audience) :
// {
//   id: 'audience',
//   label: { fr: 'Mesure d’audience', en: 'Audience measurement' },   // une simple chaîne fonctionne aussi
//   description: { fr: 'Statistiques de fréquentation pour améliorer le site.', en: 'Visit statistics to help us improve the site.' },
//   enable: () => {
//     const s = document.createElement('script');
//     s.src = 'https://matomo.exemple.fr/matomo.js';
//     s.async = true;
//     document.head.appendChild(s);
//   },
// },
export const OPTIONAL_SERVICES = [];

// Le choix du visiteur est conservé 6 mois (recommandation de la CNIL), puis redemandé
export const CONSENT_DAYS = 180;
