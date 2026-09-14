import { describe, expect, it } from 'vitest';
import {
	rgxBadWords,
	rgxSingleQuotes,
	rgxDoubleQuotes,
	rgxSlash,
	rgxOpenHook,
	rgxOpenParenthesis,
	rgxOpenBrace,
	rgxEllipsis,
	rgxPeriod,
	rgxComma,
	rgxCloseHook,
	rgxCloseParenthesis,
	rgxCloseBrace,
	rgxExclamationPoint,
	rgxPlusSign,
	rgxQuestionMark,
	rgxColon,
	rgxSemiColon,
	rgxClosingFrQuote,
	rgxOpenFrQuote,
	rgxEpicenePunctuation,
	rules,
} from './rules';

// Tests de caractérisation : figent le comportement ACTUEL des regex, écarts avec le wiki
// compris. Ne pas modifier ces attentes sans vérifier que le nouveau comportement est
// intentionnel (et le documenter dans TODO.md).

/**
 * @param {RegExp} regex
 * @param {string} text
 * @returns {string[]}
 */
function matches(regex, text) {
	return [...text.matchAll(new RegExp(regex.source, regex.flags))].map((m) => m[0]);
}

describe('rgxBadWords', () => {
	it('détecte un mot déconseillé isolé', () => {
		expect(matches(rgxBadWords, 'Le fichier est un plug-in.')).toEqual(['plug-in']);
	});
	it('ne détecte rien dans un mot qui ne fait pas partie de la liste', () => {
		expect(matches(rgxBadWords, 'Ceci est une extension WordPress.')).toEqual([]);
	});
	it('ignore un mot précédé de « guillemet + espace » (citation)', () => {
		expect(matches(rgxBadWords, 'On dit « responsif » par erreur.')).toEqual([]);
	});
	// Anglicismes sans ambiguïté en français standard (cf. utils/rules.js).
	it.each([
		'plugin', 'greffon', 'uploader', 'downloader', 'customiser', 'updater', 'mr',
		'sidebar', 'shortcode', 'tooltip', 'breadcrumb', 'changelog', 'thumbnail',
		'addon', 'add-on', 'mu-plugin', 'back-end', 'front-end', 'capabilities',
	])('détecte l’anglicisme "%s"', (word) => {
		expect(matches(rgxBadWords, `Un mot ici : ${word} et la suite.`)).toEqual([word]);
	});

	// Tests transposés depuis le wiki (rgxBadWords.md) : le mot doit être détecté quand il est
	// précédé/suivi par un espace, une virgule, un point, deux points, un point-virgule, un
	// guillemet double ou une apostrophe droite, ou en tout début/fin de chaîne.
	it('détecte un mot précédé et suivi d’une virgule', () => {
		expect(matches(rgxBadWords, 'test,plugin,fin')).toEqual(['plugin']);
	});
	// ÉCART DOCUMENTÉ : le wiki liste le point `.` parmi les caractères valides précédant le mot
	// détecté (classe `[\s,.:;"']` dans la regex documentée), mais la classe de lookbehind du
	// code actuel a perdu le point (`[\s,:;"']`, sans le `.`) — seule la classe de lookahead l’a
	// gardé. Un mot collé après un point (ex: "Fin.plugin arrive") n’est donc plus détecté.
	it.skip('détecte un mot précédé d’un point (perdu dans le lookbehind actuel)', () => {
		expect(matches(rgxBadWords, 'Fin.plugin arrive')).toEqual(['plugin']);
	});
	it('détecte un mot précédé et suivi de deux points', () => {
		expect(matches(rgxBadWords, 'Titre:plugin suite')).toEqual(['plugin']);
		expect(matches(rgxBadWords, 'suite plugin:info')).toEqual(['plugin']);
	});
	it('détecte un mot précédé et suivi d’un point-virgule', () => {
		expect(matches(rgxBadWords, 'a;plugin;b')).toEqual(['plugin']);
	});
	it('détecte un mot précédé et suivi d’un guillemet double', () => {
		expect(matches(rgxBadWords, '"plugin"')).toEqual(['plugin']);
	});
	it('détecte un mot précédé et suivi d’une apostrophe droite', () => {
		expect(matches(rgxBadWords, '\'plugin\'')).toEqual(['plugin']);
	});
	it('détecte un mot en tout début de chaîne', () => {
		expect(matches(rgxBadWords, 'plugin est utile')).toEqual(['plugin']);
	});
	it('détecte un mot en toute fin de chaîne', () => {
		expect(matches(rgxBadWords, 'Voici un plugin')).toEqual(['plugin']);
	});
});

describe('rgxSingleQuotes', () => {
	it('détecte une apostrophe droite', () => {
		expect(matches(rgxSingleQuotes, 'l\'extension')).toEqual(['\'']);
	});
	it('ignore l\'apostrophe dans un attribut href=', () => {
		expect(matches(rgxSingleQuotes, '<a href=\'example.com\'>lien</a>')).toEqual([]);
	});
	it('ignore l\'apostrophe dans un placeholder printf (%s)', () => {
		expect(matches(rgxSingleQuotes, '%s\'appelle')).toEqual([]);
	});
	// Issue #32 : l'apostrophe courbe inversée (U+2018) est une variante incorrecte à détecter,
	// au même titre que l'apostrophe droite.
	it('détecte une apostrophe courbe inversée (U+2018)', () => {
		expect(matches(rgxSingleQuotes, 'l‘extension')).toEqual(['‘']);
	});
	it('ne détecte jamais la bonne apostrophe courbe (U+2019)', () => {
		expect(matches(rgxSingleQuotes, 'l’extension')).toEqual([]);
	});
	// ÉCART DOCUMENTÉ : le wiki liste une exception « si elle est suivie par le signe % »
	// (Ex: `'%s`) via un `(?!%)` en fin de regex, mais ce lookahead n’existe plus dans le code
	// actuel (probablement perdu lors de l’ajout de la détection de l’apostrophe courbe inversée
	// U+2018). Une apostrophe suivie de `%s` est donc désormais signalée à tort.
	it.skip('ignore une apostrophe droite suivie du signe % (exception perdue)', () => {
		expect(matches(rgxSingleQuotes, '\'%s')).toEqual([]);
	});
});

describe('rgxDoubleQuotes', () => {
	// Issue #51 : aucune regex ne ciblait le guillemet double droit alors que les guillemets
	// français « » sont la norme.
	it('détecte des guillemets doubles droits', () => {
		expect(matches(rgxDoubleQuotes, 'Il a dit "bonjour"')).toHaveLength(2);
	});
	it('ignore les guillemets d\'un attribut href=', () => {
		expect(matches(rgxDoubleQuotes, '<a href="https://example.com">lien</a>')).toEqual([]);
	});
	it('ignore les guillemets d\'un attribut title=', () => {
		expect(matches(rgxDoubleQuotes, '<a href="https://example.com" title="Mon titre">lien</a>')).toEqual([]);
	});
});

describe('rgxSlash', () => {
	it('détecte une espace avant une barre oblique', () => {
		expect(matches(rgxSlash, 'oui / non')).toHaveLength(1);
	});
	it('ignore une double barre oblique (URL)', () => {
		expect(matches(rgxSlash, 'https://example.com')).toEqual([]);
	});
	it('ignore une barre oblique de commentaire (//)', () => {
		expect(matches(rgxSlash, ' // Commentaire...')).toEqual([]);
	});
	it('ignore une barre oblique suivie de la balise auto-fermante &gt;', () => {
		expect(matches(rgxSlash, '&lt;br /&gt;')).toEqual([]);
	});
	it('ignore une barre oblique suivie de }} (passage de paramètre)', () => {
		expect(matches(rgxSlash, '{{rule /}}')).toEqual([]);
	});
	it('ignore une barre oblique suivie de ]] (passage de paramètre)', () => {
		expect(matches(rgxSlash, '[[filter /]]')).toEqual([]);
	});
	it('détecte une barre oblique non précédée d’une autre et suivie d’une espace', () => {
		expect(matches(rgxSlash, 'https:/ ')).toHaveLength(1);
	});
});

describe('rgxOpenHook', () => {
	it('détecte un crochet ouvrant collé au mot suivant sans espace avant', () => {
		expect(matches(rgxOpenHook, 'texte[note]')).toHaveLength(1);
	});
	it('ignore un double crochet ouvrant', () => {
		expect(matches(rgxOpenHook, '[[note]]')).toEqual([]);
	});
	it('ignore le second crochet d’un double crochet ouvrant (exemple du wiki)', () => {
		expect(matches(rgxOpenHook, '[[valeur')).toEqual([]);
	});
	it('ignore un crochet ouvrant qui débute la chaîne', () => {
		expect(matches(rgxOpenHook, '[valeur')).toEqual([]);
	});
	it('détecte un crochet ouvrant précédé d’un espace mais suivi d’une espace en trop', () => {
		expect(matches(rgxOpenHook, 'un mot [ contenu]')).toHaveLength(1);
	});
});

describe('rgxOpenBrace', () => {
	it('détecte une accolade ouvrante collée au mot précédent sans espace avant', () => {
		expect(matches(rgxOpenBrace, 'texte{note}')).toHaveLength(1);
	});
	it('ignore une double accolade ouvrante', () => {
		expect(matches(rgxOpenBrace, '{{note}}')).toEqual([]);
	});
	// Issue #50 : « { name} » (espace juste après l'accolade, accolade fermante collée) est un
	// style d'interpolation de variable légitime, à ne pas signaler.
	it('ignore une accolade ouvrante suivie d\'un espace puis d\'un seul mot collé à la fermante', () => {
		expect(matches(rgxOpenBrace, '{ name}')).toEqual([]);
	});
	it('détecte toujours une accolade avec un espace des deux côtés', () => {
		expect(matches(rgxOpenBrace, '{ name }')).toHaveLength(1);
	});
	it('détecte toujours une accolade suivie d\'un double espace', () => {
		expect(matches(rgxOpenBrace, '{  name}')).toHaveLength(1);
	});
	it('ignore une accolade ouvrante qui débute la chaîne', () => {
		expect(matches(rgxOpenBrace, '{valeur')).toEqual([]);
	});
	it('détecte une accolade ouvrante suivie d’une espace (contenu à plusieurs mots)', () => {
		expect(matches(rgxOpenBrace, 'texte { deux mots }')).toHaveLength(1);
	});
});

describe('rgxOpenParenthesis', () => {
	it('détecte une parenthèse ouvrante collée sans espace avant', () => {
		expect(matches(rgxOpenParenthesis, 'texte(suite)')).toHaveLength(1);
	});
	it('ignore les suffixes grammaticaux tolérés, ex: mot(s)', () => {
		expect(matches(rgxOpenParenthesis, 'un ou plusieurs mot(s)')).toEqual([]);
	});
	it('ignore une parenthèse ouvrante qui débute la chaîne', () => {
		expect(matches(rgxOpenParenthesis, '(valeur')).toEqual([]);
	});
	it('ignore une parenthèse ouvrante suivie d’un pourcentage', () => {
		expect(matches(rgxOpenParenthesis, '<span class="count">(%s')).toEqual([]);
	});
	it('ignore une parenthèse ouvrante suivie d’une parenthèse fermante', () => {
		expect(matches(rgxOpenParenthesis, '<code>get_flexible()')).toEqual([]);
	});
	it.each([
		['validé(e)'],
		['soldé(es)'],
		['réside(nt)'],
		['écrit(vent)'],
	])('ignore le suffixe grammatical toléré de "%s"', (text) => {
		expect(matches(rgxOpenParenthesis, text)).toEqual([]);
	});
	it('détecte une parenthèse ouvrante qui ne débute pas la chaîne et est suivie d’un espace', () => {
		expect(matches(rgxOpenParenthesis, 'texte ( suite')).toHaveLength(1);
	});
	// ÉCART DOCUMENTÉ : le wiki ne liste que %, ), s), e), es), nt), vent) comme suffixes
	// tolérés après une parenthèse ouvrante collée — "x)" n’en fait pas partie et devrait donc
	// être détecté. Le code actuel ajoute pourtant `x\)` à la liste des exceptions, ce qui
	// empêche la détection.
	it.skip('détecte une parenthèse ouvrante suivie de "x)" (exception non documentée)', () => {
		expect(matches(rgxOpenParenthesis, 'affiché(x)')).toHaveLength(1);
	});
});

describe('rgxEllipsis', () => {
	it('détecte des points de suspension suivis directement d\'une lettre', () => {
		expect(matches(rgxEllipsis, 'et…puis')).toHaveLength(1);
	});
	it('ignore des points de suspension suivis d\'une espace', () => {
		expect(matches(rgxEllipsis, 'et… puis')).toEqual([]);
	});
	// Issue #29 : trois points ASCII successifs devraient être remplacés par le caractère
	// unique « … » et doivent donc être détectés au même titre.
	it('détecte trois points ASCII successifs', () => {
		expect(matches(rgxEllipsis, 'et...puis')).toEqual(['...']);
	});
	it('détecte des points de suspension précédés d’une espace', () => {
		expect(matches(rgxEllipsis, 'mot …!')).toHaveLength(1);
	});
	it('détecte des points de suspension suivis d’une espace finale', () => {
		expect(matches(rgxEllipsis, 'et… ')).toEqual(['…']);
	});
	it('détecte des points de suspension suivis d’une espace insécable finale', () => {
		expect(matches(rgxEllipsis, 'et…' + '\u00a0')).toEqual(['…']);
	});
	// Même cas que pour rgxComma ci-dessus : comportement figé, pas un bug.
	it('détecte aussi des points de suspension collés à × ou ÷ (comportement actuel, pas un bug)', () => {
		expect(matches(rgxEllipsis, 'et…×trois')).toHaveLength(1);
		expect(matches(rgxEllipsis, 'et…÷trois')).toHaveLength(1);
	});
});

describe('rgxPeriod', () => {
	// La branche censée détecter "mot.mot" (point collé entre deux minuscules) ne se déclenche
	// jamais en pratique — son lookbehind négatif matche toujours une chaîne vide. Comportement
	// figé tel quel ; ne pas "corriger" sans test dédié (cf. utils/rules.js).
	it('ne détecte PAS un point collé entre deux mots minuscules (branche morte connue)', () => {
		expect(matches(rgxPeriod, 'phrase.suite')).toEqual([]);
	});
	it('détecte un point précédé d\'une espace et non suivi d\'une extension connue', () => {
		expect(matches(rgxPeriod, 'Voir ceci .vraiment')).toHaveLength(1);
	});
	it('ignore un point suivi d\'une extension de fichier connue', () => {
		expect(matches(rgxPeriod, 'lire le fichier readme.txt')).toEqual([]);
	});
	it('détecte un point suivi d’une espace finale', () => {
		expect(matches(rgxPeriod, 'Fin de phrase. ')).toEqual(['. ']);
	});
	it('détecte un point suivi d’une espace insécable finale', () => {
		expect(matches(rgxPeriod, 'Fin de phrase.' + '\u00a0')).toEqual(['.' + '\u00a0']);
	});
});

describe('rgxComma', () => {
	it('détecte une virgule collée à la lettre suivante', () => {
		expect(matches(rgxComma, 'un,deux')).toHaveLength(1);
	});
	it('ignore une virgule suivie d\'une espace', () => {
		expect(matches(rgxComma, 'un, deux')).toEqual([]);
	});
	// Issue #27 (partiel) : une virgule à l'intérieur d'un bloc [[ ]] (interpolation JS) ne doit
	// pas être signalée, au même titre que le slash déjà exclu dans ce genre de bloc.
	it('ignore une virgule à l\'intérieur d\'un bloc [[ ]]', () => {
		expect(matches(rgxComma, '[[a,b]]')).toEqual([]);
	});
	it('détecte toujours une virgule dans un simple crochet [ ]', () => {
		expect(matches(rgxComma, '[a,b]')).toHaveLength(1);
	});
	it('ignore une virgule entre des chiffres (Ex: liste CSS de tailles/poids)', () => {
		expect(matches(rgxComma, 'Noto Serif:400,400i,700,700i')).toEqual([]);
	});
	it('ignore une virgule entre des chiffres (Ex: nombre décimal)', () => {
		expect(matches(rgxComma, '3,5 grammes')).toEqual([]);
	});
	// La plage [a-zÀ-ú] utilisée pour "collé à un mot" inclut par erreur × et ÷ (mêmes octets
	// Unicode que des lettres) — mais le verdict reste correct dans ce contexte, donc pas un bug.
	it('détecte aussi une virgule collée à × ou ÷ (comportement actuel, pas un bug)', () => {
		expect(matches(rgxComma, 'un,×deux')).toHaveLength(1);
		expect(matches(rgxComma, 'un,÷deux')).toHaveLength(1);
	});
});

describe('rgxCloseHook', () => {
	it('détecte un crochet fermant collé à la lettre suivante', () => {
		expect(matches(rgxCloseHook, '[note]suite')).toHaveLength(1);
	});
	it('ignore un crochet fermant suivi d\'une espace', () => {
		expect(matches(rgxCloseHook, '[note] suite')).toEqual([]);
	});
	it('ignore le second crochet fermant d’un double crochet (Ex: [[valeur]]texte)', () => {
		expect(matches(rgxCloseHook, '[[valeur]]texte')).toEqual([]);
	});
});

describe('rgxCloseParenthesis', () => {
	it('détecte une parenthèse fermante suivie d\'une lettre sans espace', () => {
		expect(matches(rgxCloseParenthesis, 'texte (a) suite')).toHaveLength(1);
	});
	it('ignore une parenthèse fermante précédée de "(e" (accord grammatical)', () => {
		expect(matches(rgxCloseParenthesis, 'affiché(e)')).toEqual([]);
	});
	it('ignore une parenthèse fermante suivie de la lettre s (Ex: animé(e)s)', () => {
		expect(matches(rgxCloseParenthesis, 'animé(e)s')).toEqual([]);
	});
	it('détecte une parenthèse fermante précédée d’une espace', () => {
		expect(matches(rgxCloseParenthesis, 'texte )')).toHaveLength(1);
	});
	// ÉCART DOCUMENTÉ : le wiki dit qu'une parenthèse fermante suivie directement par une lettre
	// ou un chiffre (sans espace) doit être détectée, sauf si elle est suivie de "s". Le lookahead
	// du code actuel (regex avec deux \u00a0 dans le lookahead) est bien plus restrictif que
	// celui documenté (simple lookahead lettre/chiffre/\u00a0) : il exige la présence d'une espace insécable
	// dans un motif précis, ce qu'une simple lettre collée comme dans "(reste)ici" ne satisfait
	// jamais. Cette parenthèse fermante n'est donc plus détectée du tout.
	it.skip('détecte une parenthèse fermante suivie d’une lettre sans espace ni nbsp (lookahead trop restrictif)', () => {
		expect(matches(rgxCloseParenthesis, '(reste)ici')).toHaveLength(1);
	});
	it.skip('détecte une parenthèse fermante suivie d’un chiffre sans espace ni nbsp (lookahead trop restrictif)', () => {
		expect(matches(rgxCloseParenthesis, '(reste)9ici')).toHaveLength(1);
	});
	// ÉCART DOCUMENTÉ : le wiki n'exclut que les lettres "e" et "s" de la détection "précédée par
	// une parenthèse ouvrante suivie d'une lettre" (classes [a-d]|[f-r]|[t-z], qui couvrent tout
	// l'alphabet sauf e et s). Le code actuel scinde différemment cette plage
	// (`[a-d]|[f-r]|[t-w]|[y-z]`), ce qui exclut aussi la lettre "x" sans que le wiki ne la liste
	// comme exception. "affiché(x)" n'est donc plus détecté alors qu'il devrait l'être.
	it.skip('détecte une parenthèse fermante précédée de "(x" (lettre non exceptée par le wiki)', () => {
		expect(matches(rgxCloseParenthesis, 'affiché(x)')).toHaveLength(1);
	});
});

describe('rgxCloseBrace', () => {
	it('détecte une accolade fermante collée à la lettre suivante', () => {
		expect(matches(rgxCloseBrace, '{note}suite')).toHaveLength(1);
	});
	it('ignore une accolade fermante suivie d\'une espace', () => {
		expect(matches(rgxCloseBrace, '{note} suite')).toEqual([]);
	});
	it('ignore le second accolade fermante d’une double accolade (Ex: {{valeur}})', () => {
		expect(matches(rgxCloseBrace, '{{valeur}}')).toEqual([]);
	});
});

describe('rgxExclamationPoint', () => {
	it('détecte un point d\'exclamation non précédé d\'une espace insécable', () => {
		expect(matches(rgxExclamationPoint, 'Bravo!')).toHaveLength(1);
	});
	it('ignore un point d\'exclamation précédé d\'une espace insécable', () => {
		expect(matches(rgxExclamationPoint, 'Bravo !')).toEqual([]);
	});
	// Issue #34 : le point d'exclamation de "!important" (syntaxe CSS standard) n'est pas
	// une ponctuation française et ne doit pas être signalé.
	it('ignore le "!" de "!important" en CSS', () => {
		expect(matches(rgxExclamationPoint, 'width: 100px !important;')).toEqual([]);
	});
	it('ignore un point d’exclamation qui débute la chaîne et est suivi d’une espace', () => {
		expect(matches(rgxExclamationPoint, '! Bravo')).toEqual([]);
	});
	it('ignore un point d’exclamation en toute fin de chaîne (précédé d’une espace insécable)', () => {
		expect(matches(rgxExclamationPoint, 'Bravo' + '\u00a0' + '!')).toEqual([]);
	});
	// Faux positif confirmé en conditions réelles le 2026-09-15 : "!)" est la typographie
	// correcte (rien entre "!" et la parenthèse fermante), pas une espace manquante.
	it('ignore un point d’exclamation suivi d’une parenthèse fermante', () => {
		expect(matches(rgxExclamationPoint, 'Bravo' + '\u00a0' + '!)')).toEqual([]);
	});
});

describe('rgxPlusSign', () => {
	it('détecte un signe plus non précédé d\'une espace insécable', () => {
		expect(matches(rgxPlusSign, '2+2')).toHaveLength(1);
	});
	it('ignore "google+"', () => {
		expect(matches(rgxPlusSign, 'google+')).toEqual([]);
	});
	it('ignore un signe plus qui débute la chaîne et est suivi d’une espace', () => {
		expect(matches(rgxPlusSign, '+ 2')).toEqual([]);
	});
	it('ignore un signe plus en toute fin de chaîne (précédé d’une espace insécable)', () => {
		expect(matches(rgxPlusSign, '2' + '\u00a0' + '+')).toEqual([]);
	});
});

describe('rgxQuestionMark', () => {
	it('détecte un point d\'interrogation non précédé d\'une espace insécable', () => {
		expect(matches(rgxQuestionMark, 'Pourquoi?')).toHaveLength(1);
	});
	it('ignore un point d\'interrogation dans un chemin de fichier .php', () => {
		expect(matches(rgxQuestionMark, 'fichier.php?param=1')).toEqual([]);
	});
	it('ignore un point d’interrogation précédé d’une barre oblique (Ex: /?var)', () => {
		expect(matches(rgxQuestionMark, '/?var')).toEqual([]);
	});
	it('ignore un point d’interrogation précédé d’une barre oblique suivie de lettres (Ex: /page?name)', () => {
		expect(matches(rgxQuestionMark, '/page?name')).toEqual([]);
	});
	it('ignore un point d’interrogation qui débute la chaîne et est suivi d’une espace', () => {
		expect(matches(rgxQuestionMark, '? texte')).toEqual([]);
	});
	it('ignore un point d’interrogation en toute fin de chaîne (précédé d’une espace insécable)', () => {
		expect(matches(rgxQuestionMark, 'Pourquoi' + '\u00a0' + '?')).toEqual([]);
	});
	// Faux positif confirmé en conditions réelles le 2026-09-15 (younitedpay-payment-gateway,
	// "les identifiants ont-ils été modifiés ?)") : "?)" est la typographie correcte.
	it('ignore un point d’interrogation suivi d’une parenthèse fermante', () => {
		expect(matches(rgxQuestionMark, 'Pourquoi' + '\u00a0' + '?)')).toEqual([]);
	});
});

describe('rgxColon', () => {
	it('détecte un deux-points non précédé d\'une espace insécable', () => {
		expect(matches(rgxColon, 'Titre: texte')).toHaveLength(1);
	});
	it('ignore le deux-points d\'une URL http:', () => {
		expect(matches(rgxColon, 'http://example.com')).toEqual([]);
	});
	it('ignore un format d\'heure hh:mm', () => {
		expect(matches(rgxColon, ' hh:mm')).toEqual([]);
	});
	// Issue #49 : un format de date PHP (lettres de format séparées par des ":") ne doit pas
	// déclencher la règle, au même titre que hh/mm/aaaa déjà exclus.
	it('ignore les deux-points d\'un format de date PHP (Y/m/d g:s:i A)', () => {
		expect(matches(rgxColon, 'Y/m/d g:s:i A')).toEqual([]);
	});
	// Issue #27 (partiel) : un deux-points à l'intérieur d'un bloc {{ }} (interpolation JS) ne
	// doit pas être signalé, au même titre que le slash déjà exclu dans ce genre de bloc.
	it('ignore un deux-points à l\'intérieur d\'un bloc {{ }}', () => {
		expect(matches(rgxColon, '{{foo:bar}}')).toEqual([]);
	});
	it('détecte toujours un deux-points dans une simple accolade { }', () => {
		expect(matches(rgxColon, '{foo:bar}')).toHaveLength(1);
	});

	// Cas particulier (cf. consigne) : la page rgxColon.md du wiki indique elle-même qu'elle
	// n'est plus à jour (« La regex vient d'être revue... »), et le code a depuis évolué sans
	// que la page ne soit corrigée (ajout des lettres de format de date PHP g/s/i/a/h/y/m/d,
	// issue #49 — cf. tests ci-dessus). On ne teste donc ici que les exemples de la page qui
	// restent plausibles, contre le code ACTUEL, sans présumer que l'ancienne regex documentée
	// est la référence.
	it('ignore le deux-points d’une URL https:// (avec le "s")', () => {
		expect(matches(rgxColon, 'https://')).toEqual([]);
	});
	// ÉCART DOCUMENTÉ : le wiki dit qu'un deux-points précédé d'un seul chiffre est excepté
	// (Ex: "4:00"), mais le code actuel n'excepte plus que "espace/nbsp + exactement 2 chiffres"
	// (espace ou \u00a0 suivi de exactement 2 chiffres) — l'ancienne exception à un chiffre isolé a disparu. "4:00" en
	// tout début de chaîne est donc désormais signalé à tort.
	it.skip('ignore le deux-points précédé d’un chiffre (Ex: 4:00) — exception disparue', () => {
		expect(matches(rgxColon, '4:00')).toEqual([]);
	});
	// ÉCART DOCUMENTÉ : le wiki dit qu'un deux-points précédé de 2 chiffres est excepté
	// (Ex: "14:30"), mais le code actuel exige en plus un espace/nbsp immédiatement avant ces 2
	// chiffres. "14:30" en tout début de chaîne (sans espace avant) n'a donc plus cette espace et
	// est désormais signalé à tort.
	it.skip('ignore le deux-points précédé de 2 chiffres (Ex: 14:30) — espace désormais exigée', () => {
		expect(matches(rgxColon, '14:30')).toEqual([]);
	});
	// ÉCART DOCUMENTÉ : le wiki exceptait un deux-points suivi d'une parenthèse fermante (avec ou
	// sans tiret), pour ne pas signaler les émoticônes ":)"/":-)" . Cette exception a disparu du
	// code actuel, qui signale désormais ces émoticônes.
	it.skip('ignore le smiley ":)" — exception disparue', () => {
		expect(matches(rgxColon, ':)')).toEqual([]);
	});
	it.skip('ignore le smiley ":-)" — exception disparue', () => {
		expect(matches(rgxColon, ':-)')).toEqual([]);
	});
});

describe('rgxSemiColon', () => {
	it('détecte un point-virgule non précédé d\'une espace insécable', () => {
		expect(matches(rgxSemiColon, 'un;deux')).toHaveLength(1);
	});
	it('ignore le point-virgule d\'une entité HTML', () => {
		expect(matches(rgxSemiColon, '&nbsp;texte')).toEqual([]);
	});
	// Issue #23 : un point-virgule en toute fin de chaîne (ex: liste à puces où chaque item se
	// termine par ";") ne doit pas être signalé, au même titre que d'autres règles de
	// ponctuation qui ont déjà une exception fin-de-chaîne.
	it('ignore un point-virgule en toute fin de chaîne', () => {
		expect(matches(rgxSemiColon, 'item de liste;')).toEqual([]);
	});
});

describe('rgxClosingFrQuote', () => {
	it('détecte un guillemet français fermant non précédé d\'une espace insécable', () => {
		expect(matches(rgxClosingFrQuote, 'texte»')).toHaveLength(1);
	});
	it('ignore un guillemet fermant précédé d\'une espace insécable', () => {
		expect(matches(rgxClosingFrQuote, 'texte »')).toEqual([]);
	});
	it.each([
		['un point', 'mot\u00a0».'],
		['une virgule', 'mot\u00a0»,'],
		['une espace insécable puis un point d’interrogation', 'mot\u00a0»\u00a0?'],
		['une espace insécable puis un point d’exclamation', 'mot\u00a0»\u00a0!'],
		['une espace insécable puis un deux-points', 'mot\u00a0»\u00a0:'],
		['une espace insécable puis un point-virgule', 'mot\u00a0»\u00a0;'],
	])('ignore un guillemet fermant non suivi d’une espace, s’il est suivi de %s', (_label, text) => {
		expect(matches(rgxClosingFrQuote, text)).toEqual([]);
	});
});

describe('rgxOpenFrQuote', () => {
	it('détecte un guillemet français ouvrant non suivi d\'une espace insécable', () => {
		expect(matches(rgxOpenFrQuote, '«texte')).toHaveLength(1);
	});
	it('ignore un guillemet ouvrant suivi d\'une espace insécable', () => {
		expect(matches(rgxOpenFrQuote, '« texte')).toEqual([]);
	});
	it('ignore un guillemet ouvrant qui débute la chaîne et est suivi d’une espace insécable', () => {
		expect(matches(rgxOpenFrQuote, '«\u00a0texte')).toEqual([]);
	});
});

describe('rgxEpicenePunctuation', () => {
	it('détecte un point utilisé au lieu du point médian', () => {
		expect(matches(rgxEpicenePunctuation, 'Les administrateur.rice sont invités.')).toEqual(['.rice']);
	});
	it('détecte un tiret utilisé au lieu du point médian', () => {
		expect(matches(rgxEpicenePunctuation, 'Les utilisateur-rice peuvent se connecter.')).toEqual(['-rice']);
	});
	it('détecte un astérisque utilisé au lieu du point médian, avec le pluriel', () => {
		expect(matches(rgxEpicenePunctuation, 'Bienvenue aux abonné*e*s du site.')).toEqual(['*e*s']);
	});
	it('ne signale jamais le point médian correct (U+00B7)', () => {
		expect(matches(rgxEpicenePunctuation, 'Les administrateur·rice sont invités.')).toEqual([]);
	});
	it('ignore un ordinal français ("2e", pas de séparateur)', () => {
		expect(matches(rgxEpicenePunctuation, 'La 2e édition est disponible.')).toEqual([]);
	});
	it('ignore "e-mail" (le e précède le tiret, pas l’inverse)', () => {
		expect(matches(rgxEpicenePunctuation, 'Envoyer un e-mail de confirmation.')).toEqual([]);
	});
});

describe('règle Space (double espace interne)', () => {
	// Issue #26 : la règle `Space` ne ciblait que le début/fin de ligne, pas un double espace
	// au milieu d'une phrase.
	const spaceRegex = rules.find((rule) => rule.id === 'Space').regex;

	it('détecte un double espace au milieu d\'une phrase', () => {
		expect(matches(spaceRegex, 'mot  mot')).toEqual(['  ']);
	});
	it('détecte toujours une espace en début de chaîne', () => {
		expect(matches(spaceRegex, ' début')).toHaveLength(1);
	});
	it('détecte toujours une espace en fin de chaîne', () => {
		expect(matches(spaceRegex, 'fin ')).toHaveLength(1);
	});
	it('ignore une espace simple entre deux mots', () => {
		expect(matches(spaceRegex, 'mot mot')).toEqual([]);
	});
});
