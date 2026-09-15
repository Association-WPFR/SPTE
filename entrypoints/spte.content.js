import { rules, charTitle, charClass } from '../utils/rules';
import { addStyle, createElement, parseCsv, isPartOfProjectName } from '../utils/helpers';
import { buildWarningSpanHTML } from '../utils/warnings';
import { createDefaultSettings } from '../utils/settings';
import {
	addForeignToolTip,
	addEditorHighlighter,
	hideNonWarningRows,
	showAllRows,
	moveFrenchRowToFirst,
	moveFrenchLocaleCardToFirst,
	setErrorRowsSelection,
} from '../utils/dom';
import './style.css';

export default defineContentScript({
	matches: ['https://translate.wordpress.org/*'],
	main() {
		// Si le script est réinjecté sans navigation complète (ex: rechargement de l'extension
		// depuis about:debugging pendant le développement), on évite de recréer et réinsérer
		// tous les éléments SPTE par-dessus ceux déjà présents.
		if (document.getElementById('sp-controls')) { return; }

		// Accès rapide à une règle par son id.
		const rulesById = new Map(rules.map((rule) => [rule.id, rule]));
		// Vérification de la localisation.
		const onTranslateWordPressRoot = (/https:\/\/translate\.wordpress\.org\//).test(window.location.href);

		// Slug de locale dérivé du chemin de l'URL, validé par pattern (fr, fr-be...) pour éviter
		// de prendre un segment sans rapport (ex: 'wp-plugins') — repli sur 'fr' sinon.
		let currentProjectLocaleSlug = '';
		const pathSegments = window.location.pathname.split('/').filter(Boolean);
		const localeSlugPattern = /^[a-z]{2,3}(-[a-z0-9]{2,6})?$/;
		if (pathSegments.length >= 2 && localeSlugPattern.test(pathSegments[pathSegments.length - 2])) {
			currentProjectLocaleSlug = pathSegments[pathSegments.length - 2];
		}
		currentProjectLocaleSlug = (currentProjectLocaleSlug === '') ? 'fr' : currentProjectLocaleSlug;

		// Élément déclencheur de la popup de cohérence, pour restaurer le focus à sa fermeture.
		let popupTriggerElement = null;

		// Liens externes utilisés par SPTE.
		const typographyURL = 'https://fr.wordpress.org/team/handbook/guide-du-traducteur/les-regles-typographiques-utilisees-pour-la-traduction-de-wp-en-francais/';
		const glossaryURL = `https://translate.wordpress.org/locale/${currentProjectLocaleSlug}/default/glossary/`;
		// Export CSV officiel du glossaire (colonnes en,fr,pos,description).
		const glossaryExportURL = `${glossaryURL}-export/`;

		// Réglages (localStorage ne gère pas les booléens).
		let lsHideCaption = localStorage.getItem('spteHideCaption') === 'true';
		let lsShowOnlyWarning = localStorage.getItem('spteShowOnlyWarning') === 'true';

		// Principaux éléments existants.
		const gpContent = /** @type {HTMLElement | null} */ (document.querySelector('.gp-content'));
		if (gpContent) { gpContent.style.maxWidth = '85% !important'; }
		const translations = document.querySelectorAll('tr.preview:not(.sp-has-spte-error) .translation-text');
		const bulkActions = document.querySelector('#bulk-actions-toolbar-top');
		if (bulkActions) {
			document.body.classList.add('sp-pte-is-on-board');
		}
		const tableTranslations = document.querySelector('#translations');
		const filterToolbar = document.querySelector('.filter-toolbar');
		const isConnected = document.querySelector('body.logged-in') !== null;
		const GDmayBeOnBoard = localStorage.getItem('gd_language') !== null;

		// Nom du projet en cours de traduction (breadcrumb : Projects > catégorie > nom du
		// projet > branche > locale), pour ne pas signaler à tort son propre nom dans badWords
		// (ex: une extension nommée "Widget"). Voir issue #38.
		const projectName = document.querySelector('.breadcrumb li:nth-child(3) a')?.textContent?.trim() ?? '';

		// Principaux éléments créés.
		const spPopup = createElement('DIV', { id: 'sp-the-popup', class: 'sp-the-popup--hidden', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Résultats de cohérence', tabindex: '-1' });
		const spGDNoticesContainer = createElement('DIV', { id: 'sp-gd-notices-container' });
		const spConsistency = createElement('DIV', { id: 'sp-consist-container' });
		const spConsistencyLabel = createElement('LABEL', { for: 'sp-consist__text' }, 'Cohérence d’une chaîne');
		const spConsistencyInputText = /** @type {HTMLInputElement} */ (createElement('INPUT', { type: 'text', id: 'sp-consist__text', name: 'spConsistencyInputText', value: '' }));
		const spConsistencyBtn = createElement('INPUT', { type: 'button', id: 'sp-consist__btn', name: 'spConsistencyBtn', value: 'Vérifier' });
		spConsistency.append(spConsistencyLabel, spConsistencyInputText, spConsistencyBtn);
		const spControls = createElement('DIV', { id: 'sp-controls' });
		const results = createElement('DIV', { id: 'sp-results', class: 'sp-results' });
		const resultsData = createElement('DIV', { class: 'sp-results__data' });
		const resultsCaption = createElement('DIV', { class: 'sp-results__captions' });
		const resultsTitle = createElement('P');
		results.append(resultsData, resultsCaption);
		resultsData.append(resultsTitle);
		const title = createElement('SPAN', {}, charTitle);
		const caption = createElement('P', { class: 'sp-results__caption' });
		caption.innerHTML = 'Les avertissements en rouge sont à <strong class="sp-info" title="Quelques rares exceptions subsistent, par exemple lorsque le mot fait partie du nom de l’extension">très forte probabilité</strong>. Ceux en rose sont à <strong class="sp-info" title="Les exceptions sont fréquentes lorsque du code est intégré aux traductions (fonctions, paramètres…)">forte probabilité</strong> mais à vérifier car ils peuvent compter des faux positifs.';
		const typographyLink = createElement('P', { class: 'sp-results__caption sp-results__caption--link' });
		typographyLink.innerHTML = `Consultez <a class="sp-caption-link sp-caption-link--typography" target="_blank" href="${typographyURL}">les règles typographiques</a> à respecter pour les caractères.`;
		const glossaryLink = createElement('P', { class: 'sp-results__caption sp-results__caption--link' });
		glossaryLink.innerHTML = `Consultez <a class="sp-caption-link sp-caption-link--glossary" target="_blank" href="${glossaryURL}">le glossaire officiel</a> à respecter pour les mots.`;
		const hideCaption = createElement('A', { id: 'sp-results__toggle-caption', href: '#', title: 'Légende' });
		const spFilters = createElement('DIV', { class: 'sp-controls__filters' });
		const showOnlyWarning = /** @type {HTMLInputElement} */ (createElement('INPUT', { type: 'checkbox', id: 'sp-show-only-warnings', name: 'showOnlyWarning', value: 'showOnlyWarning' }));
		const showOnlyWarningLabel = createElement('LABEL', { for: 'sp-show-only-warnings' }, 'Afficher uniquement les avertissements de cette page (0)');
		showOnlyWarning.checked = lsShowOnlyWarning;
		spFilters.append(showOnlyWarning, showOnlyWarningLabel);

		const pteControls = createElement('DIV', { class: 'sp-controls__pte' });
		const spSelectErrors = /** @type {HTMLInputElement} */ (createElement('INPUT', { type: 'checkbox', id: 'sp-select-errors', name: 'spteSelectErrors', value: 'spteSelectErrors' }));
		const spSelectErrorsLabel = createElement('LABEL', { for: 'sp-select-errors' }, 'Cocher les mots et apostrophes');
		if (bulkActions) {
			pteControls.append(spSelectErrors, spSelectErrorsLabel);
		}

		// Éléments spécifiques à la locale française.
		const frenchStatsGlobal = document.querySelector('#stats-table tr a[href*="/locale/fr/"]');
		const frenchLocaleCard = document.querySelector('#locales a[href*="/locale/fr/"]');
		const frenchStatsSpecific = document.querySelector('#translation-sets tr a[href*="/fr/"]');

		// GlotDict plante s'il s'exécute après SPTE et trouve des balises qu'il n'attend pas : on force ses réglages pour les désactiver en amont.
		function preventGlotDictTags() {
			localStorage.setItem('gd_curly_apostrophe_highlight', 'true');
			localStorage.setItem('gd_non_breaking_space_highlight', 'true');
		}

		// addForeignToolTip() et addEditorHighlighter() sont dans utils/dom.js.

		// Ajoute des classes CSS à la ligne d’aperçu selon les avertissements.
		function tagTRTranslations(preview) {
			const hasTranslation = preview.classList.contains('has-translations');
			const trad = preview.querySelector('.translation-text');
			const spWarning = trad.querySelector('[class*="sp-warning--"]');
			if (hasTranslation && spWarning) {
				preview.classList.add('sp-has-spte-warning');
			}
			if (hasTranslation && (trad.querySelector('.sp-warning--word') || trad.querySelector('.sp-warning--quote'))) {
				preview.classList.add('sp-has-spte-error');
			}
		}

		// Affichage des lignes (logique testée dans utils/dom.test.js).
		function rowsDisplay() {
			const rows = document.querySelectorAll('tr.preview:not(.sp-has-spte-warning)');
			if (lsShowOnlyWarning) {
				hideNonWarningRows(rows, Boolean(bulkActions));
			} else {
				showAllRows(rows);
			}
			updateWarningFilterState();
		}

		// Met à jour le compteur et l'état (grisé si zéro) du toggle "avertissements de cette page".
		function updateWarningFilterState() {
			if (!showOnlyWarning || !showOnlyWarningLabel) { return; }
			const warningCount = document.querySelectorAll('tr.preview.sp-has-spte-warning').length;
			showOnlyWarningLabel.textContent = `Afficher uniquement les avertissements de cette page (${warningCount})`;
			showOnlyWarning.disabled = warningCount === 0;
			if (warningCount === 0) {
				showOnlyWarning.checked = false;
			}
		}

		// Vérifie et traite les traductions, surligne les éléments (avec le statut « rejeté » on ne fait que décompter).
		function checkTranslation(translation, oldStatus, newStatus) {
			const preview = translation.closest('tr.preview');

			addForeignToolTip(translation);

			// Inutile de traiter les anciennes traductions rejetées, sauf celle qu’on vient de rejeter, et uniquement pour les compteurs.
			if (!preview || (preview.classList.contains('status-rejected') && newStatus !== 'rejected')) { return; }

			// Récupère le texte.
			let text = translation.innerHTML;

			// Pour la compatibilité des regex, on remplace les entités HTML d’espace insécable par le vrai caractère.
			text = text.replaceAll(/&nbsp;/gmi, ' ');

			// On mémorise le texte sans les balises.
			let textWithoutTags = text.replaceAll(/&lt;.*?(?<!\/)&gt;/gmi, '');
			// Pour chaque règle typographique...
			for (const rule of rules) {
				text = text.replace(rule.regex, (string) => {
					// Si le cas est présent dans le texte mais pas dans textWithoutTags, il ne doit pas être traité.
					if (!textWithoutTags.match(rule.regex)) {
						// Ce qui est IMPORTANT dans ce procédé pour éviter les vérifications à l’intérieur des balises,
						// c’est que l’ordre de "replace(rule.regex)" soit le même que celui du "textWithoutTags.replace(string, '')" qui suit,
						// et que seul le premier élément de "textWithoutTags.match(rule.regex)" soit vérifié ici.
						return string;
					}

					// Le mot signalé fait partie du nom du projet en cours de traduction (ex: une
					// extension nommée "Widget") : ce n'est pas un anglicisme à corriger. Voir issue #38.
					if (rule.id === 'badWords' && isPartOfProjectName(string, projectName)) {
						return string;
					}

					// GlotPress a 6 statuts : untranslated, current, fuzzy, waiting, old, rejected. Old et rejected ne doivent pas être comptés.
					switch (newStatus) {
					case 'rejected':
						if (oldStatus !== 'old') {
							rule.counter--;
						}
						break;
					case 'fuzzy':
						if (oldStatus === 'rejected') {
							rule.counter++;
						}
						break;
					case 'current':
						if (oldStatus !== 'waiting') {
							rule.counter++;
						}
						break;
					case 'waiting':
						if (oldStatus !== 'current') {
							rule.counter++;
						}
						break;
					default:
						rule.counter++;
						break;
					}
					if (newStatus !== 'rejected') {
						textWithoutTags = textWithoutTags.replace(string, '');
						return buildWarningSpanHTML(rule, string);
					}
					return string;
				});
			}
			const node = document.createRange().createContextualFragment(text);
			const newTranslation = translation.cloneNode(false);
			newTranslation.append(node);
			translation.replaceWith(newTranslation);
			addEditorHighlighter(preview);
			tagTRTranslations(preview);
		}

		// Affiche/masque la légende.
		function toggleCaption(e) {
			lsHideCaption = lsHideCaption !== true;
			resultsCaption.classList.toggle('sp-results__captions--closed');
			e.target.textContent = (e.target.textContent === 'Masquer la légende') ? 'Afficher la légende' : 'Masquer la légende';
			localStorage.setItem('spteHideCaption', ((lsHideCaption === true) ? 'true' : 'false'));
			e.preventDefault();
		}

		// Fait défiler la page jusqu'à la première occurrence d'un avertissement donné et lui
		// donne le focus. Voir issue #3.
		/** @param {string} cssClass */
		function jumpToFirstWarning(cssClass) {
			// Le compteur lui-même porte la même classe que ce qu'il cherche (ex: sp-warning--word
			// sur le bouton ET sur chaque mot surligné) : sans exclusion, il se trouverait
			// lui-même en premier puisqu'il est placé avant le tableau dans le DOM (en-tête).
			const target = /** @type {HTMLElement | null} */ (document.querySelector(`.${cssClass}:not(.sp-warning-title)`));
			if (!target) { return; }
			target.scrollIntoView({ behavior: 'smooth', block: 'center' });
			target.focus();
		}

		// Rend un compteur cliquable pour sauter à sa première occurrence sur la page. C'est un
		// <button>, pas un lien : il ne navigue nulle part, il déplace juste le focus sur la
		// page actuelle (role="link" était sémantiquement faux — corrigé après relecture UI/UX).
		/**
		 * @param {Element} counter
		 * @param {string} cssClass
		 * @param {string} label
		 */
		function makeCounterClickable(counter, cssClass, label) {
			counter.setAttribute('aria-label', `Aller à la première occurrence : ${label}`);
			counter.classList.add('sp-warning-title--clickable');
			counter.addEventListener('click', () => jumpToFirstWarning(cssClass));
		}

		// Affiche les statistiques de résultats dans l’en-tête.
		function displayResults() {
			let nbCharacter = 0;
			let nbTotal = 0;

			for (const rule of rules) {
				if (!rule.counter) {
					continue;
				}

				if (rule.title && rule.title !== charTitle) {
					let counter = document.querySelector(`.${rule.cssClass}.sp-warning-title`);
					if (counter) {
						// Deux règles peuvent partager le même cssClass (ex: quotes/doubleQuotes) :
						// on cumule plutôt que d'écraser le compteur de la première.
						counter.textContent = String(Number(counter.textContent) + rule.counter);
					} else {
						const title = createElement('SPAN', {}, rule.title);
						counter = createElement('BUTTON', { type: 'button', class: `${rule.cssClass} sp-warning-title` }, String(rule.counter));
						makeCounterClickable(counter, rule.cssClass, rule.title);
						title.append(counter);
						resultsData.append(title);
					}
					nbTotal += rule.counter;
				} else if (rule.title === charTitle) {
					nbCharacter += rule.counter;
					nbTotal += rule.counter;
				}
			}

			let counter = document.querySelector(`.${charClass}.sp-warning-title`);
			if (counter) {
				counter.textContent = String(nbCharacter);
			} else if (nbCharacter) {
				counter = createElement('BUTTON', { type: 'button', class: `${charClass} sp-warning-title` }, String(nbCharacter));
				makeCounterClickable(counter, charClass, charTitle.replace(/\s*:\s*$/, ''));
				title.append(counter);
				resultsData.append(title);
			}

			resultsTitle.textContent = nbTotal ? `éléments à vérifier : ${nbTotal}` : 'aucun élément à vérifier';
			resultsTitle.classList.add('sp-results__title');
			resultsTitle.classList.toggle('sp-results__title--ok', nbTotal === 0);
			filterToolbar.append(results);

			if (nbTotal) {
				if (lsHideCaption) {
					hideCaption.textContent = 'Afficher la légende';
					resultsCaption.classList.add('sp-results__captions--closed');
				} else {
					hideCaption.textContent = 'Masquer la légende';
				}
				hideCaption.onclick = toggleCaption;
				resultsCaption.append(hideCaption, caption, glossaryLink, typographyLink);
			} else {
				resultsCaption.replaceChildren();
			}
			const characters = document.querySelector('.sp-warning-title.sp-warning--char');
			if (nbCharacter === 0 && characters?.parentElement) {
				characters.parentElement.remove();
			}
			const quotes = document.querySelector('.sp-warning-title.sp-warning--quote');
			if (rulesById.get('quotes').counter === 0 && rulesById.get('doubleQuotes').counter === 0 && quotes?.parentElement) {
				quotes.parentElement.remove();
			}
		}

		// Gère les contrôles.
		function manageControls() {
			if (!showOnlyWarning) { return; }

			showOnlyWarning.addEventListener('change', () => {
				localStorage.setItem('spteShowOnlyWarning', showOnlyWarning.checked ? 'true' : 'false');
				lsShowOnlyWarning = showOnlyWarning.checked;
				rowsDisplay();
			});

			if (!spSelectErrors) { return; }

			spSelectErrors.addEventListener('change', () => {
				const errorRows = document.querySelectorAll('tr.preview.sp-has-spte-error');
				const nbSelectedRows = setErrorRowsSelection(errorRows, spSelectErrors.checked);
				if (document.querySelector('#gd-checked-count')) {
					document.querySelector('#gd-checked-count').remove();
				}
				if (nbSelectedRows === 0) { return; }
				const GDCountNotice = createElement('DIV', { id: 'gd-checked-count', class: 'notice' }, `${nbSelectedRows} ligne(s) sélectionnée(s)`);
				tableTranslations.parentNode.insertBefore(GDCountNotice, tableTranslations);
			});
		}

		// Spécifique à la page de présentation d’un projet (liste des locales disponibles), fait
		// remonter la ligne FR en première position du tableau (logique testée dans utils/dom.test.js).
		function frenchiesGoFirst() {
			moveFrenchRowToFirst(frenchStatsGlobal, GDmayBeOnBoard);
			// Pas de garde GlotDict ici : GlotDict n'a aucune emprise sur cette page (vérifié en
			// live, aucun élément/script gd- présent), contrairement au tableau des locales d'un
			// projet où son propre réordonnancement peut entrer en conflit avec le nôtre.
			moveFrenchLocaleCardToFirst(frenchLocaleCard, false);
		}

		// Ajoute un drapeau français sur la locale française dans les différents tableaux pour mieux l’identifier.
		function frenchFlag(spteFrenchFlag) {
			if (spteFrenchFlag && spteFrenchFlag === 'false') { return; }

			if (frenchStatsSpecific) {
				frenchStatsSpecific.classList.add('sp-frenchies', 'sp-frenchies--long');
			}
			if (frenchStatsGlobal) {
				frenchStatsGlobal.classList.add('sp-frenchies');
			}
			if (frenchLocaleCard) {
				frenchLocaleCard.classList.add('sp-frenchies', 'sp-frenchies--locale-card');
			}
		}

		// Observe les mutations.
		function observeMutations() {
			const observerMutations = new MutationObserver((mutations) => {
				/** @type {string | undefined} */
				let removedRowID;
				/** @type {string | undefined} */
				let addedRowID;
				/** @type {string | undefined} */
				let oldStatus;
				/** @type {string | undefined} */
				let newStatus;
				let translation;
				mutations.forEach((mutation) => {
					mutation.removedNodes.forEach((node) => {
						if (node.nodeType !== 1) { return; }
						const removedNode = /** @type {Element} */ (node);
						if (!removedRowID && !oldStatus && removedNode.nodeName === 'TR' && removedNode.classList.contains('preview')) {
							removedRowID = removedNode.id;
							if (removedNode.classList.contains('untranslated')) {
								oldStatus = 'untranslated';
							} else {
								oldStatus = removedNode.classList.value.match('(?<=status-)(\\w*)(?= )')?.[0];
							}
						}
					});

					mutation.addedNodes.forEach((node) => {
						if (node.nodeType !== 1) {	return;	}
						const addedNode = /** @type {Element} */ (node);

						// Lignes correspondant à des changements de statut.
						if (!addedRowID && !newStatus && addedNode.nodeName === 'TR' && addedNode.classList.contains('preview')) {
							addedRowID = addedNode.id;
							newStatus = addedNode.classList.value.match('(?<=status-)(\\w*)(?= )')?.[0];
						}

						// Notices de GlotDict. Attention, si le parent doit changer, on vérifie que addedNode n’a pas déjà été ajouté au parent.
						if (GDmayBeOnBoard && addedNode.parentNode !== spGDNoticesContainer && addedNode.id.startsWith('gd-') && addedNode.classList.contains('notice')) {
							spGDNoticesContainer.appendChild(addedNode);
						}
					});
				});

				if (removedRowID && addedRowID && oldStatus && newStatus) {
					if (oldStatus === 'untranslated' && !addedRowID.toString().startsWith(removedRowID.replace('old', ''))) { return; }
					if (oldStatus !== 'untranslated' && !removedRowID.toString().startsWith(addedRowID)) { return; }

					translation = document.querySelector(`#${addedRowID} .translation-text`);
					checkTranslation(translation, oldStatus, newStatus);
					displayResults();
					manageControls();
					updateWarningFilterState();
				}
			});

			observerMutations.observe(gpContent, {
				subtree: true,
				childList: true,
			});
		}

		// Place tous les éléments dans un en-tête collant (sticky).
		function buildHeader() {
			if (bulkActions) {
				spControls.append(pteControls);
			}
			spControls.append(spFilters, spConsistency);
			filterToolbar.append(spGDNoticesContainer, spControls);
		}

		function checkConsistency() {
			const inputValue = spConsistencyInputText.value;
			if (inputValue === '') { return; }
			popupTriggerElement = document.activeElement;
			spPopup.classList.remove('sp-the-popup--hidden');
			const URL = `https://translate.wordpress.org/consistency/?search=${inputValue}&set=${currentProjectLocaleSlug}%2Fdefault&`;
			fetch(URL).then((response) => response.text()).then((data) => {
				const table = data.replace(/(\r\n|\n|\r)/gm, '').match(/(?<=consistency-table">)(.*?)(?=<\/table>)/gmi);
				if (table && table[0]) {
					spPopup.innerHTML = `<table class="consistency">${table[0]}</table>}`;
				} else {
					spPopup.innerHTML = '<h1 style="text-align:center;margin:2em auto;">Aucun résultat</h1>';
				}
				spPopup.focus();
			});
		}

		function closePopup(e) {
			if (!spPopup.contains(e.target) && e.target !== spConsistencyBtn) {
				spPopup.innerHTML = '';
				spPopup.classList.add('sp-the-popup--hidden');
				spConsistencyInputText.value = '';
				if (popupTriggerElement) {
					popupTriggerElement.focus();
					popupTriggerElement = null;
				}
			}
		}

		function declareEvents() {
			document.addEventListener('click', (e) => {
				closePopup(e);
			});

			document.addEventListener('keyup', (e) => {
				switch (e.key) {
				case 'Escape':
					closePopup(e);
					break;

				default:
					break;
				}
			});

			spConsistencyInputText.addEventListener('keyup', (e) => {
				e.preventDefault();
				switch (e.key) {
				case 'Enter':
					checkConsistency();
					break;

				default:
					break;
				}
			});

			spConsistencyBtn.addEventListener('click', (e) => {
				e.preventDefault();
				checkConsistency();
			});
		}

		function setColors(spteColorWord = '#ff0000', spteColorQuote = '#ff0000', spteColorChar = '#ff00ff') {
			addStyle('.sp-warning--word', `background-color:${spteColorWord};color:white;font-weight:bold;padding:1px;margin:0 1px`);
			addStyle('.sp-warning--quote', `display:inline-block;line-height:16px;box-shadow:${spteColorQuote} 0px 0px 0px 2px inset;background-color:white;padding:3px 4px`);
			addStyle('.sp-warning--char', `display:inline-block;line-height:16px;box-shadow:${spteColorChar} 0px 0px 0px 2px inset;background-color:white;padding:3px 4px`);
			addStyle('.sp-spaces--showing', 'display:inline-block;line-height:16px;background-color:deepskyblue;border:2px solid deepskyblue');
			addStyle('.sp-nbkspaces--showing', 'display:inline-block;line-height:16px;background-color:white;border:2px solid white');
		}

		function blackToolTip(spteBlackToolTip) {
			if (spteBlackToolTip && spteBlackToolTip === 'false') {
				addStyle('.actions:hover .sp-foreign-tooltip', 'display:none!important');
				addStyle('.actions:hover', 'cursor:pointer!important');
			}
		}

		function gpContentMaxWidth(spteEnlargeTable, spteGpcontentBig) {
			const enlargeTable = spteEnlargeTable !== 'false';
			const enlargeRest = spteGpcontentBig === 'true';

			if ((tableTranslations && enlargeTable) || (!tableTranslations && enlargeRest)) {
				addStyle('.gp-content', 'max-width: 85% !important');
			}
		}

		function getGlossaryRegex(glossary) {
			const badWordsRegexPattern = rulesById.get('badWords').regex.source;
			// On duplique chaque mot avec un s final pour pouvoir traiter les pluriels.
			const glossaryWithPlurals = glossary.reduce((a, i) => a.concat(i, `${i}s`), []);
			const glossaryRegexPattern = `${glossaryWithPlurals.join('(?=[\\s,:;"\']|$)|(?<=[\\s,:;"\']|^)(?<!«\\s)')}(?=[\\s,.:;"']|$)`;
			const newRgxBadWords = new RegExp(`${badWordsRegexPattern}|${glossaryRegexPattern}`, 'gm');
			rulesById.get('badWords').regex = newRgxBadWords;
		}

		function mainProcesses(spteSettings) {
			document.body.appendChild(spPopup);
			gpContentMaxWidth(spteSettings.spteEnlargeTable, spteSettings.spteGpcontentBig);
			if (spteSettings.spteBetterReadability && spteSettings.spteBetterReadability === 'true') { document.body.classList.add('sp-better-readability'); }

			const onFrenchLocale = (/\/fr\//).test(window.location.href);

			if (onFrenchLocale && gpContent && tableTranslations) {
				setColors(spteSettings.spteColorWord, spteSettings.spteColorQuote, spteSettings.spteColorChar);
				preventGlotDictTags();
				translations.forEach(checkTranslation);
				rowsDisplay();

				blackToolTip(spteSettings.spteBlackToolTip);
				displayResults();
				manageControls();
				buildHeader();
				if (isConnected) {
					observeMutations();
				}
				declareEvents();
			}

			if (onTranslateWordPressRoot && (frenchStatsGlobal || frenchLocaleCard)) {
				frenchiesGoFirst();
			}
			frenchFlag(spteSettings.spteFrenchFlag);
		}

		function launchProcess(spteSettings) {
			const hasExistingSettings = spteSettings !== undefined;
			spteSettings = spteSettings || {};
			const todayDate = new Date();
			if (spteSettings.spteActiveGlossary === 'false') {
				mainProcesses(spteSettings);
				return;
			}
			if (spteSettings.spteLastUpdateGlossary !== '' && spteSettings.spteGlossary !== '' && todayDate.toISOString().substring(0, 10) === spteSettings.spteLastUpdateGlossary) {
				getGlossaryRegex(spteSettings.spteGlossary);
				mainProcesses(spteSettings);
			} else {
				fetch(glossaryExportURL).then((response) => response.text()).then((dataGlossary) => {
					const rows = parseCsv(dataGlossary);
					const header = rows[0];
					const enIndex = header ? header.indexOf('en') : -1;
					const frIndex = header ? header.indexOf('fr') : -1;
					if (enIndex !== -1 && frIndex !== -1) {
						const entries = rows.slice(1)
							.filter((row) => !row.some((field) => field.toLowerCase().includes('spte') || field.toLowerCase().includes('[np]')));

						// Ne garde un terme anglais que si une traduction officielle diffère du mot lui-même
						// (sinon un mot identique en FR/EN, ex. « plugin », serait surligné à tort). Limitation
						// connue : un terme polysémique (ex. « support » nom/verbe) reste signalé dans tous les cas.
						const termsWithDifferentTranslation = new Set();
						entries.forEach((row) => {
							const en = (row[enIndex] || '').trim().toLowerCase();
							const fr = (row[frIndex] || '').trim().toLowerCase();
							if (en !== '' && fr !== '' && en !== fr) {
								termsWithDifferentTranslation.add(en);
							}
						});
						const difference = [...termsWithDifferentTranslation];

						getGlossaryRegex(difference);

						mainProcesses(spteSettings);

						let settings;
						if (hasExistingSettings) {
							settings = spteSettings;
							settings.spteLastUpdateGlossary = todayDate.toISOString().substring(0, 10);
							settings.spteGlossary = difference;
							settings.spteActiveGlossary = 'true';
						} else {
							settings = createDefaultSettings({
								spteLastUpdateGlossary: todayDate.toISOString().substring(0, 10),
								spteGlossary: difference,
							});
						}

						browser.storage.local.set({ spteSettings: settings }).catch(() => {
							console.log('Impossible d’initialiser les paramètres');
						});
					} else {
						// Format CSV inattendu (colonne "en" introuvable) : on ne bloque pas tout,
						// SPTE continue avec la liste de mots déconseillés déjà en place.
						console.log('Glossaire officiel : format inattendu, SPTE continue sans le glossaire à jour.');
						mainProcesses(spteSettings);
					}
				}).catch(() => {
					// Le téléchargement du glossaire a échoué (réseau, wp.org indisponible...) : sans ce
					// filet, mainProcesses() n'était jamais appelé et SPTE semblait totalement inactif,
					// sans le moindre indice pour comprendre pourquoi.
					console.log('Glossaire officiel : téléchargement impossible, SPTE continue sans le glossaire à jour.');
					mainProcesses(spteSettings);
				});
			}
		}

		browser.storage.local.get('spteSettings').then((data) => {
			launchProcess(data.spteSettings);
		});
	},
});
