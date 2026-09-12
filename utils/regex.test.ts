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
	rules,
} from './rules';

// Tests de caractérisation : figent le comportement ACTUEL du moteur de règles
// (regex.ts) avant sa consolidation en Phase 3 (format TypographyRule[] unique).
// Objectif : si la refonte change accidentellement une règle, un test casse ici.
// Ne pas modifier ces attentes sans vérifier d'abord que le nouveau comportement
// est intentionnel (et le documenter dans TODO.md).

function matches(regex: RegExp, text: string): string[] {
	return [...text.matchAll(new RegExp(regex.source, regex.flags))].map((m) => m[0]);
}

describe('rgxBadWords', () => {
	it('détecte un mot déconseillé isolé', () => {
		expect(matches(rgxBadWords, 'Le fichier est un plug-in.')).toEqual(['plug-in']);
	});
	it('ne détecte rien dans un mot qui ne fait pas partie de la liste', () => {
		expect(matches(rgxBadWords, 'Ceci est un plugin WordPress.')).toEqual([]);
	});
	it('ignore un mot précédé de « guillemet + espace » (citation)', () => {
		expect(matches(rgxBadWords, 'On dit « responsif » par erreur.')).toEqual([]);
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
});

describe('rgxOpenHook', () => {
	it('détecte un crochet ouvrant collé au mot suivant sans espace avant', () => {
		expect(matches(rgxOpenHook, 'texte[note]')).toHaveLength(1);
	});
	it('ignore un double crochet ouvrant', () => {
		expect(matches(rgxOpenHook, '[[note]]')).toEqual([]);
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
});

describe('rgxOpenParenthesis', () => {
	it('détecte une parenthèse ouvrante collée sans espace avant', () => {
		expect(matches(rgxOpenParenthesis, 'texte(suite)')).toHaveLength(1);
	});
	it('ignore les suffixes grammaticaux tolérés, ex: mot(s)', () => {
		expect(matches(rgxOpenParenthesis, 'un ou plusieurs mot(s)')).toEqual([]);
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
});

describe('rgxPeriod', () => {
	// NOTE : la branche censée détecter "mot.mot" (point collé entre deux minuscules,
	// sans espace) ne se déclenche jamais en pratique — son lookbehind négatif utilise
	// un quantificateur paresseux (*?) qui matche toujours une chaîne vide, ce qui neutralise
	// la condition. Comportement actuel figé tel quel ; piste de correction notée dans TODO.md
	// pour la consolidation du moteur de règles (Phase 3).
	it('ne détecte PAS un point collé entre deux mots minuscules (branche morte connue)', () => {
		expect(matches(rgxPeriod, 'phrase.suite')).toEqual([]);
	});
	it('détecte un point précédé d\'une espace et non suivi d\'une extension connue', () => {
		expect(matches(rgxPeriod, 'Voir ceci .vraiment')).toHaveLength(1);
	});
	it('ignore un point suivi d\'une extension de fichier connue', () => {
		expect(matches(rgxPeriod, 'lire le fichier readme.txt')).toEqual([]);
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
});

describe('rgxCloseHook', () => {
	it('détecte un crochet fermant collé à la lettre suivante', () => {
		expect(matches(rgxCloseHook, '[note]suite')).toHaveLength(1);
	});
	it('ignore un crochet fermant suivi d\'une espace', () => {
		expect(matches(rgxCloseHook, '[note] suite')).toEqual([]);
	});
});

describe('rgxCloseParenthesis', () => {
	it('détecte une parenthèse fermante suivie d\'une lettre sans espace', () => {
		expect(matches(rgxCloseParenthesis, 'texte (a) suite')).toHaveLength(1);
	});
});

describe('rgxCloseBrace', () => {
	it('détecte une accolade fermante collée à la lettre suivante', () => {
		expect(matches(rgxCloseBrace, '{note}suite')).toHaveLength(1);
	});
	it('ignore une accolade fermante suivie d\'une espace', () => {
		expect(matches(rgxCloseBrace, '{note} suite')).toEqual([]);
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
});

describe('rgxPlusSign', () => {
	it('détecte un signe plus non précédé d\'une espace insécable', () => {
		expect(matches(rgxPlusSign, '2+2')).toHaveLength(1);
	});
	it('ignore "google+"', () => {
		expect(matches(rgxPlusSign, 'google+')).toEqual([]);
	});
});

describe('rgxQuestionMark', () => {
	it('détecte un point d\'interrogation non précédé d\'une espace insécable', () => {
		expect(matches(rgxQuestionMark, 'Pourquoi?')).toHaveLength(1);
	});
	it('ignore un point d\'interrogation dans un chemin de fichier .php', () => {
		expect(matches(rgxQuestionMark, 'fichier.php?param=1')).toEqual([]);
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
});

describe('rgxOpenFrQuote', () => {
	it('détecte un guillemet français ouvrant non suivi d\'une espace insécable', () => {
		expect(matches(rgxOpenFrQuote, '«texte')).toHaveLength(1);
	});
	it('ignore un guillemet ouvrant suivi d\'une espace insécable', () => {
		expect(matches(rgxOpenFrQuote, '« texte')).toEqual([]);
	});
});

describe('règle Space (double espace interne)', () => {
	// Issue #26 : la règle `Space` ne ciblait que le début/fin de ligne, pas un double espace
	// au milieu d'une phrase.
	const spaceRegex = rules.find((rule) => rule.id === 'Space')!.regex;

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
