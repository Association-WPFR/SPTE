import js from '@eslint/js';
import globals from 'globals';
import noUnsanitized from 'eslint-plugin-no-unsanitized';

// Variables injectées automatiquement par WXT dans les entrypoints (background.js, *.content.js, popup).
// Pas d'import nécessaire pour ces noms — sans cette déclaration, ESLint les signalerait comme non définis.
const wxtGlobals = {
	browser: 'readonly',
	chrome: 'readonly',
	defineBackground: 'readonly',
	defineContentScript: 'readonly',
	defineUnlistedScript: 'readonly',
};

export default [
	js.configs.recommended,
	{
		languageOptions: {
			globals: { ...globals.browser, ...wxtGlobals },
		},
		plugins: {
			'no-unsanitized': noUnsanitized,
		},
		rules: {
			// Des espaces insécables (U+00A0) sont volontairement utilisées dans des template
			// strings pour respecter les règles typographiques françaises (ex: avant un ':').
			'no-irregular-whitespace': ['error', { skipTemplates: true }],
			// Même check que l'addons-linter de Mozilla (AMO) à la soumission — l'attraper ici
			// évite la surprise à l'upload. DOMPurify.sanitize() reconnu comme échappement sûr.
			'no-unsanitized/method': ['error', { escape: { methods: ['DOMPurify.sanitize'] } }],
			'no-unsanitized/property': ['error', { escape: { methods: ['DOMPurify.sanitize'] } }],
		},
	},
	{
		// Tests : environnement jsdom (document/window) + Node (__dirname) + Vitest (describe/it/expect).
		// no-unsanitized désactivé : fixtures HTML locales de confiance, pas de flux runtime à risque.
		files: ['**/*.test.js'],
		languageOptions: {
			globals: { ...globals.browser, ...globals.node, ...globals.vitest },
		},
		rules: {
			'no-unsanitized/method': 'off',
			'no-unsanitized/property': 'off',
		},
	},
	{
		// Fichiers de config, exécutés par Node, pas dans un navigateur.
		files: ['vitest.config.js', 'wxt.config.js'],
		languageOptions: {
			globals: { ...globals.node },
		},
	},
	{
		ignores: ['.output/**', '.wxt/**', 'node_modules/**', 'coverage/**'],
	},
];
