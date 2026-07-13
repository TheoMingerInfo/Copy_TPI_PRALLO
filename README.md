# PRALLO — Project Allocator ETML

Application web de gestion et répartition de projets de fin d'année pour l'ETML.

---

## Prérequis de développement

### Outils nécessaires

| Outil | Version recommandée | Utilité |
|-------|-------------------|---------|
| Node.js | 22 LTS | Backend et frontend |
| Docker Desktop | Dernière version | Base de données MySQL en local |
| Git | Dernière version | Gestion du code source |

---

## Installation et lancement en local

### 1. Base de données

Démarrer le conteneur MySQL et phpMyAdmin :

```bash
cd src
docker-compose up -d
```

La base de données est accessible sur `localhost:3306`.  
phpMyAdmin est accessible sur `http://localhost:8080`.

### 2. Backend

```bash
cd src/backend/PRALLO_api
npm install
node ace migration:run
node ace db:seed --files database/seeders/permissions_seeder.ts
node ace serve --hmr
```

L'API tourne sur `http://localhost:3333`.

### 3. Frontend

```bash
cd src/frontend/PRALLO_front
npm install
npm run dev
```

Le frontend tourne sur `http://localhost:5173`.

---

## Variables d'environnement

### Backend — `src/backend/PRALLO_api/.env`

```env
TZ=UTC
PORT=3333
HOST=localhost
LOG_LEVEL=info
APP_KEY=                        # Générer avec : node ace generate:key
NODE_ENV=development

# Base de données
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=prallo
DB_PASSWORD=prallo
DB_DATABASE=prallo

# Azure AD
AZURE_CLIENT_ID=                # Client ID de l'application Azure
AZURE_TENANT_ID=                # Tenant ID Azure

# Mode dev : permet de se connecter sans Azure (true uniquement en développement)
DEV_BYPASS_AUTH=false

# Azure Blob Storage (pour les fichiers de projets)
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER=prallo-files
```

### Frontend — `src/frontend/PRALLO_front/.env`

```env
VITE_API_URL=http://localhost:3333          # URL du backend
VITE_AZURE_CLIENT_ID=                       # Même valeur que le backend
VITE_AZURE_TENANT_ID=                       # Même valeur que le backend
VITE_REDIRECT_URI=http://localhost:5173     # URL de retour après login Azure
VITE_DEV_BYPASS=false                       # true pour activer le bypass dev
```

---

## Utilisation de l'application

### Connexion

L'authentification se fait via les comptes **Eduvaud** (Microsoft Azure AD). Cliquer sur "Se connecter avec Eduvaud" redirige vers la page de connexion Microsoft.

> En mode développement (`VITE_DEV_BYPASS=true`), un menu de bypass permet de se connecter directement avec un compte de test sans passer par Azure.

### Rôles

| Rôle | Accès |
|------|-------|
| **Doyen** | Accès complet — gère l'état, les participants, la répartition |
| **Professeur** | Crée et gère ses projets |
| **Étudiant** | Consulte les projets et vote selon l'état actuel |
| **Invité** | Accès limité selon l'état |

### États de l'application

L'application passe par 5 états gérés par le doyen :

1. **Préparation** — Les professeurs créent leurs projets
2. **Repérage** — Les projets sont visibles par tous
3. **Vote** — Les étudiants votent pour leurs projets préférés (max 3)
4. **Répartition** — Le doyen calcule et ajuste la répartition
5. **Publication** — La répartition est publiée et visible par tous

---

## Staging

### Initialisation de la base de données

Lancer uniquement les migrations :

```bash
node ace migration:run --force
```

Lancer uniquement le seeder des permissions (rôles, états et droits) :

```bash
node ace db:seed --files database/seeders/permissions_seeder.js
```

> Note : sur le serveur, utiliser l'extension `.js` (fichiers compilés) et non `.ts`.

### Premier utilisateur — rôle Doyen

La première personne qui se connecte via Azure AD est automatiquement assignée au rôle **doyen**. Tous les utilisateurs suivants reçoivent le rôle **invité** par défaut. Le doyen peut ensuite modifier les rôles depuis la page Participants.

### Redémarrer le backend

```bash
pm2 restart PRALLO_API
pm2 logs PRALLO_API --lines 50
```
