const styleSheet = (document.head.appendChild(document.createElement('style')) as HTMLStyleElement).sheet!;

export function addStyle(selector: string, rules: string) {
	styleSheet.insertRule(`${selector}{${rules}}`, styleSheet.cssRules.length);
}

export function createElement(tagName = 'DIV', attributes: Record<string, string> = {}, textContent = '') {
	const element = document.createElement(tagName);
	for (const attribute in attributes) {
		if (Object.hasOwn(attributes, attribute)) {
			element.setAttribute(attribute, attributes[attribute]!);
		}
	}
	element.textContent = textContent;
	return element;
}

// Analyseur CSV minimal (RFC 4180) : gère les champs entre guillemets, les guillemets
// échappés ("") et les virgules à l'intérieur d'un champ entre guillemets.
export function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
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
