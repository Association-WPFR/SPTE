import { data } from './data';

// Échappe les données.
function escapeRegExp(str: string) {
	return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/gm, '\\$&');
}

const fileExtensions = data.fileExtensions.join('|');

// Détecte les mots déconseillés. https://github.com/Association-WPFR/SPTE/wiki/rgxBadWords
export const rgxBadWords = new RegExp(`(?<=[\\s,:;"']|^)(?<!«\\s)${data.badWord.map(escapeRegExp).join('(?=[\\s,.:;"\']|$)|(?<=[\\s,:;"\']|^)(?<!«\\s)')}(?=[\\s,.:;"']|$)`, 'gmi');

// Détecte les apostrophes droites. https://github.com/Association-WPFR/SPTE/wiki/rgxSingleQuotes
export const rgxSingleQuotes = new RegExp('(?<!href\\=|href\\=\'[a-z0-9.]*?|%[a-z])\u0027', 'gm');

// Détecte la barre oblique. https://github.com/Association-WPFR/SPTE/wiki/rgxSlash
export const rgxSlash = new RegExp(`(?<= |\u00a0)\\${data.slash}(?!\\${data.slash}|\\&gt\\;|\\}{2}|\\]{2})|(?<!\\${data.slash})\\${data.slash}(?= |\u00a0)`, 'gmi');

// Détecte le crochet ouvrant. https://github.com/Association-WPFR/SPTE/wiki/rgxOpenHook
export const rgxOpenHook = new RegExp(`(?<! |\\${data.openHook}|^)\\${data.openHook}(?!\\${data.openHook})|\\${data.openHook}(?=[ |\u00a0])`, 'gmi');

// Détecte la parenthèse ouvrante. https://github.com/Association-WPFR/SPTE/wiki/rgxOpenParenthesis
export const rgxOpenParenthesis = new RegExp(`(?<![ ]|^)\\${data.openParenthesis}(?!\\%|\\)|s\\)|x\\)|e\\)|es\\)|nt\\)|vent\\))|(?<!^)\\${data.openParenthesis}(?=[ |\u00a0])`, 'gmi');

// Détecte l’accolade ouvrante. https://github.com/Association-WPFR/SPTE/wiki/rgxOpenBrace
export const rgxOpenBrace = new RegExp(`(?<! |\\${data.openBrace}|^)\\${data.openBrace}(?!\\${data.openBrace})|\\${data.openBrace}(?=[ |\u00a0])`, 'gmi');

// Détecte les points de suspension. https://github.com/Association-WPFR/SPTE/wiki/rgxEllipsis
export const rgxEllipsis = new RegExp(`(?<=[ |\u00a0])\\${data.ellipsis}|\\${data.ellipsis}(?=[a-zÀ-ú0-9]| $|\u00a0$)`, 'gmi');

// Détecte le point. https://github.com/Association-WPFR/SPTE/wiki/rgxPeriod
export const rgxPeriod = new RegExp(`(?<= |\u00a0)\\${data.period}(?!${fileExtensions})|(?<![a-zÀ-ú0-9\\${data.period}]*?)\\${data.period}(?=[a-zÀ-ú0-9])|\\${data.period}( $|\u00a0$)`, 'gmi');

// Détecte la virgule. https://github.com/Association-WPFR/SPTE/wiki/rgxComma
export const rgxComma = new RegExp(`(?<=[ |\u00a0])\\${data.comma}|\\${data.comma}(?=[a-zÀ-ú]| $|\u00a0$)`, 'gmi');

// Détecte le crochet fermant. https://github.com/Association-WPFR/SPTE/wiki/rgxCloseHook
export const rgxCloseHook = new RegExp(`(?<=[ |\u00a0])\\${data.closeHook}|(?<!\\${data.closeHook})\\${data.closeHook}(?=[a-zÀ-ú0-9]| $|\u00a0$)`, 'gmi');

// Détecte la parenthèse fermante. https://github.com/Association-WPFR/SPTE/wiki/rgxCloseParenthesis
export const rgxCloseParenthesis = new RegExp(`(?<= |\u00a0|\\([a-d]|\\([f-r]|\\([t-w]|\\([y-z])\\${data.closeParenthesis}|\\${data.closeParenthesis}(?=[a-rt-zÀ-ú0-9]\u00a0$|\u00a0[a-zÀ-ú]{2,})`, 'gmi');

// Détecte l’accolade fermante. https://github.com/Association-WPFR/SPTE/wiki/rgxCloseBrace
export const rgxCloseBrace = new RegExp(`(?<=[ |\u00a0])\\${data.closeBrace}|(?<!\\${data.closeBrace})\\${data.closeBrace}(?=[a-zÀ-ú0-9]|\u00a0| $|\u00a0$)`, 'gmi');

// Détecte le point d’exclamation. https://github.com/Association-WPFR/SPTE/wiki/rgxExclamationPoint
export const rgxExclamationPoint = new RegExp(`(?<!\u00a0|^)\\${data.exclamationPoint}|\\${data.exclamationPoint}(?! |$)`, 'gmi');

// Détecte le signe plus. https://github.com/Association-WPFR/SPTE/wiki/rgxPlusSign
export const rgxPlusSign = new RegExp(`(?<!\u00a0|google|^)\\${data.plusSign}|\\${data.plusSign}(?! |$)`, 'gmi');

// Détecte le point d’interrogation. https://github.com/Association-WPFR/SPTE/wiki/rgxQuestionMark
export const rgxQuestionMark = new RegExp(`(?<!\u00a0|\\/|\\.php|\\/[a-z0-9\\-\\#\\.\\_]*?|^)\\${data.questionMark}|(?<!\\/|\\.php|\\/[a-z0-9\\-\\#\\.\\_]*?|^)\\${data.questionMark}(?! |$)`, 'gmi');

// Détecte les deux points. https://github.com/Association-WPFR/SPTE/wiki/rgxColon
export const rgxColon = new RegExp(`(?<!\u00a0|https|http| \\d{2}|\u00a0\\d{2}| hh|\u00a0hh| mm|\u00a0mm| aaaa|\u00a0aaaa)${data.colon}(?= )|(?<=\u00a0)${data.colon}(?! |$)|(?<!\u00a0|https|http| \\d{2}|\u00a0\\d{2}| hh|\u00a0hh| mm|\u00a0mm| aaaa|\u00a0aaaa)${data.colon}(?! )`, 'gmi');

// Détecte le point-virgule. https://github.com/Association-WPFR/SPTE/wiki/rgxSemiColon
export const rgxSemiColon = new RegExp(`(?<!\u00a0|:[a-z0-9.]*?|&[${data.semiColon}a-z0-9#]*?)${data.semiColon}|(?<!:[a-z0-9.]*?|&[${data.semiColon}a-z0-9#]*?)${data.semiColon}(?! )`, 'gmi');

// Détecte le guillemet français fermant. https://github.com/Association-WPFR/SPTE/wiki/rgxClosingFrQuote
export const rgxClosingFrQuote = new RegExp(`(?<!\u00a0)${data.closingFrQuote}|${data.closingFrQuote}(?! |\\.|\\,|\u00a0\\?|\u00a0\\!|\u00a0\\:|\u00a0\\;|$)`, 'gmi');

// Détecte le guillemet français ouvrant. https://github.com/Association-WPFR/SPTE/wiki/rgxOpenFrQuote
export const rgxOpenFrQuote = new RegExp(`(?<! |^)${data.openFrQuote}|${data.openFrQuote}(?!\u00a0|$)`, 'gmi');
