import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// jsdom : les fichiers testés (utils/helpers.js) accèdent à `document` dès leur import.
		environment: 'jsdom',
	},
});
