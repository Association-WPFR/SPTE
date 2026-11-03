import { createElement } from './helpers';

// Fonctions DOM à risque (lignes de tableau parfois incomplètes), testées sur de vraies fixtures HTML (utils/fixtures/*.html) sans navigateur.

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
	// Clone les nœuds existants plutôt qu'un innerHTML = innerHTML : évite de reparser du HTML.
	toolTip.append(...Array.from(translated.childNodes, (node) => node.cloneNode(true)));
	hook.append(toolTip);
}

// Aligne le retour à la ligne du highlighter sur celui du textarea (comparaison visuelle plus facile).
// Copie le style calculé plutôt que des valeurs fixes, pour rester correct si GlotPress change son CSS.
/**
 * @param {HTMLElement} el
 * @param {Element} textarea
 */
export function matchTextWrapping(el, textarea) {
	const style = getComputedStyle(textarea);
	el.style.boxSizing = style.boxSizing;
	el.style.width = style.width;
	el.style.paddingLeft = style.paddingLeft;
	el.style.paddingRight = style.paddingRight;
	el.style.borderLeftWidth = style.borderLeftWidth;
	el.style.borderRightWidth = style.borderRightWidth;
	el.style.fontFamily = style.fontFamily;
	el.style.fontSize = style.fontSize;
	el.style.letterSpacing = style.letterSpacing;
	el.style.wordSpacing = style.wordSpacing;
}

// Ajoute un bouton pour copier le permalien de la traduction, sans passer par le menu contextuel (clic > nouvel onglet > copie manuelle).
/** @param {Element} brother */
export function addPermalinkButton(brother) {
	if (brother.querySelector('.sp-copy-permalink')) { return; }
	const nextButton = brother.querySelector('.panel-header-actions__next');
	if (!nextButton) { return; }
	const permalink = /** @type {HTMLAnchorElement | undefined} */ ([...brother.querySelectorAll('.button-menu__dropdown a')]
		.find((a) => a.textContent?.trim() === 'Permalink to translation'));
	if (!permalink) { return; }
	const button = createElement('BUTTON', { type: 'button', class: 'sp-copy-permalink with-tooltip', 'aria-label': 'Copier le permalien de cette traduction' });
	// SVG inline plutôt qu'un dashicon : même rendu visuel (currentColor, taille similaire) sans dépendre
	// d'une police que WordPress gèle et remplace progressivement par des icônes SVG (@wordpress/icons) depuis la 7.1.
	// 16px et non 20px : Feather dessine ses icônes bord à bord, alors que les dashicons voisins ont une marge
	// intégrée dans la police — à taille égale le SVG paraît plus gros. 16px recrée cette marge.
	button.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
	button.addEventListener('click', () => {
		navigator.clipboard.writeText(permalink.href);
	});
	nextButton.insertAdjacentElement('afterend', button);
}

/** @param {Element} translation */
export function addEditorHighlighter(translation) {
	const preview = translation.closest('tr');
	if (!preview) { return; }
	const brother = preview.nextElementSibling;
	// La toute dernière ligne du tableau n'a pas de ligne suivante.
	if (!brother) { return; }
	addPermalinkButton(brother);
	const brotherHighlighter = brother.querySelector('.sp-editor-highlighter');
	if (brotherHighlighter) {
		brotherHighlighter.parentNode?.removeChild(brotherHighlighter);
	}
	if (preview.classList.contains('has-translations')) {
		const help = createElement('DIV', { class: 'sp-editor-highlighter' });
		const trad = preview.querySelector('.translation-text');
		const hook = brother.querySelector('.source-details');
		const textarea = brother.querySelector('textarea.foreign-text');
		if (textarea) { matchTextWrapping(help, textarea); }
		if (trad && hook) {
			const copycat = trad.cloneNode(true);
			help.append(copycat);
			hook.append(help);
		}
	}
}

// Coche/décoche la case d'une ligne en toute sécurité : certaines (ex: historique de révision) n'en ont pas.
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

// Masque les lignes sans avertissement (filtre "Les avertissements"), décoche leur case au passage si la sélection en masse est active.
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

// Filtre "Tout".
/** @param {Iterable<Element>} rows */
export function showAllRows(rows) {
	for (const row of rows) {
		/** @type {HTMLElement} */ (row).style.display = 'table-row';
	}
}

// Coche/décoche les lignes en erreur "certain" (bouton "Cocher les mots et apostrophes"). Retourne le nombre coché, pour le compteur.
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

// Remonte la ligne de la locale française en première position du tableau des locales d'un projet.
// Ne fait rien si GlotDict est présent (évite un conflit avec son propre réordonnancement).
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

// Remonte la carte de la locale française en première position de l'annuaire des locales (page d'accueil,
// structure #locales différente d'un tableau). Ne fait rien si GlotDict est présent (évite un conflit).
/**
 * @param {Element | null} frenchLink
 * @param {boolean} glotDictPresent
 * @returns {boolean}
 */
export function moveFrenchLocaleCardToFirst(frenchLink, glotDictPresent) {
	const frenchCard = frenchLink?.closest('.locale');
	const localesList = frenchCard?.closest('#locales');
	const firstCard = localesList?.firstElementChild;
	if (firstCard && frenchCard && firstCard !== frenchCard && !glotDictPresent) {
		firstCard.before(frenchCard);
		return true;
	}
	return false;
}

// Cartes de versions de WordPress (page /locale/<locale>/default/wp/, liste #projects).
/** @param {Element} card */
function getVersionCardInfo(card) {
	const name = card.querySelector('.project-name a')?.textContent?.trim() ?? '';
	const match = name.match(/^(\d+(?:\.\d+)*)\.x\b/);
	return { card, version: match ? match[1].split('.').map(Number) : null, isDevelopment: /development/i.test(name) };
}

/** @param {Element} projectsList */
function isVersionList(projectsList) {
	const cards = Array.from(projectsList.querySelectorAll(':scope > .project'));
	return cards.length > 0 && cards.every((card) => getVersionCardInfo(card).version);
}

// Dès qu'un filtre de la barre de tri (.sort-bar, formulaire GET `?filter=…`) est appliqué, GlotPress renvoie
// les cartes déjà triées selon ce filtre : on les laisse telles quelles.
/** @param {string} search */
function hasSortFilter(search) {
	return Boolean(new URLSearchParams(search).get('filter'));
}

// Trie les cartes de versions de WordPress : la version en développement d'abord, puis les versions stables
// de la plus récente à la plus ancienne. L'ordre par défaut de GlotPress mélange les précédentes versions et la version actuelle
// (ex: 4.8.x en tête, la version en développement au milieu). Ne trie que les cartes de la page courante (cf. sortWordPressVersionCardsAcrossPages).
// Tri par défaut uniquement (sans filtre de la .sort-bar). Ne fait rien si une carte n'est pas une version (ex: liste de plugins).
/**
 * @param {Element | null} projectsList
 * @param {string} [search] Query string de la page (par défaut celle de la page courante).
 * @returns {boolean} true si les cartes ont été réordonnées
 */
export function sortWordPressVersionCards(projectsList, search = location.search) {
	if (!projectsList || hasSortFilter(search) || !isVersionList(projectsList)) { return false; }
	const cards = Array.from(projectsList.querySelectorAll(':scope > .project'));
	const entries = cards.map(getVersionCardInfo);

	/** @param {number[]} a @param {number[]} b */
	const compareVersions = (a, b) => {
		for (let i = 0; i < Math.max(a.length, b.length); i++) {
			const diff = (b[i] ?? 0) - (a[i] ?? 0);
			if (diff !== 0) { return diff; }
		}
		return 0;
	};
	const sorted = [...entries].sort((a, b) => {
		if (a.isDevelopment !== b.isDevelopment) { return a.isDevelopment ? -1 : 1; }
		return compareVersions(/** @type {number[]} */ (a.version), /** @type {number[]} */ (b.version));
	});
	if (sorted.every((entry, i) => entry.card === cards[i])) { return false; }
	projectsList.append(...sorted.map((entry) => entry.card));
	return true;
}

/** @param {string} url */
function fetchPageText(url) {
	return fetch(url).then((response) => response.text());
}

// Rassemble sur la page courante les cartes des autres pages de la liste (pagination GlotPress), puis les trie :
// la liste complète des versions s'affiche ainsi dans l'ordre, sur une seule page.
// Trie d'abord la page courante pour éviter d'attendre le réseau ; si une récupération échoue, ce tri local est conservé.
// Sans effet avec un filtre de la .sort-bar ni sur une liste qui n'est pas une liste de versions.
/**
 * @param {Element | null} projectsList
 * @param {string} [search]
 * @param {(url: string) => Promise<string>} [fetchPage]
 * @returns {Promise<boolean>} true si des cartes d'autres pages ont été ajoutées
 */
export async function sortWordPressVersionCardsAcrossPages(projectsList, search = location.search, fetchPage = fetchPageText) {
	if (!projectsList || hasSortFilter(search) || !isVersionList(projectsList)) { return false; }
	sortWordPressVersionCards(projectsList, search);

	const doc = projectsList.ownerDocument;
	const pagings = Array.from(doc.querySelectorAll('.paging'));
	const urls = new Set(Array.from(doc.querySelectorAll('.paging a[href]'), (link) => new URL(/** @type {string} */ (link.getAttribute('href')), doc.baseURI).href));
	if (urls.size === 0) { return false; }

	const knownLinks = new Set(Array.from(projectsList.querySelectorAll('.project-name a'), (link) => link.getAttribute('href')));
	let added = false;
	try {
		const pages = await Promise.all(Array.from(urls, (url) => fetchPage(url)));
		for (const html of pages) {
			const otherDoc = new DOMParser().parseFromString(html, 'text/html');
			for (const card of otherDoc.querySelectorAll('#projects > .project')) {
				const href = card.querySelector('.project-name a')?.getAttribute('href');
				if (href && !knownLinks.has(href)) {
					knownLinks.add(href);
					projectsList.append(doc.importNode(card, true));
					added = true;
				}
			}
		}
	} catch {
		return false;
	}
	if (added) {
		for (const paging of pagings) { /** @type {HTMLElement} */ (paging).style.display = 'none'; }
		sortWordPressVersionCards(projectsList, search);
	}
	return added;
}
