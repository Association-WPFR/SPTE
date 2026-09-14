import { describe, expect, it } from 'vitest';
import { parseCsv } from './helpers';

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
