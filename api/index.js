import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Charge les variables d'environnement
dotenv.config();

const app = express();

// ---------------------------------------------------------------------------
// Protections de sécurité de base (Helmet)
// ---------------------------------------------------------------------------
app.use(helmet());

// ---------------------------------------------------------------------------
// Configuration CORS
// Le backend ne stocke aucune clé (BYOK), il agit comme un proxy ouvert.
// ---------------------------------------------------------------------------
app.use(cors()); // Accepte toutes les origines

app.use(express.json({ limit: '5mb' })); // Augmenté à 5mb pour les longues descriptions de poste

// ---------------------------------------------------------------------------
// Limite de requêtes (Rate Limiting)
// Pour éviter qu'un bot ne vide les quotas API
// ---------------------------------------------------------------------------
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limite à 30 requêtes par IP par fenêtre de 15 minutes
  message: { error: "Trop de requêtes, veuillez réessayer plus tard." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);


// ---------------------------------------------------------------------------
// Route 1 : Récupération des offres d'emploi via SerpApi (Google Jobs)
// ---------------------------------------------------------------------------
app.get('/api/jobs', async (req, res) => {
  try {
    let SERPAPI_KEY = req.headers['x-serpapi-key'];
    if (!SERPAPI_KEY) {
      return res.status(401).json({ error: "Clé API SerpApi manquante dans les en-têtes." });
    }
    SERPAPI_KEY = SERPAPI_KEY.trim();

    const { title, location } = req.query;
    
    // Validation basique
    if (title && title.length > 100) return res.status(400).json({ error: "Titre trop long" });
    if (location && location.length > 100) return res.status(400).json({ error: "Localisation trop longue" });

    const query = `${title || ''} ${location || ''}`.trim() || 'développeur';
    
    console.log(`[DEBUG SerpApi] Requête reçue. Query: "${query}"`);
    console.log(`[DEBUG SerpApi] Clé fournie (obfusquée) : ${SERPAPI_KEY.substring(0, 4)}...${SERPAPI_KEY.substring(SERPAPI_KEY.length - 4)}`);
    
    let jobs = [];
    let start = 0;
    
    // Boucle pour récupérer exactement 10 offres (ou s'arrêter s'il n'y en a plus)
    while (jobs.length < 10) {
      const url = `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(query)}&start=${start}&api_key=${SERPAPI_KEY}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DEBUG SerpApi] Erreur brute depuis SerpApi (${response.status}):`, errorText);
        throw new Error(`Erreur SerpApi: ${response.status}`);
      }

      const data = await response.json();
      const pageJobs = data.jobs_results || [];
      
      if (pageJobs.length === 0) break; // Plus aucune offre disponible
      
      jobs = jobs.concat(pageJobs);
      start += 10; // Page suivante
    }

    // Formatage côté serveur pour alléger le frontend
    const formattedJobs = jobs.slice(0, 10).map((job, index) => {
      const applyUrl = (job.apply_options && job.apply_options.length > 0) 
        ? job.apply_options[0].link 
        : (job.related_links && job.related_links.length > 0) 
          ? job.related_links[0].link 
          : "";

      return {
        id: job.job_id || index,
        title: job.title,
        company: job.company_name,
        location: job.location,
        type: job.detected_extensions?.schedule_type || 'Full-time',
        url: applyUrl,
        tags: [],
        description: job.description ? job.description.substring(0, 1500) : "Aucune description fournie."
      };
    });

    res.json(formattedJobs);
  } catch (error) {
    console.error("Erreur serveur (/api/jobs):", error.message);
    res.status(500).json({ error: "Erreur interne du serveur" }); // Ne pas exposer les détails de l'erreur au client
  }
});

// ---------------------------------------------------------------------------
// Route 2 : Évaluation par l'Intelligence Artificielle (Mistral)
// ---------------------------------------------------------------------------
app.post('/api/ai/evaluate', async (req, res) => {
  try {
    let AI_API_KEY = req.headers['x-ai-key'];
    if (!AI_API_KEY) {
      return res.status(401).json({ error: "Clé API IA manquante dans les en-têtes." });
    }
    AI_API_KEY = AI_API_KEY.trim();

    const aiBaseUrl = req.headers['x-ai-base-url'] || process.env.AI_BASE_URL || 'https://api.mistral.ai/v1';
    const aiModel = req.headers['x-ai-model'] || 'mistral-small-latest';

    const { job, userProfile } = req.body;

    if (!job || !userProfile) {
      return res.status(400).json({ error: "Les données 'job' et 'userProfile' sont requises." });
    }

    // Validation des données pour éviter d'envoyer d'énormes payloads à l'IA
    if (
      (job.description && job.description.length > 3000) ||
      (userProfile.skills && userProfile.skills.length > 1000)
    ) {
      return res.status(400).json({ error: "Payload trop volumineux." });
    }

    console.log(`\n========== [DEBUG IA - NOUVELLE REQUÊTE] ==========`);
    console.log(`[DEBUG IA] Modèle utilisé : ${aiModel} sur ${aiBaseUrl}`);
    console.log(`[DEBUG IA] Requête d'évaluation reçue pour le poste : "${job.title}"`);
    console.log(`[DEBUG IA] Clé fournie (obfusquée) : ${AI_API_KEY.substring(0, 4)}...${AI_API_KEY.substring(AI_API_KEY.length - 4)}`);

    const prompt = `
Tu es un recruteur expert. 
Profil du candidat : 
- Métier : ${userProfile.title}
- Localisation : ${userProfile.location}
- Compétences : ${userProfile.skills}

Offre d'emploi :
- Titre : ${job.title}
- Entreprise : ${job.company}
- Localisation : ${job.location}

Analyse si cette offre correspond au candidat.
Réponds UNIQUEMENT avec un objet JSON avec deux clés :
- "matchScore": un nombre de 0 à 100 (100 = parfait).
- "aiSummary": 2 phrases expliquant pourquoi.
`;

    // Certains modèles ne supportent pas response_format strict, 
    // on l'envoie mais on doit aussi gérer si le modèle répond avec des backticks markdown.
    const requestBody = {
      model: aiModel, 
      messages: [{ role: "user", content: prompt }],
    };
    
    // Si ce n'est pas OpenRouter (ou si on sait que c'est supporté), on peut ajouter le format
    // Pour simplifier, on s'appuie sur le prompt très strict.
    
    const response = await fetch(`${aiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.ALLOWED_ORIGIN || 'http://localhost:5173', // Requis par OpenRouter
        'X-Title': 'JobFinder AI', // Requis par OpenRouter
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DEBUG IA] Erreur brute API (${response.status}):`, errorText);
      return res.status(response.status).json({ 
        error: `Erreur API IA (${response.status})`, 
        details: errorText 
      });
    }

    const data = await response.json();
    let contentText = data.choices[0].message.content;
    
    console.log(`[DEBUG IA] Réponse brute du modèle : \n`, contentText);

    // Amélioration de l'extraction JSON : on cherche le premier { et le dernier }
    // Cela permet de survivre même si le modèle dit "Voici le json: { ... }"
    const firstBrace = contentText.indexOf('{');
    const lastBrace = contentText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      contentText = contentText.substring(firstBrace, lastBrace + 1);
    } else {
      console.warn(`[DEBUG IA] Attention : Impossible de trouver des accolades dans la réponse !`);
    }
    
    console.log(`[DEBUG IA] Texte après nettoyage prêt pour JSON.parse : \n`, contentText);
    
    const parsedData = JSON.parse(contentText);
    console.log(`[DEBUG IA] JSON correctement parsé !`);
    console.log(`=====================================================\n`);
    
    res.json(parsedData);
  } catch (error) {
    console.error(`\n========== [ERREUR CRITIQUE SERVEUR] ==========`);
    console.error("Erreur serveur (/api/ai/evaluate):", error.message);
    
    // Renvoyer le vrai message d'erreur pour faciliter le débuggage en ligne
    res.status(500).json({ error: error.message });
  }
});

// Keep all errors JSON-only so implementation details and stack traces never
// reach clients, including errors raised before a route handler runs.
app.use((error, req, res, _next) => {
  const status = error.status || error.statusCode || 500;

  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'JSON de requête invalide.' });
  }

  if (status === 413 || error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Requête trop volumineuse.' });
  }

  if (error.code === 'CORS_ORIGIN_DENIED' || status === 403) {
    return res.status(403).json({ error: 'Origine non autorisée.' });
  }

  console.error('Erreur API non gérée:', error.message);
  return res.status(500).json({ error: 'Erreur interne du serveur.' });
});

// Exportation de l'application Express pour Vercel (PAS de app.listen ici !)
export default app;
