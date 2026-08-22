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

## 📦 Déploiement (Vercel)

Ce projet est nativement configuré pour être déployé sur [Vercel](https://vercel.com). Le fichier `vercel.json` est prêt à l'emploi et route dynamiquement les requêtes `/api/*` vers les fonctions Serverless.

1. Poussez votre code sur GitHub.
2. Connectez le dépôt sur Vercel.
3. Définissez la variable d'environnement `ALLOWED_ORIGIN` sur le tableau de bord Vercel (ex: `https://votre-app.vercel.app`).
4. Déployez !

---
*Conçu avec des standards de production par un développeur Senior.*
