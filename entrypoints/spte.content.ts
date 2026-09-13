// @ts-nocheck
// Conversion mécanique depuis spte.js (comportement inchangé). Le vrai typage de ce fichier
// est prévu en Phase 3 (consolidation du moteur de règles), pas dans cette conversion WXT.
import { rules, charTitle, charClass } from '../utils/rules';
import { addStyle, createElement, parseCsv } from '../utils/helpers';
import './style.css';

export default defineContentScript({
	matches: ['https://translate.wordpress.org/*'],
	main() {
		// Accès rapide à une règle par son id (remplace l'accès direct par clé d'objet
		// de l'ancien format `cases[id]`, devenu un tableau `rules: TypographyRule[]`).
		const rulesById = new Map(rules.map((rule) => [rule.id, rule]));
		// Vérification de la localisation.
		const onTranslateWordPressRoot = (/https:\/\/translate\.wordpress\.org\//).test(window.location.href);

		// SLUG (identifiant de la locale) : dérivé du chemin de l'URL (/projects/.../<locale>/<set>/
		// ou /locale/<locale>/...), en ne retenant le segment que s'il ressemble vraiment à un slug
		// de locale GlotPress (ex: fr, fr-be, fr-ca) — sinon on retombe sur 'fr' comme avant, plutôt
		// que de retenir un segment de chemin qui n'a rien à voir (ex: 'wp-plugins', 'default').
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
		// Export CSV officiel du glossaire (colonnes en,fr,pos,description), plus robuste que le
		// scraping HTML de la page ci-dessus qui servait auparavant à la fois d'affichage et de source de données.
		const glossaryExportURL = `${glossaryURL}-export/`;

		// Réglages (localStorage ne gère pas les booléens).
		let lsHideCaption = localStorage.getItem('spteHideCaption') === 'true';
		let lsShowOnlyWarning = localStorage.getItem('spteShowOnlyWarning') === 'true';

		// Principaux éléments existants.
		const gpContent = document.querySelector('.gp-content');
		if (gpContent) { gpContent.style.maxWidth = '85% !important'; }
		const translations = document.querySelectorAll('tr.preview:not(.sp-has-spte-error) .translation-text');
		const bulkActions = document.querySelector('#bulk-actions-toolbar-top');
		if (bulkActions) {
			document.body.classList.add('sp-pte-is-on-board');
		}
		const tableTranslations = document.querySelector('#translations');
		const filterToolbar = document.querySelector('.filter-toolbar');
		const filterToolbarsDiv = document.querySelector('.filters-toolbar>div:first-child');
		const isConnected = document.querySelector('body.logged-in') !== null;
		const GDmayBeOnBoard = localStorage.getItem('gd_language') !== null;

		// Principaux éléments créés.
		const gpSeparator = createElement('SPAN', { class: 'separator' }, '•');
		const spPopup = createElement('DIV', { id: 'sp-the-popup', class: 'sp-the-popup--hidden', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Résultats de cohérence', tabindex: '-1' });
		const spGDNoticesContainer = createElement('DIV', { id: 'sp-gd-notices-container' });
		const spConsistency = createElement('DIV', { id: 'sp-consist-container' });
		const spConsistencyLabel = createElement('LABEL', { for: 'sp-consist__text' }, 'Cohérence d’une chaîne');
		const spConsistencyInputText = createElement('INPUT', { type: 'text', id: 'sp-consist__text', name: 'spConsistencyInputText', value: '' });
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
		const spFilters = createElement('DIV', { class: 'sp-controls__filters' }, 'Afficher  ');
		const showEverything = createElement('INPUT', { type: 'radio', id: 'sp-show-all-translations', name: 'showEverything', value: 'showEverything', checked: 'checked' });
		const showEverythingLabel = createElement('LABEL', { for: 'sp-show-all-translations' }, 'Tout');
		const showOnlyWarning = createElement('INPUT', { type: 'radio', id: 'sp-show-only-warnings', name: 'showOnlyWarning', value: 'showOnlyWarning' });
		const showOnlyWarningLabel = createElement('LABEL', { for: 'sp-show-only-warnings' }, 'Les avertissements');
		showEverything.checked = lsShowOnlyWarning ? '' : 'checked';
		showOnlyWarning.checked = lsShowOnlyWarning ? 'checked' : '';
		spFilters.append(showEverything, showEverythingLabel, showOnlyWarning, showOnlyWarningLabel);

		const pteControls = createElement('DIV', { class: 'sp-controls__pte' });
		const spSelectErrors = createElement('INPUT', { type: 'checkbox', id: 'sp-select-errors', name: 'spteSelectErrors', value: 'spteSelectErrors' });
		const spSelectErrorsLabel = createElement('LABEL', { for: 'sp-select-errors' }, 'Cocher les mots et apostrophes');
		if (bulkActions) {
			pteControls.append(spSelectErrors, spSelectErrorsLabel);
		}

		// Éléments spécifiques à la locale française.
		const frenchLocale = document.querySelector('#locales .english a[href="/locale/fr/"]');
		const frenchStatsGlobal = document.querySelector('#stats-table tr a[href*="/locale/fr/"]');
		const frenchStatsSpecific = document.querySelector('#translation-sets tr a[href*="/fr/"]');

		// Empêche les balises de GlotDict dans l’aperçu en forçant ses réglages, car quand GlotDict s’exécute après SPTE, il ne s’attend pas à trouver des balises et peut planter.
		function preventGlotDictTags() {
			localStorage.setItem('gd_curly_apostrophe_highlight', 'true');
			localStorage.setItem('gd_non_breaking_space_highlight', 'true');
		}

		// Affiche la chaîne traduite sans aucune balise.
		function addForeignToolTip(translation) {
			const preview = translation.closest('tr');
			const translated = preview && preview.querySelector('.translation-text');
			// td.actions n'existe pas sur toutes les lignes (ex: utilisateur non connecté,
			// sans les droits pour valider/modifier) : on ignore cette ligne plutôt que de
			// planter tout le traitement des lignes suivantes.
			const hook = preview && preview.querySelector('td.actions');
			if (!hook || !translated) {
				return;
			}
			hook.style.position = 'relative';
			const toolTip = createElement('SPAN', { class: 'sp-foreign-tooltip' });
			toolTip.innerHTML = translated.innerHTML;
			hook.append(toolTip);
		}

		// Clone l’aperçu surligné dans le panneau d’édition.
		function addEditorHighlighter(translation) {
			const preview = translation.closest('tr');
			const brother = preview.nextElementSibling;
			const brotherHighlighter = brother.querySelector('.sp-editor-highlighter') || null;
			if (brotherHighlighter) {
				brother.querySelector('.sp-editor-highlighter').parentNode.removeChild(brother.querySelector('.sp-editor-highlighter'));
			}
			if (preview.classList.contains('has-translations')) {
				const help = createElement('DIV', { class: 'sp-editor-highlighter' });
				const trad = preview.querySelector('.translation-text');
				const hook = brother.querySelector('.source-details');
				const copycat = trad.cloneNode(true);
				help.append(copycat);
				if (hook) {
					hook.append(help);
				}
			}
		}

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

		// Affichage des lignes.
		function rowsDisplay() {
			if (lsShowOnlyWarning) {
				document.querySelectorAll('tr.preview:not(.sp-has-spte-warning)').forEach((el) => {
					el.style.display = 'none';
					if (bulkActions) {
						// On décoche les éléments masqués pour éviter un traitement en masse des lignes non visibles.
						el.firstElementChild.firstElementChild.checked = '';
					}
				});
			}
			if (!lsShowOnlyWarning) {
				document.querySelectorAll('tr.preview:not(.sp-has-spte-warning)').forEach((el) => {
					el.style.display = 'table-row';
				});
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

			// on mémorise le texte sans les balises.
			let textWithoutTags = text.replaceAll(/&lt;.*?(?<!\/)&gt;/gmi, '');
			// pour chaque règle typographique...
			for (const rule of rules) {
				text = text.replace(rule.regex, (string) => {
					// Si le cas est présent dans le texte mais pas dans textWithoutTags, il ne doit pas être traité.
					if (!textWithoutTags.match(rule.regex)) {
						// Ce qui est IMPORTANT dans ce procédé pour éviter les vérifications à l’intérieur des balises,
						// c’est que l’ordre de "replace(rule.regex)" soit le même que celui du "textWithoutTags.replace(string, '')" qui suit,
						// et que seul le premier élément de "textWithoutTags.match(rule.regex)" soit vérifié ici.
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
						const ariaName = (rule.id === 'badWords') ? `${string}. ` : `${rule.name}. `;
						// ariaName se termine déjà par une espace : ne pas en ajouter une seconde ici.
						// Un double espace généré dans cet attribut peut être re-détecté par la règle
						// "espace en double" lors d'un passage ultérieur de la boucle, qui insère alors
						// son propre <span> à l'intérieur de cet attribut et casse le balisage HTML
						// (bug confirmé en conditions réelles le 2026-09-14, voir TODO.md).
						const ariaLabel = (rule.id === 'Space' || rule.id === 'nbkSpaces') ? `${rule.message}` : `${ariaName}${rule.message}`;
						const tooltip = (rule.id === 'Space' || rule.id === 'nbkSpaces') ? `${rule.message}` : `&#171; ${string} &#187;&#10; ${rule.message}`;

						textWithoutTags = textWithoutTags.replace(string, '');
						return `<span tabindex="0" aria-label="${ariaLabel}" data-message="${tooltip}" class="${rule.cssClass}">${string}</span>`;
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
			e.target.textContent = (e.target.textContent === 'Masquer la légende') ? '' : 'Masquer la légende';
			localStorage.setItem('spteHideCaption', ((lsHideCaption === true) ? 'true' : 'false'));
			e.preventDefault();
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
						counter.textContent = Number(counter.textContent) + rule.counter;
					} else {
						const title = createElement('SPAN', {}, rule.title);
						counter = createElement('SPAN', { class: `${rule.cssClass} sp-warning-title` }, rule.counter);
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
				counter.textContent = nbCharacter;
			} else if (nbCharacter) {
				counter = createElement('SPAN', { class: `${charClass} sp-warning-title` }, nbCharacter);
				title.append(counter);
				resultsData.append(title);
			}

			resultsTitle.textContent = `éléments à vérifier : ${nbTotal}`;

			if (nbTotal && !resultsTitle.classList.contains('sp-results__title')) {
				resultsTitle.classList.add('sp-results__title');
				if (lsHideCaption) {
					hideCaption.textContent = '';
					resultsCaption.classList.add('sp-results__captions--closed');
				} else {
					hideCaption.textContent = 'Masquer la légende';
				}
				hideCaption.onclick = toggleCaption;
				resultsCaption.append(hideCaption, caption, glossaryLink, typographyLink);
				filterToolbar.append(results);
			}
			const characters = document.querySelector('.sp-warning-title.sp-warning--char');
			if (nbCharacter === 0 && characters) {
				characters.parentNode.remove();
			}
			const quotes = document.querySelector('.sp-warning-title.sp-warning--quote');
			if (rulesById.get('quotes').counter === 0 && rulesById.get('doubleQuotes').counter === 0 && quotes) {
				quotes.parentNode.remove();
			}
		}

		// Gère les contrôles.
		function manageControls() {
			if (!showOnlyWarning || !showEverything) { return; }

			showOnlyWarning.addEventListener('click', () => {
				showOnlyWarning.checked = 'checked';
				showEverything.checked = '';
				localStorage.setItem('spteShowOnlyWarning', 'true');
				lsShowOnlyWarning = true;
				rowsDisplay();
			});
			showEverything.addEventListener('click', () => {
				showEverything.checked = 'checked';
				showOnlyWarning.checked = '';
				localStorage.setItem('spteShowOnlyWarning', 'false');
				lsShowOnlyWarning = false;
				rowsDisplay();
			});

			if (!spSelectErrors) { return; }

			spSelectErrors.addEventListener('change', () => {
				let nbSelectedRows = 0;
				if (spSelectErrors.checked) {
					document.querySelectorAll('tr.preview.sp-has-spte-error').forEach((el) => {
						el.firstElementChild.firstElementChild.checked = 'checked';
						nbSelectedRows++;
					});
				} else {
					document.querySelectorAll('tr.preview.sp-has-spte-error').forEach((el) => {
						el.firstElementChild.firstElementChild.checked = '';
					});
					nbSelectedRows = 0;
				}
				if (document.querySelector('#gd-checked-count')) {
					document.querySelector('#gd-checked-count').remove();
				}
				if (nbSelectedRows === 0) { return; }
				const GDCountNotice = createElement('DIV', { id: 'gd-checked-count', class: 'notice' }, `${nbSelectedRows} ligne(s) sélectionnée(s)`);
				tableTranslations.parentNode.insertBefore(GDCountNotice, tableTranslations);
			});
		}

		// Spécifique à la page de translate.wordpress.org, fait remonter la locale FR en premier pour y accéder plus facilement.
		function frenchiesGoFirst() {
			const frenchLocaleDiv = frenchLocale.closest('div.locale');
			const firstLocaleDiv = document.querySelector('div.locale:first-child');
			if (firstLocaleDiv && frenchLocaleDiv && !GDmayBeOnBoard) {
				firstLocaleDiv.before(frenchLocaleDiv);
			}
		}

		// Ajoute un drapeau français sur la locale française dans les différents tableaux pour mieux l’identifier.
		function frenchFlag(spteFrenchFlag) {
			if (spteFrenchFlag && spteFrenchFlag === 'false') { return; }
			const frenchLocaleClone = document.querySelector('#locales .gd-locale-moved .english a[href="/locale/fr/"]');
			if (frenchLocaleClone) {
				frenchLocaleClone.classList.add('sp-frenchies');
			} else if (frenchLocale) {
				frenchLocale.classList.add('sp-frenchies');
			}

			if (frenchStatsSpecific) {
				frenchStatsSpecific.classList.add('sp-frenchies', 'sp-frenchies--long');
			}
			if (frenchStatsGlobal) {
				frenchStatsGlobal.classList.add('sp-frenchies');
			}
		}

		// Observe les mutations.
		function observeMutations() {
			const observerMutations = new MutationObserver((mutations) => {
				let removedRowID;
				let addedRowID;
				let oldStatus;
				let newStatus;
				let translation;
				mutations.forEach((mutation) => {
					mutation.removedNodes.forEach((removedNode) => {
						if (!removedRowID && !oldStatus && removedNode.nodeName === 'TR' && removedNode.classList.contains('preview')) {
							removedRowID = removedNode.id;
							if (removedNode.classList.contains('untranslated')) {
								oldStatus = 'untranslated';
							} else {
								oldStatus = removedNode.classList.value.match('(?<=status-)(\\w*)(?= )')[0];
							}
						}
					});

					mutation.addedNodes.forEach((addedNode) => {
						if (addedNode.nodeType !== 1) {	return;	}

						// Lignes correspondant à des changements de statut.
						if (!addedRowID && !newStatus && addedNode.nodeName === 'TR' && addedNode.classList.contains('preview')) {
							addedRowID = addedNode.id;
							newStatus = addedNode.classList.value.match('(?<=status-)(\\w*)(?= )')[0];
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
			filterToolbar.append(spControls);
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

		function gpContentMaxWidth(spteGpcontentBig, spteGpcontentMaxWitdh) {
			spteGpcontentMaxWitdh = spteGpcontentMaxWitdh === '' ? 0 : spteGpcontentMaxWitdh;

			if (tableTranslations || (spteGpcontentBig && spteGpcontentBig === 'true' && parseInt(spteGpcontentMaxWitdh, 10) === 0)) {
				addStyle('.gp-content', 'max-width: 85% !important');
			} else if (!tableTranslations && spteGpcontentBig && spteGpcontentBig === 'true' && parseInt(spteGpcontentMaxWitdh, 10) !== 0) {
				addStyle('.gp-content', `max-width: ${parseInt(spteGpcontentMaxWitdh, 10)}% !important`);
			}
		}

		function isOnAcceptableLocale(slugs) {
			let onAcceptableLocale = false;
			slugs = slugs.replace(/;\s*$/, '');
			if (slugs.includes(';')) {
				slugs.split(';').forEach((otherLocale) => {
					if (onAcceptableLocale) { return; }
					onAcceptableLocale = (new RegExp(`/${otherLocale}/`, 'gi')).test(window.location.href);
				});
			} else {
				onAcceptableLocale = (new RegExp(`/${slugs}/`, 'gi')).test(window.location.href);
			}
			return onAcceptableLocale;
		}

		function getGlossaryRegex(glossary) {
			const badWordsRegexPattern = rulesById.get('badWords').regex.source;
			// on duplique chaque mot avec un s final pour pouvoir traiter les pluriels.
			const glossaryWithPlurals = glossary.reduce((a, i) => a.concat(i, `${i}s`), []);
			const glossaryRegexPattern = `${glossaryWithPlurals.join('(?=[\\s,:;"\']|$)|(?<=[\\s,:;"\']|^)(?<!«\\s)')}(?=[\\s,.:;"']|$)`;
			const newRgxBadWords = new RegExp(`${badWordsRegexPattern}|${glossaryRegexPattern}`, 'gm');
			rulesById.get('badWords').regex = newRgxBadWords;
		}

		function mainProcesses(spteSettings) {
			document.body.appendChild(spPopup);
			gpContentMaxWidth(spteSettings.spteGpcontentBig, spteSettings.spteGpcontentMaxWitdh);
			if (spteSettings.spteBetterReadability && spteSettings.spteBetterReadability === 'true') { document.body.classList.add('sp-better-readability'); }

			const onFrenchLocale = (/\/fr\//).test(window.location.href);
			let onOtherLocale = false;
			if (!onFrenchLocale && spteSettings.spteOtherSlugs) {
				onOtherLocale = isOnAcceptableLocale(spteSettings.spteOtherSlugs);
			}

			if ((onFrenchLocale || onOtherLocale) && gpContent && tableTranslations) {
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

			if (onTranslateWordPressRoot && frenchLocale) {
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

						// On ne garde un terme anglais que si au moins une de ses traductions officielles
						// diffère du mot anglais lui-même (sinon rien à signaler : un mot identique en
						// français et en anglais, ex. « dimensions », « plugin », ne doit pas être surligné
						// à chaque occurrence légitime). Ne résout pas le cas d'un terme ayant plusieurs sens
						// dont un seul diffère (ex. « support » nom vs verbe) : ça reste signalé, faute de
						// pouvoir distinguer le sens utilisé dans la traduction — limitation connue.
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

						let settings = {};
						if (hasExistingSettings) {
							settings = spteSettings;
							settings.spteLastUpdateGlossary = todayDate.toISOString().substring(0, 10);
							settings.spteGlossary = difference;
							settings.spteActiveGlossary = 'true';
						} else {
							settings = {
								spteColorWord: '',
								spteColorQuote: '',
								spteColorChar: '',
								spteBlackToolTip: 'checked',
								spteBetterReadability: '',
								spteOtherSlugs: '',
								spteFrenchFlag: 'checked',
								spteGpcontentBig: '',
								spteGpcontentMaxWitdh: '',
								spteActiveGlossary: 'checked',
								spteLastUpdateGlossary: todayDate.toISOString().substring(0, 10),
								spteGlossary: difference,
							};
						}

						browser.storage.local.set({ spteSettings: settings }, () => {
							if (browser.runtime.error) {	console.log('Impossible d’initialiser les paramètres'); }
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

		browser.storage.local.get('spteSettings', (data) => {
			if (browser.runtime.error) { return; }
			launchProcess(data.spteSettings);
		});
	},
});
