// Moteur de règles typographiques de SPTE.
// Fusionne ce qui était auparavant 3 fichiers couplés à la main (data.js/regex.js/styles.js)
// en un seul tableau typé `rules: TypographyRule[]` — chaque règle porte désormais son
// identifiant, son texte et sa regex au même endroit, au lieu de clés de string recopiées
// séparément dans 3 fichiers différents.

// Données brutes utilisées pour construire les regex ci-dessous.
const data = {
	badWord: [
		'etes vous',
		'ets',
		'fdp',
		'font-sise',
		'limace',
		'limaces',
		'melle',
		'n4est',
		'plug-in',
		'plug-ins',
		'roter l’image',
		'roter l\'image',
		'responsif',
		's4est',
		// Anglicismes ajoutés le 2026-09-12, sélection resserrée depuis la table "Termes critiques"
		// de thierrypigot/wp-fr-typo (SKILL.md §3.2) : uniquement des mots qui n'ont jamais de sens
		// correct en français standard, quel que soit le contexte (contrairement à des mots de la
		// même table comme "paramètres" ou "motif", qui sont des mots français ordinaires ailleurs
		// et créeraient de faux positifs s'ils étaient ajoutés ici).
		'plugin',
		'greffon',
		'uploader',
		'downloader',
		'customiser',
		'updater',
		'mr',
		'sidebar',
		'shortcode',
		'tooltip',
		'breadcrumb',
		'changelog',
		'thumbnail',
		'addon',
		'add-on',
		'mu-plugin',
		'back-end',
		'front-end',
		'capabilities',
	],
	slash: '/',
	openHook: '[',
	openParenthesis: '(',
	openBrace: '{',
	ellipsis: '…',
	period: '.',
	comma: ',',
	closeHook: ']',
	closeParenthesis: ')',
	closeBrace: '}',
	exclamationPoint: '!',
	plusSign: '+',
	questionMark: '?',
	colon: ':',
	semiColon: ';',
	closingFrQuote: '»',
	openFrQuote: '«',
	fileExtensions: [
		'avi', 'bak', 'bat', 'bin', 'bmp', 'css', 'csv', 'doc', 'docx', 'eot',
		'exe', 'gif', 'git', 'github', 'htaccess', 'html', 'ico', 'ics', 'jpg',
		'jpeg', 'js', 'log', 'maintenance', 'mail', 'mo', 'mov', 'mp3', 'mp4',
		'mpeg', 'pdf', 'pem', 'php', 'po', 'pot', 'png', 'ppt', 'psd', 'ods',
		'rar', 'rtf', 'svg', 'sql', 'tar', 'gz', 'tiff', 'tif', 'ttf', 'txt',
		'vcf', 'wav', 'woff', 'xls', 'xlsx', 'xml', 'zip',
	],
};

// Échappe les données.
function escapeRegExp(str: string) {
	return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/gm, '\\$&');
}

const fileExtensions = data.fileExtensions.join('|');

// Contexte partagé par rgxColon/rgxComma : exclut un caractère quand il est entouré par un
// bloc `{{ }}` ou `[[ ]]` (interpolation JS, ex: {{foo:bar}}, [[a,b]]). Voir issue #27.
const doubleBracketGuard = '(?:(?<=\\{\\{[a-zA-Z0-9:,]*)(?=[a-zA-Z0-9:,]*\\}\\})|(?<=\\[\\[[a-zA-Z0-9:,]*)(?=[a-zA-Z0-9:,]*\\]\\]))';

// Détecte les mots déconseillés. https://github.com/Association-WPFR/SPTE/wiki/rgxBadWords
export const rgxBadWords = new RegExp(`(?<=[\\s,:;"']|^)(?<!«\\s)${data.badWord.map(escapeRegExp).join('(?=[\\s,.:;"\']|$)|(?<=[\\s,:;"\']|^)(?<!«\\s)')}(?=[\\s,.:;"']|$)`, 'gmi');

// Détecte les apostrophes droites et l'apostrophe courbe inversée (U+2018, à ne pas confondre
// avec U+2019 qui est la bonne apostrophe courbe et ne doit jamais être signalée).
// https://github.com/Association-WPFR/SPTE/wiki/rgxSingleQuotes
export const rgxSingleQuotes = new RegExp('(?<!href\\=|href\\=\'[a-z0-9.]*?|%[a-z])[\u0027\u2018]', 'gm');

// Détecte les guillemets doubles droits (à remplacer par des guillemets français « »). Exclut
// les guillemets d'un attribut HTML (href="...", title="..."), puisque le texte traité peut
// contenir du HTML inline. https://github.com/Association-WPFR/SPTE/wiki/rgxDoubleQuotes
export const rgxDoubleQuotes = new RegExp('(?<!href\\=|href\\="[^"]*?|title\\=|title\\="[^"]*?)"', 'gm');

// Détecte la barre oblique. https://github.com/Association-WPFR/SPTE/wiki/rgxSlash
export const rgxSlash = new RegExp(`(?<= |\u00a0)\\${data.slash}(?!\\${data.slash}|\\&gt\\;|\\}{2}|\\]{2})|(?<!\\${data.slash})\\${data.slash}(?= |\u00a0)`, 'gmi');

// Détecte le crochet ouvrant. https://github.com/Association-WPFR/SPTE/wiki/rgxOpenHook
export const rgxOpenHook = new RegExp(`(?<! |\\${data.openHook}|^)\\${data.openHook}(?!\\${data.openHook})|\\${data.openHook}(?=[ |\u00a0])`, 'gmi');

// Détecte la parenthèse ouvrante. https://github.com/Association-WPFR/SPTE/wiki/rgxOpenParenthesis
export const rgxOpenParenthesis = new RegExp(`(?<![ ]|^)\\${data.openParenthesis}(?!\\%|\\)|s\\)|x\\)|e\\)|es\\)|nt\\)|vent\\))|(?<!^)\\${data.openParenthesis}(?=[ |\u00a0])`, 'gmi');

// Détecte l’accolade ouvrante. https://github.com/Association-WPFR/SPTE/wiki/rgxOpenBrace
export const rgxOpenBrace = new RegExp(`(?<! |\\${data.openBrace}|^)\\${data.openBrace}(?!\\${data.openBrace})|\\${data.openBrace}(?=[ |\u00a0])(?![ \u00a0][a-zA-Z0-9]+\\${data.closeBrace})`, 'gmi');

// Détecte les points de suspension. https://github.com/Association-WPFR/SPTE/wiki/rgxEllipsis
export const rgxEllipsis = new RegExp(`(?<=[ |\u00a0])\\${data.ellipsis}|\\${data.ellipsis}(?=[a-zÀ-ú0-9]| $|\u00a0$)|\\.\\.\\.`, 'gmi');

// Détecte le point. https://github.com/Association-WPFR/SPTE/wiki/rgxPeriod
// NOTE (2026-09-12) : la 2e alternative ci-dessous est censée détecter un point collé entre
// deux mots minuscules sans espace (ex: "mot.mot"), mais ne se déclenche jamais en pratique —
// son lookbehind négatif `(?<![a-zÀ-ú0-9\.]*?)` matche toujours une chaîne vide (quantificateur
// paresseux avec minimum 0), ce qui neutralise la condition. Comportement conservé tel quel
// dans cette consolidation (pas de changement de logique non demandé) ; correction à faire
// séparément, avec un test dédié qui verrouille le comportement voulu une fois fixé.
export const rgxPeriod = new RegExp(`(?<= |\u00a0)\\${data.period}(?!${fileExtensions})|(?<![a-zÀ-ú0-9\\${data.period}]*?)\\${data.period}(?=[a-zÀ-ú0-9])|\\${data.period}( $|\u00a0$)`, 'gmi');

// Détecte la virgule. https://github.com/Association-WPFR/SPTE/wiki/rgxComma
export const rgxComma = new RegExp(`(?<=[ |\u00a0])\\${data.comma}(?!${doubleBracketGuard})|\\${data.comma}(?!${doubleBracketGuard})(?=[a-zÀ-ú]| $|\u00a0$)`, 'gmi');

// Détecte le crochet fermant. https://github.com/Association-WPFR/SPTE/wiki/rgxCloseHook
export const rgxCloseHook = new RegExp(`(?<=[ |\u00a0])\\${data.closeHook}|(?<!\\${data.closeHook})\\${data.closeHook}(?=[a-zÀ-ú0-9]| $|\u00a0$)`, 'gmi');

// Détecte la parenthèse fermante. https://github.com/Association-WPFR/SPTE/wiki/rgxCloseParenthesis
export const rgxCloseParenthesis = new RegExp(`(?<= |\u00a0|\\([a-d]|\\([f-r]|\\([t-w]|\\([y-z])\\${data.closeParenthesis}|\\${data.closeParenthesis}(?=[a-rt-zÀ-ú0-9]\u00a0$|\u00a0[a-zÀ-ú]{2,})`, 'gmi');

// Détecte l’accolade fermante. https://github.com/Association-WPFR/SPTE/wiki/rgxCloseBrace
export const rgxCloseBrace = new RegExp(`(?<=[ |\u00a0])\\${data.closeBrace}|(?<!\\${data.closeBrace})\\${data.closeBrace}(?=[a-zÀ-ú0-9]|\u00a0| $|\u00a0$)`, 'gmi');

// Détecte le point d’exclamation. https://github.com/Association-WPFR/SPTE/wiki/rgxExclamationPoint
export const rgxExclamationPoint = new RegExp(`(?<!\u00a0|^)\\${data.exclamationPoint}(?!important)|\\${data.exclamationPoint}(?!important)(?! |$)`, 'gmi');

// Détecte le signe plus. https://github.com/Association-WPFR/SPTE/wiki/rgxPlusSign
export const rgxPlusSign = new RegExp(`(?<!\u00a0|google|^)\\${data.plusSign}|\\${data.plusSign}(?! |$)`, 'gmi');

// Détecte le point d’interrogation. https://github.com/Association-WPFR/SPTE/wiki/rgxQuestionMark
export const rgxQuestionMark = new RegExp(`(?<!\u00a0|\\/|\\.php|\\/[a-z0-9\\-\\#\\.\\_]*?|^)\\${data.questionMark}|(?<!\\/|\\.php|\\/[a-z0-9\\-\\#\\.\\_]*?|^)\\${data.questionMark}(?! |$)`, 'gmi');

// Détecte les deux points. https://github.com/Association-WPFR/SPTE/wiki/rgxColon
export const rgxColon = new RegExp(`(?<!\u00a0|https|http| \\d{2}|\u00a0\\d{2}| hh|\u00a0hh| mm|\u00a0mm| aaaa|\u00a0aaaa|(?<![a-zA-Z])[gsiahymd])${data.colon}(?!${doubleBracketGuard})(?= )|(?<=\u00a0)${data.colon}(?! |$)|(?<!\u00a0|https|http| \\d{2}|\u00a0\\d{2}| hh|\u00a0hh| mm|\u00a0mm| aaaa|\u00a0aaaa|(?<![a-zA-Z])[gsiahymd])${data.colon}(?!${doubleBracketGuard})(?! )`, 'gmi');

// Détecte le point-virgule. https://github.com/Association-WPFR/SPTE/wiki/rgxSemiColon
export const rgxSemiColon = new RegExp(`(?<!\u00a0|:[a-z0-9.]*?|&[${data.semiColon}a-z0-9#]*?)${data.semiColon}(?!$)|(?<!:[a-z0-9.]*?|&[${data.semiColon}a-z0-9#]*?)${data.semiColon}(?! |$)`, 'gmi');

// Détecte le guillemet français fermant. https://github.com/Association-WPFR/SPTE/wiki/rgxClosingFrQuote
export const rgxClosingFrQuote = new RegExp(`(?<!\u00a0)${data.closingFrQuote}|${data.closingFrQuote}(?! |\\.|\\,|\u00a0\\?|\u00a0\\!|\u00a0\\:|\u00a0\\;|$)`, 'gmi');

// Détecte le guillemet français ouvrant. https://github.com/Association-WPFR/SPTE/wiki/rgxOpenFrQuote
export const rgxOpenFrQuote = new RegExp(`(?<! |^)${data.openFrQuote}|${data.openFrQuote}(?!\u00a0|$)`, 'gmi');

// Détecte un point médian mal formé (écriture épicène) : caractère de substitution
// (point, tiret, astérisque) utilisé à la place du vrai point médian U+00B7 (·).
// Validation uniquement (le point médian correctement formé n'est jamais signalé) —
// pas de détection de l'ABSENCE d'écriture inclusive, ni de suggestion de reformulation,
// décision de Jason (2026-09-12) pour ce premier jet, cf. TODO.md.
export const rgxEpicenePunctuation = /(?<=[a-zÀ-ú])[.\-*](?:e|rice|trice|ve|euse|esse|ale|ère|enne|ienne|elle)(?:[.\-*]s)?(?=[\s,.;:!?)»]|$)/gm;

export const charTitle = 'Caractères à vérifier : ';
export const charClass = 'sp-warning--char';
const spaceBeforeTitle = 'Espace précédente manquante ou espace suivante en trop';
const spaceAfterTitle = 'Précédé par une espace ou caractère suivant collé ou suivi par une espace finale';
const nbkSpaceBeforeTitle = 'Non précédé par une espace insécable ou non suivi par une espace';
const nbkSpaceAfterTitle = 'Non précédé par une espace ou non suivi par une espace insécable';

// 'certain' (rouge) : erreur avérée. 'toVerify' (rose) : nécessite une relecture humaine,
// jamais de correction automatique (cf. TODO.md, Phase 5). 'info' : simple indicateur visuel
// (espaces rendues visibles), ni une erreur ni une hypothèse à vérifier.
export type RuleSeverity = 'certain' | 'toVerify' | 'info';

export interface TypographyRule {
	id: string;
	name: string;
	title: string;
	message: string;
	severity: RuleSeverity;
	cssClass: string;
	counter: number;
	regex: RegExp;
}

export const rules: TypographyRule[] = [
	{
		id: 'badWords',
		name: '',
		title: 'Mots déconseillés ou mal orthographiés : ',
		message: 'Mot déconseillé ou mal orthographié',
		severity: 'certain',
		cssClass: 'sp-warning--word',
		counter: 0,
		regex: rgxBadWords,
	},
	{
		id: 'quotes',
		name: 'apostrophe droite',
		title: 'Apostrophes droites : ',
		message: 'Apostrophe droite au lieu d’une apostrophe courbe',
		severity: 'certain',
		cssClass: 'sp-warning--quote',
		counter: 0,
		regex: rgxSingleQuotes,
	},
	{
		id: 'doubleQuotes',
		name: 'guillemet double droit',
		title: 'Guillemets doubles droits : ',
		message: 'Guillemet double droit au lieu des guillemets français « »',
		severity: 'certain',
		cssClass: 'sp-warning--quote',
		counter: 0,
		regex: rgxDoubleQuotes,
	},
	{
		id: 'slash',
		name: 'barre oblique',
		title: charTitle,
		message: 'Espace précédente en trop ou espace suivante en trop',
		severity: 'toVerify',
		cssClass: charClass,
		counter: 0,
		regex: rgxSlash,
	},
	{
		id: 'openHook',
		name: 'crochet ouvrant',
		title: charTitle,
		message: spaceBeforeTitle,
		severity: 'toVerify',
		cssClass: charClass,
		counter: 0,
		regex: rgxOpenHook,
	},
	{
		id: 'openParenthesis',
		name: 'parenthèse ouvrante',
		title: charTitle,
		message: spaceBeforeTitle,
		severity: 'toVerify',
		cssClass: charClass,
		counter: 0,
		regex: rgxOpenParenthesis,
	},
	{
		id: 'openBrace',
		name: 'accolade ouvrante',
		title: charTitle,
		message: spaceBeforeTitle,
		severity: 'toVerify',
		cssClass: charClass,
		counter: 0,
		regex: rgxOpenBrace,
	},
	{
		id: 'ellipsis',
		name: 'points de suspension',
		title: charTitle,
		message: spaceAfterTitle,
		severity: 'toVerify',
		cssClass: charClass,
		counter: 0,
		regex: rgxEllipsis,
	},
	{
		id: 'period',
		name: 'point',
		title: charTitle,
		message: spaceAfterTitle,
		severity: 'toVerify',
		cssClass: charClass,
		counter: 0,
		regex: rgxPeriod,
	},
	{
		id: 'comma',
		name: 'virgule',
		title: charTitle,
		message: spaceAfterTitle,
		severity: 'toVerify',
		cssClass: charClass,
		counter: 0,
		regex: rgxComma,
	},
	{
		id: 'closeHook',
		name: 'crochet fermant',
		title: charTitle,
		message: spaceAfterTitle,
		severity: 'toVerify',
		cssClass: charClass,
		counter: 0,
		regex: rgxCloseHook,
	},
	{
		id: 'closeParenthesis',
		name: 'parenthèse fermante',
		title: charTitle,
		message: spaceAfterTitle,
		severity: 'toVerify',
		cssClass: charClass,
		counter: 0,
		regex: rgxCloseParenthesis,
	},
	{
		id: 'closeBrace',
		name: 'accolade fermante',
		title: charTitle,
		message: spaceAfterTitle,
		severity: 'toVerify',
		cssClass: charClass,
		counter: 0,
		regex: rgxCloseBrace,
	},
	{
		id: 'exclamationPoint',
		name: 'point d’exclamation',
		title: charTitle,
		message: nbkSpaceBeforeTitle,
		severity: 'toVerify',
		cssClass: charClass,
		counter: 0,
		regex: rgxExclamationPoint,
	},
	{
		id: 'plusSign',
		name: 'signe plus',
		title: charTitle,
		message: nbkSpaceBeforeTitle,
		severity: 'toVerify',
		cssClass: charClass,
		counter: 0,
		regex: rgxPlusSign,
	},
	{
		id: 'questionMark',
		name: 'point d’interrogation',
		title: charTitle,
		message: nbkSpaceBeforeTitle,
		severity: 'toVerify',
		cssClass: charClass,
		counter: 0,
		regex: rgxQuestionMark,
	},
	{
		id: 'colon',
		name: 'deux points',
		title: charTitle,
		message: nbkSpaceBeforeTitle,
		severity: 'toVerify',
		cssClass: charClass,
		counter: 0,
		regex: rgxColon,
	},
	{
		id: 'semiColon',
		name: 'point-virgule',
		title: charTitle,
		message: nbkSpaceBeforeTitle,
		severity: 'toVerify',
		cssClass: charClass,
		counter: 0,
		regex: rgxSemiColon,
	},
	{
		id: 'closingFrQuote',
		name: 'guillemet français fermant',
		title: charTitle,
		message: nbkSpaceBeforeTitle,
		severity: 'toVerify',
		cssClass: charClass,
		counter: 0,
		regex: rgxClosingFrQuote,
	},
	{
		id: 'openFrQuote',
		name: 'guillemet français ouvrant',
		title: charTitle,
		message: nbkSpaceAfterTitle,
		severity: 'toVerify',
		cssClass: charClass,
		counter: 0,
		regex: rgxOpenFrQuote,
	},
	{
		id: 'epicenePunctuation',
		name: 'point médian mal formé',
		title: charTitle,
		message: 'Le point médian de l’écriture inclusive doit utiliser le caractère · (U+00B7), pas un point, un tiret ou un astérisque',
		severity: 'toVerify',
		cssClass: charClass,
		counter: 0,
		regex: rgxEpicenePunctuation,
	},
	{
		id: 'Space',
		name: 'espace sécable',
		title: '',
		message: 'Espace en début ou en fin de chaîne',
		severity: 'info',
		cssClass: 'sp-spaces--showing',
		counter: 0,
		regex: /^ | $| {2}/gm,
	},
	{
		id: 'nbkSpaces',
		name: 'espace insécable',
		title: '',
		message: 'Espace insécable',
		severity: 'info',
		cssClass: 'sp-nbkspaces--showing',
		counter: 0,
		regex: /\u00A0/gm,
	},
];
