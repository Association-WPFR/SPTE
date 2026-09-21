import { createDefaultSettings } from '../../utils/settings';

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
	const existingSettings = /** @type {SpteSettings | undefined} */ (data.spteSettings);
	/** @type {SpteSettings} */
	let settings;
	if (existingSettings) {
		settings = existingSettings;
	} else {
		settings = createDefaultSettings();
	}
	settings.spteColorWord = colorWord.value;
	settings.spteColorQuote = colorQuote.value;
	settings.spteColorChar = colorChar.value;
	settings.spteBlackToolTip = blackToolTip.checked ? 'true' : 'false';
	settings.spteBetterReadability = betterReadability.checked ? 'true' : 'false';
	settings.spteFrenchFlag = frenchFlag.checked ? 'true' : 'false';
	settings.spteEnlargeTable = enlargeTable.checked ? 'true' : 'false';
	settings.spteGpcontentBig = gpcontentBig.checked ? 'true' : 'false';
	settings.spteActiveGlossary = gpActiveGlossary.checked ? 'true' : 'false';
	settings.spteStrictNarrowSpace = strictNarrowSpace.checked ? 'true' : 'false';

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

	if (settings.spteColorWord) {
		colorWord.value = settings.spteColorWord;
	}

	if (settings.spteColorQuote) {
		colorQuote.value = settings.spteColorQuote;
	}

	if (settings.spteColorChar) {
		colorChar.value = settings.spteColorChar;
	}

	if (settings.spteBlackToolTip) {
		blackToolTip.checked = (settings.spteBlackToolTip === 'false') ? false : true;
	}

	if (settings.spteBetterReadability) {
		betterReadability.checked = (settings.spteBetterReadability === 'false') ? false : true;
	}

	if (settings.spteFrenchFlag) {
		frenchFlag.checked = (settings.spteFrenchFlag === 'false') ? false : true;
	} else {
		frenchFlag.checked = true;
		try {
			await browser.storage.local.set({ spteSettings: initSettings });
		} catch {
			console.log('Impossible d’enregistrer les paramètres');
		}
	}

	if (settings.spteEnlargeTable) {
		enlargeTable.checked = (settings.spteEnlargeTable === 'false') ? false : true;
	} else {
		enlargeTable.checked = true;
	}

	if (settings.spteGpcontentBig) {
		gpcontentBig.checked = (settings.spteGpcontentBig === 'false') ? false : true;
	} else {
		gpcontentBig.checked = false;
	}

	if (settings.spteActiveGlossary) {
		gpActiveGlossary.checked = (settings.spteActiveGlossary === 'false') ? false : true;
	}

	strictNarrowSpace.checked = settings.spteStrictNarrowSpace === 'true';
}

document.addEventListener('DOMContentLoaded', restoreSettings);

Object.values(getFormFields()).forEach((field) => {
	field?.addEventListener('change', saveSettings);
});

document.getElementById('reset-color').addEventListener('click', () => {
	document.querySelectorAll('#settings-color__word, #settings-color__quote').forEach((element) => {
		/** @type {HTMLInputElement} */ (element).value = '#ff0000';
	});
	/** @type {HTMLInputElement} */ (document.querySelector('#settings-color__char')).value = '#ff00ff';
	saveSettings();
});

settingsForm.addEventListener('submit', (e) => {
	e.preventDefault();
});
