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
