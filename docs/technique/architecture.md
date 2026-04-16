# Architecture

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Vue 3 + Quasar v2 (SPA, hash mode) |
| État global | Pinia |
| Backend | Node.js + Express |
| Base de données | MongoDB 4.4 (Mongoose) |
| Authentification | Google OAuth 2.0 + JWT |
| Téléchargement vidéo | `yt-dlp` |
| Données films | TMDB API |
| Compilation vidéo | ffmpeg + node-canvas |
| Conteneurisation | Docker + Docker Compose |

---

## Organisation des services

```
docker-compose
├── mongo          → MongoDB 4.4
├── server         → API Node.js (port 3000)
│                    sert aussi le frontend build + les médias + la doc
└── docs           → MkDocs Material (port 8001, profil "docs")
```

---

## Structure du projet

```
versus/
├── frontend/                  # Application Vue 3 + Quasar
│   └── src/
│       ├── pages/
│       │   ├── AdminPage.vue  # Interface d'administration
│       │   └── EditorPage.vue # Éditeur de scènes
│       ├── stores/            # Pinia stores (auth, fights, actors)
│       ├── router/            # Vue Router (hash mode)
│       └── boot/axios.ts      # Client HTTP
│
├── server/                    # API Node.js / Express
│   └── src/
│       ├── index.js           # Point d'entrée, middlewares, static
│       ├── routes/            # Routeurs Express
│       │   ├── auth.js        # Google OAuth + JWT
│       │   ├── fights.js      # CRUD scènes
│       │   ├── actors.js      # CRUD acteurs
│       │   ├── movies.js      # Films (lecture depuis fights)
│       │   ├── choreographers.js
│       │   ├── suggestions.js
│       │   ├── youtube.js     # yt-dlp wrapper
│       │   ├── movie.js       # Détection TMDB
│       │   └── projects.js    # Projets d'édition + export
│       ├── models/            # Schémas Mongoose
│       │   ├── Fight.js
│       │   ├── Actor.js
│       │   └── Project.js
│       └── services/
│           └── compiler.js    # ffmpeg + node-canvas
│
├── data/                      # Données persistantes (volume Docker)
│   ├── videos/                # Vidéos téléchargées
│   ├── photos/                # Photos acteurs
│   ├── mongo/                 # Données MongoDB
│   └── projects/              # Exports compilés
│
├── docs/                      # Sources MkDocs (ce fichier)
├── site/                      # Build MkDocs (servi par Node)
└── mkdocs.yml                 # Configuration MkDocs
```

---

## Flux de données — Import d'une scène

```
URL YouTube
    │
    ▼
/api/youtube/info  → yt-dlp (métadonnées)
    │
    ▼
/api/movie/detect  → TMDB API (détection film par titre)
    │
    ├── Titre + Année + Poster
    ├── Casting (acteurs + personnages)
    ├── Chorégraphe
    └── Suggestions (films alternatifs)
    │
    ▼
Frontend (formulaire)
    │
    ▼ (optionnel)
/api/youtube/download → yt-dlp (téléchargement MP4)
    │
    ▼
/api/fights POST → MongoDB
```

---

## Flux de données — Compilation

```
Frontend
    │── POST /api/projects/:id/export
    │
    ▼
Server (fire & forget)
    │
    ├── ffprobe → dimensions, fps, durée
    ├── Génération frames canvas (node-canvas, RGBA)
    │    └── rendu HUD SF2 frame par frame
    │
    └── ffmpeg
         ├── Input 0 : vidéo source
         ├── Input 1 : pipe RGBA (canvas frames)
         └── filter_complex :
              ├── trim / atrim (coupes)
              ├── concat (si N coupes)
              └── overlay (HUD sur vidéo)
         └── Output : MP4 H.264 + AAC
    │
    ├── Progression exposée via Map en mémoire
    │    └── GET /api/projects/:id/export/status → { status, progress }
    │
    └── Résultat → MongoDB (exportStatus: done/error)
```

---

## Modèles de données

### Fight (Scène)

```js
{
  youtubeUrl, youtubeId, youtubeTitle,
  views, thumbnail,
  movieTitle, movieYear, movieTmdbId, moviePoster,
  choreographer,
  actors: [{ name, character, photo, tmdbId, selected }],
  title,           // Titre affiché
  videoPath,       // Chemin local de la vidéo téléchargée
  viewsHistory: [{ views, recordedAt }]
}
```

### Project (Projet d'édition)

```js
{
  fightId,         // Référence à Fight
  players: [{ id, name, color, side }],
  events:  [{ id, time, type, target, damage }],
  cuts:    [{ start, end }],
  exportStatus,    // idle | processing | done | error
  exportPath,
  exportError
}
```

### Actor

```js
{
  tmdbId, name, photo,
  birthDate, placeOfBirth, biography
}
```
