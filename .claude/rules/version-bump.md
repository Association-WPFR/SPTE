# Montée de version — bloquant

Avant de merger (ou de proposer de passer en ready) une PR qui change le numéro de version : vérifier que `package.json` et `package-lock.json` portent bien le même numéro de version, tous les deux alignés sur la section `CHANGELOG.md` en tête de fichier.

## Hook à chaque PR de montée de version

1. `grep '"version"' package.json` et comparer à la section `## [X.Y.Z]` en tête de `CHANGELOG.md` (doivent matcher).
2. `grep -m1 '"version"' package-lock.json` (deux occurrences en tête de fichier, `name`/`packages.""`) : doivent matcher `package.json`. Si désynchro, `npm install --package-lock-only` pour resynchroniser, jamais éditer `package-lock.json` à la main.
3. Si un écart est trouvé qui préexistait avant le travail en cours (pas introduit par la PR), le signaler quand même avant de merger plutôt que de l'ignorer silencieusement.
