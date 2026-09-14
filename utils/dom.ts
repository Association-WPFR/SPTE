import { createElement } from './helpers';

// Ces fonctions ont toutes été extraites de `entrypoints/spte.content.ts` (Phase 8, TODO.md)
// pour être testables avec de vraies fixtures HTML (utils/fixtures/*.html) sans navigateur —
// chacune correspond à un bug réel trouvé et corrigé en conditions réelles le 2026-09-14.

// Affiche la chaîne traduite sans aucune balise, au survol de la colonne actions.
export function addForeignToolTip(translation: Element): void {
	const preview = translation.closest('tr');
	const translated = preview && preview.querySelector('.translation-text');
	// td.actions n'existe pas sur toutes les lignes (ex: utilisateur non connecté, sans les
	// droits pour valider/modifier) : on ignore cette ligne plutôt que de planter tout le
	// traitement des lignes suivantes (bug confirmé en conditions réelles le 2026-09-14).
	const hook = preview && preview.querySelector('td.actions');
	if (!hook || !translated) {
		return;
	}
	(hook as HTMLElement).style.position = 'relative';
	const toolTip = createElement('SPAN', { class: 'sp-foreign-tooltip' });
	toolTip.innerHTML = translated.innerHTML;
	hook.append(toolTip);
}

// Clone l’aperçu surligné dans le panneau d’édition.
export function addEditorHighlighter(translation: Element): void {
	const preview = translation.closest('tr');
	if (!preview) { return; }
	const brother = preview.nextElementSibling;
	// La toute dernière ligne du tableau n'a pas de ligne suivante (même prudence que pour
	// td.actions ci-dessus, bug confirmé en conditions réelles le 2026-09-14).
	if (!brother) { return; }
	const brotherHighlighter = brother.querySelector('.sp-editor-highlighter');
	if (brotherHighlighter) {
		brotherHighlighter.parentNode?.removeChild(brotherHighlighter);
	}
	if (preview.classList.contains('has-translations')) {
		const help = createElement('DIV', { class: 'sp-editor-highlighter' });
		const trad = preview.querySelector('.translation-text');
		const hook = brother.querySelector('.source-details');
		if (trad && hook) {
			const copycat = trad.cloneNode(true);
			help.append(copycat);
			hook.append(help);
		}
	}
}

// Coche/décoche la case d'une ligne en toute sécurité — certaines lignes (ex: historique de
// révision) n'ont pas de case en première colonne, sans quoi l'exception arrêtait net les
// boucles forEach appelantes (rowsDisplay, sélection en masse — bug confirmé le 2026-09-14).
export function setRowCheckboxSafely(row: Element, checked: boolean): boolean {
	const checkbox = row.firstElementChild?.firstElementChild as HTMLInputElement | undefined;
	if (!checkbox) { return false; }
	checkbox.checked = checked;
	return true;
}

// Masque les lignes sans avertissement (filtre "Les avertissements"), en décochant leur case
// à cocher au passage si la sélection en masse est active.
export function hideNonWarningRows(rows: Iterable<Element>, resetCheckbox: boolean): void {
	for (const row of rows) {
		(row as HTMLElement).style.display = 'none';
		if (resetCheckbox) { setRowCheckboxSafely(row, false); }
	}
}

// Réaffiche toutes les lignes (filtre "Tout").
export function showAllRows(rows: Iterable<Element>): void {
	for (const row of rows) {
		(row as HTMLElement).style.display = 'table-row';
	}
}

// Coche/décoche la case de toutes les lignes en erreur "certain" (bouton "Cocher les mots et
// apostrophes"). Retourne le nombre de lignes réellement cochées, pour l'affichage du compteur.
// Même prudence que setRowCheckboxSafely : ignore silencieusement les lignes sans case à cocher
// (bug confirmé le 2026-09-14).
export function setErrorRowsSelection(rows: Iterable<Element>, checked: boolean): number {
	let count = 0;
	for (const row of rows) {
		const wasSet = setRowCheckboxSafely(row, checked);
		if (wasSet && checked) { count++; }
	}
	return count;
}

// Remonte la ligne de la locale française en première position du tableau des locales d'un
// projet, pour y accéder plus facilement. Cible `#stats-table` (structure GlotPress actuelle) —
// l'ancienne structure `#locales`/`div.locale` a disparu du DOM (régression silencieuse
// confirmée par audit puis corrigée le 2026-09-14). Ne fait rien si GlotDict est présent (évite
// un conflit avec son propre mécanisme de réordonnancement).
export function moveFrenchRowToFirst(frenchLink: Element | null, glotDictPresent: boolean): boolean {
	const frenchRow = frenchLink?.closest('tr');
	const tableBody = frenchRow?.closest('tbody');
	const firstRow = tableBody?.querySelector('tr:first-child');
	if (firstRow && frenchRow && firstRow !== frenchRow && !glotDictPresent) {
		firstRow.before(frenchRow);
		return true;
	}
	return false;
}
