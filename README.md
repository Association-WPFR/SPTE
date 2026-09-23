<p align="center">
  <img src="public/icons/spte.png" alt="SPTE" width="160" />
</p>

<div align="center">

[![Version 3.0.0](https://img.shields.io/badge/version-3.0.0-blue?style=flat-square)](CHANGELOG.md) [![Licence GPL v2+](https://img.shields.io/badge/licence-GPL%20v2%2B-276749?style=flat-square)](LICENSE) [![Tests : Vitest](https://img.shields.io/badge/tests-vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://github.com/Association-WPFR/SPTE/actions/workflows/ci.yml) [![Lines](https://img.shields.io/badge/lines-45.61%25-red.svg?style=flat)](https://github.com/Association-WPFR/SPTE/actions/workflows/ci.yml)

</div>

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

Sur https://translate.wordpress.org/, SPTE surligne dans les traductions en français les espaces (insécables et sécables), les apostrophes droites, les mots déconseillés (glossaire officiel) et les erreurs de typographie du [guide du traducteur](https://fr.wordpress.org/team/handbook/guide-du-traducteur/les-regles-typographiques-utilisees-pour-la-traduction-de-wp-en-francais/). Chaque erreur détaille le problème au survol. Le rouge signale une erreur certaine, le rose un point à vérifier (SPTE ne gère pas toutes les exceptions typographiques, certaines alertes roses sont des faux positifs).

![Screenshot](https://raw.githubusercontent.com/Association-WPFR/SPTE/main/docs/screenshots/screenshot-1.png "Statistiques")
![Screenshot](https://raw.githubusercontent.com/Association-WPFR/SPTE/main/docs/screenshots/screenshot-2.png "Coloration syntaxique")

Le détail pas à pas de l’interface (statistiques, options de filtrage, infobulles, aide à la correction) est dans le wiki : [Le fonctionnement de SPTE](https://github.com/Association-WPFR/SPTE/wiki/Le-fonctionnement-de-SPTE).

<details>
<summary>uBlock Origin peut bloquer l’extension</summary>

Il peut être nécessaire de désactiver l’extension uBlock Origin sur translate.wordpress.org dans certains cas, en ajoutant une exception pour cette URL. Toute extension bloquant les scripts peut avoir besoin du même processus.

</details>

## GlotDict & SPTE

Cette extension n’est pas destinée à remplacer GlotDict, mais à afficher des alertes spécifiques à la langue Française. Elle est donc complémentaire.
Elle n’apporte pas d’aide lors de la saisie d’une traduction puisque GlotDict le fait très bien mais elle permet de contrôler ultérieurement si une traduction a respecté les règles mises en place par l’équipe française en charge de la traduction.

> [!NOTE]
> SPTE travaille en profondeur sur la colonne des traductions et force par compatibilité certains paramètres internes de GlotDict. GlotDict évoluant de son côté, cette compatibilité peut nécessiter une mise à jour ponctuelle de SPTE — se référer au [wiki](https://github.com/Association-WPFR/SPTE/wiki) pour le détail technique à jour.

## Architecture

Extension WebExtension bâtie avec [WXT](https://wxt.dev/) : points d'entrée (`background`, `spte.content`, `popup`) dans `entrypoints/`, logique métier et manipulation DOM dans `utils/` (testée avec Vitest). Détail complet et contraintes de design : [`.claude/ARCHITECTURE.md`](.claude/ARCHITECTURE.md).

## Remerciements

Merci à Loïc Antignac ([webaxones](https://github.com/webaxones)), auteur initial de SPTE et à l’origine du projet.

Fin 2025, le projet SPTE a été repris par l’Association WordPress Francophone ([WPFR.net](https://wpfr.net)), propriétaire et hébergeur du projet, afin d’en assurer la maintenance suite à l’envie de Loïc de passer la main. Mainteneur actuel : Jason Rouet ([jaz-on](https://github.com/jaz-on)). Pour contribuer à SPTE, [lis le wiki](https://github.com/Association-WPFR/SPTE/wiki).

## Contact
Privilégier les issues Github ou le slack communautaire WordPressFR (en dernier recours contact@wpfr.net).
