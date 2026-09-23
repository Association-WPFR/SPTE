/** @typedef {import('./rules').TypographyRule} TypographyRule */

/**
 * Échappe les caractères qui casseraient un attribut HTML entre guillemets doubles. N'échapper
 * que le texte réellement extrait de la traduction (matchedString) : le reste (rule.message,
 * rule.name, les entités &#171;/&#187;/&#10;) est du texte de configuration fixe, déjà valide.
 * @param {string} value
 * @returns {string}
 */
function escapeHtmlAttribute(value) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

/**
 * @param {TypographyRule} rule
 * @param {string} matchedString
 * @returns {string}
 */
export function buildWarningSpanHTML(rule, matchedString) {
	const safeMatchedString = escapeHtmlAttribute(matchedString);
	const ariaName = (rule.id === 'badWords') ? `${safeMatchedString}. ` : `${rule.name}. `;
	// ariaName se termine déjà par une espace : ne pas en ajouter une seconde ici (double
	// espace = balisage HTML cassé une fois inséré dans la page).
	const ariaLabel = (rule.id === 'Space' || rule.id === 'nbkSpaces') ? `${rule.message}` : `${ariaName}${rule.message}`;
	const tooltip = (rule.id === 'Space' || rule.id === 'nbkSpaces') ? `${rule.message}` : `&#171; ${safeMatchedString} &#187;&#10; ${rule.message}`;
	return `<span tabindex="0" aria-label="${ariaLabel}" data-message="${tooltip}" class="${rule.cssClass}">${matchedString}</span>`;
}
