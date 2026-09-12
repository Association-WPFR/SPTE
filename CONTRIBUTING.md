# Contribuer à SPTE

Merci de vouloir contribuer ! Deux façons de le faire, selon votre profil.

## Vous n'êtes pas développeur·euse

Le plus utile : [ouvrir une issue](https://github.com/Association-WPFR/SPTE/issues) en français, avec un exemple concret (l'URL de la traduction concernée, ou le texte exact qui pose problème). Plus de détails sur le wiki : [Comment contribuer](https://github.com/Association-WPFR/SPTE/wiki/Comment-contribuer).

## Vous êtes développeur·euse

Prérequis : Node.js (voir `package.json`), npm.

```bash
npm install          # installe les dépendances
npm run dev           # lance l'extension en mode développement (Chrome)
npm run dev:firefox   # idem, pour Firefox
npm test              # lance les tests Vitest
npm run lint           # ESLint
npm run typecheck      # vérification TypeScript
npm run build          # build de production (Chrome)
npm run build:firefox  # build de production (Firefox)
```

Le moteur de règles typographiques vit dans `utils/rules.ts` (un tableau `TypographyRule[]`). Chaque règle a sa propre regex, testée dans `utils/regex.test.ts`. Avant de modifier une règle existante, lancez `npm test` pour vérifier l'état actuel — ces tests figent le comportement voulu et doivent continuer à passer après votre changement.

Le fichier `TODO.md` à la racine (non versionné, local à chaque contributeur) sert de feuille de route de la refonte en cours ; il n'est pas nécessaire de le consulter pour une contribution ponctuelle.

Pas encore à jour : la page [Contribuer](https://github.com/Association-WPFR/SPTE/wiki/Comment-contribuer) du wiki décrit encore l'ancienne structure de fichiers (avant la migration vers [WXT](https://wxt.dev/)) — sa mise à jour est prévue.
