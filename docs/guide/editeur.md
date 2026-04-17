# Éditeur de scènes

L'éditeur est accessible depuis l'onglet **Scènes** → bouton 🎬 d'une scène, ou via l'URL `/editor/:fightId`.

Il permet de :

- Définir des **coupes** (segments à conserver)
- Placer des **événements de hit** sur la timeline via des boutons façon manette
- Configurer les **personnages** (couleur, côté, vie finale)
- **Compiler** la vidéo finale avec overlay HUD style SF2 (barres de vie animées)

---

## Interface générale

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Titre de la scène                      [Sauvegarder] [Compiler] │
├──────────────────────────────────────────┬──────────────────────┤
│                                          │ PERSONNAGES          │
│            Lecteur vidéo                 │ HITS À 0:12.3        │
│          (overlay HUD canvas)            │ ÉVÉNEMENTS (N)       │
│                                          │ COUPES (N)           │
├──────────────────────────────────────────┤                      │
│ ▶ 0:00.0 / 2:34.5  ──────────●───────── │                      │
│ ‹ › [Début coupe] [Fin coupe]            │                      │
├──────────────────────────────────────────┤                      │
│ Timeline ████░░░░│░░░▌░░░░░░░░░░░░░░│   │                      │
└──────────────────────────────────────────┴──────────────────────┘
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

L'overlay est rendu en temps réel sur un canvas superposé à la vidéo (preview), puis frame par frame lors de la **compilation** (voir section dédiée).

### Éléments affichés

- **Barre de vie gauche** — joueur côté gauche, se remplit de gauche à droite
- **Barre de vie droite** — joueur côté droit, se remplit de droite à gauche
- **Nom** — affiché **sous** chaque barre, en jaune, police monospace
- **"Versus"** — texte centré entre les deux barres, style italique serif, légèrement incliné

### Apparence des barres

| Élément | Couleur / Style |
|---|---|
| Bordure | Blanc `#ffffff` |
| Fond (vie perdue) | Jaune `#f5c800` |
| Barre (vie restante) | Rouge `#e01000` |
| Reflet | Blanc semi-transparent (haut de barre, 35% de hauteur) |

!!! note "Troncature des noms"
    Si le nom dépasse la largeur de la barre, il est automatiquement tronqué avec `…`.

---

## Personnages

Panneau **PERSONNAGES** dans la sidebar.

| Champ | Description |
|---|---|
| Couleur | Sélecteur couleur (identifiant visuel du personnage) |
| Nom | Texte libre (pré-rempli depuis les acteurs de la scène) |
| Côté | Gauche ◀ ou Droite ▶ (détermine le sens de remplissage de la barre) |
| **Vie finale (%)** | Pourcentage de vie restant à la **fin du combat** (slider 0–100) |
| 🗑️ | Supprime le personnage et tous ses événements |

Maximum **2 personnages** par scène.

### Vie finale et vainqueur

- Le personnage avec `vie finale > 0 %` est le **vainqueur**
- Le(s) perdant(s) ont `vie finale = 0 %`
- Ce champ pilote le **calcul automatique des dégâts** (voir ci-dessous)

---

## Événements de hit

### Panneau "HITS À [timecode]"

Chaque personnage dispose d'une rangée de **7 boutons ronds façon manette** :

| N° | Type | Icône | Couleur |
|---|---|---|---|
| 1 | Blocage | `shield` | Gris |
| 2 | Coup de poing faible | `sports_mma` | Cyan clair |
| 3 | Coup de poing fort | `fitness_center` | Cyan foncé |
| 4 | Coup de pied faible | `directions_run` | Vert lime |
| 5 | Coup de pied moyen | `sports_martial_arts` | Ambre |
| 6 | Coup de pied fort | `sports_martial_arts` | Orange foncé |
| 7 | Coup spécial | `bolt` | Violet |

Un clic sur un bouton **ajoute immédiatement un événement** au timecode courant, ciblant ce personnage (qui **reçoit** le coup).

Un bouton **KO** (icône `sports_kabaddi`, jaune) est disponible séparément pour forcer la vie à 0.

### Calcul automatique des dégâts

Les dégâts ne sont **jamais saisis manuellement** : ils sont calculés automatiquement à partir de la **vie finale** du personnage et du **nombre et type de hits** reçus.

#### Formule

```
totalDamage  = 100 - finalHp
totalWeight  = Σ poids(type) pour tous les hits reçus
damage(hit)  = totalDamage × poids(hit.type) / totalWeight
```

Le recalcul s'effectue **automatiquement** à chaque ajout/suppression d'événement et à chaque modification de `vie finale`.

#### Hiérarchie des poids

```
(2) = (4) = 2 × (1)
(3) = (5) = 2 × (4)
(6) = 2 × (5)
(7) = 2 × (6)
```

Tableau des poids :

| N° | Type | Poids |
|---|---|---:|
| 1 | Blocage (chip damage) | **1** |
| 2 | Coup de poing faible | **2** |
| 4 | Coup de pied faible | **2** |
| 3 | Coup de poing fort | **4** |
| 5 | Coup de pied moyen | **4** |
| 6 | Coup de pied fort | **8** |
| 7 | Coup spécial | **16** |

!!! tip "Ajuster l'équilibre"
    Pour modifier la répartition des dégâts, changer les valeurs dans `HIT_WEIGHTS`
    dans `frontend/src/pages/EditorPage.vue` (frontend) **et**
    `server/src/services/compiler.js` (compilation).  
    Les deux doivent rester synchronisés.

!!! note "Blocage = chip damage"
    Le blocage (type 1) cause des dégâts réduits — il n'annule pas la vie,
    il absorbe une fraction proportionnelle à son poids (le plus faible).

### Supprimer un événement

- Bouton `×` dans la liste **ÉVÉNEMENTS** (sidebar)
- Ou clic direct sur le marqueur dans la timeline

---

## Timeline

Barre horizontale affichant toute la durée de la vidéo.

### Éléments visuels

| Élément | Description |
|---|---|
| Curseur blanc | Position de lecture actuelle |
| Segments orange semi-transparents | Coupes définies |
| Traits colorés | Événements de hit (voir couleurs ci-dessous) |
| Marqueur orange fin | Point de début de coupe en attente |

### Couleurs des marqueurs d'événements

| Type | Couleur |
|---|---|
| Blocage | Gris bleu `#78909c` |
| Poing faible | Cyan clair `#4dd0e1` |
| Poing fort | Cyan foncé `#0097a7` |
| Pied faible | Vert lime `#aed581` |
| Pied moyen | Ambre `#ffca28` |
| Pied fort | Orange `#ff7043` |
| Spécial | Violet `#b39ddb` |
| KO | Jaune vif `#ffeb3b` |

### Interactions

- **Clic sur la timeline** → positionne la lecture à cet instant
- **Clic sur un événement** → supprime l'événement directement
- **Clic sur un segment de coupe** → supprime la coupe
- Au survol : les marqueurs s'agrandissent et brillent

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

## Sauvegarde

Le bouton **Sauvegarder** (en-tête) enregistre en base de données :

- La liste des personnages (avec `finalHp`)
- La liste des événements (avec les dégâts calculés)
- La liste des coupes

!!! warning "Sauvegarder avant de compiler"
    La compilation lit les données depuis la base. Pensez à sauvegarder avant de lancer l'export.
    Le bouton **Compiler** déclenche automatiquement une sauvegarde préalable.

---

## Compilation

### Lancer la compilation

Bouton **Compiler** (en-tête, vert). La compilation :

1. Sauvegarde automatiquement le projet (avec recalcul des dégâts)
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
- Bouton `×` pour **annuler** (réinitialise le statut)

### Résultat

Quand la compilation est terminée :

```
✅ Export prêt — Télécharger
```

Un lien de téléchargement direct vers le fichier `.mp4` généré est affiché.

### Animation des barres de vie à la compilation

Les barres de vie sont **animées frame par frame** dans la vidéo compilée :

- Démarrent à **100%** de vie
- Diminuent progressivement à chaque hit, selon les dégâts calculés
- Terminent au pourcentage `vie finale` défini pour chaque personnage
- Un **KO** ramène instantanément la vie à 0

```
Frames canvas (RGBA pipe) ──┐
                            ├──> ffmpeg ──> MP4 exporté
Vidéo source (segments) ────┘
```

Le rendu est assuré par **Node Canvas** côté serveur, avec la même logique que le preview navigateur.  
Le fichier est stocké dans `/data/projects/:fightId/exported.mp4`.

### Rechargement de page pendant la compilation

Si la page est rechargée pendant une compilation, la barre de progression reprend automatiquement et le polling redémarre.
