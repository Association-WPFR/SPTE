import { describe, expect, it } from 'vitest';
import { buildWarningSpanHTML } from './warnings';
import { rules } from './rules';

const badWordsRule = rules.find((rule) => rule.id === 'badWords');
const colonRule = rules.find((rule) => rule.id === 'colon');
const spaceRule = rules.find((rule) => rule.id === 'Space');
const doubleQuotesRule = rules.find((rule) => rule.id === 'doubleQuotes');

describe('buildWarningSpanHTML', () => {
	it('ne produit jamais de double espace dans aria-label (régression du 2026-09-14)', () => {
		// ariaName se termine déjà par une espace ("support. ") : un double espace ici cassait
		// le balisage HTML (re-détecté et surligné par la règle "espace en double" elle-même).
		const html = buildWarningSpanHTML(badWordsRule, 'support');
		expect(html).not.toMatch(/aria-label="[^"]* {2}/);
	});

	it('génère un unique <span> bien formé pour un mot badWords', () => {
		const html = buildWarningSpanHTML(badWordsRule, 'support');
		expect(html).toBe(
			'<span tabindex="0" aria-label="support. Mot déconseillé ou mal orthographié" data-message="&#171; support &#187;&#10; Mot déconseillé ou mal orthographié" class="sp-warning--word">support</span>',
		);
	});

	it('génère un <span> bien formé pour une règle de ponctuation (toVerify)', () => {
		const html = buildWarningSpanHTML(colonRule, ':');
		expect(html).toContain('aria-label="deux points. Non précédé par une espace insécable ou non suivi par une espace"');
		expect(html).toContain('class="sp-warning--char"');
	});

	it('les règles Space/nbkSpaces utilisent le message seul, sans nom de règle ni tooltip guillemets', () => {
		const html = buildWarningSpanHTML(spaceRule, ' ');
		expect(html).toContain('aria-label="Espace en début ou en fin de chaîne"');
		expect(html).toContain('data-message="Espace en début ou en fin de chaîne"');
		expect(html).not.toContain('&#171;');
	});

	it('échappe le guillemet droit détecté (matchedString) pour ne pas casser data-message (régression sécurité)', () => {
		// La règle doubleQuotes détecte justement le caractère " — s'il n'est pas échappé,
		// il ferme l'attribut data-message en plein milieu du balisage généré.
		const html = buildWarningSpanHTML(doubleQuotesRule, '"');
		const fragment = document.createRange().createContextualFragment(html);
		expect(fragment.childNodes).toHaveLength(1);
		const span = /** @type {Element} */ (fragment.firstChild);
		expect(span.tagName).toBe('SPAN');
		expect(span.getAttribute('data-message')).toContain('« " »');
		expect(span.textContent).toBe('"');
	});

	it('le HTML généré reste un unique élément valide une fois réinjecté dans le DOM (pas de balise cassée)', () => {
		const html = buildWarningSpanHTML(badWordsRule, 'support');
		const fragment = document.createRange().createContextualFragment(html);
		expect(fragment.childNodes).toHaveLength(1);
		const span = /** @type {Element} */ (fragment.firstChild);
		expect(span.tagName).toBe('SPAN');
		expect(span.textContent).toBe('support');
		// Si le HTML était cassé (balise ouverte en plein milieu d'un attribut), le texte visible
		// contiendrait des fragments d'attributs (data-message=, class=...) au lieu du seul mot.
		expect(span.textContent).not.toContain('data-message');
		expect(span.textContent).not.toContain('class=');
	});
});
