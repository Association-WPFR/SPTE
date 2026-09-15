import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, beforeEach } from 'vitest';
import {
	addForeignToolTip,
	addEditorHighlighter,
	hideNonWarningRows,
	showAllRows,
	moveFrenchRowToFirst,
	moveFrenchLocaleCardToFirst,
	setRowCheckboxSafely,
	setErrorRowsSelection,
} from './dom';

// Fixtures réelles, cf. utils/fixtures/*.html pour leur provenance.
const translationsTableHTML = readFileSync(join(__dirname, 'fixtures/translations-table.html'), 'utf-8');
const statsTableHTML = readFileSync(join(__dirname, 'fixtures/stats-table.html'), 'utf-8');
const localesListHTML = readFileSync(join(__dirname, 'fixtures/locales-list.html'), 'utf-8');

describe('addForeignToolTip', () => {
	beforeEach(() => {
		document.body.innerHTML = translationsTableHTML;
	});

	it('ajoute la tooltip sur une ligne normale (td.actions présent)', () => {
		const translated = document.querySelector('#preview-1-1 .translation-text');
		addForeignToolTip(translated);
		const hook = document.querySelector('#preview-1-1 td.actions');
		expect(hook.querySelector('.sp-foreign-tooltip')).not.toBeNull();
	});

	it('ne plante pas sur la ligne d’historique (pas de td.actions) — bug confirmé le 2026-09-14', () => {
		const historyRow = document.querySelector('#preview-3-3');
		// La ligne d'historique n'a pas de .translation-text ; on simule l'appel tel qu'il
		// arriverait réellement (translation = un élément quelconque de cette ligne).
		expect(() => addForeignToolTip(historyRow)).not.toThrow();
	});
});

describe('addEditorHighlighter', () => {
	beforeEach(() => {
		document.body.innerHTML = translationsTableHTML;
	});

	it('clone la traduction dans le panneau d’édition suivant', () => {
		const translated = document.querySelector('#preview-1-1 .translation-text');
		addEditorHighlighter(translated);
		const sourceDetails = document.querySelector('#editor-1-1 .source-details');
		expect(sourceDetails.querySelector('.sp-editor-highlighter')).not.toBeNull();
		expect(sourceDetails.querySelector('.sp-editor-highlighter')?.textContent).toBe('Fichier');
	});

	it('ne plante pas sur la toute dernière ligne du tableau (pas de ligne suivante) — bug confirmé le 2026-09-14', () => {
		// La ligne 4-4 (dernière du tbody) est immédiatement suivie de rien : on la place
		// artificiellement en dernière position pour isoler le cas.
		const lastRow = document.querySelector('#preview-4-4');
		lastRow.parentElement.appendChild(lastRow);
		const translated = lastRow.querySelector('.original-text'); // pas de .translation-text ici, peu importe pour ce test
		expect(() => addEditorHighlighter(translated)).not.toThrow();
	});
});

describe('hideNonWarningRows / showAllRows', () => {
	beforeEach(() => {
		document.body.innerHTML = translationsTableHTML;
	});

	it('masque toutes les lignes sans avertissement, y compris la ligne d’historique sans case à cocher — bug confirmé le 2026-09-14', () => {
		const rows = document.querySelectorAll('tr.preview:not(.sp-has-spte-warning)');
		expect(rows.length).toBeGreaterThan(1);
		expect(() => hideNonWarningRows(rows, true)).not.toThrow();
		rows.forEach((row) => {
			expect(/** @type {HTMLElement} */ (row).style.display).toBe('none');
		});
	});

	it('décoche la case des lignes qui en ont une, ignore silencieusement celles qui n’en ont pas', () => {
		const checkbox = /** @type {HTMLInputElement} */ (document.querySelector('#preview-1-1 input[type=checkbox]'));
		checkbox.checked = true;
		const rows = document.querySelectorAll('tr.preview:not(.sp-has-spte-warning)');
		hideNonWarningRows(rows, true);
		expect(checkbox.checked).toBe(false);
	});

	it('réaffiche toutes les lignes avec "Tout"', () => {
		const rows = document.querySelectorAll('tr.preview:not(.sp-has-spte-warning)');
		hideNonWarningRows(rows, false);
		showAllRows(rows);
		rows.forEach((row) => {
			expect(/** @type {HTMLElement} */ (row).style.display).toBe('table-row');
		});
	});
});

describe('setRowCheckboxSafely', () => {
	beforeEach(() => {
		document.body.innerHTML = translationsTableHTML;
	});

	it('coche/décoche la case quand elle existe', () => {
		const row = document.querySelector('#preview-1-1');
		expect(setRowCheckboxSafely(row, true)).toBe(true);
		expect(/** @type {HTMLInputElement} */ (row.querySelector('input[type=checkbox]')).checked).toBe(true);
		expect(setRowCheckboxSafely(row, false)).toBe(true);
		expect(/** @type {HTMLInputElement} */ (row.querySelector('input[type=checkbox]')).checked).toBe(false);
	});

	it('ne plante pas sur la ligne d’historique sans case à cocher — bug confirmé le 2026-09-14', () => {
		const historyRow = document.querySelector('#preview-3-3');
		expect(() => setRowCheckboxSafely(historyRow, true)).not.toThrow();
		expect(setRowCheckboxSafely(historyRow, true)).toBe(false);
	});
});

describe('setErrorRowsSelection', () => {
	beforeEach(() => {
		document.body.innerHTML = translationsTableHTML;
	});

	it('coche toutes les lignes en erreur "certain" et retourne le compte', () => {
		const errorRows = document.querySelectorAll('tr.preview.sp-has-spte-error');
		expect(errorRows.length).toBeGreaterThan(0);
		const count = setErrorRowsSelection(errorRows, true);
		expect(count).toBe(errorRows.length);
		errorRows.forEach((row) => {
			expect(/** @type {HTMLInputElement} */ (row.querySelector('input[type=checkbox]')).checked).toBe(true);
		});
	});

	it('décoche toutes les lignes en erreur et retourne 0', () => {
		const errorRows = document.querySelectorAll('tr.preview.sp-has-spte-error');
		setErrorRowsSelection(errorRows, true);
		const count = setErrorRowsSelection(errorRows, false);
		expect(count).toBe(0);
		errorRows.forEach((row) => {
			expect(/** @type {HTMLInputElement} */ (row.querySelector('input[type=checkbox]')).checked).toBe(false);
		});
	});
});

describe('moveFrenchRowToFirst', () => {
	beforeEach(() => {
		document.body.innerHTML = statsTableHTML;
	});

	it('remonte la ligne française en première position (structure #stats-table actuelle)', () => {
		const frenchLink = document.querySelector('a[href*="/locale/fr/"]');
		const tbody = document.querySelector('#stats-table tbody');
		expect(tbody.querySelector('tr:first-child th')?.getAttribute('title')).toBe('af');

		const moved = moveFrenchRowToFirst(frenchLink, false);

		expect(moved).toBe(true);
		expect(tbody.querySelector('tr:first-child th')?.getAttribute('title')).toBe('fr_FR');
	});

	it('ne fait rien si GlotDict est présent (évite le conflit avec son propre réordonnancement)', () => {
		const frenchLink = document.querySelector('a[href*="/locale/fr/"]');
		const tbody = document.querySelector('#stats-table tbody');

		const moved = moveFrenchRowToFirst(frenchLink, true);

		expect(moved).toBe(false);
		expect(tbody.querySelector('tr:first-child th')?.getAttribute('title')).toBe('af');
	});

	it('ne plante pas si le lien français est absent (sélecteur mort, ex: #locales disparu)', () => {
		expect(() => moveFrenchRowToFirst(null, false)).not.toThrow();
		expect(moveFrenchRowToFirst(null, false)).toBe(false);
	});
});

describe('moveFrenchLocaleCardToFirst', () => {
	beforeEach(() => {
		document.body.innerHTML = localesListHTML;
	});

	it('remonte la carte française en première position (annuaire #locales de la page d’accueil)', () => {
		const frenchLink = document.querySelector('a[href="/locale/fr/"]');
		const localesList = document.querySelector('#locales');
		expect(localesList.firstElementChild.querySelector('.code a')?.textContent).toBe('af');

		const moved = moveFrenchLocaleCardToFirst(frenchLink, false);

		expect(moved).toBe(true);
		expect(localesList.firstElementChild.querySelector('.code a')?.textContent).toBe('fr_FR');
	});

	it('ne fait rien si GlotDict est présent (évite le conflit avec son propre réordonnancement)', () => {
		const frenchLink = document.querySelector('a[href="/locale/fr/"]');
		const localesList = document.querySelector('#locales');

		const moved = moveFrenchLocaleCardToFirst(frenchLink, true);

		expect(moved).toBe(false);
		expect(localesList.firstElementChild.querySelector('.code a')?.textContent).toBe('af');
	});

	it('ne plante pas si le lien français est absent (sélecteur mort)', () => {
		expect(() => moveFrenchLocaleCardToFirst(null, false)).not.toThrow();
		expect(moveFrenchLocaleCardToFirst(null, false)).toBe(false);
	});
});
