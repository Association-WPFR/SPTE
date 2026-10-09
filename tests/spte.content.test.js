import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, beforeEach } from 'vitest';
import {
	updateWarningFilterState,
	rowsDisplay,
	checkTranslation,
	frenchFlag,
	gpContentMaxWidth,
	getGlossaryRegex,
	getUnambiguousGlossaryTerms,
	applyStrictNarrowSpace,
	preventGlotDictTags,
	checkConsistencyTranslation,
	checkConsistencyTranslations,
} from '../entrypoints/spte.content';
import { rules } from '../utils/rules';
import { createElement } from '../utils/helpers';

// Fixture partagée avec utils/dom.test.js.
const translationsTableHTML = readFileSync(join(__dirname, '../utils/fixtures/translations-table.html'), 'utf-8');

describe('applyStrictNarrowSpace', () => {
	it('remplace le regex des 3 règles concernées quand activé', () => {
		const exclamationPoint = { regex: /old-exclamation/ };
		const questionMark = { regex: /old-question/ };
		const semiColon = { regex: /old-semicolon/ };
		const ctx = {
			rulesById: new Map([
				['exclamationPoint', exclamationPoint],
				['questionMark', questionMark],
				['semiColon', semiColon],
			]),
		};
		applyStrictNarrowSpace(ctx, true);
		expect(exclamationPoint.regex.source).not.toContain('old-exclamation');
		expect(questionMark.regex).toBeInstanceOf(RegExp);
		expect(semiColon.regex).toBeInstanceOf(RegExp);
	});

	it('ne touche à rien quand désactivé', () => {
		const originalRegex = /old-exclamation/;
		const exclamationPoint = { regex: originalRegex };
		const ctx = { rulesById: new Map([['exclamationPoint', exclamationPoint]]) };
		applyStrictNarrowSpace(ctx, false);
		expect(exclamationPoint.regex).toBe(originalRegex);
	});
});

describe('getGlossaryRegex', () => {
	it('construit un regex badWords qui capture aussi les termes du glossaire (avec pluriel)', () => {
		const badWords = { regex: /^original$/gm };
		const ctx = { rulesById: new Map([['badWords', badWords]]) };
		getGlossaryRegex(ctx, ['widget']);
		expect('Un widget et des widgets').toMatch(badWords.regex);
	});

	// SPTE met les termes du glossaire en minuscules : la regex doit rester insensible à la casse pour repérer un mot capitalisé.
	it('repère aussi les termes du glossaire capitalisés', () => {
		const badWords = { regex: /^original$/gm };
		const ctx = { rulesById: new Map([['badWords', badWords]]) };
		getGlossaryRegex(ctx, ['notice']);
		expect('Une Notice ici').toMatch(badWords.regex);
	});
});

describe('getUnambiguousGlossaryTerms', () => {
	it('garde un terme dont la traduction diffère toujours', () => {
		const entries = [['plugin', 'extension']];
		expect(getUnambiguousGlossaryTerms(entries, 0, 1)).toEqual(['plugin']);
	});

	it('exclut un terme dont la traduction est identique (mot commun EN/FR)', () => {
		const entries = [['plugin', 'plugin']];
		expect(getUnambiguousGlossaryTerms(entries, 0, 1)).toEqual([]);
	});

	// Issue #63 : « note » (nom, non traduit) et « note »/« noter » (verbe, traduit) sont 2 entrées
	// glossaire distinctes pour le même terme anglais « note ». Le terme est ambigu, jamais signalé.
	it('exclut un terme polysémique qui a à la fois une entrée identique et une entrée différente', () => {
		const entries = [
			['note', 'note'],
			['note', 'noter'],
		];
		expect(getUnambiguousGlossaryTerms(entries, 0, 1)).toEqual([]);
	});

	it('exclut un terme polysémique quelle que soit l\'ordre des lignes dans le CSV', () => {
		const entries = [
			['note', 'noter'],
			['note', 'note'],
		];
		expect(getUnambiguousGlossaryTerms(entries, 0, 1)).toEqual([]);
	});

	it('ignore les lignes avec un champ vide', () => {
		const entries = [['', 'extension'], ['plugin', '']];
		expect(getUnambiguousGlossaryTerms(entries, 0, 1)).toEqual([]);
	});
});

describe('preventGlotDictTags', () => {
	// Issue #80 : ces clés doivent être celles que GlotDict lit (gd_get_setting préfixe « gd_ »), sinon il surligne quand même.
	it('désactive le surlignage des apostrophes courbes et des espaces insécables dans GlotDict', () => {
		localStorage.clear();

		preventGlotDictTags();

		expect(localStorage.getItem('gd_curly_apostrophe_warning')).toBe('true');
		expect(localStorage.getItem('gd_no_non_breaking_space')).toBe('true');
	});
});

describe('gpContentMaxWidth', () => {
	it('agrandit .gp-content quand tableTranslations existe et enlargeTable !== "false"', () => {
		const ctx = { tableTranslations: document.createElement('div') };
		const before = document.styleSheets[0]?.cssRules.length ?? 0;
		gpContentMaxWidth(ctx, 'true', 'false');
		const after = document.styleSheets[0].cssRules.length;
		expect(after).toBeGreaterThan(before);
		expect(document.styleSheets[0].cssRules[after - 1].cssText).toContain('max-width');
	});

	it("n'ajoute rien quand tableTranslations existe et enlargeTable est explicitement à false", () => {
		const ctx = { tableTranslations: document.createElement('div') };
		const before = document.styleSheets[0]?.cssRules.length ?? 0;
		gpContentMaxWidth(ctx, 'false', 'false');
		const after = document.styleSheets[0]?.cssRules.length ?? 0;
		expect(after).toBe(before);
	});
});

describe('frenchFlag', () => {
	it('ajoute les classes sp-frenchies sur les 3 éléments quand pas désactivé', () => {
		const ctx = {
			frenchStatsSpecific: createElement('DIV'),
			frenchStatsGlobal: createElement('DIV'),
			frenchLocaleCard: createElement('DIV'),
		};
		frenchFlag(ctx, 'true');
		expect(ctx.frenchStatsSpecific.classList.contains('sp-frenchies--long')).toBe(true);
		expect(ctx.frenchStatsGlobal.classList.contains('sp-frenchies')).toBe(true);
		expect(ctx.frenchLocaleCard.classList.contains('sp-frenchies--locale-card')).toBe(true);
	});

	it('ne touche rien quand spteFrenchFlag === "false"', () => {
		const ctx = { frenchStatsSpecific: createElement('DIV'), frenchStatsGlobal: null, frenchLocaleCard: null };
		frenchFlag(ctx, 'false');
		expect(ctx.frenchStatsSpecific.classList.length).toBe(0);
	});
});

describe('updateWarningFilterState', () => {
	beforeEach(() => {
		document.body.innerHTML = '<input type="checkbox" id="cb"><label id="lbl"></label><table><tbody><tr class="preview sp-has-spte-warning"></tr></tbody></table>';
	});

	it('active la case et affiche le compteur quand des lignes sont en avertissement', () => {
		const ctx = {
			showOnlyWarning: document.getElementById('cb'),
			showOnlyWarningLabel: document.getElementById('lbl'),
		};
		updateWarningFilterState(ctx);
		expect(ctx.showOnlyWarningLabel.textContent).toContain('(1)');
		expect(ctx.showOnlyWarning.disabled).toBe(false);
	});

	it('désactive et décoche la case quand aucune ligne en avertissement', () => {
		document.querySelector('.sp-has-spte-warning').classList.remove('sp-has-spte-warning');
		const ctx = {
			showOnlyWarning: document.getElementById('cb'),
			showOnlyWarningLabel: document.getElementById('lbl'),
		};
		ctx.showOnlyWarning.checked = true;
		updateWarningFilterState(ctx);
		expect(ctx.showOnlyWarning.disabled).toBe(true);
		expect(ctx.showOnlyWarning.checked).toBe(false);
	});
});

describe('rowsDisplay', () => {
	beforeEach(() => {
		document.body.innerHTML = `
			<input type="checkbox" id="cb"><label id="lbl"></label>
			<table><tbody>
				<tr class="preview" id="warned"></tr>
				<tr class="preview sp-has-spte-warning" id="clean"></tr>
			</tbody></table>
		`;
	});

	it('ne masque rien quand lsShowOnlyWarning est faux', () => {
		const ctx = {
			lsShowOnlyWarning: false,
			bulkActions: null,
			showOnlyWarning: document.getElementById('cb'),
			showOnlyWarningLabel: document.getElementById('lbl'),
		};
		rowsDisplay(ctx);
		expect(document.getElementById('warned').style.display).not.toBe('none');
	});

	it('réaffiche tout si lsShowOnlyWarning est vrai mais qu\'aucune ligne n\'a d\'avertissement sur cette page', () => {
		document.body.innerHTML = `
			<input type="checkbox" id="cb"><label id="lbl"></label>
			<table><tbody>
				<tr class="preview" id="row1"></tr>
				<tr class="preview" id="row2"></tr>
			</tbody></table>
		`;
		const ctx = {
			lsShowOnlyWarning: true,
			bulkActions: null,
			showOnlyWarning: document.getElementById('cb'),
			showOnlyWarningLabel: document.getElementById('lbl'),
		};
		ctx.showOnlyWarning.checked = true;
		rowsDisplay(ctx);
		expect(document.getElementById('row1').style.display).not.toBe('none');
		expect(document.getElementById('row2').style.display).not.toBe('none');
		expect(ctx.showOnlyWarning.checked).toBe(false);
		expect(ctx.lsShowOnlyWarning).toBe(false);
	});
});

// Issue #75 : page /consistency/, structure sans tr.preview/.translation-text (voir checkTranslation ci-dessous).
describe('checkConsistencyTranslation(s)', () => {
	beforeEach(() => {
		document.body.innerHTML = '<table><tbody>'
			+ '<tr class="new-translation" id="t-1"><th colspan="2"><strong>Un mot "cité" entre guillemets droits</strong></th></tr>'
			+ '<tr class="new-translation" id="t-2"><th colspan="2"><strong>Rien à signaler ici</strong></th></tr>'
			+ '</tbody></table>';
		rules.forEach((rule) => { rule.counter = 0; });
	});

	it('surligne une erreur typo dans le <strong> canonique, sans toucher aux compteurs', () => {
		const translation = document.querySelector('#t-1 strong');
		const doubleQuotes = rules.find((rule) => rule.id === 'doubleQuotes');

		checkConsistencyTranslation({ projectName: '' }, translation);

		expect(document.querySelector('#t-1 .sp-warning--quote')).not.toBeNull();
		expect(doubleQuotes.counter).toBe(0);
	});

	it('parcourt tous les tr.new-translation th strong de la page', () => {
		checkConsistencyTranslations({ projectName: '' });

		expect(document.querySelector('#t-1 .sp-warning--quote')).not.toBeNull();
		expect(document.querySelector('#t-2 .sp-warning--quote')).toBeNull();
	});
});

describe('checkTranslation', () => {
	beforeEach(() => {
		document.body.innerHTML = translationsTableHTML;
		rules.forEach((rule) => { rule.counter = 0; });
	});

	it('détecte un guillemet droit, incrémente le compteur et surligne le texte', () => {
		const translated = document.querySelector('#preview-1-1 .translation-text');
		translated.innerHTML = 'Un mot "cité" entre guillemets droits';
		const doubleQuotes = rules.find((rule) => rule.id === 'doubleQuotes');

		checkTranslation({ projectName: '' }, translated, 'untranslated', 'current');

		expect(doubleQuotes.counter).toBe(2);
		const warning = document.querySelector('#preview-1-1 .sp-warning--quote');
		expect(warning).not.toBeNull();
	});

	// Bug trouvé en revue de la 3.1 (préexistant, identique sur main) : le <span> injecté par un rule a des
	// attributs entre guillemets doubles (tabindex="0", aria-label="…") ; sans garde, le rule doubleQuotes qui
	// tourne ensuite dans la même passe matche AUSSI ces guillemets d'attributs et corrompt le balisage déjà posé.
	it('ne corrompt pas un <span> déjà injecté par un rule précédent dans la même passe', () => {
		const translated = document.querySelector('#preview-1-1 .translation-text');
		translated.innerHTML = 'Un plug-in "cité"';
		const badWords = rules.find((rule) => rule.id === 'badWords');
		const doubleQuotes = rules.find((rule) => rule.id === 'doubleQuotes');

		checkTranslation({ projectName: '' }, translated, 'untranslated', 'current');

		expect(badWords.counter).toBe(1);
		expect(doubleQuotes.counter).toBe(2);
		const spans = document.querySelectorAll('#preview-1-1 .translation-text > span');
		expect(spans).toHaveLength(3);
		spans.forEach((span) => {
			expect(span.getAttribute('tabindex')).toBe('0');
		});
		expect(document.querySelector('#preview-1-1 .translation-text').textContent).toBe('Un plug-in "cité"');
	});

	// Issue #27 : un bloc d'interpolation JS {{ }}/[[ ]] n'est pas du texte français, ignoré par toutes les
	// règles de ponctuation. Testé bout-en-bout (pas juste le regex en isolation) : un rule antérieur dans
	// la boucle (openBrace) injecte un <span> autour d'une des deux accolades du délimiteur si le bloc
	// contient une espace après "{{" — ça défait un guard basé sur l'adjacence textuelle des caractères.
	it('ignore les deux-points à l\'intérieur d\'un bloc {{ }} avec espace (défait un guard basé sur l\'adjacence)', () => {
		const translated = document.querySelector('#preview-1-1 .translation-text');
		translated.innerHTML = 'Le {{ foo:bar }} ici';
		const colon = rules.find((rule) => rule.id === 'colon');

		checkTranslation({ projectName: '' }, translated, 'untranslated', 'current');

		// openBrace reste hors scope de #27 (signale toujours la seconde accolade elle-même dans ce cas
		// spacé : limite préexistante et distincte de rgxOpenBrace, pas du contenu du bloc). Seul le
		// contenu (ici le deux-points) doit être protégé.
		expect(colon.counter).toBe(0);
	});

	// Exemple du CHANGELOG (ICU MessageFormat) : une seule paire d'accolades imbriquées par branche.
	it('ignore la ponctuation dans un bloc {{ }} avec des accolades simples imbriquées (ICU MessageFormat)', () => {
		const translated = document.querySelector('#preview-1-1 .translation-text');
		translated.innerHTML = '{{count, plural, one{...} other{...}}}';
		const ellipsis = rules.find((rule) => rule.id === 'ellipsis');
		const comma = rules.find((rule) => rule.id === 'comma');
		const openBrace = rules.find((rule) => rule.id === 'openBrace');

		checkTranslation({ projectName: '' }, translated, 'untranslated', 'current');

		expect(ellipsis.counter).toBe(0);
		expect(comma.counter).toBe(0);
		expect(openBrace.counter).toBe(0);
	});

	it('ignore une virgule à l\'intérieur d\'un bloc [[ ]]', () => {
		const translated = document.querySelector('#preview-1-1 .translation-text');
		translated.innerHTML = 'Un mot [[a,b]] ici';
		const comma = rules.find((rule) => rule.id === 'comma');

		checkTranslation({ projectName: '' }, translated, 'untranslated', 'current');

		expect(comma.counter).toBe(0);
	});

	it('signale toujours la ponctuation en dehors de tout bloc {{ }}/[[ ]]', () => {
		const translated = document.querySelector('#preview-1-1 .translation-text');
		translated.innerHTML = '{{a}} : après';
		const colon = rules.find((rule) => rule.id === 'colon');

		checkTranslation({ projectName: '' }, translated, 'untranslated', 'current');

		expect(colon.counter).toBe(1);
	});

	// La garde s'applique de façon partagée à toutes les règles de ponctuation (pas seulement virgule/deux-points).
	it.each([
		['point-virgule', '{{a;b}}', 'semiColon'],
		['point d\'exclamation', '{{a!b}}', 'exclamationPoint'],
		['point d\'interrogation', '{{a?b}}', 'questionMark'],
		['apostrophe droite', '{{a\'b}}', 'quotes'],
		['guillemet droit', '{{a"b}}', 'doubleQuotes'],
	])('ignore un %s à l\'intérieur d\'un bloc {{ }}', (_label, html, ruleId) => {
		const translated = document.querySelector('#preview-1-1 .translation-text');
		translated.innerHTML = html;

		checkTranslation({ projectName: '' }, translated, 'untranslated', 'current');

		expect(rules.find((rule) => rule.id === ruleId).counter).toBe(0);
	});

	it('signale une apostrophe courbe inversée avec sa propre règle, pas comme une apostrophe droite', () => {
		const translated = document.querySelector('#preview-1-1 .translation-text');
		translated.innerHTML = 'Impossible d‘importer les widgets';
		const quotes = rules.find((rule) => rule.id === 'quotes');
		const reversedQuote = rules.find((rule) => rule.id === 'reversedQuote');

		checkTranslation({ projectName: '' }, translated, 'untranslated', 'current');

		expect(quotes.counter).toBe(0);
		expect(reversedQuote.counter).toBe(1);
		const warning = document.querySelector('#preview-1-1 .sp-warning--reversed-quote');
		expect(warning).not.toBeNull();
		expect(warning.getAttribute('aria-label')).toContain('apostrophe courbe inversée');
		expect(document.querySelector('#preview-1-1').classList.contains('sp-has-spte-error')).toBe(true);
	});

	// Issue #80 : GlotDict surligne les espaces insécables avec un <span style="background-color:yellow">
	// avant SPTE ; les règles ne doivent pas s'appliquer dans les attributs de cette balise.
	it('ne signale pas le balisage de surlignage de GlotDict et laisse le texte intact', () => {
		const translated = document.querySelector('#preview-1-1 .translation-text');
		translated.innerHTML = 'Vous êtes inscrit<span style="background-color:yellow">\u00a0</span>!';
		const doubleQuotes = rules.find((rule) => rule.id === 'doubleQuotes');
		const colon = rules.find((rule) => rule.id === 'colon');

		checkTranslation({ projectName: '' }, translated, 'untranslated', 'current');

		expect(doubleQuotes.counter).toBe(0);
		expect(colon.counter).toBe(0);
		const visibleText = document.querySelector('#preview-1-1 .translation-text').textContent;
		expect(visibleText).not.toContain('background-color');
		expect(visibleText.replace(/\u00a0/g, ' ')).toBe('Vous êtes inscrit !');
	});

	it('laisse le texte identique quand SPTE traite deux fois la même ligne', () => {
		const first = document.querySelector('#preview-1-1 .translation-text');
		first.innerHTML = 'Échec de l\'enregistrement des données';
		checkTranslation({ projectName: '' }, first, 'untranslated', 'current');
		const second = document.querySelector('#preview-1-1 .translation-text');
		const textAfterFirstPass = second.textContent;

		checkTranslation({ projectName: '' }, second, 'untranslated', 'current');

		expect(document.querySelector('#preview-1-1 .translation-text').textContent).toBe(textAfterFirstPass);
	});

	it('ignore une ancienne traduction déjà rejetée (sauf si on vient tout juste de la rejeter)', () => {
		const translated = document.querySelector('#preview-2-2 .translation-text');
		document.querySelector('#preview-2-2').classList.add('status-rejected');
		translated.innerHTML = 'Un mot "cité"';
		const doubleQuotes = rules.find((rule) => rule.id === 'doubleQuotes');

		checkTranslation({ projectName: '' }, translated, 'rejected', 'current');

		expect(doubleQuotes.counter).toBe(0);
		expect(translated.innerHTML).toBe('Un mot "cité"');
	});

	// Issue #79 : innerHTML sérialise l'espace insécable en &nbsp; ; elle doit rester insécable pour les regex.
	it('ne signale pas une espace insécable devant les deux points', () => {
		const translated = document.querySelector('#preview-1-1 .translation-text');
		translated.innerHTML = 'Note\u00a0: fermez cette fenêtre';
		const colon = rules.find((rule) => rule.id === 'colon');

		checkTranslation({ projectName: '' }, translated, 'untranslated', 'current');

		expect(colon.counter).toBe(0);
	});

	it('signale une espace normale devant les deux points', () => {
		const translated = document.querySelector('#preview-1-1 .translation-text');
		translated.innerHTML = 'Note : fermez cette fenêtre';
		const colon = rules.find((rule) => rule.id === 'colon');

		checkTranslation({ projectName: '' }, translated, 'untranslated', 'current');

		expect(colon.counter).toBe(1);
	});

	it('ignore un mot déconseillé qui fait partie du nom du projet en cours (issue #38)', () => {
		const translated = document.querySelector('#preview-1-1 .translation-text');
		const badWords = rules.find((rule) => rule.id === 'badWords');
		translated.innerHTML = 'Plugin';
		checkTranslation({ projectName: 'Plugin' }, translated, 'untranslated', 'current');
		expect(badWords.counter).toBe(0);
	});

	// Issue #95 : un projet nommé "GeoDirectory - Plugin" contient "Plugin" dans son propre nom, mais ça
	// ne doit exempter "plugin" que quand le nom du projet est cité tel quel, pas dans une phrase normale.
	it('signale toujours un mot déconseillé utilisé normalement, même si le nom du projet le contient aussi', () => {
		const translated = document.querySelector('#preview-1-1 .translation-text');
		const badWords = rules.find((rule) => rule.id === 'badWords');
		translated.innerHTML = 'lorsque le plugin est supprimé';
		checkTranslation({ projectName: 'GeoDirectory - Plugin' }, translated, 'untranslated', 'current');
		expect(badWords.counter).toBe(1);
	});

	// Le groupe capturant de rgxPeriod décale les arguments transmis par replace() (régression de la 3.1.0).
	it('détecte trois points ASCII sans lever d\'exception', () => {
		const translated = document.querySelector('#preview-1-1 .translation-text');
		translated.innerHTML = 'Chargement...';
		const asciiEllipsis = rules.find((rule) => rule.id === 'asciiEllipsis');
		const ellipsis = rules.find((rule) => rule.id === 'ellipsis');

		expect(() => checkTranslation({ projectName: '' }, translated, 'untranslated', 'current')).not.toThrow();

		expect(asciiEllipsis.counter).toBe(1);
		expect(ellipsis.counter).toBe(0);
		expect(document.querySelector('#preview-1-1 .translation-text').textContent).toBe('Chargement...');
	});

	// Issue #29 : l'infobulle doit désigner le caractère à utiliser, et non un problème d'espacement.
	it('affiche pour trois points ASCII un message qui désigne le caractère points de suspension', () => {
		const translated = document.querySelector('#preview-1-1 .translation-text');
		translated.innerHTML = 'Chargement...';

		checkTranslation({ projectName: '' }, translated, 'untranslated', 'current');

		const warning = document.querySelector('#preview-1-1 .sp-warning--char');
		expect(warning.getAttribute('data-message')).toContain('Trois points au lieu du caractère points de suspension (…)');
		expect(warning.getAttribute('data-message')).not.toContain('Précédé par une espace');
	});

	it('détecte un point suivi d\'une espace finale sans lever d\'exception', () => {
		const translated = document.querySelector('#preview-1-1 .translation-text');
		translated.innerHTML = 'Fin de phrase. ';
		const period = rules.find((rule) => rule.id === 'period');

		expect(() => checkTranslation({ projectName: '' }, translated, 'untranslated', 'current')).not.toThrow();

		expect(period.counter).toBe(1);
	});
});
