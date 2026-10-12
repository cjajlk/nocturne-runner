# Nocturne Runner

Prototype v0.10.0 : endless runner dans une cité néon.

## Jouer

Ouvrir `index.html` dans Chrome ou Edge, ou servir le dossier avec un serveur local. Aucun téléchargement externe n'est nécessaire pour jouer.

- ← → : changer de voie ; ↑ ou espace : sauter ; ↓ : glisser.
- B : propulsion, une activation par course ; Échap : pause.
- Mobile : gestes directionnels et bouton propulsion.

## Mots de la cité

Collecter les lettres holographiques dorées pour compléter la série **NÉON → OMBRE → NOVA → ÉCLIPSE**. Les accents ne sont pas à ramasser. Les lettres d'un même mot peuvent être récupérées dans n'importe quel ordre.

Chaque lettre est sauvegardée immédiatement. Récompenses : 90 / 100 / 90 / 120 cristaux. Après quatre mots, **Nova** devient disponible dans Personnages. La série recommence ensuite et continue à rapporter des cristaux.

L'aimant ramasse les cristaux uniquement : les lettres se récupèrent en passant dans leur voie.

## Compagnons et personnages

- Robot éclaireur : gratuit, équipé par défaut.
- Chat néon : 250 cristaux, achat unique et sélection sauvegardée.
- Compagnons visibles pendant l'aimant, avec animation de collecte.
- Renard spectral et corbeau cyber : annoncés « Bientôt », sans achat.
- Nova possède ses poses debout, course, saut et glissade. Les personnages ont les mêmes capacités.

## Sauvegarde

Le portefeuille, les améliorations, les missions, les mots et les choix équipés sont conservés dans le navigateur. La clé de sauvegarde de v0.9 est conservée et enrichie. Garder le même navigateur et la même adresse de jeu pour retrouver sa progression.

Les cristaux de course sont versés à la fin de la course. Les récompenses des mots sont versées immédiatement. Musique et autres variantes restent à venir.

## Assets

Visuels originaux créés avec ImageGen intégré : `assets/nova-sheet.png` et `assets/cat-sheet.png`. Coordonnées des poses dans `assets/sprites.js`, prompts complets dans [assets/ASSETS.md](assets/ASSETS.md).

## Vérification

`tests/browser-smoke.cjs` couvre collisions, génération, collecte, achats, migration v0.9, progression des mots, déblocage de Nova et sauvegarde des sélections.

Pour relancer les tests : installer les dépendances de développement avec `npm install`, installer Chromium avec `npx playwright install chromium`, puis lancer `npm test`. Pour utiliser Chrome existant, définir `NOCTURNE_CHROME` avec le chemin de son exécutable.

Les dépendances de développement ne sont pas nécessaires pour jouer. Affichage vérifié dans Chrome à 900 × 1400 et 390 × 844. Téléphone physique non testé.
