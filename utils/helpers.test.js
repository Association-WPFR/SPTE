import { describe, expect, it } from 'vitest';
import { parseCsv, isPartOfProjectName } from './helpers';

describe('parseCsv', () => {
	it('découpe des lignes CSV simples', () => {
		expect(parseCsv('en,fr,pos\nplugin,extension,noun')).toEqual([
			['en', 'fr', 'pos'],
			['plugin', 'extension', 'noun'],
		]);
	});

	it('gère les champs entre guillemets contenant des virgules', () => {
		expect(parseCsv('en,fr,description\nsave,"enregistrer, sauvegarder","utilisé pour, par exemple, un bouton"')).toEqual([
			['en', 'fr', 'description'],
			['save', 'enregistrer, sauvegarder', 'utilisé pour, par exemple, un bouton'],
		]);
	});

	it('gère les guillemets échappés (doublés) à l’intérieur d’un champ', () => {
		expect(parseCsv('en,fr\nterm,"il dit ""bonjour"""')).toEqual([
			['en', 'fr'],
			['term', 'il dit "bonjour"'],
		]);
	});

	it('gère les fins de ligne CRLF et LF', () => {
		expect(parseCsv('en,fr\r\nplugin,extension\nwidget,widget')).toEqual([
			['en', 'fr'],
			['plugin', 'extension'],
			['widget', 'widget'],
		]);
	});

	it('ignore les lignes vides en fin de fichier', () => {
		expect(parseCsv('en,fr\nplugin,extension\n')).toEqual([
			['en', 'fr'],
			['plugin', 'extension'],
		]);
	});
});

// Issue #38 : un mot du glossaire qui fait partie du nom de l'extension en cours de traduction
// (ex: "Widget") n'est pas un anglicisme à corriger.
describe('isPartOfProjectName', () => {
	it('détecte un mot contenu dans le nom du projet', () => {
		expect(isPartOfProjectName('Widget', 'Super Widget – Blocks & More')).toBe(true);
	});

	it('ignore la casse', () => {
		expect(isPartOfProjectName('widget', 'Super Widget')).toBe(true);
	});

	it('retourne false si le mot n’est pas dans le nom du projet', () => {
		expect(isPartOfProjectName('plugin', 'Super Widget')).toBe(false);
	});

	it('retourne false si le nom du projet est vide (breadcrumb absent/non lu)', () => {
		expect(isPartOfProjectName('widget', '')).toBe(false);
	});
});
