# Nocturne Runner — corrections ciblées du 23 octobre 2026

## Changements
- Impulsion spectrale : deux réacteurs lumineux distincts sous les chaussures, noyaux clairs, halos cyan/violet pulsés et traînées plus épaisses. Aucun plateau physique, filtre flou ou système de particules ajouté.
- Rush aérien : traînées plus épaisses et plus visibles, même au début d'une course. Vitesse, durée, trajectoires et collecte aérienne inchangées.
- Options : bouton Plein écran / Quitter le plein écran, état synchronisé avec le navigateur, gestion des refus et des navigateurs incompatibles. Dans ces cas, message explicite et présentation normale conservée. Pas de changement de caméra ni du cadre portrait.
- SAUT/GLISSE : déjà absents des textes rendus par la version actuelle ; absence confirmée par les tests de rendu. Les notifications utiles restent présentes.

## Mots et personnages
La progression des lettres est déjà persistante : collecte partielle, rechargement, fermeture de l'onglet et reprise testés. Le mot suivant commence uniquement après achèvement ; rejouer la dernière lettre ne crédite pas une deuxième récompense. Aucun changement de sauvegarde nécessaire.
Rythme conservé : NEON → OMBRE → NOVA → ECLIPSE, puis nouveau cycle. Nova demande 20 mots (5 cycles, 100 lettres). Aucun déblocage gratuit supplémentaire introduit.
Conditions vérifiées : K-0 = record 2 500 m + achat 6 000 fragments ; Vesper = 40 mots + 10 000 ; Onyx = record 7 500 m ET 60 mots + 18 000. Nova acquise avant une ancienne migration reste acquise. Achat insuffisant, seuil manquant, achat concurrent, double achat, équipement et reprise testés.

## Vérifications exécutées
- tests/bonus-v2-smoke.cjs : bonus, durées et stocks historiques, accélération, collisions sans protection de l'Impulsion, fragments aériens sur trois voies, collecte par voie sans doublon, retour au sol, notifications et captures PC/mobile : réussite.
- tests/options-words-smoke.cjs : mot partiel conservé après rechargement et fermeture d'onglet, complétion, mot suivant, récompense unique ; entrée/sortie plein écran, refus et absence d'API ; Options aux quatre tailles : réussite.
- tests/characters-smoke.cjs : déblocages, achats et équipement, animations et trois tailles mobiles : réussite.
- tests/mobile-course-smoke.cjs : 360×800, 390×844, 412×915, trois voies, course/saut/glissade, gestes, HUD compact, projection et collisions : réussite.
- tests/v1-smoke.cjs : sauvegardes, concurrence, inventaire, résurrection, fossés et simulation 50 km ; témoin de stockage CJ inchangé : réussite.
- tests/graphics-performance.cjs : comparaison alternée sur PC et trois tailles mobiles, qualités élevée/économique. Écart médian −0,3 à +0,2 ms selon le cas. Ce benchmark mesure le rendu de scènes fixes sur ordinateur, pas un téléphone physique.
- git diff --check : aucune erreur d'espacement.

## Fichiers
Modifiés : game.js, profile.js, index.html.
Créés : fullscreen.js, tests/options-words-smoke.cjs, CORRECTIFS-2026-10-23.md.
Aucun asset bitmap créé ou remplacé. road3d.js, track-v1.js, storage-v1.js, characters.js et cj-integration.js inchangés.

## Sauvegarde et preuves
Sauvegarde complète avant modification, dossier .git inclus :
C:/Users/User/Documents/Codex/2026-10-12/re/outputs/correctifs-2026-10-23/Reference-complete-avec-git.zip
Captures et résultats des tests : même dossier.
Version locale modifiée directement dans E:/cj_project/NOCTURNE RUNNER, prête à tester avec le serveur local habituel. Actualiser la page pour charger les nouveaux scripts.

## Limites
Tests automatisés Chrome sur ordinateur avec dimensions mobiles simulées ; aucun téléphone physique ni Safari/iOS réel testé. Plein écran dépend des permissions et des capacités du navigateur. Intégration Hub distante bloquée dans les tests isolés : aucune opération sur les CJ du Hub, mais pas de validation de bout en bout du service distant. Aucun blocage ou régression détecté par les contrôles exécutés.
Aucun commit, push ou publication effectué.
