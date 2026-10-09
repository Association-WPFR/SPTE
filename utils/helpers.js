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
// Vérifie que CETTE occurrence précise est bien le nom du projet cité dans la traduction (le nom du
// projet apparaît littéralement dans le texte, à cette position), pas juste que le mot matché est une
// sous-chaîne du nom du projet : sinon un projet nommé "GeoDirectory - Plugin" exempterait "plugin"
// dans toutes ses traductions, même utilisé comme mot normal. Voir issue #95.
/**
 * @param {string} text texte complet de la traduction où le mot a été trouvé
 * @param {number} offset position du mot trouvé dans text
 * @param {number} matchedLength longueur du mot trouvé
 * @param {string} projectName
 * @returns {boolean}
 */
export function isPartOfProjectName(text, offset, matchedLength, projectName) {
	if (!projectName) { return false; }
	const projectNameIndex = text.toLowerCase().indexOf(projectName.toLowerCase());
	if (projectNameIndex === -1) { return false; }
	return offset >= projectNameIndex && offset + matchedLength <= projectNameIndex + projectName.length;
}

// Surlignages qu'on sait poser dans une traduction et qui ne font pas partie de son contenu :
// ceux de SPTE (classes sp-warning--*, sp-spaces--*, sp-nbkspaces--*) et ceux de GlotDict
// (<span style="background-color:yellow"> autour des espaces insécables et des apostrophes courbes).
const HIGHLIGHT_SPAN_REGEX = /<span\b(?:[^>"]|"[^"]*")*>[^<]*<\/span>/g;
// Guillemets simples ou doubles, casse indifférente : GlotDict ou une extension tierce peut générer
// l'un ou l'autre.
const HIGHLIGHT_MARKER_REGEX = /class=["']sp-(?:warning--|spaces--|nbkspaces--)[^"']*["']|style=["'][^"']*background-color:\s*yellow/i;

/**
 * Retire les surlignages déjà posés (par SPTE ou par GlotDict) pour ne garder que le texte de la
 * traduction : sinon les règles s'appliquent aussi dans les attributs de ces balises (ex: les
 * guillemets et les deux points de style="background-color:yellow"). Le reste du HTML est conservé.
 * @param {string} html
 * @returns {string}
 */
export function stripHighlightTags(html) {
	if (!html.includes('<span')) { return html; }
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

const HTML_TAG_REGEX = /<[^>]*>/g;
// Contenu entre les délimiteurs doublés, avec tolérance à UN niveau de paire { }/[ ] imbriquée
// (ex: ICU MessageFormat "{{count, plural, one{...} other{...}}}"). Un niveau de plus n'est pas
// supporté (cas non rencontré en pratique à ce jour).
const CURLY_INNER = '(?:[^{}]|\\{[^{}]*\\})*';
const SQUARE_INNER = '(?:[^\\][]|\\[[^\\][]*\\])*';
// « before » peut se terminer au milieu d'une paire imbriquée non refermée (ex: juste après "one{") ;
// « after » peut symétriquement commencer par la fin de cette même paire (ex: "...}").
const CURLY_OPEN_AT_END = new RegExp(`\\{\\{${CURLY_INNER}(?:\\{[^{}]*)?$`);
const CURLY_CLOSE_AT_START = new RegExp(`^(?:[^{}]*\\})?${CURLY_INNER}\\}\\}`);
const SQUARE_OPEN_AT_END = new RegExp(`\\[\\[${SQUARE_INNER}(?:\\[[^\\][]*)?$`);
const SQUARE_CLOSE_AT_START = new RegExp(`^(?:[^\\][]*\\])?${SQUARE_INNER}\\]\\]`);

/**
 * Un bloc d'interpolation JS `{{ }}`/`[[ ]]` (ex: {{foo:bar}}, {{count, plural, one{...} other{...}}})
 * n'est pas du texte français à vérifier : ignorer tout caractère de ponctuation à l'intérieur. Voir
 * issue #27. Les balises HTML réelles (un <span> déjà injecté par un rule précédent dans la même passe,
 * cf. isInsideHtmlTag) sont retirées avant de tester l'adjacence, sinon un rule antérieur qui a inséré
 * un <span> autour d'un des deux caractères du délimiteur (ex: `{<span ...>{</span>`) casse cette
 * adjacence textuelle et défait la détection.
 * @param {string} text
 * @param {number} offset
 * @returns {boolean}
 */
export function isInsideDoubleBracketBlock(text, offset) {
	const before = text.slice(0, offset).replace(HTML_TAG_REGEX, '');
	const after = text.slice(offset).replace(HTML_TAG_REGEX, '');
	const insideCurly = CURLY_OPEN_AT_END.test(before) && CURLY_CLOSE_AT_START.test(after);
	const insideSquare = SQUARE_OPEN_AT_END.test(before) && SQUARE_CLOSE_AT_START.test(after);
	return insideCurly || insideSquare;
}

/**
 * String.prototype.replace() transmet un argument par groupe capturant avant la position et la chaîne
 * d'origine, puis un objet de groupes nommés le cas échéant (rgxPeriod contient un groupe capturant).
 * La position et la chaîne sont donc lues à partir de la fin de la liste des arguments.
 * @param {unknown[]} replaceArgs arguments transmis au callback de replace(), match exclu
 * @returns {{offset: number, fullString: string}}
 */
export function getReplaceMatchPosition(replaceArgs) {
	const positionalArgs = typeof replaceArgs.at(-1) === 'object' ? replaceArgs.slice(0, -1) : replaceArgs;
	return {
		offset: /** @type {number} */ (positionalArgs.at(-2)),
		fullString: /** @type {string} */ (positionalArgs.at(-1)),
	};
}
