# Versus

**Versus** est une application web de catalogage et d'édition de scènes de combat cinématographiques.  
Elle permet d'importer des vidéos YouTube, de les associer à des films via TMDB, puis d'éditer les séquences avec incrustation de barres de vie style _Street Fighter 2_.

---

## Fonctionnalités principales

| Fonctionnalité | Description |
|---|---|
| **Import YouTube** | Analyse une URL YouTube, détecte le film automatiquement (TMDB), télécharge la vidéo localement via `yt-dlp` |
| **Catalogue** | Scènes classées par vues, filtrage, historique d'évolution des vues |
| **Acteurs** | Base locale enrichie via TMDB, biographies, photos |
| **Chorégraphes** | Référencement des directeurs de combats |
| **Suggestions** | Formulaire public pour soumettre des scènes, géré depuis l'admin |
| **Éditeur vidéo** | Découpe de segments, événements (hit / block / KO), overlay HUD SF2 |
| **Compilation** | Export vidéo avec barre de progression temps réel (ffmpeg + canvas) |

---

## Accès rapide

<div class="grid cards" markdown>

- :material-shield-account: **[Administration](guide/admin.md)**  
  Gérer les scènes, films, acteurs, chorégraphes et suggestions

- :material-movie-edit: **[Éditeur](guide/editeur.md)**  
  Découper, annoter et exporter une scène de combat

- :material-google: **[Connexion](guide/connexion.md)**  
  Authentification via compte Google

- :material-server: **[Architecture](technique/architecture.md)**  
  Stack technique et organisation du projet

</div>

---

## Aperçu de l'interface

```
┌─────────────────────────────────────────────────────────┐
│  RYUKEN — Espace d'administration                        │
│  ┌──────────┬────────┬──────────┬────────────┬────────┐ │
│  │  Scènes  │ Films  │ Acteurs  │ Chorégraph │ Sugges.│ │
│  └──────────┴────────┴──────────┴────────────┴────────┘ │
│                                                          │
│  [URL YouTube]  →  Analyse  →  Film TMDB  →  Sauvegarde │
└─────────────────────────────────────────────────────────┘
```
