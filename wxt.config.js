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

    // Version calculée depuis les fonctionnalités CSS/JS réellement utilisées (actuellement
    // `light-dark()`), pas un plancher de prudence arbitraire — cf. politique de compat'
    // dans TODO.md. À recalculer à chaque fonctionnalité plus récente adoptée.
    minimum_chrome_version: '123',

    // Identifiant Firefox obligatoire pour publier/mettre à jour sur l’AMO.
    // Doit correspondre exactement à l’identifiant de la fiche SPTE existante sur l’AMO.
    browser_specific_settings: {
      gecko: {
        id: 'contact@wpfr.net',
        strict_min_version: '120.0',
        // Obligatoire par Mozilla à terme pour toutes les extensions AMO. SPTE ne collecte rien.
        data_collection_permissions: {
          required: ['none'],
        },
      },
    },
  },
});
