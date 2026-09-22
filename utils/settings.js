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
