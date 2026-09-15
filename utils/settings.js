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
		spteBlackToolTip: 'checked',
		spteBetterReadability: '',
		spteFrenchFlag: 'checked',
		spteEnlargeTable: 'checked',
		spteGpcontentBig: '',
		spteActiveGlossary: 'checked',
		spteLastUpdateGlossary: '',
		spteGlossary: '',
		...overrides,
	};
}
