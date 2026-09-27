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

// Analyseur CSV minimal (RFC 4180) : champs entre guillemets, guillemets échappés (""), virgules dans un champ.
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

// Un mot signalé par badWords qui fait partie du nom du projet (ex: une extension "Widget") n'est pas un anglicisme. Voir issue #38.
/**
 * @param {string} word
 * @param {string} projectName
 * @returns {boolean}
 */
export function isPartOfProjectName(word, projectName) {
	if (!projectName) { return false; }
	return projectName.toLowerCase().includes(word.toLowerCase());
}

// Surlignages qu'on sait poser dans une traduction et qui ne font pas partie de son contenu :
// ceux de SPTE (classes sp-warning--*, sp-spaces--*, sp-nbkspaces--*) et ceux de GlotDict
// (<span style="background-color:yellow"> autour des espaces insécables et des apostrophes courbes).
const HIGHLIGHT_SPAN_REGEX = /<span\b(?:[^>"]|"[^"]*")*>[^<]*<\/span>/g;
const HIGHLIGHT_MARKER_REGEX = /class="sp-(?:warning--|spaces--|nbkspaces--)[^"]*"|style="[^"]*background-color:\s*yellow/;

/**
 * Retire les surlignages déjà posés (par SPTE ou par GlotDict) pour ne garder que le texte de la
 * traduction : sinon les règles s'appliquent aussi dans les attributs de ces balises (ex: les
 * guillemets et les deux points de style="background-color:yellow"). Le reste du HTML est conservé.
 * @param {string} html
 * @returns {string}
 */
export function stripHighlightTags(html) {
	return html.replace(HIGHLIGHT_SPAN_REGEX, (span) => {
		if (!HIGHLIGHT_MARKER_REGEX.test(span)) { return span; }
		return span.slice(span.indexOf('>') + 1, span.lastIndexOf('</span>'));
	});
}

/**
 * Un rule antérieur dans checkTranslation() peut déjà avoir injecté un <span ...> (attributs
 * tabindex/aria-label/data-message/class, tous entre guillemets doubles) : un rule suivant, dans
 * la même passe, ne doit jamais matcher à l'intérieur de ce balisage déjà posé, sous peine de le
 * corrompre en y insérant un second <span> (ex: un deuxième rule qui détecte les guillemets droits
 * matcherait aussi ceux de tabindex="0"). Cherche le dernier « < » et le dernier « > » avant offset :
 * si le « < » est plus récent, offset est à l'intérieur d'une balise non refermée.
 * @param {string} text
 * @param {number} offset
 * @returns {boolean}
 */
export function isInsideHtmlTag(text, offset) {
	return text.lastIndexOf('<', offset - 1) > text.lastIndexOf('>', offset - 1);
}
