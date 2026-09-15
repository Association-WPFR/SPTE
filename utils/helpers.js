const styleSheet = /** @type {CSSStyleSheet} */ (document.head.appendChild(document.createElement('style')).sheet);

/**
 * @param {string} selector
 * @param {string} rules
 */
export function addStyle(selector, rules) {
	styleSheet.insertRule(`${selector}{${rules}}`, styleSheet.cssRules.length);
}

/**
 * @param {string} [tagName]
 * @param {Record<string, string>} [attributes]
 * @param {string} [textContent]
 */
export function createElement(tagName = 'DIV', attributes = {}, textContent = '') {
	const element = document.createElement(tagName);
	for (const attribute in attributes) {
		if (Object.hasOwn(attributes, attribute)) {
			element.setAttribute(attribute, attributes[attribute]);
		}
	}
	element.textContent = textContent;
	return element;
}

// Analyseur CSV minimal (RFC 4180) : gère les champs entre guillemets, les guillemets
// échappés ("") et les virgules à l'intérieur d'un champ entre guillemets.
/**
 * @param {string} text
 * @returns {string[][]}
 */
export function parseCsv(text) {
	/** @type {string[][]} */
	const rows = [];
	/** @type {string[]} */
	let row = [];
	let field = '';
	let inQuotes = false;
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (inQuotes) {
			if (char === '"') {
				if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
			} else {
				field += char;
			}
		} else if (char === '"') {
			inQuotes = true;
		} else if (char === ',') {
			row.push(field);
			field = '';
		} else if (char === '\n' || char === '\r') {
			if (char === '\r' && text[i + 1] === '\n') { i++; }
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
		} else {
			field += char;
		}
	}
	if (field !== '' || row.length > 0) {
		row.push(field);
		rows.push(row);
	}
	return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ''));
}

// Un mot signalé par badWords qui fait partie du nom du projet en cours de traduction (ex: une
// extension nommée "Widget") n'est pas un anglicisme à corriger. Voir issue #38.
/**
 * @param {string} word
 * @param {string} projectName
 * @returns {boolean}
 */
export function isPartOfProjectName(word, projectName) {
	if (!projectName) { return false; }
	return projectName.toLowerCase().includes(word.toLowerCase());
}
