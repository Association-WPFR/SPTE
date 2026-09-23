# Contribuer à SPTE

Merci de vouloir filer un coup de pouce !

## Si vous n'êtes pas développeur·euse

Le plus utile : [ouvrir une issue](https://github.com/Association-WPFR/SPTE/issues) avec un exemple concret (l'URL de la traduction concernée, le texte exact qui pose problème, etc) ou proposer des idées.

Plus de détails sur le wiki : [Comment contribuer](https://github.com/Association-WPFR/SPTE/wiki/Comment-contribuer).

## Si vous êtes développeur·euse

Prérequis : Node.js (version exacte dans `.nvmrc`), npm.

Les commandes utiles :
```bash
npm install          # installe les dépendances
npm run dev           # lance l'extension en mode développement (Chrome)
npm run dev:firefox   # idem, pour Firefox
npm test              # lance les tests
npm run lint           # ESLint
npm run build          # build de production (Chrome)
npm run build:firefox  # build de production (Firefox)
```

Le moteur des règles typographiques vit dans `utils/rules.js` (c'est le tableau `TypographyRule[]`). Chaque règle a sa propre regex, testée dans `utils/regex.test.js`.

Avant de modifier une règle existante, lancez `npm test` pour vérifier l'état actuel. Les tests sont obligatoires.

## Tags de version

Format `X.X.X`, sans `v` devant (ex: `3.0.0`, pas `v3.0.0`) — convention en place depuis la 2.0.0.

## Workflow git

`main` est protégée : toute modification passe par une Pull Request, jamais de push direct.
