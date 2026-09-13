import { defineConfig } from 'wxt';

// Documentation WXT : https://wxt.dev/api/config.html
export default defineConfig({
  // Le dossier "entrypoints" contiendra le background, le content script et le popup.
  srcDir: '.',

  // Migration MV3 (2026-09-14, décision de Jason) : Firefox restait en MV2 (v1.1.0, 2022)
  // pendant que Chrome avait déjà MV3 (v2.0.0, 2023). MV3 exige déjà Firefox 109 minimum,
  // en dessous du plancher réel calculé ci-dessous — donc pas le facteur limitant.
  manifestVersion: 3,

  manifest: {
    name: 'SPTE',
    description: 'Extension d\'aide à la traduction WordPress permettant de visualiser des éléments à améliorer et des erreurs à corriger sur https://translate.wordpress.org/.',
    permissions: ['storage', 'tabs'],
    icons: {
      16: '/icons/icon16.png',
      48: '/icons/icon48.png',
      128: '/icons/icon128.png',
    },

    // Politique de compat' navigateur (décision de Jason, 2026-09-14) : SPTE cible une
    // petite communauté de bénévoles (quelques centaines de traducteurs FR de WordPress),
    // pas le grand public — donc plus de plancher "prudent" arbitraire type Firefox 109.
    // Les versions minimales ci-dessous sont calculées à partir des fonctionnalités CSS/JS
    // réellement utilisées dans le code (audité le 2026-09-14), pas fixées à l'avance :
    // aujourd'hui le facteur limitant est `light-dark()` (Firefox 120+, Chrome 123+,
    // vérifié sur MDN/caniuse), au-dessus de CSS nesting (Firefox 117+, Chrome 120+).
    // À recalculer à chaque fois qu'une fonctionnalité plus récente est adoptée.
    // Pour référence, au moment de cet audit (2026-09-14) : Chrome stable = 153/154,
    // Firefox stable = 155 (voir TODO.md pour le détail par version de SPTE).
    minimum_chrome_version: '123',

    // Identifiant Firefox obligatoire pour publier/mettre à jour sur l’AMO.
    // Doit correspondre exactement à l’identifiant de la fiche SPTE existante sur l’AMO.
    browser_specific_settings: {
      gecko: {
        id: 'contact@wpfr.net',
        strict_min_version: '120.0',
        // Obligatoire pour les nouvelles extensions Firefox depuis le 3 novembre 2025 ;
        // SPTE (déjà publiée) est exemptée pour l'instant mais Mozilla étend l'obligation
        // à toutes les extensions existantes au 1er semestre 2026. SPTE ne collecte rien.
        data_collection_permissions: {
          required: ['none'],
        },
      },
    },
  },
});
