/** @typedef {import('./rules').TypographyRule} TypographyRule */

// Construit le HTML du <span> de surlignage pour un mot/caractère détecté par une règle.
/**
 * @param {TypographyRule} rule
 * @param {string} matchedString
 * @returns {string}
 */
export function buildWarningSpanHTML(rule, matchedString) {
	const ariaName = (rule.id === 'badWords') ? `${matchedString}. ` : `${rule.name}. `;
	// ariaName se termine déjà par une espace : ne pas en ajouter une seconde ici (double
	// espace = balisage HTML cassé une fois inséré dans la page).
	const ariaLabel = (rule.id === 'Space' || rule.id === 'nbkSpaces') ? `${rule.message}` : `${ariaName}${rule.message}`;
	const tooltip = (rule.id === 'Space' || rule.id === 'nbkSpaces') ? `${rule.message}` : `&#171; ${matchedString} &#187;&#10; ${rule.message}`;
	return `<span tabindex="0" aria-label="${ariaLabel}" data-message="${tooltip}" class="${rule.cssClass}">${matchedString}</span>`;
}
