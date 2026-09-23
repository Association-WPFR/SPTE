# Architecture

Comment ce dépôt est organisé, et pourquoi.

## Repository layout

```text
.
├── .claude/
│   ├── CLAUDE.md
│   ├── ARCHITECTURE.md          # Ce fichier
│   ├── rules/                   # Chargées à chaque session, checklists bloquantes
│   ├── skills/                  # Chargées à la demande
│   ├── hooks/                   # session-banner.sh, lint-edited.sh
│   └── settings.json
├── entrypoints/                 # Points d'entrée WXT : background.js, spte.content.js, popup/
├── tests/                       # Tests qui ne peuvent pas être co-localisés dans entrypoints/ (WXT y scanne les fichiers par nom pour trouver les entrypoints — un spte.content.test.js posé à côté de spte.content.js y est détecté à tort comme un second entrypoint "spte")
│   └── spte.content.test.js     # Tests des fonctions exportées de entrypoints/spte.content.js
├── utils/                       # Logique métier (regex de vérification typo, DOM, réglages) + tests co-localisés (*.test.js)
│   └── fixtures/                # Fixtures HTML utilisées par les tests
├── docs/                        # Ressources non buildées (captures d'écran, images du wiki)
├── public/                      # Icônes de l'extension, copiées telles quelles dans le build
├── .github/workflows/ci.yml     # CI GitHub Actions
├── wxt.config.js                # Config WXT (manifest v3, permissions, id Firefox)
├── eslint.config.js             # Config ESLint (flat config)
├── tsconfig.json                # checkJs seul — pas de TypeScript, juste du typage JSDoc sur du JS
├── vitest.config.js             # Config Vitest
├── .output/, .wxt/              # Générés par WXT, jamais commités
├── CHANGELOG.md                 # Une ligne par changement, tenu à jour à la main (voir rules/)
└── TODO.md                      # Notes de travail locales, gitignorée, jamais commitée
```

## Design constraints à préserver

- Extension WebExtension bâtie avec **WXT** (pas de build manuel côté manifest) — cible Chrome (MV3) et Firefox (`browser_specific_settings.gecko`), d'où les scripts `*:firefox` en doublon dans `package.json`.
- Pas de TypeScript : le code est en JS avec `checkJs` activé (`tsconfig.json`) — le typage vient des JSDoc, pas de fichiers `.ts`.
- Espaces insécables (U+00A0) volontairement utilisées dans des template strings pour respecter la typographie française (avant `:`, `;`, `!`, `?`) — `eslint.config.js` désactive `no-irregular-whitespace` sur les templates pour cette raison précise. Ne pas « nettoyer » ces espaces.
- `TODO.md` est gitignoré : c'est un fichier de travail local, jamais destiné à être committé — contrairement à `CHANGELOG.md` qui, lui, est versionné et à tenir à jour (cf. `.claude/rules/`).
- HTML inséré dynamiquement (`innerHTML`, `createContextualFragment`) : toujours passer par `DOMPurify.sanitize()` (dépendance runtime, pas dev) quand le contenu n'est pas un littéral figé — sinon reconstruire via `createElement`/`append` (déjà le cas pour les liens de la légende, `entrypoints/spte.content.js`). `eslint-plugin-no-unsanitized` (`eslint.config.js`) fait respecter cette règle au lint.

## CI/CD

`.github/workflows/ci.yml`, déclenché sur les PR vers `main` : `npm ci` puis `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run build`, `npm run build:firefox`, puis upload du rapport `coverage/` en artefact — dans cet ordre, tout doit passer avant merge.

## Known pitfalls

- Vérifier sur quelle branche on travaille avant de supposer que `main` reflète l'état courant du code.
- README.md, ligne de badges en tête (`<div align="center">…</div>`) : les badges sont en markdown pur (`[![alt](img)](lien)`), générés par `istanbul-badges-readme` qui ne sait émettre que ça (jamais de `<img>`). Deux pièges : (1) du markdown mélangé à du HTML brut sur les mêmes lignes ne se rend PAS sur GitHub (affiché en texte littéral) — le contenu markdown doit être dans son propre paragraphe, isolé par une ligne vide avant et après ; (2) englober ce paragraphe markdown dans un `<p align="center">` produit un `<p>` imbriqué invalide (le moteur markdown enveloppe déjà le paragraphe dans son propre `<p>`) qui casse silencieusement le centrage — utiliser `<div align="center">`, pas `<p>`. Ne pas revenir à des `<img>`/`<a>` HTML mêlés au marqueur `#lines#`, ni à un `<p>` autour, sans revérifier ces deux points.
- Ne jamais nommer un fichier de test `entrypoints/<nom>.content.test.js` (ni `.background.test.js`/`.popup.test.js` etc.) : WXT scanne `entrypoints/` par motif de nom de fichier pour découvrir les entrypoints, et le détecterait comme un second entrypoint portant le même nom → `wxt prepare`/`typecheck`/`build` échouent avec « Multiple entrypoints with the same name detected ». Les tests des fichiers d'entrypoints vivent dans `tests/` à la racine.
- Badges de couverture du README (`istanbul-badges-readme`) : pas régénérés automatiquement en CI (pas d'auto-commit configuré, pour éviter la complexité/risque d'un push depuis un workflow). Les rafraîchir à la main avant une release avec `npm run test:coverage && npx istanbul-badges-readme`.
- `npm run lint:amo` (`addons-linter` sur le build Firefox) ne peut pas descendre à 0 warning `UNSAFE_VAR_ASSIGNMENT` : contrairement à `eslint-plugin-no-unsanitized`, `addons-linter` ne reconnaît pas `DOMPurify.sanitize()` comme un assainissement valide et flague même le code interne de DOMPurify une fois bundlé. Attendu, à mentionner aux reviewers AMO si besoin — pas un bug à corriger ici.
- `createDefaultSettings()` (`utils/settings.js`) initialise les réglages non personnalisés à `''` (chaîne vide), pas `undefined`. Un paramètre de fonction avec valeur par défaut (`function f(x = 'défaut')`) ne se déclenche que sur `undefined` — passer une valeur venant des réglages sans vérifier ce cas produit une valeur par défaut jamais appliquée, silencieusement (ex: CSS généré avec une valeur vide, ignoré par le navigateur sans erreur). Utiliser `||=` ou un coalescing explicite dans le corps de la fonction plutôt que compter sur les paramètres par défaut.
