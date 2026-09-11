import { defineConfig } from 'wxt';

// Documentation WXT : https://wxt.dev/api/config.html
export default defineConfig({
  // Le dossier "entrypoints" contiendra le background, le content script et le popup.
  srcDir: '.',

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
    // ⚠️ Valeur provisoire — à remplacer par l’identifiant réel de la fiche SPTE existante avant toute publication.
    browser_specific_settings: {
      gecko: {
        id: 'spte@wpfr.net',
        strict_min_version: '109.0',
      },
    },
  },
});
