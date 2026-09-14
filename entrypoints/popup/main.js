/**
 * @typedef {Object} SpteSettings
 * @property {string} spteColorWord
 * @property {string} spteColorQuote
 * @property {string} spteColorChar
 * @property {string} spteBlackToolTip
 * @property {string} spteBetterReadability
 * @property {string} spteOtherSlugs
 * @property {string} spteFrenchFlag
 * @property {string} spteGpcontentBig
 * @property {string} spteGpcontentMaxWitdh
 * @property {string} spteActiveGlossary
 * @property {string} [spteLastUpdateGlossary]
 * @property {string[] | string} [spteGlossary]
 */

const settingsForm = document.querySelector('#settings-form');
const isFirefox = import.meta.env.FIREFOX;

if (isFirefox) {
	document.querySelectorAll('#settings-color__word, #settings-color__quote, #settings-color__char').forEach((element) => {
		const input = /** @type {HTMLInputElement} */ (element);
		input.type = 'text';
		input.style.width = '55px';
		input.style.margin = '0 10px';
		input.closest('label').style.width = '33%';
		input.closest('label').style.margin = '0 0 8px 0';
	});
}

async function saveSettings() {
	const colorWord = /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-color__word'));
	const colorQuote = /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-color__quote'));
	const colorChar = /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-color__char'));
	const blackToolTip = /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-blacktooltip'));
	const betterReadability = /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-betterreadability'));
	const locales = /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-locales'));
	const frenchFlag = /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-frenchflag'));
	const gpcontentBig = /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-gpcontent-big'));
	const gpcontentMaxWitdh = /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-gpcontent-maxwidth'));
	const gpActiveGlossary = /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-importglossary'));
	if (!locales) { return; }

	const data = await browser.storage.local.get('spteSettings');
	const existingSettings = /** @type {SpteSettings | undefined} */ (data.spteSettings);
	/** @type {SpteSettings} */
	let settings;
	if (existingSettings) {
		settings = existingSettings;
	} else {
		settings = {
			spteColorWord: '',
			spteColorQuote: '',
			spteColorChar: '',
			spteBlackToolTip: 'checked',
			spteBetterReadability: '',
			spteOtherSlugs: '',
			spteFrenchFlag: 'checked',
			spteGpcontentBig: '',
			spteGpcontentMaxWitdh: '',
			spteActiveGlossary: 'checked',
			spteLastUpdateGlossary: '',
			spteGlossary: '',
		};
	}
	settings.spteColorWord = colorWord.value;
	settings.spteColorQuote = colorQuote.value;
	settings.spteColorChar = colorChar.value;
	settings.spteBlackToolTip = blackToolTip.checked ? 'true' : 'false';
	settings.spteBetterReadability = betterReadability.checked ? 'true' : 'false';
	settings.spteOtherSlugs = locales.value;
	settings.spteFrenchFlag = frenchFlag.checked ? 'true' : 'false';
	settings.spteGpcontentBig = gpcontentBig.checked ? 'true' : 'false';
	settings.spteGpcontentMaxWitdh = gpcontentMaxWitdh.value;
	settings.spteActiveGlossary = gpActiveGlossary.checked ? 'true' : 'false';

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
	const colorWord = /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-color__word'));
	const colorQuote = /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-color__quote'));
	const colorChar = /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-color__char'));
	const blackToolTip = /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-blacktooltip'));
	const betterReadability = /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-betterreadability'));
	const locales = /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-locales'));
	const frenchFlag = /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-frenchflag'));
	const gpcontentBig = /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-gpcontent-big'));
	const gpcontentMaxWitdh = /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-gpcontent-maxwidth'));
	const gpActiveGlossary = /** @type {HTMLInputElement | null} */ (document.querySelector('#settings-importglossary'));
	const initSettings = { spteBlackToolTip: 'true', spteFrenchFlag: 'true' };
	if (settings === undefined) {
		if (blackToolTip) { blackToolTip.checked = true; }
		if (frenchFlag) { frenchFlag.checked = true; }
		if (gpActiveGlossary) { gpActiveGlossary.checked = true; }
		try {
			await browser.storage.local.set({ spteSettings: initSettings });
		} catch {
			console.log('Impossible d’initialiser les paramètres');
		}
	}
	if (!settings || !colorWord || !colorQuote || !colorChar || !blackToolTip || !betterReadability || !locales || !frenchFlag || !gpcontentBig || !gpcontentMaxWitdh || !gpActiveGlossary) { return; }

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

	if (settings.spteOtherSlugs) {
		locales.value = settings.spteOtherSlugs;
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

	if (settings.spteGpcontentBig) {
		gpcontentBig.checked = (settings.spteGpcontentBig === 'false') ? false : true;
	} else {
		gpcontentBig.checked = false;
	}

	if (settings.spteGpcontentMaxWitdh) {
		gpcontentMaxWitdh.value = settings.spteGpcontentMaxWitdh;
	}

	if (settings.spteActiveGlossary) {
		gpActiveGlossary.checked = (settings.spteActiveGlossary === 'false') ? false : true;
	}
}

document.addEventListener('DOMContentLoaded', restoreSettings);

document.getElementById('reset-color').addEventListener('click', () => {
	document.querySelectorAll('#settings-color__word, #settings-color__quote').forEach((element) => {
		/** @type {HTMLInputElement} */ (element).value = '#ff0000';
	});
	/** @type {HTMLInputElement} */ (document.querySelector('#settings-color__char')).value = '#ff00ff';
});

settingsForm.addEventListener('submit', (e) => {
	e.preventDefault();
	saveSettings();
});
