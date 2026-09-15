import { defineConfig } from 'wxt';

// Documentation WXT : https://wxt.dev/api/config.html
export default defineConfig({
  // Le dossier "entrypoints" contiendra le background, le content script et le popup.
  srcDir: '.',

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

    minimum_chrome_version: '123',

    // Identifiant Firefox obligatoire pour publier/mettre à jour : il doit correspondre exactement à l’identifiant de la fiche SPTE existante.
    browser_specific_settings: {
      gecko: {
        id: 'contact@wpfr.net',
        strict_min_version: '120.0',
        // Obligatoire pour Mozilla même si SPTE ne collecte rien.
        data_collection_permissions: {
          required: ['none'],
        },
      },
    },
  },
});
