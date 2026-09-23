import { defineConfig } from 'wxt';

// Documentation WXT : https://wxt.dev/api/config.html
export default defineConfig({
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
        id: '{baaf1485-bb79-407c-83f6-b9e30032f436}',
        // 140.0 = version ESR actuelle, pas un plancher technique : alignée sur data_collection_permissions
        // (clé lue par Firefox seulement à partir de 140) plutôt que sur la fonctionnalité JS/CSS la plus récente.
        strict_min_version: '140.0',
        // Obligatoire pour Mozilla même si SPTE ne collecte rien.
        data_collection_permissions: {
          required: ['none'],
        },
      },
    },
  },

  zip: {
    excludeSources: ['coverage/**', 'docs/**'],
  },
});
