# Éditeur de scènes

L'éditeur est accessible depuis l'onglet **Scènes** → bouton 🎬 d'une scène, ou via l'URL `/editor/:fightId`.

Il permet de :

- Définir des **coupes** (segments à conserver)
- Placer des **événements** (hit, block, KO) sur la timeline
- Configurer les **personnages** avec couleur et côté
- **Compiler** la vidéo finale avec overlay HUD style SF2

---

## Interface générale

```
┌─────────────────────────────────────────────────────────────┐
│ ← Titre de la scène                    [Sauvegarder] [Compiler] │
├─────────────────────────────────────────┬───────────────────┤
│                                         │ PERSONNAGES       │
│           Lecteur vidéo                 │ AJOUTER ÉVÉNEMENT │
│         (overlay HUD canvas)            │ ÉVÉNEMENTS (N)    │
│                                         │ COUPES (N)        │
├─────────────────────────────────────────┤                   │
│ ▶ 0:00.0 / 2:34.5  ──────────●──────── │                   │
│ ‹ › [Début coupe] [Fin coupe]           │                   │
├─────────────────────────────────────────┤                   │
│ Timeline ████░░░░│░░░▌░░░░░░░░░░░░░░│  │                   │
└─────────────────────────────────────────┴───────────────────┘
```

---

## Lecteur vidéo

La vidéo est affichée avec un **overlay canvas** qui rend le HUD en temps réel.

### Contrôles

| Contrôle | Action |
|---|---|
| ▶ / ⏸ | Lancer / mettre en pause |
| Slider de position | Aller à un instant précis (fonctionne en pause) |
| `‹` | Reculer d'une frame (≈ 1/25s) |
| `›` | Avancer d'une frame (≈ 1/25s) |

---

## Overlay HUD (style Street Fighter 2)

L'overlay est rendu en temps réel sur un canvas superposé à la vidéo.

### Éléments affichés

- **Barre de vie gauche** — joueur côté gauche, se remplit de gauche à droite
- **Barre de vie droite** — joueur côté droit, se remplit de droite à gauche
- **Nom** — affiché **sous** chaque barre, en jaune, police monospace
- **"Versus"** — texte centré entre les deux barres, style italique serif, légèrement incliné

### Couleurs des barres

| Niveau de vie | Couleur |
|---|---|
| > 60% | Vert `#7ce830` |
| 30% – 60% | Jaune `#f5d000` |
| < 30% | Rouge `#e01000` |

### Troncature des noms

Si le nom dépasse la largeur de la barre, il est automatiquement tronqué avec `…`.

---

## Timeline

Barre horizontale affichant toute la durée de la vidéo.

### Éléments visuels

| Élément | Description |
|---|---|
| Curseur blanc | Position de lecture actuelle |
| Segments orange | Coupes définies |
| Traits colorés | Événements (orange = hit, cyan = block, jaune = KO) |
| Marqueur orange fin | Point de début de coupe en attente |

### Interactions

- **Clic sur la timeline** → positionne la lecture à cet instant
- **Clic sur un événement** → supprime l'événement directement
- **Clic sur un segment de coupe** → supprime la coupe
- Au survol : les marqueurs s'agrandissent et brillent pour indiquer qu'ils sont cliquables

---

## Coupes

Une coupe définit un **segment à conserver** dans la vidéo finale.  
Si aucune coupe n'est définie, la vidéo est exportée en entier.

### Définir une coupe

1. Se positionner au début du segment désiré (en pause ou en lecture)
2. Cliquer **"Début coupe"** → marque le point d'entrée (visible sur la timeline)
3. Se positionner à la fin du segment
4. Cliquer **"Fin coupe"** → la coupe est ajoutée

!!! tip "Navigation image par image"
    Utiliser les boutons `‹` / `›` pour un positionnement précis au demi-centième de seconde.

### Résultat à la compilation

- **1 coupe** → seul ce segment est dans la vidéo finale
- **N coupes** → les segments sont concaténés dans l'ordre

### Supprimer une coupe

- Bouton `×` dans la liste **COUPES** (sidebar droite)
- Ou clic direct sur le segment orange dans la timeline

---

## Événements

Les événements sont placés sur la timeline et pilotent les barres de vie dans l'overlay.

### Types d'événements

| Type | Effet | Couleur sur timeline |
|---|---|---|
| **Hit** | Retire N points de vie à la cible | Orange |
| **Block** | Événement visuel (pas de dégâts) | Cyan |
| **KO** | Met la vie de la cible à 0 | Jaune |

### Ajouter un événement

1. Se positionner à l'instant souhaité
2. Dans le panneau **"AJOUTER UN ÉVÉNEMENT"** :
   - Choisir le type (Hit / Block / KO)
   - Choisir la cible (personnage)
   - Saisir les dégâts (uniquement pour Hit, en points)
3. Cliquer ➕

### Supprimer un événement

- Bouton `×` dans la liste **ÉVÉNEMENTS**
- Ou clic direct sur le marqueur dans la timeline

---

## Personnages

Panneau **PERSONNAGES** dans la sidebar.

| Champ | Description |
|---|---|
| Couleur | Sélecteur couleur (affiché sur l'avatar) |
| Nom | Texte libre (pré-rempli depuis les acteurs de la scène) |
| Côté | Gauche ◀ ou Droite ▶ (détermine le sens de remplissage de la barre) |
| 🗑️ | Supprime le personnage et tous ses événements |

Maximum **2 personnages** par scène.

---

## Sauvegarde

Le bouton **Sauvegarder** (en-tête) enregistre en base de données :

- La liste des personnages
- La liste des événements
- La liste des coupes

!!! warning "Sauvegarder avant de compiler"
    La compilation lit les données depuis la base. Pensez à sauvegarder avant de lancer l'export.
    Le bouton **Compiler** déclenche automatiquement une sauvegarde préalable.

---

## Compilation

### Lancer la compilation

Bouton **Compiler** (en-tête, vert). La compilation :

1. Sauvegarde automatiquement le projet
2. Lance ffmpeg côté serveur (traitement asynchrone)
3. Affiche une **barre de progression** temps réel (polling toutes les 3 secondes)

### Barre de progression

```
┌────────────────────────────────────┐
│ ⟳ Compilation en cours… 47%    [×]│
│ ████████████░░░░░░░░░░░░░░░░░░░░   │
└────────────────────────────────────┘
```

- Pourcentage mis à jour à chaque changement
- Bouton `×` pour **annuler** (réinitialise le statut, ne stoppe pas ffmpeg)

### Résultat

Quand la compilation est terminée :

```
✅ Export prêt — Télécharger
```

Un lien de téléchargement direct vers le fichier `.mp4` généré est affiché.

### Processus de compilation (technique)

```
Frames canvas (RGBA pipe) ──┐
                            ├──> ffmpeg ──> MP4 exporté
Vidéo source (segments) ────┘
```

- Les barres de vie sont rendues frame par frame via Node Canvas
- ffmpeg applique les coupes (trim/concat) et superpose l'overlay
- Le fichier est stocké dans `/data/projects/:fightId/exported.mp4`

### Rechargement de page pendant la compilation

Si la page est rechargée pendant une compilation, la barre de progression reprend automatiquement au bon niveau et le polling redémarre.
