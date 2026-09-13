import { defineConfig } from 'wxt';

// Documentation WXT : https://wxt.dev/api/config.html
export default defineConfig({
  // Le dossier "entrypoints" contiendra le background, le content script et le popup.
  srcDir: '.',

  // Migration MV3 (2026-09-14, décision de Jason) : Firefox restait en MV2 (v1.1.0, 2022)
  // pendant que Chrome avait déjà MV3 (v2.0.0, 2023). Firefox 109 (déjà le strict_min_version
  // déclaré ci-dessous) est justement la première version à supporter MV3 côté Firefox.
  manifestVersion: 3,

  manifest: {
    name: 'SPTE',
    description: 'Extension de vérification typographique pour les traductions françaises de WordPress sur translate.wordpress.org.',
    permissions: ['storage', 'tabs'],
    icons: {
      16: '/icons/icon16.png',
      48: '/icons/icon48.png',
      128: '/icons/icon128.png',
    },

    // Identifiant Firefox obligatoire pour publier/mettre à jour sur l’AMO.
    // Doit correspondre exactement à l’identifiant de la fiche SPTE existante sur l’AMO.
    browser_specific_settings: {
      gecko: {
        id: 'contact@wpfr.net',
        strict_min_version: '109.0',
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
