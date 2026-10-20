# Bilan de développement Nocturne Runner V1

## Évolution du 19 octobre 2026 — Obstacles et risque

Les règles actuelles du parcours sont décrites dans README.md. Le générateur propose des séquences avec deux voies occupées plus tôt, des sauts/glissades parfois obligatoires et annoncés, des récupérations courtes et des fragments dorés réellement conditionnés à une action. Une route franchissable avec les commandes de base reste prévue ; elle ne reste plus toujours vide.

Validation : 22 500 rangées contrôlées, simulation de 50 km sans bonus et trois autres simulations de 20 km (dont une au boost maximal), actions obligatoires vérifiées sur les trois voies, récompenses à risque et aimant testés. Les essais sont automatisés et ne remplacent pas un équilibrage humain sur téléphone. Les systèmes de sauvegarde, CJ, prix, caméra et interface sont conservés.

Le bilan daté du 13 octobre ci-dessous décrit l’état historique initial de la V1.

13 octobre 2026. Base : `1708fff`. Version de sécurité complète créée avant modification, y compris `.git`. Le 13 octobre, CJ a ensuite autorisé le commit et le push après correction de la taille du personnage.

## Effectué

- Sauvegarde interne transactionnelle avec un verrou distinct de celui du Hub ; transactions sérialisées entre onglets.
- Gains sécurisés pendant la course. Journal persistant des crédits, ramassages et lettres : récupération après interruption, attribution unique.
- Original v0.10 et copie de migration conservés. Stocks initialisés à zéro, investissements de Surcharge conservés séparément de Surge.
- Personnages Runner/Nova réduits d'environ 22 %, sans déformation ; planche et chat ajustés, compagnon vers l'intérieur. Pieds toujours alignés sur la route.
- Pause automatique à la perte de focus/visibilité et protection des actions pendant les transitions.
- Paliers de difficulté jusqu'à 50 000 m, phases de répit, rangées aléatoires, voie libre et espacement conservateur tenant compte du boost de planche.
- Drones avec deux hauteurs, mouvement latéral prévisible, flèche anticipée et arrêt des mouvements à l'approche. Sprite existant réutilisé.
- Fossés rendus par ouverture réelle de la surface WebGL, bords lumineux, collision sur leur longueur et chute.
- Récompenses de distance idempotentes, esquives proches plafonnées, fragments en petits groupes et opportunités dorées à risque.
- Inventaire persistant, trois équipés par type maximum, activation manuelle, un effet actif, récupération de cinq secondes, consommation unique.
- Planche accélératrice sans protection, Surge à un choc, propulsion aérienne ; aimant/compagnon conservé.
- Résurrection unique à 50 fragments, refus possible, solde vérifié, paiement unique, même distance, protection deux secondes et dégagement des dangers proches.
- Ancien record figé, barre, objectif restant, effet au dépassement et mise à jour finale atomique.
- Tampons de sommets réutilisés ; qualité économique à résolution de route réduite, fenêtres et halos limités.
- Préparation d'un lecteur local de musique en boucle, volume séparé et déblocage audio au geste utilisateur ; aucun morceau ajouté.

## Tests réalisés

- Test obligatoire : 1 000 +10 +20 dans deux onglets = **1 030**. Répéter le même événement ne crédite rien de plus.
- Crédit interrompu récupéré au rechargement, sans duplication lors d'un second rechargement.
- Adoption concurrente du chat : un seul achat. Récompense de mission concurrente : un seul versement.
- Migration de profil ancien : portefeuille, niveaux, Nova/chat, Surcharge et source originale conservés ; nouveau Surge niveau zéro.
- Limite d'emport de trois, conservation du stock non équipé, refus d'une quatrième consommation, bonus exclusifs, délai de cinq secondes.
- Ramassage sans activation, Surge absorbe un choc, planche non protectrice, vol au-dessus d'un conteneur.
- Résurrection : 50 prélevés une seule fois, distance identique, deux secondes de protection, deuxième mort définitive ; solde 49 sans proposition.
- Matrice de huit collisions, drones bas/hauts et glissade/saut, trajectoire gauche-droite-gauche. Fossé franchi puis chute sans saut.
- 18 000 rangées échantillonnées aux seuils 0 / 3 000 / 6 000 / 10 000 / 20 000 / 50 000 : voie libre, transitions adjacentes, drones hors voie réservée, longueur des fossés et marge temporelle contrôlées.
- Simulation d'une course de **50 km sans bonus**, avec les commandes de base suivant la voie libre ; aucune mort. C'est un joueur automatisé, pas une validation humaine de la difficulté.
- Record de référence conservé jusqu'à la fin ; record final sauvegardé.
- 30 combinaisons des deux personnages, trois voies et cinq poses ; sprites et chat dans le cadre. Affichage PC et 390 × 844 simulé, boutons de bonus d'au moins 44 pixels.
- Qualité basse/haute et contexte WebGL sans erreur ; rendu 3D indisponible explicitement bloqué pour éviter les fossés invisibles du repli 2D.
- Sauvegarde invalide non remplacée. Les tests ne touchent pas les sauvegardes du navigateur habituel.
- Clé CJ témoin inchangée et adaptateur CJ identique octet pour octet. Les requêtes Hub sont bloquées dans les tests : aucun vrai CJ attribué.
- Les **119 PNG d'origine et les deux sprites Nova/chat sont identiques** à la copie de sécurité, vérifiés par SHA-256.

## Économie provisoire

Les prix d'amélioration, du chat, de Nova, des mots et des missions n'ont pas changé. Les fragments collectables produisent environ **46–47 unités/km** au potentiel maximal des secteurs avancés, contre environ 114 auparavant, hors lettres/missions. S'ajoutent 5 par kilomètre et au maximum 10 esquives proches par course. La diminution est justifiée par les motifs plus courts, leur fréquence, la valeur de leurs fragments et le nouvel espacement ; les fragments dorés valent 5 et demandent un passage risqué.

Cette mesure est une borne de collecte des parcours générés, pas un gain moyen de joueurs. Les temps d'achat et le plaisir de progression doivent être ajustés avec des essais humains, en incluant les mots et missions. Aucun prix de consommable n'a été inventé : le stock s'obtient sur la route.

## Partiel ou en attente

1. **Surcharge historique → Surge : décision de CJ.** Le niveau reste stocké et affiché, mais le multiplicateur de score ancien n'est pas actif dans les quatre bonus V1. Aucune conversion/remboursement irréversible.
2. **Musique : morceau manquant.** Préparation terminée ; lecture réelle, raccord de boucle et restriction audio mobile à vérifier quand le morceau Suno approuvé sera fourni.
3. **Téléphones physiques / Safari / validation humaine.** Les captures mobiles sont simulées ; aucune garantie de fréquence d'images sur tous les téléphones. Le moteur 3D est requis ; le repli 2D n'est pas validé pour le gameplay V1.
4. **CJ réels sur l'origine du Hub.** Source conservée, contrat et isolation contrôlés ; accumulation réelle, identité et concurrence Hub devront être testées avec un compte de test sur l'origine appropriée. Aucun autre jeu ou fichier du Hub modifié.
5. **Endurance des sauvegardes.** Les dix derniers journaux de courses terminées sont gardés pour limiter le volume. Les courses abandonnées ne sont pas purgées automatiquement ; prévoir une maintenance coordonnée pour les très longues utilisations. En cas de quota plein, le jeu se bloque sans effacer le profil.
6. **Polissage.** Chute et vol réutilisent les poses existantes, sans nouveaux assets. Effets/drone/terrain à affiner avec validation visuelle de CJ.

## Fichiers

Modifiés : `game.js`, `road3d.js`, `profile.js`, `index.html`, `menu.css`, `package.json`, `README.md`, `README.txt`, `tests/browser-smoke.cjs`.

Ajoutés : `storage-v1.js`, `track-v1.js`, `audio-v1.js`, `tests/v1-smoke.cjs`, `tests/legacy-v010-smoke.cjs`, ce fichier `V1-STATUS.md`.

Inchangés : `.git` jusqu'à l'autorisation finale de commit, `cj-integration.js`, tous les assets, les autres jeux et le Hub. Aucun nouveau visuel généré ni publication du jeu.

## Reprendre le développement

1. Garder la copie `Nocturne_Runner_1708fff_SECURITE_COMPLETE.zip` intacte. Le ZIP V1 livré contient aussi `.git`, les assets, les fichiers et les changements de cette session.
2. Ouvrir le projet à la même adresse locale pour retrouver son stockage. Distinguer le stockage V1, les anciennes données et les CJ ; ne jamais lancer de nettoyage global de localStorage.
3. Relancer `npm test` avec Playwright/Chromium, ou Chrome via `NOCTURNE_CHROME`. L'ancienne suite v0.10 est une archive de référence, pas un test V1.
4. Commencer par des essais humains sur PC/téléphone et l'origine correcte du Hub ; mesurer gains/minute, lisibilité, réaction et temps d'achat.
5. Décider de la conversion réversible de Surcharge avant de modifier ce niveau historique. Fournir ensuite le morceau original approuvé.
6. Avant retour à v0.10, exporter `nocturneRunnerV1Data`, le journal en attente et la copie de migration. Restaurer le code depuis la copie de sécurité ; ne pas supprimer les données V1, qui contiennent des stocks absents du format ancien.

## Mise à jour du 20 octobre 2026 — runners supplémentaires

K-0, Vesper et Onyx disposent de six poses de dos et sont jouables après défi et achat. Conditions et prix inchangés depuis la préparation. Achat atomique, équipement sauvegardé, aperçu d’accueil cohérent. Ni migration destructive ni modification des collisions ou du Hub. Tests dédiés : seuils, solde, concurrence entre onglets, rechargement, bouton d’achat et poses sur les trois formats portrait. Les sections historiques ci-dessus décrivent les étapes précédentes.
