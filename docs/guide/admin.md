# Administration

La page d'administration (`/admin`) est organisée en **5 onglets**.  
Elle n'est accessible qu'après connexion avec le compte Google autorisé.

---

## Onglet Scènes

C'est l'onglet principal. Il est divisé en deux colonnes.

### Colonne gauche — Import & liste

#### Import YouTube

```
┌─────────────────────────────────────────┐
│  Importer un combat                     │
│  [https://www.youtube.com/watch?v=...] 🔍│
└─────────────────────────────────────────┘
```

1. Coller l'URL d'une vidéo YouTube
2. Cliquer sur 🔍 (ou Entrée)
3. Le serveur appelle l'API YouTube → récupère titre, miniature, nombre de vues
4. Détection automatique du film via TMDB (analyse du titre)
5. Suggestions de films alternatifs affichées si la détection est incertaine

#### Classement des scènes

Liste triable par :

- **Vues** (défaut) — badge doré/argent/bronze pour le podium
- **Date** d'ajout

Chaque entrée propose :

| Bouton | Action |
|---|---|
| ✏️ | Ouvrir le formulaire d'édition |
| 🎬 | Ouvrir l'**éditeur vidéo** de la scène |
| 🗑️ | Supprimer la scène |

---

### Colonne droite — Formulaire de scène

Affiché après analyse d'une URL ou clic sur ✏️.

#### Miniature et métadonnées YouTube

- Miniature de la vidéo (16:9)
- Titre original YouTube
- Nombre de vues formaté (ex. `1.2M`, `450K`)

#### Recherche film (TMDB)

Si la détection automatique n'est pas satisfaisante :

1. Saisir un titre dans le champ **"Chercher un film…"**
2. Les résultats TMDB s'affichent avec poster et année
3. Cliquer sur un résultat l'applique au formulaire (titre, année, chorégraphe, casting)

#### Détails du film

| Champ | Description |
|---|---|
| Titre du film | Alimenté automatiquement depuis TMDB, modifiable |
| Année | Année de sortie |
| Chorégraphe | Directeur des combats (texte libre) |

#### Titre de la scène

- Généré automatiquement : `Film - Acteur1 vs Acteur2 (Année)`
- Bouton 🔄 pour régénérer
- Modifiable manuellement

#### Acteurs du film

Liste du casting TMDB avec cases à cocher.  
Les acteurs **cochés** seront associés à la scène.

#### Ajouter un acteur

Recherche en deux étapes :

1. **Base locale** — acteurs déjà enregistrés dans Versus
2. **TMDB** — si aucun résultat local, élargissement à TMDB

#### Actions

| Bouton | Action |
|---|---|
| **Télécharger** | Lance le téléchargement de la vidéo YouTube via `yt-dlp` |
| 📈 | Historique d'évolution des vues (graphe SVG) |
| **Sauvegarder** | Crée ou met à jour la scène en base |

!!! tip "Téléchargement + sauvegarde"
    Le bouton "Télécharger" déclenche automatiquement une sauvegarde après le téléchargement.
    La vidéo est stockée dans `/data/videos/` et le chemin est enregistré en base.

---

#### Historique des vues

Dialogue accessible via le bouton 📈 lors de l'édition d'une scène existante.

- Stats rapides : vues actuelles, progression totale, nombre de mesures
- Graphe SVG interactif (courbe + zone remplie)
- Axe X : dates, Axe Y : nombre de vues

---

## Onglet Films

Vue en lecture seule, classée par **vues cumulées** de toutes les scènes du film.

| Colonne | Description |
|---|---|
| # | Rang (or/argent/bronze pour le podium) |
| Poster | Miniature TMDB |
| Titre / Année | Métadonnées du film |
| Chorégraphe | Si renseigné |
| Scènes | Nombre de scènes associées |
| Vues | Total des vues de toutes les scènes |

Un champ de filtre permet de chercher par titre ou chorégraphe.

---

## Onglet Acteurs

### Recherche

Recherche en deux temps :

1. Saisir un nom → clic 🔍 → résultats **dans votre base** d'abord
2. Si non trouvé → bouton **"Chercher sur TMDB"** pour élargir

Les acteurs TMDB peuvent être ajoutés à la base locale (bouton ➕).

### Ajout manuel

Pour les acteurs non référencés sur TMDB, ajout direct par nom.

### Liste des acteurs enregistrés

Filtre en temps réel. Chaque acteur affiche :

- Photo, nom, année de naissance, lieu de naissance
- Extrait de biographie
- Badge **nombre de scènes** associées

#### Édition d'un acteur

Dialogue avec les champs :

| Champ | Format |
|---|---|
| Photo | URL de l'image |
| Nom | Texte libre |
| Date de naissance | `AAAA-MM-JJ` |
| Lieu de naissance | Texte libre |
| Biographie | Texte long |

---

## Onglet Chorégraphes

Gestion des directeurs de combats.

### Recherche

Recherche par nom dans la base locale.

### Liste complète

Filtre en temps réel. Chaque entrée est éditable via dialogue (nom uniquement).

---

## Onglet Suggestions

Boîte de réception des suggestions soumises par les visiteurs.

Un **badge rouge** sur l'onglet indique le nombre de suggestions non lues.

### Structure d'une suggestion

| Champ | Description |
|---|---|
| Nom | Auteur (peut être anonyme) |
| Date | Horodatage formaté en français |
| Message | Contenu de la suggestion |
| URL YouTube | Lien optionnel vers une vidéo |
| Badge "nouveau" | Affiché si non lue (fond légèrement mis en valeur) |

### Actions

| Bouton | Action |
|---|---|
| ✅ | Marquer comme lue |
| 🗑️ | Supprimer |
