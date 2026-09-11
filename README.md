<p align="center">
  <img src="public/icons/spte.png" alt="SPTE" width="160" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-blue?style=flat-square" alt="Version 2.0.0" />
  <img src="https://img.shields.io/badge/licence-GPL%20v2%2B-276749?style=flat-square" alt="Licence GPL v2+" />
</p>

> → *English speakers: read [Why is this extension only available for French speakers?](https://github.com/Association-WPFR/SPTE/wiki/Why-is-this-extension-only-available-for-French-speakers%3F).*
>
> → *Lire le [Wiki](https://github.com/Association-WPFR/SPTE/wiki) pour de plus amples (et actualisées) informations.*

## Installation

<p align="center">
  <a href="https://addons.mozilla.org/fr/firefox/addon/spte/">
    <img src="https://img.shields.io/badge/Firefox-Ajouter_à_Firefox-FF7139?style=for-the-badge&logo=firefoxbrowser&logoColor=white" alt="Ajouter à Firefox" />
  </a>
  &nbsp;&nbsp;
  <a href="https://chrome.google.com/webstore/detail/spte/phoglaigilljgehnhjfomdhkgokelgnk">
    <img src="https://img.shields.io/badge/Chrome_Web_Store-Ajouter_à_Chrome-4285F4?style=for-the-badge&logo=chromewebstore&logoColor=white" alt="Ajouter à Chrome" />
  </a>
</p>

## Fonctionnement

Cette extension est utilisable sur https://translate.wordpress.org/ et permet de visualiser sur les traductions en français les éléments suivants :
* les espaces insécables en blanc
* les espaces sécables en début et en fin de chaîne en bleu

les erreurs suivantes :
* les apostrophes droites au lieu d’apostrophes courbes
* les mots déconseillés : on peut trouver les mots à privilégier en utilisant l’extension GlotDict ou en consultant le glossaire (https://translate.wordpress.org/locale/fr/default/glossary/).
* les erreurs de typographie listées par le guide du traducteur (https://fr.wordpress.org/team/handbook/guide-du-traducteur/les-regles-typographiques-utilisees-pour-la-traduction-de-wp-en-francais/)

Chaque erreur affiche une information au survol dans une infobulle.
Le survol du lien Détails en fin de ligne permet de voir la chaîne d’origine sans coloration syntaxique sur un fond noir.

La chaine avec ses erreurs est également affichée dans la partie saisie/modification.

Un bouton radio permet de n’afficher que les traductions ayant des avertissements.

Les éditeurs de traduction ont une option supplémentaire pour cocher toutes les lignes avec avertissements en rouge (donc les erreurs dont on est sûr).

## Utilisation

SPTE affiche en haut de page les statistiques des erreurs/éléments qu’il a trouvé sur la page en cours.
Il peut donc être utile de définir dans les paramètres de traduction (menu en haut à droite) un nombre de lignes par page assez important si l’on veut juger rapidement si une traduction est acceptable ou non.
Les erreurs avérées sont en rouge. En rose sont notifiés les éléments à vérifier : il s’agit la plupart du temps d’erreurs relatives au non respect des règles typographiques, mais la couleur rose peut aussi indiquer des faux positifs : beaucoup de spécificités liées à la programmation génèrent des exceptions. Certaines exceptions sont gérées par SPTE mais pas toutes. Il est donc indispensable de contrôler les caractères en rose.

![Screenshot](https://raw.githubusercontent.com/Association-WPFR/SPTE/master/assets/screenshots/screenshot-1.png "Statistiques")

Sur les traductions, la même coloration syntaxique est utilisée :
* les mots déconseillés (pour des raisons de cohérence) ou mal écrits sont sur fond rouge : l’erreur est certaine, si l’orthographe est correcte alors il faut se référer au glossaire pour trouver le mot à utiliser.
* les caractères interdits comme les apostrophes droites sont encadrées de rouge sur fond blanc.
* les caractères ne respectant probablement pas les règles typographiques sont encadrés de rose sur fond blanc.

![Screenshot](https://raw.githubusercontent.com/Association-WPFR/SPTE/master/assets/screenshots/screenshot-2.png "Coloration syntaxique")

Au survol de chaque élément surligné apparait une info-bulle dans laquelle une explication du problème est décrite.

![Screenshot](https://raw.githubusercontent.com/Association-WPFR/SPTE/master/assets/screenshots/screenshot-3.png "Info-bulle au survol")

Le survol du lien « Détails » se trouvant en fin de ligne permet de voir la chaîne traduite sans surlignage afin d’aider à la compréhension de l’erreur.
Le texte est en blanc sur fond noir et sa taille est agrandie afin d’en faciliter la lecture.

![Screenshot](https://raw.githubusercontent.com/Association-WPFR/SPTE/master/assets/screenshots/screenshot-4.png "Info-bulle sans surlignage")

En modification de traduction, la traduction à corriger est reprise juste au dessus du champ de saisie avec ses informations surlignées pour aider à la correction.
Elle est sur fond gris pour permettre de voir les espaces insécables qui sont en blanc.

![Screenshot](https://raw.githubusercontent.com/Association-WPFR/SPTE/master/assets/screenshots/screenshot-5.png "Correction de la traduction")

Les espaces (sécables) sont affichées en bleu afin d’être différenciées des espaces insécables : il peut s’agir d’une erreur, mais il peut aussi s’agir d’une espace voulue. Bien réfléchir avant de les supprimer.

![Screenshot](https://raw.githubusercontent.com/Association-WPFR/SPTE/master/assets/screenshots/screenshot-6.png "Espaces sécables en début ou fin de ligne")

<details>
<summary>uBlock Origin peut bloquer l’extension</summary>

Il peut être nécessaire de désactiver l’extension uBlock Origin sur translate.wordpress.org dans certains cas, en ajoutant une exception pour cette URL. Toute extension bloquant les scripts peut avoir besoin du même processus.

</details>

## GlotDict & SPTE

Cette extension n’est pas destinée à remplacer GlotDict, mais à afficher des alertes spécifiques à la langue Française. Elle est donc complémentaire.
Elle n’apporte pas d’aide lors de la saisie d’une traduction puisque GlotDict le fait très bien mais elle permet de contrôler ultérieurement si une traduction a respecté les règles mises en place par l’équipe française en charge de la traduction.

> [!NOTE]
> SPTE travaille en profondeur sur la colonne des traductions et force par compatibilité certains paramètres internes de GlotDict. GlotDict évoluant de son côté, cette compatibilité peut nécessiter une mise à jour ponctuelle de SPTE — se référer au [wiki](https://github.com/Association-WPFR/SPTE/wiki) pour le détail technique à jour.

## Remerciements

Merci à Loïc Antignac ([webaxones](https://github.com/webaxones)), auteur initial de SPTE et à l’origine du projet.

Fin 2025, le projet SPTE a été repris par l’Association WordPress Francophone ([WPFR.net](https://wpfr.net)) afin d’en assurer la maintenance suite à l’envie de Loïc de passer la main. Si vous souhaitez contribuer à SPTE, [lisez le wiki](https://github.com/Association-WPFR/SPTE/wiki).
