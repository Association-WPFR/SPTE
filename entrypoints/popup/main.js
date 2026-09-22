import { createDefaultSettings, formValuesToSettings, settingsToFormValues } from '../../utils/settings';

/** @typedef {import('../../utils/settings').SpteSettings} SpteSettings */

const settingsForm = document.querySelector('#settings-form');

/** @returns {Record<string, HTMLInputElement | null>} */
function getFormFields() {
	return {
		colorWord: /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-color__word')),
		colorQuote: /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-color__quote')),
		colorChar: /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-color__char')),
		blackToolTip: /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-blacktooltip')),
		betterReadability: /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-betterreadability')),
		frenchFlag: /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-frenchflag')),
		enlargeTable: /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-enlarge-table')),
		gpcontentBig: /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-gpcontent-big')),
		gpActiveGlossary: /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-importglossary')),
		strictNarrowSpace: /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-strictnarrowspace')),
	};
}

/** @param {Record<string, HTMLInputElement | null>} fields */
function hasAllFields(fields) {
	return Object.values(fields).every(Boolean);
}

async function saveSettings() {
	const fields = getFormFields();
	if (!hasAllFields(fields)) { return; }
	const { colorWord, colorQuote, colorChar, blackToolTip, betterReadability, frenchFlag, enlargeTable, gpcontentBig, gpActiveGlossary, strictNarrowSpace } = fields;

	const data = await browser.storage.local.get('spteSettings');
	const existingSettings = /** @type {SpteSettings | undefined} */ (data.spteSettings) ?? createDefaultSettings();
	const settings = formValuesToSettings(existingSettings, {
		colorWord: colorWord.value,
		colorQuote: colorQuote.value,
		colorChar: colorChar.value,
		blackToolTip: blackToolTip.checked,
		betterReadability: betterReadability.checked,
		frenchFlag: frenchFlag.checked,
		enlargeTable: enlargeTable.checked,
		gpcontentBig: gpcontentBig.checked,
		gpActiveGlossary: gpActiveGlossary.checked,
		strictNarrowSpace: strictNarrowSpace.checked,
	});

	try {
		await browser.storage.local.set({ spteSettings: settings });
	} catch {
		console.log('Impossible d’enregistrer les paramètres');
	}
	browser.tabs.reload({ bypassCache: true });
}

async function restoreSettings() {
	const data = await browser.storage.local.get('spteSettings');
	const settings = /** @type {SpteSettings | undefined} */ (data.spteSettings);
	const fields = getFormFields();
	const { colorWord, colorQuote, colorChar, blackToolTip, betterReadability, frenchFlag, enlargeTable, gpcontentBig, gpActiveGlossary, strictNarrowSpace } = fields;
	// Réglages "table rase" utilisés pour la migration ci-dessous : recrée les défauts plutôt que
	// de fusionner avec l'existant (comportement identique à avant l'extraction dans utils/settings.js).
	const initSettings = createDefaultSettings();
	if (settings === undefined) {
		if (blackToolTip) { blackToolTip.checked = true; }
		if (frenchFlag) { frenchFlag.checked = true; }
		if (enlargeTable) { enlargeTable.checked = true; }
		if (gpActiveGlossary) { gpActiveGlossary.checked = true; }
		try {
			await browser.storage.local.set({ spteSettings: initSettings });
		} catch {
			console.log('Impossible d’initialiser les paramètres');
		}
	}
	if (!settings || !hasAllFields(fields)) { return; }

	const { values, needsFrenchFlagMigration } = settingsToFormValues(settings);
	if (values.colorWord !== undefined) { colorWord.value = values.colorWord; }
	if (values.colorQuote !== undefined) { colorQuote.value = values.colorQuote; }
	if (values.colorChar !== undefined) { colorChar.value = values.colorChar; }
	if (values.blackToolTip !== undefined) { blackToolTip.checked = values.blackToolTip; }
	if (values.betterReadability !== undefined) { betterReadability.checked = values.betterReadability; }
	if (values.gpActiveGlossary !== undefined) { gpActiveGlossary.checked = values.gpActiveGlossary; }
	frenchFlag.checked = values.frenchFlag;
	enlargeTable.checked = values.enlargeTable;
	gpcontentBig.checked = values.gpcontentBig;
	strictNarrowSpace.checked = values.strictNarrowSpace;

	if (needsFrenchFlagMigration) {
		try {
			await browser.storage.local.set({ spteSettings: initSettings });
		} catch {
			console.log('Impossible d’enregistrer les paramètres');
		}
	}
}

document.addEventListener('DOMContentLoaded', restoreSettings);

Object.values(getFormFields()).forEach((field) => {
	field?.addEventListener('change', saveSettings);
});

document.getElementById('reset-color')?.addEventListener('click', () => {
	document.querySelectorAll('#settings-color__word, #settings-color__quote').forEach((element) => {
		/** @type {HTMLInputElement} */ (element).value = '#ff0000';
	});
	/** @type {HTMLInputElement} */ (document.querySelector('#settings-color__char')).value = '#ff00ff';
	saveSettings();
});

settingsForm.addEventListener('submit', (e) => {
	e.preventDefault();
});
