// @ts-nocheck
// Conversion mécanique depuis pageAction/script.js (comportement inchangé). Le vrai typage
// de ce fichier est prévu en Phase 3, pas dans cette conversion WXT.

const settingsForm = document.querySelector('#settings-form');
const isFirefox = !chrome.app;

if (isFirefox) {
	document.querySelectorAll('#settings-color__word, #settings-color__quote, #settings-color__char').forEach((element) => {
		element.type = 'text';
		element.style.width = '55px';
		element.style.margin = '0 10px';
		element.closest('label').style.width = '33%';
		element.closest('label').style.margin = '0 0 8px 0';
	});
}

function saveSettings() {
	const colorWord = document.querySelector('#settings-color__word');
	const colorQuote = document.querySelector('#settings-color__quote');
	const colorChar = document.querySelector('#settings-color__char');
	const blackToolTip = document.querySelector('#settings-blacktooltip');
	const betterReadability = document.querySelector('#settings-betterreadability');
	const locales = document.querySelector('#settings-locales');
	const frenchFlag = document.querySelector('#settings-frenchflag');
	const gpcontentBig = document.querySelector('#settings-gpcontent-big');
	const gpcontentMaxWitdh = document.querySelector('#settings-gpcontent-maxwidth');
	const gpActiveGlossary = document.querySelector('#settings-importglossary');
	browser.storage.local.get('spteSettings', (data) => {
		if (browser.runtime.error || !locales) {	return;	}
		let settings = {};
		if (data.spteSettings) {
			settings = data.spteSettings;
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

		browser.storage.local.set({ spteSettings: settings }, () => {
			if (browser.runtime.error) {	console.log('Impossible d’enregistrer les paramètres'); }
			browser.tabs.reload({ bypassCache: true });
		});
	});
}

function restoreSettings() {
	browser.storage.local.get('spteSettings', (data) => {
		if (browser.runtime.error) {	return;	}
		const colorWord = document.querySelector('#settings-color__word');
		const colorQuote = document.querySelector('#settings-color__quote');
		const colorChar = document.querySelector('#settings-color__char');
		const blackToolTip = document.querySelector('#settings-blacktooltip');
		const betterReadability = document.querySelector('#settings-betterreadability');
		const locales = document.querySelector('#settings-locales');
		const frenchFlag = document.querySelector('#settings-frenchflag');
		const gpcontentBig = document.querySelector('#settings-gpcontent-big');
		const gpcontentMaxWitdh = document.querySelector('#settings-gpcontent-maxwidth');
		const gpActiveGlossary = document.querySelector('#settings-importglossary');
		const initSettings = { spteBlackToolTip: 'true', spteFrenchFlag: 'true' };
		if (data.spteSettings === undefined) {
			blackToolTip.checked = 'checked';
			frenchFlag.checked = 'checked';
			gpActiveGlossary.checked = 'checked';
			browser.storage.local.set({ spteSettings: initSettings }, () => {
				if (browser.runtime.error) {	console.log('Impossible d’initialiser les paramètres'); }
			});
		}
		if (!data.spteSettings || !colorWord || !colorQuote || !colorChar || !blackToolTip || !betterReadability || !locales || !frenchFlag || !gpcontentBig || !gpcontentMaxWitdh || !gpcontentMaxWitdh) { return; }

		if (data.spteSettings.spteColorWord) {
			colorWord.value = data.spteSettings.spteColorWord;
		}

		if (data.spteSettings.spteColorQuote) {
			colorQuote.value = data.spteSettings.spteColorQuote;
		}

		if (data.spteSettings.spteColorChar) {
			colorChar.value = data.spteSettings.spteColorChar;
		}

		if (data.spteSettings.spteBlackToolTip) {
			blackToolTip.checked = (data.spteSettings.spteBlackToolTip === 'false') ? '' : 'checked';
		}

		if (data.spteSettings.spteBetterReadability) {
			betterReadability.checked = (data.spteSettings.spteBetterReadability === 'false') ? '' : 'checked';
		}

		if (data.spteSettings.spteOtherSlugs) {
			locales.value = data.spteSettings.spteOtherSlugs;
		}

		if (data.spteSettings.spteFrenchFlag) {
			frenchFlag.checked = (data.spteSettings.spteFrenchFlag === 'false') ? '' : 'checked';
		} else {
			frenchFlag.checked = 'checked';
			browser.storage.local.set({ spteSettings: initSettings }, () => {
				if (browser.runtime.error) {	console.log('Impossible d’enregistrer les paramètres'); }
			});
		}

		if (data.spteSettings.spteGpcontentBig) {
			gpcontentBig.checked = (data.spteSettings.spteGpcontentBig === 'false') ? '' : 'checked';
		} else {
			gpcontentBig.checked = '';
		}

		if (data.spteSettings.spteGpcontentMaxWitdh) {
			gpcontentMaxWitdh.value = data.spteSettings.spteGpcontentMaxWitdh;
		}

		if (data.spteSettings.spteActiveGlossary) {
			gpActiveGlossary.checked = (data.spteSettings.spteActiveGlossary === 'false') ? '' : 'checked';
		}
	});
}

document.addEventListener('DOMContentLoaded', restoreSettings);

document.getElementById('reset-color').addEventListener('click', (e) => {
	document.querySelectorAll('#settings-color__word, #settings-color__quote').forEach((element) => {
		element.value = '#ff0000';
	});
	document.querySelector('#settings-color__char').value = '#ff00ff';
});

settingsForm.addEventListener('submit', (e) => {
	e.preventDefault();
	saveSettings();
});
