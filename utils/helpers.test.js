import { describe, expect, it } from 'vitest';
import { parseCsv, isPartOfProjectName, stripHighlightTags, isInsideHtmlTag } from './helpers';
import { buildWarningSpanHTML } from './warnings';

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

describe('stripHighlightTags', () => {
	// Balisage inséré par GlotDict (glotdict-functions.js) autour des espaces insécables et des apostrophes courbes.
	it('retire le surlignage jaune de GlotDict autour d\'une espace insécable', () => {
		expect(stripHighlightTags('Super<span style="background-color:yellow">&nbsp;</span>!')).toBe('Super&nbsp;!');
	});
	it('retire le surlignage jaune de GlotDict autour d\'une apostrophe courbe', () => {
		expect(stripHighlightTags('l<span style="background-color:yellow">’</span>auteur')).toBe('l’auteur');
	});
	it('retire un surlignage GlotDict même avec des guillemets simples ou une casse différente', () => {
		expect(stripHighlightTags('Super<span style=\'background-color:YELLOW\'>&nbsp;</span>!')).toBe('Super&nbsp;!');
	});
	it('ne fait aucun travail regex si le texte ne contient aucun <span', () => {
		expect(stripHighlightTags('Simple texte : « ok »')).toBe('Simple texte : « ok »');
	});
	it('retire un surlignage SPTE déjà posé (second passage)', () => {
		const rule = { id: 'quotes', name: 'apostrophe droite', message: 'Message', cssClass: 'sp-warning--quote' };
		const highlighted = `l${buildWarningSpanHTML(/** @type {any} */ (rule), '\'')}auteur`;
		expect(stripHighlightTags(highlighted)).toBe('l\'auteur');
	});
	it('retire aussi les surlignages des espaces (sécables et insécables) de SPTE', () => {
		expect(stripHighlightTags('a<span tabindex="0" class="sp-nbkspaces--showing">&nbsp;</span>b')).toBe('a&nbsp;b');
		expect(stripHighlightTags('a<span tabindex="0" class="sp-spaces--showing"> </span>b')).toBe('a b');
	});
	it('conserve les autres balises, y compris un span sans lien avec ces surlignages', () => {
		const html = 'Un <strong>mot</strong> et <span class="autre">un span</span> et <a href="#">un lien</a>';
		expect(stripHighlightTags(html)).toBe(html);
	});
	it('ne fait rien sur un texte sans balise', () => {
		expect(stripHighlightTags('Simple texte : « ok »')).toBe('Simple texte : « ok »');
	});
});

describe('isInsideHtmlTag', () => {
	it('détecte une position à l\'intérieur d\'un attribut entre guillemets doubles', () => {
		const text = 'Un <span tabindex="0" aria-label="x">"</span>cité"';
		const offset = text.indexOf('0');
		expect(isInsideHtmlTag(text, offset)).toBe(true);
	});

	it('ignore une position dans le texte visible, hors balise', () => {
		const text = 'Un <span tabindex="0">mot</span> "cité"';
		const offset = text.indexOf('"cité"');
		expect(isInsideHtmlTag(text, offset)).toBe(false);
	});

	it('ignore une position avant toute balise', () => {
		const text = '"cité"';
		expect(isInsideHtmlTag(text, 0)).toBe(false);
	});
});
