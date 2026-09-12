import { describe, expect, it } from 'vitest';
import {
	rgxBadWords,
	rgxSingleQuotes,
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
});

describe('rgxSemiColon', () => {
	it('détecte un point-virgule non précédé d\'une espace insécable', () => {
		expect(matches(rgxSemiColon, 'un;deux')).toHaveLength(1);
	});
	it('ignore le point-virgule d\'une entité HTML', () => {
		expect(matches(rgxSemiColon, '&nbsp;texte')).toEqual([]);
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
