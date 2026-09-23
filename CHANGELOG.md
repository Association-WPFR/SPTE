# Changelog

## [3.0.0] - xx septembre 2026

### Added
- Nouvelle règle détectant les guillemets doubles droits (`"`), à remplacer par les guillemets français « »
- Nouvelle règle détectant un point/tiret/astérisque utilisé à la place du point médian épicène (ex: administrateur.rice, abonné-e-s)
- Les compteurs d'avertissements (mots déconseillés, guillemets, ponctuation...) sont cliquables (et accessibles au clavier) : ils font défiler la page jusqu'à la première occurrence correspondante
- Bouton pour copier le permalien d'une traduction, à côté du bouton « Next » du panneau d'édition (au lieu du menu contextuel)
- Indicateur de chargement pendant la recherche « Cohérence d'une chaîne »
- Mode sombre du popup de réglages (suit le choix de l'OS/browser).
- La locale française remonte aussi en première position, avec son drapeau, sur l'annuaire des locales de la page d'accueil de translate.wordpress.org (en plus du tableau des locales par projet qui existait déjà)
- Outillage de développement : WXT (génère automatiquement les manifests Chrome et Firefox), ESLint, Vitest, .editorconfig, Dependabot, CONTRIBUTING.md, .nvmrc (build reproductible côté AMO)
- Fichier LICENSE (GPL v2+)
- Réglage « Espace fine insécable stricte » : signale l'espace insécable normale (U+00A0) au lieu de l'espace fine insécable (U+202F) devant « ; ! ? », désactivé par défaut

### Changed
- Tous les réglages du popup (couleurs comprises) s'enregistrent et rechargent la page immédiatement, le bouton « Enregistrer » a été retiré. Plus simple et évite d'oublier de cliquer sur enregistrer.
- Le filtre « Tout »/« Les avertissements » devient un toggle unique « Afficher uniquement les avertissements de cette page (x) », x étant le nombre de lignes concernées sur la page ; grisé et désactivé automatiquement quand il n'y a rien à filtrer
- Liste des mots bannis enrichie de 19 anglicismes supplémentaires (source : table « Termes critiques » de thierrypigot/wp-fr-typo)
- Liste des mots bannis enrichie de 7 entrées supplémentaires (« entête », « et/ou », « customizer », « template », « templates », « add-ons », « événement »), en partie récupérées de Pull Requests jamais mergées sur un fork du dépôt
- Séparation en 2 réglages distincts de l'agrandissement de la page : « Agrandir les pages de traduction » (actif par défaut, 85% fixe) et « Agrandir le reste de GlotPress » (85% fixe aussi désormais, le champ « Largeur maximale » est retiré)
- Le réglage « Contraste des textes » ne recolore plus que le contenu de traduction, plus la navigation ni le pied de page du site (hors du rôle de SPTE)
- Firefox aligné en Manifest V3 (alignement sur la version Chrome déjà gérée depuis la 2.0.0), le MV2 est toujours supporté par Firefox, mais autant y passer.
- Récupération du glossaire officiel par export CSV plutôt que par extraction du HTML de la page
- Réécriture du README (réorg des contenus, liens mis à jour, mention de la reprise du projet par WPFR.net, remerciements à Loïc)
- Éclatement du fichier monolithique `spte.js` (640 lignes, logique métier et manipulation DOM mêlées) en modules dédiés dans `utils/` : `rules.js` (règles de détection), `dom.js` (manipulation DOM), `helpers.js`, `warnings.js`, `settings.js`, orchestrés depuis `entrypoints/spte.content.js` ; le popup (`pageAction/index.html`+`script.js`) migre de la même façon vers `entrypoints/popup/` ; structure imposée par l'adoption de WXT (voir Added), sans changement de comportement visible
- Réorganisation interne de `entrypoints/spte.content.js` : l'état partagé (regex, éléments DOM, réglages) est désormais explicite dans un objet `ctx` plutôt qu'implicite dans la fermeture de la fonction `main()`, sans changement de comportement
- Extraction de la logique de conversion réglages ↔ champs de formulaire du popup (`entrypoints/popup/main.js`) vers `utils/settings.js` (`settingsToFormValues`/`formValuesToSettings`), testée unitairement ; sans changement de comportement (migration `spteFrenchFlag` manquant comprise)
- Ajout de la couverture de tests (`@vitest/coverage-v8`, `npm run test:coverage`), de badges de couverture dans le README (`istanbul-badges-readme`, à régénérer manuellement, pas d'auto-commit CI) et du plugin `wxt/testing/vitest-plugin` dans `vitest.config.js` (nécessaire pour tester les fonctions exportées des entrypoints, qui utilisent les globales WXT comme `defineContentScript`)
- Ajout d’`eslint-plugin-no-unsanitized` (détecte une insertion HTML non assainie dès le lint) et d’`addons-linter` (même vérification que la soumission AMO, intégrée en CI via `npm run lint:amo`)
- Plancher de compatibilité Firefox remonté à la version 140 (`strict_min_version`), alignée sur la clé `data_collection_permissions` que Firefox ne sait lire qu’à partir de cette version

### Removed
- Le réglage « Locales supplémentaires » (fr-be, fr-ca, etc) a été retiré. Trop peu testé, introduit une complexité inutile car aucun usage n'est connu à ce jour. Ça pourra toujours être réintroduit plus tard.
- La permission « tabs » n'est plus demandée à l'installation : l'accès à l'URL de l'onglet actif était déjà couvert par l'autorisation d'accès à translate.wordpress.org, la permission séparée était redondante.

### Fixed
- Les réglages s'initialisent maintenant correctement au premier lancement (ils provoquaient un retéléchargement en boucle du glossaire officiel)
- Les réglages s'enregistrent et se rechargent maintenant correctement sur Firefox
- Compatibilité rétablie avec la version actuelle de GlotDict (clés de réglages renommées côté GlotDict)
- Les lignes du tableau sans case à cocher ne provoquent plus de plantage (ex: ligne d'historique de révision)
- Les mots déconseillés (rouge), apostrophes droites (rouge) et caractères à vérifier (rose) sont de nouveau colorés par défaut au premier lancement — sans réglage personnalisé, la couleur ne s'appliquait pas (bug présent depuis longtemps, pas propre à cette version)
- Le double espace qui cassait le balisage HTML des avertissements est corrigé
- Le bandeau de résultats s'affiche maintenant même quand la page ne comporte aucun avertissement (« aucun élément à vérifier »), pour distinguer une vérification effectuée d'une extension qui n'aurait pas tourné
- Le lien « Masquer la légende » redevient visible (« Afficher la légende ») une fois la légende masquée, au lieu de disparaître entièrement
- Les mots signalés sont de nouveau focusables au clavier (à tester plus en détail si quelqu'un s'y connait bien)
- Les notices GlotDict (ex : le décompte affiché par le bouton « Review ») s'affichent de nouveau (le conteneur qui les récupère n'était jamais inséré dans la page)
- Le tri de la locale française fonctionne de nouveau dans le tableau des locales d'un projet (la structure HTML visée de GlotPress avait changé)
- L'espace fine insécable (U+202F), recommandée par le guide du traducteur devant « ; ! ? », n'est plus signalée à tort comme une espace manquante (seule l'espace insécable normale U+00A0 était reconnue jusque-là)
- Le bandeau de résultats (compteurs d'avertissements) n'affiche plus les compteurs collés les uns aux autres sans espacement ; le titre « Éléments à vérifier » et le lien « Masquer la légende » restent alignés sur la même ligne quel que soit le nombre de compteurs affichés en dessous
- Le texte du highlighter (aperçu surligné dans le panneau d'édition) fait maintenant le même retour à la ligne que le champ de traduction, pour faciliter la comparaison visuelle des chaînes multi-lignes
- Un guillemet français collé à une balise HTML (ex : `<strong>«texte»</strong>`) n'est plus signalé à tort comme collé à du texte
- Les cases à cocher des réglages ont maintenant un nom accessible pour les lecteurs d'écran (idem)
- La popup de recherche de cohérence gère maintenant le focus au clavier (idem)
- Le sélecteur de couleur natif n'est plus forcé en champ texte hexadécimal sous Firefox (Firefox supporte `input[type=color]` nativement depuis 2014, ce contournement était obsolète)
- Couleur de l'interrupteur de réglages rendue cohérente (bleu ; une définition CSS en double l'écrasait)
- Bordure des interrupteurs de réglages corrigée (`border: 2px` sans `solid` annulait leur style)
- Curseur de survol des interrupteurs de réglages corrigé (un résidu IE restait dans le code)
- Les transitions du popup de réglages (onglets, boutons) sont maintenant animées en douceur comme les interrupteurs, au lieu de changer d'état instantanément
- L'effet réel du réglage « Agrandir la page » est maintenant explicite (il contrôlait le reste de GlotPress, pas la table de traduction déjà agrandie ; voir aussi Changed pour le nouveau découpage en 2 réglages)
- Le bouton « Réinitialiser » ne soumet plus tout le formulaire des réglages, il réinitialise seulement les couleurs ce qui est son comportement attendu
- Le bouton « Réinitialiser » enregistre maintenant son propre effet immédiatement (il fallait auparavant cliquer sur « Enregistrer » séparément)
- Le bouton « Réinitialiser » ne décale plus les éléments au clic (bordure désormais réservée dès l'état de repos)
- Le bouton « Réinitialiser » est repositionné sur la ligne du réglage « Couleurs des avertissements » (il n'était pas aligné, ce qui pouvait laisser croire à une réinitialisation globale des réglages)
- Sélecteurs CSS obsolètes retirés (résidus d'anciennes versions du popup)
- Propriété CSS `font-smoothing: antialiased` non standard retirée
- Les mots identiques en français et en anglais (ex : « plugin ») ne sont plus signalés à tort par le glossaire
- « ?) »/« !) » (point d'interrogation ou d'exclamation suivi d'une parenthèse fermante) ne sont plus signalés à tort
- L'apostrophe courbe inversée (U+2018) est désormais détectée, au même titre que l'apostrophe droite
- Une accolade ouvrante suivie d'un espace puis d'un mot collé à la fermante (ex : « { name} », style d'interpolation de variable) n'est plus signalée à tort
- Trois points ASCII successifs (« ... ») sont désormais détectés au même titre que les points de suspension
- Une virgule à l'intérieur d'un bloc `[[ ]]` n'est plus signalée à tort
- Le « ! » de « !important » (syntaxe CSS) n'est plus signalé à tort
- Les deux-points d'un format de date PHP (ex : `Y/m/d g:s:i A`) ne sont plus signalés à tort
- Un deux-points à l'intérieur d'un bloc `{{ }}` n'est plus signalé à tort
- Une parenthèse ouvrante précédée d'un `<br>` n'est plus signalée à tort
- Un appel de fonction façon WPCS (ex : `registerBlockType( name, settings );`) n'est plus signalé à tort
- Une apostrophe droite suivie immédiatement de `%lettre` (ex : `'%s`) n'est plus signalée à tort
- Le nom du projet en cours de traduction (ex : une extension nommée « Widget ») n'est plus signalé à tort par le glossaire
- Un point-virgule en toute fin de chaîne n'est plus signalé à tort
- Un double espace au milieu d'une phrase est désormais détecté (la règle ne couvrait auparavant que le début/fin de ligne)
- Un guillemet droit détecté par la règle correspondante ne casse plus le balisage HTML de l'avertissement (l'attribut `data-message` n'était pas échappé)
- La recherche de cohérence d'une chaîne fonctionne de nouveau avec des caractères spéciaux (`&`, `#`, `%`…) dans le champ de recherche, et n'affiche plus une accolade fermante résiduelle sous le tableau de résultats
- L'icône de l'extension reflète maintenant l'état (actif/inactif) de l'onglet affiché, plutôt qu'un état global partagé entre tous les onglets ouverts
- Le bouton « Réinitialiser » les couleurs ne plante plus si l'élément est absent du DOM du popup
- Les icônes d'aide (🛈) du popup de réglages sont maintenant des boutons focusables au clavier et lus par les lecteurs d'écran, au lieu de `<span>` uniquement visibles à la souris
- Le logo du popup de réglages a un texte alternatif
- Les liens de la légende (règles typographiques, glossaire) s'ouvrent avec `rel="noopener"` comme le reste du popup
- Le HTML inséré dynamiquement dans la page (surlignage des traductions, résultat de la recherche de cohérence) est désormais assaini avec DOMPurify avant insertion ; les liens de la légende et l’infobulle de traduction alternative sont reconstruits sans passer par une chaîne HTML

## [2.0.0] - 01 mai 2023

### Changed
- Migrate extension to Manifest V3

## [1.1.0] - 03 avril 2022

### Changed
- Suppression des liens Glossaire officiel et Typographie qui vont être ajoutés par GlotDict dans la prochaine version

### Fixed
- Correction des styles cassés suite à mise à jour de GlotPress

## [1.0.9] - 06 février 2022

### Changed
- Amélioration de l’affichage des liens Glossaire officiel et Règles typographiques

### Added
- Ajout des exceptions textuelles : ics, git et github
- Ajout test import glossaire sur code « [np] » pour futur remplacement de « spte » dans le glossaire

## [1.0.8] - 01 novembre 2021

### Fixed
- Correction du surlignement des mots qui parfois passaient à la ligne et créaient des traits rouges verticaux
- Suppression des mots potentiellement utilisés dans d’autres locales du fichier data.js
- Corrige les faux positif avec les pluriels en x entre parenthèses (x)

## [1.0.7] - 24 septembre 2021

### Fixed
- Correction bug Popup

## [1.0.6] - 16 septembre 2021

### Changed
- Réduction de la hauteur de l’entête pour prendre en compte le sticky header de GlotDict.

## [1.0.5] - 14 septembre 2021

### Changed
- Déplacement du sticky header et du bouton back to top sur GlotDict et donc suppression sur SPTE.

## [1.0.4] - 1 septembre 2021

### Fixed
- Correction regex apostrophes qui n’étaient plus surlignées
- Correction espaces insécables qui n’étaient plus surlignées

## [1.0.3] - 1 septembre 2021

### Fixed
- Correction sur la persistance du choix de l’affichage qui ne fonctionnait pas avec les lignes sans traductions. (voir précédente version)

## [1.0.2] - 1 septembre 2021

### Added
- Le choix de l’affichage des traductions (afficher tout / les avertissements) est enregistré ce qui permet de passer de page en page pour ne voir que les avertissements.

### Fixed
- Suppression de l’exception % de la regex des apostrophes puisque désormais les seuls cas acceptables sont gérés par l’exception globale des attributs de balises HTML.

## [1.0.1] - 31 août 2021

### Added
- Les caractères compris entre < > (balises HTML) ne sont plus analysées et surlignées ce qui devrait réduire considérablement le nombre de faux positifs.

## [1.0.0.6] - 10 juillet 2021

### Changed
- Amélioration de la regex parenthèse fermante pour ne plus surligner celles suivies d’une espace insécable suivie d’un caractère unique (voir wiki pour plus d’information).

### Fixed
- Correction de la regex des deux points qui dysfonctionnait. Bug remonté par Clément Polito sur slack. La regex a été refaite et simplifiée, ce qui fera réapparaitre des faux positifs, mais qui la fera fonctionner dans les cas nécessaires. J’envisage de gérer autrement les exceptions mais cela demandera plus de travail. 
Sous ce bug s’en cachait un autre à savoir l’utilisation des deux points dans le aria label de l’erreur qui provoquait un bug.

## [1.0.0.5] - 8 juin 2021

### Added
- Ajout d’une exception sur la regex des mots interdits lorsqu’ils sont entre guillemets (avec espaces insécables)

### Fixed
- Suppression du point dans le LookAhead de la regex sur les mots interdits car il n’avait aucune utilité et surlignait les mots interdits lorsqu’ils étaient dans une URL

## [1.0.0.4] - 4 juin 2021

### Added
- Import des expressions du glossaire officiel : une requête est effectuée 1 fois par 24h et ajoute aux fautes de frappes surlignées par SPTE les mots du glossaire. Les mots importés sont ceux de la colonne 1 dont la valeur est différente de ceux de la colonne 3 pour éviter de surligner les mots qui sont identiques en français et en anglais. De plus, chaque mot importé est dupliqué avec ajout d’un s final pour tenter de trouver et surligner les pluriels.

## [1.0.0.3] - 8 mai 2021

### Fixed
- Correction du problème de ligne de recherche qui disparait (thanks to [Aurélien Joahny](https://github.com/ajoah)).

## [1.0.0.2] - 10 Janv 2021

### Added
- Ajout de paramètres permettant de sélectionner les couleurs des 3 types d’avertissements.

### Changed
- Amélioration de l’accessibilité des messages d’erreur en séparant les label aria des textes des infobulles
- Remplacement des span des avertissements par des liens a pour les rendre accessibles au clavier

### Fixed
- Remplacement du pictogramme unicode Information par un SVG par compatibilité

## [1.0.0.1] - 3 Janv 2021

### Changed
- Remplacement des info-bulles des avertissements par des aria-label couplés à des pseudo-éléments. Les info-bulles deviennent accessibles
- Remplacement des span des avertissements par des liens a pour les rendre accessibles au clavier
- Changement de la police utilisée pour le caractère i d’information pour de l’arial sans-serif afin de le rendre compatible Linux
- remise à vide du champs de saisie Cohérence lorsqu’on ferme la popup
- au clic sur Cocher Tous/Les avertissements en rouge : si 0 lignes alors on masque la notice
- amélioration visibilité des liens Livres (menu secondaire) par défaut

## [1.0.0.0] - 29 Déc 2020

### Added
- Ajout d’un haut de page collant (sticky header) permettant d’avoir toujours accès aux compteurs et contrôles
- Ajout de boutons d’accès au Glossaire, aux règles Typographiques, à la Consistency (cohérence)
- Ajout d’une option (épingle rouge) pour utiliser ou non le haut de page sticky
- Ajout d’un champ de saisie permettant de faire une recherche de cohérence sur la locale française et affichage des résultats en fenêtre surgissante (popup)
- Ajout de paramètres via une page d’action (popup) accessible en cliquant sur l’icône SPTE présente dans la barre d’adresse du navigateur
- Ajout d’une option permettant d’activer/désactiver l’info-bulle noire
- Ajout d’une option permettant d’améliorer les contrastes des textes sur Translate en leur affectant un rapport minimal de 4.5:1 (voir WCAG)
- Ajout d’une option permettant de rajouter des locales sur lesquelles activer SPTE (locales dérivées du français puisque les règles typographiques ne peuvent s’appliquer à d’autres langues)
- Ajout d’une option permettant d’activer/désactiver l’affichage des drapeaux français destinés à mieux repérer la locale française dans les tables
- Ajout d’une option permettant d’agrandir le contenu de la page (corps de la page) sur le reste du site (les tables de traduction sont déjà agrandies à 85% cette option permet d’appliquer la même chose aux autres pages de Translate)
- Ajout d’une option permettant de choisir la largeur maximale du contenu de la page (corps de la page) à appliquer aux autres pages de Translate

## [0.9.9.9] - 7 Déc 2020

### Added
- Analyse d’une ligne et recalcul des compteurs à chaque : Saisie, Suggest, Fuzzy, et Reject
- Ajout du drapeau français pour mieux identifier la locale fr sur différentes tables de translate mais sans en changer le tri car ces tables sont triées par ordre logique

### Changed
- Remplacement des espaces insécables dans les regex par leur unicode pour les rendre visibles sur github (essentiellement dans le wiki)
- Déplacement des styles dans une feuille de style externe
- Ajout d’un paramètre enregistré (en LocalStorage) pour masquer/afficher la légende qui prend de la place

### Fixed
- Retrait des checkbox que j’avais bêtement intégré aux formulaires existants, ce qui les intégrait aux requêtes

## [0.9.9.8] - 11 Nov 2020

### Added
- Ajout d’exceptions au contrôle de l’espace insécable du guillemet fermant lorsque ce dernier est suivi par un point, suivi par une virgule, suivi par un espace insécable et un point d’interrogation ou d’exclamation ou deux points ou d’un point virgule. Voir Wiki pour plus d’information.

### Changed
- Menues améliorations des commentaires dans le code

## [0.9.9.7] - 9 Nov 2020

### Added
- Ajout exception sur barre oblique (slash) lorsqu’il est suivi par 2 accolades ouvrantes ou 2 crochets fermants
- Ajout lettres accentuées et espace insécable suivante mais non finale dans regxCloseBrace
- Ajout lettres accentuées dans rgxCloseHook
- Ajout lettres accentuées et chiffres à rgxPeriod
- Ajout curseur loupe sur tooltip noire

### Changed
- Renommage spaceAfter en Ellipsis puisque seul caractère, retrait de crochets en trop pour même raison, et ajout des lettres accentuées et chiffres encadrants

### Fixed
- Correction rgxCloseParenthesis qui était bugguée sur la seconde partie (après parenthèse)

## [0.9.9.6] - 23 Oct 2020

### Added
- Changement de l’ordre des locales pour faire passer la française en premier afin de la rendre plus facilement accessible. FrenchFlagPowaa :D

### Changed
- Restructuration du code en plusieurs fichiers automatiquement chargés par le navigateur dans l’ordre de déclaration du manifeste
- Séparation du readme et du changelog et passage de ce dernier au format keepachangelog (frenchifié)

### Fixed
- Correction  Espace est un n.c. féminin en typographie (thanks to [Pierre Lannoy](https://github.com/Pierre-Lannoy)).
- Correction  `ou` est implicitement inclusif et doit remplacer la pseudoconjonction `et/ou` (cf #24) (thanks to [Pierre Lannoy](https://github.com/Pierre-Lannoy))

## [0.9.9.5] - 14 Oct 2020

### Added
- Gestion des smileystextuels :) et :-)
- Gestion des cas supplémentaires pour les parenthèses ouvrantes et fermantes voir issue github #10
- Ajout caractères accentués à la règle des virgules

## [0.9.9.4] - 12 Oct 2020

### Changed
- Masquer aussi les lignes non traduites lorsqu’on sélectionne « N’afficher que les avertissements » et que l’on est sur `All`
- Séparation du point d’exclamation et du signe plus et ajout de l’exception google+ au signe plus
- Passage de l’icône SPTE dans la barre d’adresse pour ne l’afficher que lorsqu’SPTE est actif c’est à dire sur translate

## [0.9.9.3] - 11 Oct 2020

### Added
- Ajout alerte sur mots : mail, mails
- Ajout possibilité pour les PTE de sélectionner toutes les lignes avec avertissements en rouge, avec comptage des éléments

### Changed
- Modification de la surcharge des styles GlotDict par une surcharge des paramètres GlotDict
- Sécurisation du masquage des lignes sans avertissements : si connecté en PTE les lignes masquées sont automatiquement décochées si elles l’étaient

## [0.9.9.2] - 7 Oct 2020

### Removed
- Annulation gain de place en CSS qui provoquait un bug d’affichage pour les >PTE

## [0.9.9.1] - 7 Oct 2020

### Fixed
- Suppression détection des apostrophes simples encadrant un paramètre, exemple : '%s'
- Suppression détection des signes slash doublés
- Correction slash lorsque suivi par un supérieur dans le cas d’une balise XHTML auto-fermante

## [0.9.9.0] - 6 Oct 2020

### Added
- Ajout jpg et jpeg aux extensions et suppression de l’avertissement sur les apostrophes simples lorsqu’elles sont précédées par href=
- Ajout commentaire sur GlotDict dans readme et js
- Ajout « Melle » aux badwords

### Fixed
- Suppression de la détection du guillement français ouvrant lorsqu’en début de chaîne
- Suppression des exceptions rendues inutiles par le traitement unitaire de chaque caractère

## [0.9.8.9] - 6 Oct 2020

### Fixed
- Correction faux positif sur deux points précédés par un espace insécable et suivi par un espace

## [0.9.8.8] - 6 Oct 2020

### Changed
- Amélioration du markup HTML du header
- Factorisation de la fonction showControls
- Réduction de la taille de la légende

## [0.9.8.7] - 5 Oct 2020

### Added
- Ajout d’un bouton radio pour n’afficher que les avertissements.

## [0.9.8.6] - 5 Oct 2020

### Added
- Ajout de liens vers le glossaire et les règles typographiques
- ajout des mots « popup », « popups », « responsif » aux badWords

### Fixed
- correction apportée lorsqu’en sortie de correction sur une chaîne comprenant un espace insécable la coloration de GlotDict réapparaissait

## [0.9.8.5] - 4 Oct 2020

### Changed
- Reprogrammation spécifique des caractères parenthèses ouvrantes et fermantes, accolades ouvrantes et fermantes, crochets ouvrants et fermants pour accepter des doubles crochets et doubles accolades ainsi que l’utilisation des parenthèses dans des informations de développement, gestion du point d’interrogation lorsqu’il est utilisé pour passer un paramètre en URL

## [0.9.8.0] - 3 Oct 2020
- Birth
