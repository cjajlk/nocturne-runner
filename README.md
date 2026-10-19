# Nocturne Runner V1

Version de travail V1, basée sur `1708fff`. Voir [V1-STATUS.md](V1-STATUS.md) pour le bilan, les tests et les points en attente.

## Jouer

Ouvrir `index.html` dans Chrome/Edge, ou garder le serveur local et l'adresse utilisés habituellement. Le rendu 3D est nécessaire à cette version ; si l'accélération graphique est indisponible, la course est bloquée plutôt que d'afficher des fossés invisibles.

- ← → : voie ; ↑ ou espace : saut ; ↓ : glissade ; Échap : pause.
- 1 : aimant ; 2 : planche ; 3 : Surge ; 4 ou B : propulsion aérienne.
- Mobile : gestes et quatre boutons de bonus.
- La course se met en pause à la perte de focus. Reprise manuelle.

## Parcours

Distance illimitée. Vitesse de base de 17 à 36,5 m/s. La planche ajoute 12 à 18 % de vitesse, sans protection. La difficulté évolue par paliers : 200, 600, 1 200, 2 500, 5 000, 10 000 et 20 000 mètres. Les séquences alternent changements de voie, sauts, glissades et récupération. Deux voies peuvent être occupées dès 200 m. À partir de 450 m, certains passages imposent un saut ; à partir de 700 m, une glissade. La route franchissable est toujours accessible depuis une voie adjacente, mais elle peut demander une action annoncée par SAUT ou GLISSE. Espacement minimal de 1,1 s à la vitesse maximale prévue avec planche, et au moins 1,2 s après les passages obligatoires.

Drones bas à partir de 1 200 m, hauts à partir de 1 600 m : saut/esquive ou glissade/esquive. Ils restent hors de la route franchissable réservée. Trajet gauche-droite-gauche, flèche anticipée, mouvement figé à l'approche. Fossés à partir de 900 m, de trois unités de route : saut/esquive, sinon chute.

## Fragments

Petits groupes au lieu des longues lignes : fragments ordinaires de 1 ou 2 unités, fragments dorés à risque de 5. Les fragments placés au-dessus des obstacles demandent un saut ; ceux sous les lasers demandent une glissade. Aimant et propulsion conservent leurs avantages de collecte. Récompense de distance : 5 par tranche de 1 000 m, une fois par course. Esquive proche : 1, limitée à 10 par course. Les crédits sont enregistrés pendant la course, avec journal de reprise après interruption et déduplication.

Les prix existants restent provisoires et inchangés : améliorations 600 / 1 500 / 3 200 / 6 000 / 10 000 ; chat 5 000 ; Nova 20 mots. Lettres, missions, collection et compagnons sont conservés.

## Inventaire et bonus

Choisir les quantités à emporter dans Inventaire, maximum trois de chaque type. Le stock supplémentaire reste sauvegardé. Aucun stock gratuit ajouté lors de la migration. Un bonus ramassé rejoint le stock, à équiper pour une prochaine course.

Un effet actif à la fois. Une unité consommée à l'activation. Cinq secondes de récupération après sa fin ; les compteurs s'arrêtent en pause.

- Aimant : collecte de fragments par le compagnon.
- Planche : accélération, aucune invulnérabilité.
- Surge : un choc absorbé ; ne protège pas d'une chute dans un fossé.
- Propulsion : vol et passage au-dessus des obstacles/fossés.

Ancienne Surcharge de score : niveau conservé séparément ; conversion en Surge à décider. Aucun remboursement ni conversion imposée.

## Résurrection et record

Une proposition par course après une mort non protégée, si le portefeuille contient 50 fragments. Acceptation : paiement unique, même distance, deux secondes de protection et dégagement des dangers proches. Refus ou deuxième mort : fin définitive. Aucun bonus consommé remboursé.

L'ancien record reste l'objectif pendant la course. Mètres restants, barre et effet au dépassement ; record final enregistré de façon transactionnelle.

## Sauvegardes et CJ

Stockage V1 : `nocturneRunnerV1Data`. Original `nocturneRunnerProfileV1` et ancien record laissés intacts ; copie de migration dans `nocturneRunnerV1LegacyBackup`. Les événements en attente ont leur propre préfixe. Aucun effacement automatique des données invalides. Un échec de sauvegarde arrête la course ; recharger après résolution du problème.

Les crédits, achats et récompenses internes utilisent un verrou propre à Nocturne. L'adaptateur CJ est inchangé. Les CJ universels restent gérés uniquement par le moteur du Hub. Une origine différente (fichier local, localhost, GitHub Pages) possède un stockage différent : la validation réelle du compte universel devra se faire sur la bonne origine.

## Musique future

Aucun morceau ajouté. Options et volume indépendant préparés. Après validation et fourniture d'un morceau local, l'intégration peut appeler `NRAudio.setTrack('music/nocturne-dnb.mp3')`. Boucle, autorisation au geste utilisateur et continuité sans redémarrage à la résurrection sont préparées. Lecture réelle à vérifier avec le morceau approuvé.

## Développement et tests

Le jeu ne nécessite pas les dépendances de test. Pour les tests : `npm install`, `npx playwright install chromium`, `npm test`. Chrome déjà installé peut être utilisé via `NOCTURNE_CHROME`. La suite actuelle est `tests/v1-smoke.cjs` ; l'ancienne suite est conservée comme référence dans `tests/legacy-v010-smoke.cjs`.

Ne pas effacer le stockage pour rafraîchir les fichiers : actualiser sans cache suffit. Avant tout retour à v0.10, exporter les nouvelles données V1, car cette ancienne version ne représente pas les nouveaux stocks.

Tests supplémentaires du parcours : `node tests/track-patterns.cjs` et `node tests/challenge-patterns-smoke.cjs`.
