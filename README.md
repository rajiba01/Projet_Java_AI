# Déploiement Internet (DuckDNS + HTTPS) via Nginx Proxy Manager

Ce projet peut être exposé sur Internet avec **HTTPS** en gardant une seule URL publique.

## Prérequis

- Votre serveur (PC) doit exécuter Docker Desktop.
- Votre IP locale serveur (LAN) : exemple `192.168.1.14`.
- Domaine DuckDNS : **`TunisianEconomic.duckdns.org`**.

> Remarque : DuckDNS est **toujours en minuscules** côté DNS. Utilisez plutôt : **`tunisianeconomic.duckdns.org`**

## 1) DuckDNS

1. Créez le domaine `TunisianEconomic` sur https://www.duckdns.org/
2. Activez la mise à jour automatique DuckDNS (sinon le domaine cassera quand l'IP publique change).

## 2) Routeur (NAT / Port Forwarding)

Dans votre routeur, ajoutez ces règles vers votre PC serveur :

- TCP **80**  → `192.168.1.14:80`
- TCP **443** → `192.168.1.14:443`

## 3) Pare-feu Windows

Ouvrir les ports 80/443 sur la machine serveur.

## 4) Lancer la stack

Depuis le dossier `Tunisian_Economic` :

```powershell
docker compose up -d --build
```

## 5) Configurer Nginx Proxy Manager (NPM)

NPM fournit une interface d'administration sur :

- **http://192.168.1.14:81**

Ensuite :

1. Allez dans **Hosts → Proxy Hosts → Add Proxy Host**
2. **Domain Names** : `TunisianEconomic.duckdns.org`
3. **Forward Hostname / IP** : `web`
4. **Forward Port** : `80`
5. Onglet **SSL** : cochez **Request a new SSL Certificate (Let's Encrypt)** + **Force SSL**

Après ça, votre site est accessible via :

- **https://TunisianEconomic.duckdns.org/**

Le reverse proxy interne (déjà configuré dans `nginx.conf`) route :

- `/api/` → Java (`java-api`)
- `/chat/` → FastAPI (`fastapi-chat`)

---

# Déploiement Internet (recommandé) via Cloudflare Tunnel (sans ouvrir les ports)

Cette méthode est la plus simple si le port 80/443 est bloqué (CGNAT/ISP) :

- Pas de NAT/port-forwarding
- HTTPS géré par Cloudflare
- Le PC peut rester derrière le routeur

## A) Démarrer la stack Docker (avec port local 8085)

Cloudflare Tunnel doit pointer vers un service HTTP local. On expose donc `web` sur `localhost:8085` via un fichier override.

Depuis `Tunisian_Economic` :

```powershell
docker compose -f docker-compose.yml -f docker-compose.cloudflare.yml up -d --build
```

Tester :

```powershell
Invoke-WebRequest -Uri "http://localhost:8085/healthz" -UseBasicParsing
```

## B) Lancer le connecteur Cloudflare (1ère fois)

Chemin cloudflared trouvé sur Windows :

```text
C:\Program Files (x86)\cloudflared\cloudflared.exe
```

Lancer le tunnel (mode test, au premier plan) :

```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --no-autoupdate run --token <VOTRE_TUNNEL_TOKEN>
```

Quand le tunnel devient **Healthy** dans Cloudflare, configurez un **Public Hostname** qui pointe vers :

- Type : `http`
- URL : `localhost:8085`

## C) (Optionnel) Installer en service Windows

Ouvrez PowerShell **en Administrateur** puis :

```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" service install <VOTRE_TUNNEL_TOKEN>
```

---

# Pourquoi il y a "2 docker-compose" ?

Il y a 2 stacks possibles :

1) `Tunisian_Economic/docker-compose.yml` : stack **complète** (frontend Nginx + Java + FastAPI + option NPM)
2) `AI_Powered_TunisianEconomic_Intelligence_System/docker-compose.backend.yml` : stack **backend seulement** (Java + FastAPI + ML)

👉 Pour un "site complet" (front + back), utilisez **celle de `Tunisian_Economic`**.

# TunisianEconomic

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.7.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Docker (full stack)

This repository includes a Docker setup to run:
- **Frontend** (Angular static build served by Nginx) on **http://localhost/**
- **Backend Java API** on **http://localhost:8080/api/**
- **FastAPI** on **http://localhost:8010/** (docs: **http://localhost:8010/docs**)

### Prerequisites

- Docker Desktop installed and running
- The backend repository is expected next to this repo:
	- `../AI_Powered_TunisianEconomic_Intelligence_System`

If your backend repo is in a different location, update `docker-compose.yml` (`build.context`).

### Run (Windows PowerShell)

```powershell
docker compose build
docker compose up -d
docker compose ps
```

Stop:

```powershell
docker compose down
```

### Configuration

- Docker environment variables are in `.env.docker` (Oracle DB credentials, JAVA_OPTS, etc.).

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
