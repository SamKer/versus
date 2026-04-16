# Connexion

L'accès à l'administration est protégé par une authentification **Google OAuth 2.0**.  
Seul le compte Google de l'administrateur est autorisé.

---

## Écran de connexion

Accessible à l'URL `/admin`, l'écran affiche :

- Le titre **RYUKEN** (nom de l'espace admin)
- Un bouton **"Se connecter avec Google"**
- Un message d'erreur en cas de compte non autorisé

```
┌──────────────────────────────┐
│          RYUKEN              │
│    Espace d'administration   │
│                              │
│  [G]  Se connecter avec Google│
└──────────────────────────────┘
```

---

## Flux d'authentification

```
Navigateur                   Serveur Node              Google OAuth
    │                             │                          │
    │── clic "Se connecter" ─────>│                          │
    │                             │── redirect ─────────────>│
    │                             │                          │ (saisie compte)
    │                             │<── code OAuth ───────────│
    │                             │── échange token ────────>│
    │                             │<── profil Google ────────│
    │                             │                          │
    │                   [vérif email admin]                  │
    │                             │                          │
    │<── redirect + JWT token ────│                          │
    │                             │                          │
    │  (token stocké en mémoire)  │                          │
```

1. Le serveur redirige vers Google (`/auth/google`)
2. Google renvoie un code d'autorisation
3. Le serveur échange le code contre le profil utilisateur
4. Si l'email correspond à l'administrateur → un **JWT** est généré
5. Le token est transmis en query string au frontend (`?token=...`), puis stocké en mémoire (Pinia store)

---

## Erreurs

| Message | Cause |
|---|---|
| _"Accès refusé. Seul l'administrateur peut se connecter."_ | Email Google non autorisé |

---

## Sécurité

- Le **JWT** est inclus dans chaque requête API via l'en-tête `Authorization: Bearer <token>`
- Toutes les routes d'administration vérifient la validité du token côté serveur
- Le token n'est pas persisté (rechargement de page = reconnexion nécessaire)
