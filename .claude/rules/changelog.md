# CHANGELOG — bloquant

Avant chaque commit touchant le code (hors `CHANGELOG.md`/`TODO.md`/`README.md`) : vérifier si `CHANGELOG.md` doit être mis à jour, et si oui l'écrire en respectant les règles déjà établies (une ligne par élément modifié, `Fixed` formulé en « ça marche maintenant » plutôt qu'en bug).

Si un chantier technique notable est fait sans que `CHANGELOG.md` ou `TODO.md` le reflète, le signaler avant de committer plutôt que de committer silencieusement.

## Hook à chaque commit

Systématique, pas seulement quand « ça a l'air important » :
1. Repérer la version en cours de travail (branche `refonte/3.0` → section `## [3.0.0] - xx <mois> <année>`, en tête de fichier ; ne jamais créer de nouvelle section pour un commit qui n'est pas un nouveau cycle de version).
2. Comparer le diff du commit à cette section : le changement mérite-t-il une ligne (nouvelle, ou modif d'une ligne existante déjà en `xx <mois> <année>` qui couvrait le même chantier), ou est-il trop mineur/interne (typo de commentaire, refacto sans effet visible déjà documenté, tooling déjà listé) ?
3. Si oui : ajouter/modifier dans la bonne sous-section, jamais fusionner deux changements distincts dans une même ligne (cf. [[feedback_changelog-style]]).
4. Si incertain : le signaler à Jason avant de committer plutôt que trancher seul en silence.

## Organisation du fichier (respecter la structure de https://github.com/Association-WPFR/SPTE/blob/main/CHANGELOG.md)

- Titre `# Changelog`, puis une section par version : `## [X.Y.Z] - <date en toutes lettres, fr>` (la version en chantier reste datée `xx <mois> <année>` tant qu'elle n'est pas taguée).
- Sous-sections dans cet ordre, présentes seulement si elles ont du contenu : `### Added`, `### Changed`, `### Removed`, `### Fixed`.
- Une ligne = un changement, à la puce, phrase complète, sans grouper plusieurs correctifs/ajouts indépendants sur une même ligne.
- `Fixed` : décrire le comportement correct obtenu (« … fonctionne maintenant », « … n'est plus signalé à tort »), jamais le bug en soi.
- Détail technique (nom de fichier, fonction) toléré en fin de ligne entre parenthèses quand utile à un contributeur, mais la ligne doit rester lisible pour un non-dev.
