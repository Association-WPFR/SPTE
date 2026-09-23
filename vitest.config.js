import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineConfig({
	plugins: [WxtVitest()],
	test: {
		// jsdom : les fichiers testés (utils/helpers.js) accèdent à `document` dès leur import.
		environment: 'jsdom',
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json-summary', 'html'],
			// Fixtures et fichiers de test eux-mêmes hors périmètre ; glue code WXT (background,
			// popup/index.html) et build output non pertinents pour un chiffre de couverture logique.
			exclude: ['**/*.test.js', '**/fixtures/**', '.output/**', '.wxt/**'],
		},
	},
});
