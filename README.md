# JobFinder AI 🚀

JobFinder AI est une application web moderne qui révolutionne la recherche d'emploi en combinant l'agrégation de données en temps réel et l'analyse sémantique par Intelligence Artificielle. Conçue pour offrir une expérience candidat optimale, l'application filtre, score et résume les offres d'emploi pour ne présenter que les opportunités les plus pertinentes.

## 🧠 L'Architecture : Modèle "BYOK Proxy"

L'un des défis majeurs des applications basées sur l'IA est le coût d'infrastructure lié aux APIs tierces (LLMs, Scraping).
Pour garantir une scalabilité infinie avec **zéro coût récurrent d'exploitation (OpEx)**, cette application implémente une architecture hybride **BYOK (Bring Your Own Key)** adossée à un **Proxy Backend**.

1. **Frontend (Client-Side)** : L'interface React gère l'état utilisateur et stocke les clés API de manière sécurisée et persistante dans le `localStorage` du navigateur. Les clés n'existent jamais dans le bundle ou le code source.
2. **Backend (Serverless Proxy)** : Bien que le modèle BYOK soit souvent purement client-side, cela expose les requêtes à de potentielles failles CORS et révèle la structure des payloads IA au public. Pour pallier cela, le backend (fonctions serverless Vercel) agit comme un tunnel sécurisé. Il intercepte les requêtes, injecte les clés API fournies par le client via les en-têtes HTTP (`x-ai-key`, `x-serpapi-key`), et communique de serveur-à-serveur avec les fournisseurs.

## 🛠️ Stack Technique

- **Frontend** : React 18, Vite, CSS Vanilla (Architecture modulaire, Mode Sombre natif).
- **Backend** : Node.js, Express.js (adapté pour un environnement Serverless).
- **Intégrations IA & Data** :
  - **Mistral AI** (`mistral-small-latest`) : Évaluation sémantique et scoring des candidats.
  - **SerpApi** (Google Jobs) : Agrégation d'offres en temps réel.
- **Sécurité** : `helmet`, `express-rate-limit`, CORS restrictif.
- **Déploiement** : Vercel (Edge Functions & Hosting).

## 🛡️ Sécurité & Conformité

L'application a été auditée et durcie pour un déploiement public sécurisé :

- **Protection CORS stricte** : Le backend n'accepte que les requêtes provenant des origines validées.
- **Rate Limiting** : Implémentation d'un limiteur de requêtes pour mitiger les attaques DDoS et l'abus d'infrastructure.
- **Sécurisation des En-têtes** : Utilisation d'Helmet pour prévenir les attaques XSS, Clickjacking et Sniffing.
- **Sanitisation des URL** : Blocage préventif des injections `javascript:` sur les liens de candidature sortants.
- **Opacité des Erreurs** : Les erreurs de fournisseurs externes (ex: Mistral 401) sont interceptées et nettoyées avant d'être renvoyées au client, évitant la fuite de données de contexte.

### ⚔️ Audits de Sécurité & Tests de Pénétration (Pen-Testing)

Ce projet a subi deux phases d'audits agressifs pour valider sa robustesse en production, menés par des agents IA spécialisés (Codex & Antigravity) :

#### 1. L'Audit Structurel & Logique (par Codex)
Une analyse approfondie du code a permis de verrouiller l'infrastructure avant déploiement :
- **Restriction CORS** : Remplacement d'une règle permissive (`*.vercel.app`) par une liste blanche stricte via `ALLOWED_ORIGIN`.
- **Transparence Utilisateur** : Ajout d'avertissements clairs sur l'interface pour expliquer que les clés API transitent par un proxy (Vercel) sans y être sauvegardées.
- **Sanitisation** : Mise en place d'une validation forte sur les URLs générées par SerpApi pour neutraliser tout vecteur d'attaque XSS via `javascript:`.

#### 2. Le "Hacker Strike" (Test de Pénétration par Antigravity)
Une simulation d'attaque offensive massive a été exécutée directement contre le serveur local pour tester les limites physiques des middlewares :
- **Payload Bomb (Déni de Service)** : Envoi d'un payload JSON de 10 Mo pour saturer la mémoire. Résultat : Bloqué immédiatement par la limite stricte de 10kb (`413 Payload Too Large`).
- **Injection XSS / SQLi** : Tentatives d'injections malveillantes dans les paramètres et les en-têtes HTTP. Résultat : Rejet complet et erreur 500 contrôlée sans plantage du serveur.
- **Verb Tampering & Path Traversal** : Tentatives d'accès aux fichiers locaux (ex: `../../package.json`) et utilisation de méthodes HTTP non autorisées (ex: `DELETE`). Résultat : Rejet propre (`404 Not Found`).
- **Concurrency Flood (DDoS Simulé)** : Envoi asynchrone de 500 requêtes simultanées. Résultat : Le Rate Limiter a intercepté exactement les requêtes excédentaires, renvoyant 469 codes `429 Too Many Requests` tout en traitant les autres de manière fluide.

**Verdict final des audits :** Le backend s'est révélé indestructible face aux attaques web communes. La protection périmétrique (Helmet, Express-Rate-Limit, Express-JSON Limit) assure la survie des instances Serverless.

## 🚀 Démarrage Rapide (Développement Local)

Le projet utilise le système de proxy de Vite pour contourner les restrictions CORS en local, permettant au frontend de communiquer fluidement avec le serveur Express de développement.

### 1. Installation

```bash
git clone https://github.com/votre-compte/jobfinder.git
cd jobfinder
npm install
```

### 2. Variables d'Environnement

Copiez le fichier d'exemple et remplissez-le si besoin (Note: avec le modèle BYOK, l'application fonctionne même sans clés backend, car l'interface demandera à l'utilisateur de fournir les siennes).

```bash
cp .env.example .env
```

### 3. Lancement de l'environnement de développement

Ouvrez deux terminaux.

**Terminal 1 : Démarrer le Serveur Backend (Port 3000)**

```bash
npm run server
```

**Terminal 2 : Démarrer le Frontend Vite (Port 5173)**

```bash
npm run dev
```

L'application est accessible sur `http://localhost:5173`.

---

*Conçu avec des standards de production par un développeur Senior.*
