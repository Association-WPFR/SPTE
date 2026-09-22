import js from '@eslint/js';
import globals from 'globals';

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
		rules: {
			// Des espaces insécables (U+00A0) sont volontairement utilisées dans des template
			// strings pour respecter les règles typographiques françaises (ex: avant un ':').
			'no-irregular-whitespace': ['error', { skipTemplates: true }],
		},
	},
	{
		// Tests : environnement jsdom (document/window) + Node (__dirname) + Vitest (describe/it/expect).
		files: ['**/*.test.js'],
		languageOptions: {
			globals: { ...globals.browser, ...globals.node, ...globals.vitest },
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
