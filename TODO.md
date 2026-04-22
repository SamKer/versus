# TODO — Versus

## Fonctionnalités Game Mode

### Écran 1 — Start
- [ ] Son au clic START (fichier audio à fournir)

### Écran 2 — Sélection des combattants
- [ ] **Mode 2v2** : sélectionner 2 acteurs par équipe, trouver un combat correspondant
- [ ] **Mode 1vAll** : sélectionner 1 protagoniste, afficher les combats de type `1vAll`

### Écran 2→3 — Transitions
- [ ] Transition animée style Street Fighter (flash blanc, zoom, distorsion)
- [ ] Annonce dramatique "NOM1 VS NOM2" en plein écran avant le combat

### Écran 3 — Combat
- [ ] Countdown avant lancement vidéo (3… 2… 1… FIGHT!)

## Améliorations visuelles
- [ ] Effets sonores sur hover / sélection des acteurs (écran 2)
- [ ] Particules / effets de feu ou d'éclairs sur le bouton FIGHT!
- [ ] Barre de vie décorative sous chaque portrait (écran 2)

---

## Fait ✓

### Game Mode
- [x] Route `/game` fullscreen hors MainLayout
- [x] Écran 1 : fond custom, bouton START pixel art clignotant (Press Start 2P), scanlines
- [x] Écran 2 : grille acteurs scrollable, portraits P1/P2, affiche film, noms agrandis
- [x] Écran 3 : lecture vidéo exportée (MP4) ou fallback YouTube
- [x] Forçage paysage mobile (CSS rotation)

### Compilateur vidéo
- [x] Photo acteur à côté de la barre de vie (gauche pour A, droite pour B)
- [x] Vrai nom de l'acteur entre parenthèses à côté du nom de personnage
- [x] Animation slide-down à l'apparition de la lifebar (cubic ease-out 0.5s)
- [x] Association acteur fiable via `actorIndex` (résiste au swap)
- [x] Export dans `data/exports/{Film}/{Scène} (Scene N).mp4`
- [x] Photo alignée : bord supérieur = bord supérieur de la barre de vie

### Éditeur
- [x] Sections rétractables (PERSONNAGES, MARQUEURS HUD, RÉSULTAT, HITS, ÉVÉNEMENTS, COUPES)
- [x] Association acteur dans PERSONNAGES : tuiles cliquables (photo + vrai nom + perso)
- [x] `actorIndex` persisté en DB, maintenu au swap A/B

### Admin — Onglet Sons
- [x] Liste des sons prédéfinis (ready, fight, ko, draw) + sons custom additionnels
- [x] Upload fichier audio (MP3, WAV, OGG…) par son
- [x] Enregistrement direct depuis le micro (MediaRecorder, aperçu avant sauvegarde)
- [x] Ajout de nouveaux sons nommés librement
- [x] Reset → retour au son synthétisé
- [x] Priorité des fichiers custom dans le compilateur
