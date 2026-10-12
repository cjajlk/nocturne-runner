NOCTURNE RUNNER — Prototype v0.9.0

DÉMARRER
Décompresser toute l'archive, puis ouvrir index.html dans Chrome ou Edge.
Jeu autonome : aucune connexion Internet nécessaire.

NOUVEAUTÉS
Quatre obstacles 3D alignés sur la route :
- Caisse d'énergie : sauter ou changer de voie.
- Barrière basse : sauter ou changer de voie.
- Portique laser : glisser dessous ou changer de voie.
- Conteneur haut : changer de voie.
Les rangées gardent une voie libre, avec un espacement progressif et des
changements de voie libre limités à une voie entre deux rangées.

Cristaux violets collectables, portefeuille, écran de résultats, quatre
missions avec récompenses, atelier et sauvegarde locale.
Les nouveaux obstacles et cristaux sont dessinés par le jeu ; ils sont
éditables dans road3d.js et game.js sans textures externes.

AMÉLIORATIONS
Cinq achats par bonus, aux prix 60 / 140 / 280 / 480 / 760 cristaux.
Planche : 8 secondes au départ, +2 secondes par niveau, absorbe un choc.
Aimant : 8 secondes au départ, +2 secondes par niveau, attire les cristaux.
Surcharge : score doublé, 8 secondes au départ, +2 secondes par niveau.
Propulsion : une activation gratuite par course, touche B ou bouton ⚡.
4 secondes et +22 % de vitesse au départ ; +1 seconde et +3,5 points
par niveau. Les changements s'appliquent aux courses suivantes.
Les cristaux et les missions sont comptabilisés à la fin d'une course.
Les prix constituent une première proposition à équilibrer avec les essais.

MENU ET OPTIONS
Jouer / Atelier / Collection / Missions / Options.
Effets sonores et qualité graphique sont fonctionnels et sauvegardés.
Musique, variantes de tenues et sélection de planches : bientôt.

COMMANDES
← → : changer de voie ; ↑ ou espace : sauter ; ↓ : glisser.
B : propulsion ; Échap ou bouton Ⅱ : pause.
Mobile : gestes directionnels et bouton propulsion.

SAUVEGARDE
Progression conservée dans ce navigateur sur cet appareil. Garder le même
emplacement de jeu et le même navigateur pour retrouver sa sauvegarde.
Effacer les données du navigateur efface la progression. Si le navigateur
refuse la sauvegarde, le jeu affiche un message et conserve la progression
uniquement pendant la session ouverte. Le record v0.8 utilise sa clé existante.

VÉRIFICATIONS
Huit situations de collision : saut, glissade, choc, conteneur et protection.
Mille rangées générées avec au maximum deux voies bloquées par rangée.
Collecte, versement unique en fin de course, achat et rechargement de la
sauvegarde, récompense de mission unique, options, boost, pause et reprise.
Affichage Chrome à 900 x 1400 et 390 x 844 ; aucune erreur JavaScript ou
WebGL observée. Téléphone physique et Safari non testés.

CORRECTION v0.9.1 : proportions originales du personnage respectées dans toutes les poses ; silhouette agrandie en hauteur avec les pieds ancrés sur la route.

CORRECTION v0.9.2 : planche néon dessinée sous les deux pieds, posture debout pendant la glisse, petit compagnon robot durant l'aimant et fragments animés vers lui. Vitesse : 17 m/s au départ, augmentation avec la distance, plafond de 36,5 m/s à 2 730 mètres (hors propulsion).
