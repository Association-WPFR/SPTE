import type { TypographyRule } from './rules';

// Construit le HTML du <span> de surlignage pour un mot/caractère détecté par une règle.
// Extrait de checkTranslation() (entrypoints/spte.content.ts) pour être testable sans DOM :
// un bug réel (double espace dans aria-label cassant le balisage HTML une fois inséré dans la
// page, corrigé le 2026-09-14) vivait exactement dans ce gabarit.
export function buildWarningSpanHTML(rule: TypographyRule, matchedString: string): string {
	const ariaName = (rule.id === 'badWords') ? `${matchedString}. ` : `${rule.name}. `;
	// ariaName se termine déjà par une espace : ne pas en ajouter une seconde ici, sous peine de
	// double espace dans l'attribut (voir historique du bug ci-dessus).
	const ariaLabel = (rule.id === 'Space' || rule.id === 'nbkSpaces') ? `${rule.message}` : `${ariaName}${rule.message}`;
	const tooltip = (rule.id === 'Space' || rule.id === 'nbkSpaces') ? `${rule.message}` : `&#171; ${matchedString} &#187;&#10; ${rule.message}`;
	return `<span tabindex="0" aria-label="${ariaLabel}" data-message="${tooltip}" class="${rule.cssClass}">${matchedString}</span>`;
}
