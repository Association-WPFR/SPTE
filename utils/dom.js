import { createElement } from './helpers';

// Fonctions DOM à risque (lignes de tableau parfois incomplètes), testées sur de vraies
// fixtures HTML (utils/fixtures/*.html) sans navigateur.

// Affiche la chaîne traduite sans aucune balise, au survol de la colonne actions.
/** @param {Element} translation */
export function addForeignToolTip(translation) {
	const preview = translation.closest('tr');
	const translated = preview && preview.querySelector('.translation-text');
	// td.actions n'existe pas sur toutes les lignes (ex: utilisateur non connecté) : on
	// ignore cette ligne plutôt que de planter le traitement des suivantes.
	const hook = preview && preview.querySelector('td.actions');
	if (!hook || !translated) {
		return;
	}
	/** @type {HTMLElement} */ (hook).style.position = 'relative';
	const toolTip = createElement('SPAN', { class: 'sp-foreign-tooltip' });
	toolTip.innerHTML = translated.innerHTML;
	hook.append(toolTip);
}

// Clone l’aperçu surligné dans le panneau d’édition.
/** @param {Element} translation */
export function addEditorHighlighter(translation) {
	const preview = translation.closest('tr');
	if (!preview) { return; }
	const brother = preview.nextElementSibling;
	// La toute dernière ligne du tableau n'a pas de ligne suivante.
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
// révision) n'ont pas de case en première colonne.
/**
 * @param {Element} row
 * @param {boolean} checked
 * @returns {boolean}
 */
export function setRowCheckboxSafely(row, checked) {
	const checkbox = /** @type {HTMLInputElement | undefined} */ (row.firstElementChild?.firstElementChild);
	if (!checkbox) { return false; }
	checkbox.checked = checked;
	return true;
}

// Masque les lignes sans avertissement (filtre "Les avertissements"), en décochant leur case
// à cocher au passage si la sélection en masse est active.
/**
 * @param {Iterable<Element>} rows
 * @param {boolean} resetCheckbox
 */
export function hideNonWarningRows(rows, resetCheckbox) {
	for (const row of rows) {
		/** @type {HTMLElement} */ (row).style.display = 'none';
		if (resetCheckbox) { setRowCheckboxSafely(row, false); }
	}
}

// Réaffiche toutes les lignes (filtre "Tout").
/** @param {Iterable<Element>} rows */
export function showAllRows(rows) {
	for (const row of rows) {
		/** @type {HTMLElement} */ (row).style.display = 'table-row';
	}
}

// Coche/décoche la case de toutes les lignes en erreur "certain" (bouton "Cocher les mots et
// apostrophes"). Retourne le nombre de lignes réellement cochées, pour l'affichage du compteur.
/**
 * @param {Iterable<Element>} rows
 * @param {boolean} checked
 * @returns {number}
 */
export function setErrorRowsSelection(rows, checked) {
	let count = 0;
	for (const row of rows) {
		const wasSet = setRowCheckboxSafely(row, checked);
		if (wasSet && checked) { count++; }
	}
	return count;
}

// Remonte la ligne de la locale française en première position du tableau des locales d'un
// projet. Ne fait rien si GlotDict est présent (évite un conflit avec son propre
// mécanisme de réordonnancement).
/**
 * @param {Element | null} frenchLink
 * @param {boolean} glotDictPresent
 * @returns {boolean}
 */
export function moveFrenchRowToFirst(frenchLink, glotDictPresent) {
	const frenchRow = frenchLink?.closest('tr');
	const tableBody = frenchRow?.closest('tbody');
	const firstRow = tableBody?.querySelector('tr:first-child');
	if (firstRow && frenchRow && firstRow !== frenchRow && !glotDictPresent) {
		firstRow.before(frenchRow);
		return true;
	}
	return false;
}
