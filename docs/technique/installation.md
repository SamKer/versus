# Installation

## Prérequis

- **Docker** et **Docker Compose**
- Un compte **Google Cloud** (pour OAuth)
- Une clé API **TMDB**

---

## Variables d'environnement

Créer un fichier `.env` à la racine du projet :

```env
# MongoDB
MONGODB_USER=versus
MONGODB_PASSWORD=motdepasse
MONGODB_DBNAME=versus

# JWT
JWT_SECRET=une_chaine_aleatoire_longue

# Google OAuth
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxx
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
ADMIN_EMAIL=votre@email.com

# TMDB
TMDB_API_KEY=votre_cle_tmdb

# URLs
FRONTEND_URL=http://localhost:8080
VITE_API_URL=http://localhost:3000
```

---

## Démarrage

### Développement

```bash
# 1. Démarrer les services backend
docker compose up -d

# 2. Démarrer le frontend (dev server Quasar)
cd frontend
npm install
npm run dev
```

Le frontend est accessible sur **http://localhost:8080**  
L'API est accessible sur **http://localhost:3000**

### Production

```bash
# 1. Builder le frontend
cd frontend && npm run build

# 2. Démarrer tous les services
docker compose up -d
```

Le frontend compilé (`frontend/dist/spa`) est servi directement par le serveur Node sur le **port 3000**.

---

## Documentation

### Lancer le serveur de prévisualisation MkDocs

```bash
docker compose --profile docs up docs
```

Accessible sur **http://localhost:8001**  
Les modifications des fichiers `docs/*.md` sont rechargées automatiquement.

### Compiler la documentation

```bash
docker compose run --rm docs build
```

Génère le dossier `site/` à la racine du projet.  
Le serveur Node sert ensuite ce dossier à l'URL **http://localhost:3000/docs**.

---

## Commandes utiles

```bash
# Voir les logs du serveur
docker compose logs -f server

# Voir les logs de compilation vidéo
docker compose logs server | grep compiler

# Reconstruire l'image serveur après modification
docker compose build server
docker compose up -d server

# Accéder au shell MongoDB
docker compose exec mongo mongosh -u $MONGODB_USER -p $MONGODB_PASSWORD
```

---

## Ports exposés

| Service | Port | Description |
|---|---|---|
| `server` | 3000 | API + frontend build + doc |
| `mongo` | 27017 | MongoDB (dev seulement) |
| `docs` | 8001 | MkDocs live preview (profil docs) |
