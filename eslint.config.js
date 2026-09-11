import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Variables injectées automatiquement par WXT dans les entrypoints (background.ts, *.content.ts, popup).
// Pas d'import nécessaire pour ces noms — sans cette déclaration, ESLint les signalerait comme non définis.
const wxtGlobals = {
	browser: 'readonly',
	defineBackground: 'readonly',
	defineContentScript: 'readonly',
	defineUnlistedScript: 'readonly',
};

export default tseslint.config(
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		languageOptions: {
			globals: wxtGlobals,
		},
	},
	{
		// Ces fichiers sont des conversions mécaniques temporaires (@ts-nocheck en tête) —
		// le vrai nettoyage/typage est prévu en Phase 3, pas la peine de les lint sévèrement pour l'instant.
		files: ['entrypoints/spte.content.ts', 'entrypoints/popup/main.ts'],
		rules: {
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/ban-ts-comment': 'off',
			'no-useless-assignment': 'off',
		},
	},
	{
		ignores: ['.output/**', '.wxt/**', 'node_modules/**'],
	},
);
