# Trouver des pages de test sur translate.wordpress.org

Pour tester SPTE en conditions réelles (extension chargée en unpacked), il faut des chaînes déjà traduites mais pas encore validées (statut « waiting »/« fuzzy ») — SPTE analyse les traductions soumises, pas les chaînes vides.

## Filtre officiel : thèmes/plugins avec le plus de waiting+fuzzy

- Plugins : `https://translate.wordpress.org/locale/fr/default/wp-plugins/?s=&page=1&filter=strings-waiting-and-fuzzy`
- Thèmes : `https://translate.wordpress.org/locale/fr/default/wp-themes/?s=&page=1&filter=strings-waiting-and-fuzzy`

Trie automatiquement par nombre de chaînes waiting+fuzzy décroissant. Aller sur le premier résultat, sous-projet « Stable », filtrer sur « Waiting ».

## Pièges

- Un projet à 0 % traduit (aucune chaîne soumise) est inutile pour tester SPTE — il n'y a rien à analyser. Chercher un volume de « waiting », pas un faible taux de complétion.
- Les gros plugins très maintenus (WooCommerce, Elementor selon les périodes) ont parfois 0 waiting (tout est déjà relu) — vérifier le compte affiché avant de s'y rendre, pas juste la popularité du plugin.
