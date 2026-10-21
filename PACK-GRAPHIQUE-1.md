# Nocturne Runner V2 — Pack graphique 1

Version locale du 21 octobre 2026. Aucun commit, push ou publication réalisé pour ce pack.

## Visuels livrés

- Quatre apparences de `container` : module de sécurité biseauté, caisson mécanique empilé, structure endommagée et unité technologique à section octogonale. Silhouettes et panneaux distincts, palette graphite/cyan/violet. Elles restent toutes des obstacles hauts bloquants ; aucune nouvelle fonction de gameplay.
- Fossés : découpe du revêtement conservée, cadre métallique irrégulier, parois sombres, grille arrachée contre une paroi et pointes en retrait. Les pointes et grilles sont décoratives. Dimensions, intervalle de collision et règles de chute inchangés.
- Effets de vitesse : accents sur les rails et réflecteurs latéraux suivant le déplacement réel de la route ; longueur et luminosité pilotées par la vitesse réelle. Deux à six traits derrière les pieds, atténués pendant saut/glissade. Le bonus de planche amplifie ces effets via sa vitesse existante.
- Qualité économique : deux traits derrière le personnage, moitié moins de segments sur les rails, moins de petits détails sur les modules et dans les fossés. Aucun flou global.

## Assets et rendu

Les nouveaux assets sont des géométries originales intégrées dans `road3d.js`, pas des PNG plaqués sur la route ni des modèles externes. Les huit maillages des modules (quatre variantes × deux qualités) sont calculés une seule fois puis réutilisés. Leur apparence dépend de l’identifiant de l’obstacle, sans modifier cet objet ni consommer le générateur aléatoire du parcours.

Les matériaux intérieurs des fossés contournent uniquement le masque de découpe du revêtement. Ils restent opaques et utilisent la même passe WebGL que le reste de la scène. Le tampon des ouvertures est réutilisé ; aucun nouvel attribut de sommet ni passe de rendu supplémentaire. Les images et sprites d’origine sont intacts.

## Préservation

La fonction de caméra, la projection du personnage et la fonction de mise à jour/collision sont inchangées. `track-v1.js`, `storage-v1.js`, `profile.js`, `characters.js` et `cj-integration.js` sont identiques à la référence par SHA-256. Vitesse, Difficulté V2, fenêtres d’action, bonus, prix et durées inchangés. Aucun fichier des autres jeux ou du Hub modifié.

## Fichiers

- `road3d.js` : modèles, fossés, accents de vitesse, tampons réutilisés et compteurs de rendu.
- `game.js` : fonction purement visuelle `speedWake()` et son appel avant le dessin du personnage.
- `tests/graphics-pack-smoke.cjs` : scènes comparatives PC/portrait, variantes, limites de cadrage, visibilité après collision, invariance des objets/sauvegardes, effets progressifs et mesures de rendu.
- `tests/graphics-performance.cjs` : comparaison alternée sur une scène identique, 32 mesures par version, format et qualité.
- `tests/track-patterns.cjs` : vérification explicite de deux voies de fossés au maximum.
- `tests/v1-smoke.cjs` : possibilité de tester le moteur de référence et vérification des voies en approche, compatible avec le suivi latéral de caméra déjà validé.
- Ce document.

L’ancien test V1 exigeait que les deux voies extrêmes soient simultanément visibles au plan de collision alors que la caméra suivait la voie gauche. Cette assertion échouait aussi sur la référence. La caméra n’a pas été changée pour corriger le test : il vérifie désormais les voies à l’approche ; les tests mobiles et graphiques contrôlent les personnages et obstacles dans la voie suivie.

## Tests et limites

Les tests exécutés couvrent : simulation V1 de 50 km sans bonus, 22 500 rangées de Difficulté V2, collisions/fossés/résurrection, gestes, stocks et rechargement des bonus, sauvegardes, achats concurrents des personnages, accueil et HUD. Formats PC, 360×800, 390×844 et 412×915 ; contrôle paysage dans la suite mobile. Les personnages sont vérifiés dans les trois voies en course, saut, glissade, planche et vol. Les tests utilisent des contextes navigateur isolés, sans modifier les sauvegardes réelles du joueur.

Mesures alternées dans Chrome automatisé : surcoût médian en qualité élevée de 0,1 à 0,4 ms selon le format ; qualité économique dans la variabilité du test. Ces mesures de rendu sur ordinateur ne garantissent pas les performances d’un téléphone. Aucun téléphone physique ni nouvelle connexion réelle au Hub n’a été testé.

La scène de présentation des modules peut placer trois containers pour comparer leurs formes : elle est synthétique et ne modifie pas les rangées du générateur. Les captures de fossés montrent leurs détails à courte distance ; depuis la caméra basse, le fond reste volontairement sombre et les pointes sont moins visibles au loin. Les bords lumineux servent à l’anticipation. Le ressenti de vitesse reste à confirmer en jouant.

## Relancer les tests

Utiliser les mêmes variables `NOCTURNE_PLAYWRIGHT` et `NOCTURNE_CHROME` que les autres tests du projet, ou installer les dépendances de développement.

```text
node tests/track-patterns.cjs
node tests/v1-smoke.cjs
node tests/mobile-course-smoke.cjs
node tests/ui-v1-smoke.cjs
node tests/characters-smoke.cjs
node tests/home-arcade-smoke.cjs
node tests/graphics-pack-smoke.cjs
```

Pour les comparaisons : `NOCTURNE_UI_OUTPUT` choisit le dossier de livraison ; `NOCTURNE_GRAPHICS_BASELINE=1` désactive les assertions spécifiques aux nouveaux visuels. `NOCTURNE_SOURCE_ROAD` / `NOCTURNE_SOURCE_GAME` permettent de charger les sources de référence dans le test graphique. Le benchmark alterné attend `NOCTURNE_REFERENCE_DIR` contenant les anciens `game.js` et `road3d.js`, et `NOCTURNE_UI_OUTPUT` pour son résultat JSON.

## Essai local

Le projet modifié est dans son dossier habituel. Recharger avec Ctrl+F5 via le serveur local existant. Pour conserver la référence, extraire le ZIP du pack dans un dossier séparé. Le ZIP contient `.git` et les modifications locales non commitées ; aucun historique n’a été réécrit. Les sauvegardes du navigateur dépendent de l’origine locale utilisée.
