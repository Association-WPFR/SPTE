/**
 * @typedef {Object} SpteSettings
 * @property {string} spteColorWord
 * @property {string} spteColorQuote
 * @property {string} spteColorChar
 * @property {string} spteBlackToolTip
 * @property {string} spteBetterReadability
 * @property {string} spteFrenchFlag
 * @property {string} spteEnlargeTable
 * @property {string} spteGpcontentBig
 * @property {string} spteActiveGlossary
 * @property {string} spteLastUpdateGlossary
 * @property {string[] | string} spteGlossary
 * @property {string} spteStrictNarrowSpace
 */

/**
 * @param {Partial<SpteSettings>} [overrides]
 * @returns {SpteSettings}
 */
export function createDefaultSettings(overrides = {}) {
	return {
		spteColorWord: '',
		spteColorQuote: '',
		spteColorChar: '',
		spteBlackToolTip: 'true',
		spteBetterReadability: '',
		spteFrenchFlag: 'true',
		spteEnlargeTable: 'true',
		spteGpcontentBig: '',
		spteActiveGlossary: 'true',
		spteLastUpdateGlossary: '',
		spteGlossary: '',
		spteStrictNarrowSpace: '',
		...overrides,
	};
}

/**
 * @typedef {Object} SettingsFormValues
 * @property {string} [colorWord]
 * @property {string} [colorQuote]
 * @property {string} [colorChar]
 * @property {boolean} [blackToolTip]
 * @property {boolean} [betterReadability]
 * @property {boolean} frenchFlag
 * @property {boolean} enlargeTable
 * @property {boolean} gpcontentBig
 * @property {boolean} [gpActiveGlossary]
 * @property {boolean} strictNarrowSpace
 */

/**
 * Traduit les réglages stockés en valeurs de champs de formulaire. Une clé absente du résultat
 * signifie « ne pas toucher au champ » (le popup/main.js garde alors la valeur déjà dans le DOM).
 * @param {SpteSettings} settings
 * @returns {{ values: SettingsFormValues, needsFrenchFlagMigration: boolean }}
 */
export function settingsToFormValues(settings) {
	/** @type {SettingsFormValues} */
	const values = {
		frenchFlag: true,
		enlargeTable: true,
		gpcontentBig: false,
		strictNarrowSpace: settings.spteStrictNarrowSpace === 'true',
	};

	if (settings.spteColorWord) { values.colorWord = settings.spteColorWord; }
	if (settings.spteColorQuote) { values.colorQuote = settings.spteColorQuote; }
	if (settings.spteColorChar) { values.colorChar = settings.spteColorChar; }
	if (settings.spteBlackToolTip) { values.blackToolTip = settings.spteBlackToolTip !== 'false'; }
	if (settings.spteBetterReadability) { values.betterReadability = settings.spteBetterReadability !== 'false'; }
	if (settings.spteActiveGlossary) { values.gpActiveGlossary = settings.spteActiveGlossary !== 'false'; }

	let needsFrenchFlagMigration = false;
	if (settings.spteFrenchFlag) {
		values.frenchFlag = settings.spteFrenchFlag !== 'false';
	} else {
		needsFrenchFlagMigration = true;
	}

	if (settings.spteEnlargeTable) {
		values.enlargeTable = settings.spteEnlargeTable !== 'false';
	}

	if (settings.spteGpcontentBig) {
		values.gpcontentBig = settings.spteGpcontentBig !== 'false';
	}

	return { values, needsFrenchFlagMigration };
}

/**
 * Traduit les valeurs de champs de formulaire en réglages à stocker, en partant des réglages
 * existants (ou des défauts) pour ne pas perdre les clés que le formulaire ne couvre pas
 * (spteLastUpdateGlossary, spteGlossary).
 * @param {SpteSettings} baseSettings
 * @param {Required<Omit<SettingsFormValues, 'colorWord' | 'colorQuote' | 'colorChar'>> & Pick<SettingsFormValues, 'colorWord' | 'colorQuote' | 'colorChar'>} formValues
 * @returns {SpteSettings}
 */
export function formValuesToSettings(baseSettings, formValues) {
	return {
		...baseSettings,
		spteColorWord: formValues.colorWord ?? baseSettings.spteColorWord,
		spteColorQuote: formValues.colorQuote ?? baseSettings.spteColorQuote,
		spteColorChar: formValues.colorChar ?? baseSettings.spteColorChar,
		spteBlackToolTip: formValues.blackToolTip ? 'true' : 'false',
		spteBetterReadability: formValues.betterReadability ? 'true' : 'false',
		spteFrenchFlag: formValues.frenchFlag ? 'true' : 'false',
		spteEnlargeTable: formValues.enlargeTable ? 'true' : 'false',
		spteGpcontentBig: formValues.gpcontentBig ? 'true' : 'false',
		spteActiveGlossary: formValues.gpActiveGlossary ? 'true' : 'false',
		spteStrictNarrowSpace: formValues.strictNarrowSpace ? 'true' : 'false',
	};
}
