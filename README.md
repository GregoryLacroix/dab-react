# Les galets d’Ambre – Boutique (React + SASS)

    npm install
    npm run dev      # http://localhost:5173
    npm run build

Routes : `/` · `/produits` · `/produits/:id` · `/panier` · `/connexion` · `/inscription` (version anglaise : voir « Langues » ci-dessous)
- Produits : `src/data/products.js` (ajoutez `image` et remplacez `ProductImage`)
- Couleurs : `src/styles/_variables.scss`
- Paiement : Stripe Checkout (voir « Paiement en ligne » ci-dessous).

## Connexion avec Google / Facebook
Sous les formulaires Connexion et Inscription, des boutons « Continuer avec Google / Facebook » apparaissent **seulement si l'API a les clés du fournisseur** (sinon rien ne s'affiche). Le bouton est un simple lien vers l'API, qui renvoie sur `/connexion/retour` (anglais : `/en/login/callback`) avec le jeton dans le fragment de l'adresse ; `pages/OAuthReturn.jsx` l'efface de l'adresse, ouvre la session et redirige. Les échecs reviennent sur `/connexion?oauth=<raison>` avec un message (annulé, e-mail absent, compte déjà existant, e-mail à confirmer…).
- Mise en route chez Google / Facebook et règles de rattachement des comptes : README de `dab-api`, section « Connexion avec Google / Facebook ».
- Un compte créé ainsi n'a pas de mot de passe : la suppression du compte (page *Mon compte*) se confirme avec l'adresse e-mail.
- Politique de confidentialité mise à jour (données reçues du fournisseur, cookie technique `dab_oauth` posé par l'API, destinataires).

## Vitesse et partage
- **Photos** : les photos envoyées via le back-office sont optimisées par l'API (WebP, plusieurs tailles) ; le site charge la version adaptée à l'écran (`srcset` dans `ProductImage.jsx`). Les grosses photos de téléphone sont réduites dans le navigateur avant l'envoi. Photos déjà en ligne : `php bin/console app:optimize-images` côté API.
- **Chargement** : l'agrandissement plein écran n'est téléchargé qu'au premier clic, et React / le routeur sont dans un fichier à part, gardé en cache entre deux mises en ligne (`vite.config.js`). Les images sont chargées à la demande (`loading="lazy"`), sauf la première de la page.
- **Aperçus de partage** : pour les robots de WhatsApp, Facebook, X, etc., `public/.htaccess` redirige les fiches produit vers une page de l'API qui contient nom, photo et prix (README de `dab-api`). Si l'adresse de l'API change, modifiez les deux lignes `RewriteRule` correspondantes.

## Stock, mot de passe oublié, suivi
- **Pièces vendues** : un produit à 0 en stock affiche un badge « Vendu » (liste, fiche, slider), son bouton d'ajout est désactivé et le panier est plafonné au stock. Le stock se règle dans le back-office (fiche produit : « Quantité en stock »).
- **Mot de passe oublié** : pages `/mot-de-passe-oublie` et `/nouveau-mot-de-passe` (anglais : `/en/forgot-password`, `/en/reset-password`), lien sous le formulaire de connexion.
- **Suivi du colis** : le back-office demande transporteur et numéro au passage à « expédiée » ; le client reçoit un e-mail et voit le suivi dans *Mon compte → Mes commandes*.

## Zoom des photos et commandes
- **Fiche produit** : à la souris, une loupe suit le curseur sur la photo principale (`components/ui/ZoomImage.jsx`) ; un clic, une touche Entrée ou un appui au doigt ouvre l'agrandissement plein écran (`Lightbox.jsx`) : clic ou bouton +/− pour zoomer, déplacement de la souris (ou du doigt) pour parcourir l'image, ← → pour changer de photo, Échap pour fermer. Les images sans photo (dégradés provisoires) ne sont pas agrandies. **Réglages dans le back-office** (*Contenu du site → Page produit : zoom des photos*) : loupe activée ou non, grossissement de la loupe (×1,5 à ×5, ×2,5 par défaut) et grossissement en plein écran (idem). Ils s'appliquent immédiatement, sans nouveau build. La qualité du zoom dépend de la résolution des photos téléversées.
- **Mon compte → Mes commandes** : liste des commandes (date, statut, total), détail au clic (articles, paiement, adresse de livraison) et bouton **Télécharger la facture (PDF)** pour les commandes payées. Le back-office propose le même bouton sur la page *Commandes*. Détails (numérotation, informations légales à remplir) : README de `dab-api`, section « Factures ».

## Paiement en ligne (Stripe)
Le bouton « Commander avec obligation de paiement » enregistre la commande dans l'API, qui renvoie l'adresse de la page de paiement **Stripe Checkout** ; le navigateur y est redirigé (aucune donnée bancaire sur ce site, pas de bibliothèque Stripe côté React, **aucune clé dans ce projet**). Au retour, la page `/commande` (anglais : `/en/order`) vérifie le paiement auprès de l'API et vide le panier ; si le client abandonne, il revient sur `/panier?cancelled=1` avec son panier intact.
- Mise en route, clés, webhook, frais de port, remboursements : voir le README de `dab-api` (section « Paiement en ligne »).
- Sans clé Stripe côté API, le site fonctionne comme avant (commande simplement enregistrée).
- Back-office : la page *Commandes* affiche l'état du paiement, l'adresse de livraison saisie chez Stripe et un bouton **Rembourser**.
- Hors du site : adressez-vous à votre conseil pour la TVA, le droit de rétractation et les mentions de la page de paiement (la raison sociale et le logo se règlent dans Stripe > Paramètres > Personnalisation).

## Langues : français et anglais
Le site existe en français (adresses d'origine, **inchangées**) et en anglais (sous `/en`). Le bouton **FR / EN** du menu mène à la même page dans l'autre langue.

| Français | Anglais |
|---|---|
| `/` · `/produits` · `/produits/:id` · `/panier` · `/contact` | `/en` · `/en/shop` · `/en/shop/:id` · `/en/cart` · `/en/contact` |
| `/connexion` · `/inscription` · `/mon-compte` | `/en/login` · `/en/register` · `/en/account` |
| `/mentions-legales` · `/politique-de-confidentialite` · `/conditions-generales-de-vente` | `/en/legal-notice` · `/en/privacy-policy` · `/en/terms-and-conditions` |

- **Aucun cookie** : la langue se déduit de l'adresse (`/en/…` = anglais). Pas de redirection automatique selon le navigateur (mauvais pour le référencement) : on choisit avec le bouton FR / EN.
- **Textes** : `src/i18n/fr.js` et `src/i18n/en.js` (mêmes clés ; une clé absente en anglais retombe sur le français). `{nom}` = variable, `<0>texte</0>` = morceau enveloppé par un lien ou du gras, `clé_one` / `clé_other` = singulier / pluriel. Dans le code : `const { t, l, money } = useI18n();` puis `t('cart.title')`, `l('/produits')` (adresse dans la langue courante), `money(12.5)` (« 12,50 € » / « €12.50 »).
- **Adresses** : `src/i18n/routes.js` (une ligne par page). Pour ajouter une page : une ligne dans ce fichier, la page dans `PAGES` (`src/App.jsx`), et `l('/adresse-francaise')` pour les liens. Le plan du site et `robots.txt` (`npm run seo`) reprennent ce fichier.
- **Référencement** : chaque page déclare son URL canonique dans sa langue et des liens `hreflang` vers l'autre version ; `og:locale` et `<html lang>` suivent la langue ; le plan du site liste les deux versions.
- **Pages légales** : version anglaise fournie comme traduction de courtoisie (phrase « la version française prévaut » dans `legal.courtesy` de `en.js`, à retirer ou à adapter). Comme les versions françaises, ce sont des modèles à faire relire.
- **Pages 404 / 500 statiques** (`public/`) : en anglais quand l'adresse commence par `/en` (ajoutez `error_page` côté serveur pour `/en/` si vous le souhaitez).
- **Back-office (`/admin`)** : reste en français.

### Contenus qui viennent de l'API (produits, catégories, textes éditables)
Ils sont saisis en français dans le back-office ; le site anglais les traduit ainsi :
- **Textes du site** (accueil, contact, pied de page, mentions de livraison…) : tant qu'un texte est celui d'origine, sa version anglaise (`DEFAULT_CONTENT_EN`, `src/services/defaultContent.js`) s'affiche ; un texte modifié dans le back-office reste en français tant qu'on ne lui donne pas d'équivalent. Si l'API renvoie un objet `en` dans le contenu (par exemple `{ "hero": { "title": "…" } }`), il prend le dessus.
- **Produits et catégories** : si l'API ajoute `translations: { en: { name, description } }` à un produit (ou `{ en: { name } }` à une catégorie), le site l'utilise automatiquement. Sans cela, les noms et descriptions restent en français ; les catégories d'origine `galets` et `fresques` ont un nom anglais de secours (`Pebbles`, `Murals`).
- **Messages de l'API** (erreurs de validation, texte de confirmation d'inscription ou de contact…) : le site envoie l'en-tête `Accept-Language: fr|en` ; l'API peut s'en servir pour répondre dans la bonne langue. Le lien de l'e-mail de confirmation d'inscription renvoie vers `/connexion` (français).

## Effets de scroll
- `hooks/useScrollVar.js` : écrit `--p` (0→1) selon le scroll ; le CSS anime avec `calc(var(--p) * …)`.
- `components/effects/` : Reveal, ScrollProgress, SplitWords, Marquee, WaveDivider, PaintStory.
- Tous les effets respectent `prefers-reduced-motion`.

## Fonctionnement : le site utilise l'API Symfony

Toutes les données (produits, catégories, commandes, messages, contenu, slider, comptes) viennent de l'API `dab-api` : aucun enregistrement dans le navigateur, hors le jeton de connexion (`dab-token`) et le panier (`dab-cart`, stockage de session : effacé à la fermeture de l'onglet, nécessaire pour retrouver son panier après le paiement). Les deux figurent dans la politique de confidentialité.

1. Lancez l'API (voir `dab-api/README.md`) : `php -S localhost:8000 -t public` après `composer install`, création de la base et `php bin/console app:seed --demo-admin`.
2. Dans ce projet, `.env` contient l'adresse de l'API : `VITE_API_URL=http://localhost:8000`. En production, `.env.production` (déjà rempli : site `https://dab.gregory-lacroix-pf.com`, API `https://dab.api.gregory-lacroix-pf.com`) est lu par `npm run build`.
3. `npm install` puis `npm run dev` : http://localhost:5173.

Un seul fichier parle à l'API : `src/services/api.js` (toutes les routes). Les erreurs de formulaire renvoyées par l'API (HTTP 422) sont affichées sous les champs concernés.

| Écran | Appels |
|---|---|
| Accueil | `GET /api/content`, `GET /api/slider`, `GET /api/products?perPage=3` |
| Boutique (scroll infini) | `GET /api/categories`, `GET /api/products?category=…&page=…&perPage=6` |
| Fiche produit | `GET /api/products/{id}` |
| Panier « Commander » | `POST /api/orders` |
| Contact | `POST /api/contact` |
| Créer un compte / Connexion | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/resend-verification` |
| Back-office | `/api/admin/stats`, `/api/products`, `/api/categories`, `/api/orders`, `/api/messages`, `/api/slider`, `/api/content`, `/api/uploads` |

**Inscription** : le compte doit être confirmé par le lien reçu par e-mail (redirection vers `/connexion?verified=1`) avant de pouvoir se connecter.
**Back-office** : `/admin`, réservé aux comptes administrateurs (`php bin/console app:create-admin vous@exemple.fr`, ou `admin@dab.fr` / `galet2026` avec `app:seed --demo-admin`, développement uniquement).

## Photos
Les photos d'exemple sont servies par l'API (`dab-api/public/uploads/seed/`). Les nouvelles photos se téléversent depuis la fiche produit du back-office (`POST /api/uploads`, 5 Mo maximum).

## Référencement (SEO)
- Chaque page définit son titre, sa description, son URL canonique et ses aperçus de partage (`src/services/seo.js`, hook `useSeo`). Les fiches produit ajoutent les données structurées Google (`Product`, fil d'Ariane) ; l'accueil ajoute `Organization` et `WebSite`.
- Panier, connexion, inscription et « Mon compte » sont en `noindex`.
- `public/robots.txt` et `public/sitemap.xml` sont générés par `npm run seo` (et automatiquement avant `npm run build`) : le plan du site inclut toutes les fiches produit publiées si l'API tourne. En production, régler `VITE_SITE_URL` (adresse publique du site) dans `.env`.
- Images : la première image visible est chargée en priorité, les autres à la demande ; pages chargées à la demande (code découpé) ; polices hébergées avec le site.
- Limite d'un site React : Google exécute le JavaScript et lit bien ces balises, mais les robots d'aperçu (WhatsApp, Facebook, LinkedIn) ne lisent que le HTML de départ. Pour des aperçus parfaits sur chaque fiche produit, il faudrait un pré-rendu (service de prérendu ou rendu côté serveur).

## RGPD
- Pages légales : `/mentions-legales`, `/politique-de-confidentialite`, `/conditions-generales-de-vente`. Leur contenu se complète dans le back-office (Contenu du site, « Informations légales ») ; les champs vides apparaissent en surbrillance « à compléter ». Ce sont des modèles : faites-les relire avant la mise en ligne.
- Aucun traceur : pas de mesure d'audience, pas de publicité, polices hébergées (aucune requête vers Google Fonts). Aucune bannière n'est donc nécessaire. Si vous ajoutez un jour un service optionnel (statistiques…), déclarez-le dans `src/config/consent.js` : le bandeau de choix (refuser aussi simple qu'accepter, choix conservé 6 mois) et le lien « Gérer mes cookies » apparaissent, et le service ne se charge qu'après accord.
- Formulaires : inscription (politique de confidentialité + CGV), commande (CGV, bouton « Commander avec obligation de paiement ») et contact (information + case de consentement). L'API refuse la demande si l'acceptation manque.
- Droits : page « Mon compte » (télécharger mes données, supprimer mon compte) ; purge automatique des données anciennes côté API (`app:purge-data`).

## Pages d'erreur
- **404** : adresse inconnue (`NotFoundView`, galet « perdu » + liens vers la boutique et les catégories) et fiche produit inexistante ou retirée de la vente.
- **500** : l'API répond par une erreur serveur, est injoignable (réseau coupé) ou une page plante à l'affichage (`ServerErrorView`, galet fendu, bouton « Réessayer », détails techniques repliés). Un écran blanc n'apparaît plus : `ErrorBoundary` affiche cette page, aussi lorsqu'une nouvelle version du site est mise en ligne pendant qu'un visiteur navigue (« Recharger la page »).
- Aperçu direct de la page 500 : `/erreur-serveur`. Dans le back-office : adresse inconnue et plantage d'une page (le menu reste utilisable).
- `public/404.html` et `public/500.html` sont des pages statiques autonomes pour le serveur web (quand l'application ne peut pas se charger). Exemple nginx :

```
location /assets/ { try_files $uri =404; }
location / { try_files $uri /index.html; }
error_page 404 /404.html;
error_page 500 502 503 504 /500.html;
```
Hébergement **Apache / LiteSpeed (PlanetHoster, o2switch, OVH…)** : `public/.htaccess` fait la même chose (il est copié dans `dist/` par `npm run build`). Il est indispensable : sans lui, recharger `/produits` ou `/panier` affiche une erreur 404, car le serveur cherche un fichier qui n'existe pas (c'est React qui affiche les pages).
- Mise en ligne : `npm run build` (avec `VITE_API_URL` = adresse de l'API et `VITE_SITE_URL` = adresse du site, dans `.env.production`), puis envoyez **le contenu** du dossier `dist/` (pas le dossier lui-même) à la racine du site (`public_html`). Le fichier `.htaccess` est caché : activez l'affichage des fichiers cachés dans le gestionnaire de fichiers / le client FTP, et vérifiez qu'il est bien présent sur le serveur.
- Activez « Forcer le HTTPS » dans l'espace PlanetHoster plutôt qu'une règle dans `.htaccess` (le serveur est derrière un proxy : une règle maison peut provoquer une boucle de redirection).

Limite d'un site React : un lien inconnu est servi avec le code HTTP 200 (puis l'application affiche la page 404) ; `noindex` empêche Google de l'indexer.

## Couleurs des animations
Palette pastel (bleu lavande, menthe, vert tendre, pêche, saumon, rose) utilisée par les vagues, le coup de pinceau du galet, le galet peint, la barre de lecture et les pages d'erreur. Pour la changer : les 6 valeurs de `src/config/palette.js` et `$pal-1` à `$pal-6` dans `src/styles/_variables.scss` (et les dégradés de `public/404.html` / `public/500.html`).

## Logo « Les galets d'Ambre »
- Badge complet : `src/assets/logo.svg` (accueil, connexion du back-office) ; logo horizontal du menu : composant `src/components/ui/Logo.jsx` (le nom reste du vrai texte) ; galet seul : `LogoMark`.
- Dans `public/` : `logo.svg`, `logo-horizontal.svg`, `favicon.svg`, `logo.png`, `favicon.png`, `icon-192.png`, `apple-touch-icon.png`, `og-default.jpg` (image de partage). Le nom de la marque se règle dans `src/services/seo.js` (`SITE_NAME`).
