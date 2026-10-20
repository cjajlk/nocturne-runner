# Runners supplémentaires — animations et achats

Trois concepts originaux dans la direction actuelle : vêtements techniques noirs, détails cyan et violets, silhouette athlétique. Portraits générés avec l’outil intégré imagegen. Les PNG originaux sont conservés ici, sans retouche.

| Personnage | Défi préalable | Prix après le défi |
| --- | --- | --- |
| K-0, androïde coursier | Record de 2 500 m en une course | 6 000 cristaux |
| Vesper, renarde cybernétique bipède | 40 mots de la cité complétés | 10 000 cristaux |
| Onyx, panthère d’ombre bipède | Record de 7 500 m ET 60 mots complétés | 18 000 cristaux |

Toutes les conditions d’une ligne se cumulent. Les défis ouvrent le droit à l’achat ; ils ne prélèvent rien. Le prix sera prélevé une seule fois à l’achat. Les records et mots déjà sauvegardés comptent : aucune remise à zéro. Nova conserve son déblocage gratuit à 20 mots. Ces seuils sont un premier équilibrage à confirmer par les durées réelles de jeu ; aucune durée de déblocage garantie.

## État livré

- `k-0-concept.png`, `vesper-concept.png`, `onyx-concept.png` : portraits de présentation, pas des sprites de course.
- `characters.js` à la racine : catalogue avec identifiants, visuels, prix et conditions.
- `k-0-sheet.png`, `vesper-sheet.png`, `onyx-sheet.png` : six poses de dos sur fond transparent pour chacun (repos, deux pas alternés, saut, glissade et planche). Le vol réutilise le saut.
- Écran Personnages : défis, progression et achat réel après conditions ; achat et équipement sauvegardés. Le personnage acheté est équipé immédiatement et apparaît aussi sur l’accueil.
- Capacités prévues identiques pour tous : vitesse, taille de collision, saut, glissade et bonus inchangés. La queue et les oreilles sont décoratives.

## Intégration livrée

Les coordonnées des poses sont dans `assets/sprites.js`. Chaque runner dispose d’une ancre de corps pour garder sa voie malgré la queue ou les bras. La taille des poses debout et en course est normalisée à celle du runner existant ; le saut et la glissade suivent la projection de la caméra. Les collisions restent communes à tous.

L’achat utilise une transaction NRStore atomique : identifiant connu, conditions remplies, solde suffisant et personnage non possédé. Prélèvement, déblocage et équipement sont sauvegardés ensemble. Aucun nouveau débit si une autre fenêtre a déjà acheté le personnage. Nova reste gratuite à 20 mots. Aucun changement du Hub ni de la monnaie.

Validation : `node tests/characters-smoke.cjs` couvre les seuils manquants, le solde insuffisant, les achats concurrents, le double achat, le bouton d’achat, l’équipement après rechargement, les six états visuels sur 360×800 / 390×844 / 412×915 et la transparence des sprites. Les tests V1 couvrent aussi une simulation de 50 km. Captures de validation dans le dossier de livraison local `outputs/personnages/animes`. Il s’agit de tests navigateur automatisés ; le ressenti des animations et l’équilibrage restent à confirmer en jeu sur téléphone réel.

## Prompts de génération

Outil : imagegen intégré. Trois appels pour les concepts, puis trois appels séparés pour les planches de poses, en utilisant le portrait correspondant comme référence. Les PNG générés sont copiés sans retouche ; seuls les rectangles de lecture et les ancres sont définis dans le code. Transparence vérifiée par lecture du canal alpha.

Base commune (anglais) :

> Use case: stylized-concept. Production character concept portrait for Nocturne Runner neon cyberpunk night runner game. Detailed polished semi-realistic 3D game illustration matching black technical streetwear, vivid violet and cyan emissive seams, athletic readable silhouette. One full-body character only, entire feet and head visible, three-quarter front standing ready-to-run pose, centered with generous transparent margin. No background, no floor, no text, no logo, no extra figures, no cropped limbs. Actual transparent alpha. Character is a playable runner, not a small pet.

Complément K-0 :

> K-0: lean human-sized courier android, dark graphite articulated armor under short streetwear jacket, smooth faceless visor with narrow cyan light eyes, violet power core in chest, running sneakers, expressive tilted head. Distinct elegant robot anatomy, no weapons.

Complément Vesper :

> Vesper: adult anthropomorphic female fox runner, upright biped athletic anatomy, graphite and silver fur, long pointed ears, expressive cyan eyes, one flowing fox tail with violet luminous tip, black technical bomber jacket and cargo pants, cyan-soled running shoes, fingerless gloves, small magenta details, agile confident personality. Clearly fox muzzle, not human with ears. No weapons.

Complément Onyx :

> Onyx: mysterious adult bipedal shadow panther creature runner, lean muscular feline anatomy, short charcoal-black fur, clearly feline muzzle, small round feline ears, luminous violet eyes, one long panther tail. Black layered technical hooded streetwear with hood down, graphite armored forearms, slender cyan circuits and violet neon cracks, athletic cargo trousers and luminous running sneakers. Elegant grounded physical body, not a floating ghost, no smoke hiding legs, no weapons.

## Prompts des planches de poses

Paramètres des trois appels : `transparent_background: true`, `referenced_image_paths` pointant vers le concept du personnage concerné. Le prompt de chaque appel est la base suivante suivie de son complément.

Base :

> Use case: stylized-concept. Asset type: PRODUCTION TRANSPARENT GAME SPRITE SHEET for Nocturne Runner. Reference image defines character identity only. Create EXACTLY SIX poses of same character in exactly THREE columns and TWO rows, equal cells, no grid lines. ALL SIX figures are seen FROM BEHIND, head to feet fully inside each cell with large empty margins, consistent adult proportions and scale. Top row: 1 upright standing with feet planted; 2 running left leg forward; 3 running right leg forward. Bottom row: 4 airborne jump knees bent; 5 low crouching forward slide with one leg extended; 6 upright balanced feet planted for hoverboard (NO board). Flat game sprite lighting, crisp silhouette. Each pose separate, no overlaps. TRUE FULLY TRANSPARENT BACKGROUND, transparent gaps and corners, no atmospheric halo, no gradient, no ground, no smoke, no shadow disk, no text, no props, no UI. Entire sheet landscape 3:2, each cell tall enough for full body. Maintain graphite technical outfit with cyan and violet luminous lines.

K-0 :

> Character K-0: lean courier ANDROID, full mechanical head with side round violet earpieces and antenna, dark graphite armor under black short high-collar jacket, angular cyan/violet back power core, robot hands and running sneakers. Strict rear view for every pose; preserve robot design from reference.

Vesper :

> Character VESPER: adult anthropomorphic silver graphite FOX WOMAN with clearly pointed fox ears, silver swept hair, ONE large fluffy fox tail violet luminous tip. Black technical cropped jacket and dark cargo trousers, cyan sneaker soles, violet seams. Tail held to side so both legs remain visible. Strict rear view every pose. Match reference identity, no face portraits.

Onyx :

> Character ONYX: adult anthropomorphic black shadow PANTHER with small rounded feline ears, short black fur and ONE long thin black feline tail. Graphite high collar hood-down technical jacket, black cargo pants, armored gloves, violet/cyan seams and cyan sneakers. Lean athletic biped. Tail held to side, does not conceal feet. Strict rear view every pose. Preserve reference character.
