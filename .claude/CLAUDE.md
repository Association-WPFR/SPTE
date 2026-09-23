# CLAUDE.md

Ce fichier donne le contexte de session à Claude Code sur ce dépôt.

## What this is

**SPTE** — extension WebExtension (Chrome + Firefox) de vérification typographique pour les traductions françaises de WordPress sur translate.wordpress.org.

## Stack

JavaScript (pas de TypeScript, `checkJs` seul), bâti avec [WXT](https://wxt.dev/), tests avec Vitest, lint avec ESLint (flat config).

## Commands

```bash
npm run dev            # build + watch, Chrome
npm run dev:firefox    # build + watch, Firefox
npm run build          # build de prod, Chrome
npm run build:firefox  # build de prod, Firefox
npm run lint           # ESLint
npm run typecheck      # wxt prepare && tsc --noEmit
npm test               # vitest run
npm run test:coverage  # vitest run --coverage ; suivi de npx istanbul-badges-readme pour rafraîchir les badges du README
npm run zip            # paquet prêt à l'upload
npm run lint:amo       # build Firefox + addons-linter (même check qu'à la soumission AMO)
```

## Architecture

Voir `.claude/ARCHITECTURE.md` pour l'arborescence complète et les contraintes de design à préserver.

## Files never to modify

`.output/`, `.wxt/` (générés par WXT), `node_modules/`.

## Git workflow

Branche par défaut : `main`. Toujours vérifier si une PR ou une branche courante est active avant de supposer que `main` est la version la plus récente/avancée du code.

## Pointers

- **Toujours chargées** : `.claude/rules/*.md` — checklists bloquantes.
- **Architecture** : `.claude/ARCHITECTURE.md`.
- **Skills** (à la demande) : `.claude/skills/pages-de-test.md` (trouver des pages translate.wordpress.org avec du contenu à analyser pour tester SPTE en réel).
