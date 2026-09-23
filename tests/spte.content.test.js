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
	applyStrictNarrowSpace,
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

	it('ignore une ancienne traduction déjà rejetée (sauf si on vient tout juste de la rejeter)', () => {
		const translated = document.querySelector('#preview-2-2 .translation-text');
		document.querySelector('#preview-2-2').classList.add('status-rejected');
		translated.innerHTML = 'Un mot "cité"';
		const doubleQuotes = rules.find((rule) => rule.id === 'doubleQuotes');

		checkTranslation({ projectName: '' }, translated, 'rejected', 'current');

		expect(doubleQuotes.counter).toBe(0);
		expect(translated.innerHTML).toBe('Un mot "cité"');
	});

	it('ignore un mot déconseillé qui fait partie du nom du projet en cours (issue #38)', () => {
		const translated = document.querySelector('#preview-1-1 .translation-text');
		const badWords = rules.find((rule) => rule.id === 'badWords');
		translated.innerHTML = 'Plugin';
		checkTranslation({ projectName: 'Plugin' }, translated, 'untranslated', 'current');
		expect(badWords.counter).toBe(0);
	});
});
