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
// Configuration CORS stricte
// N'autoriser que les requêtes venant du domaine frontend
// ---------------------------------------------------------------------------
const allowedOrigins = process.env.ALLOWED_ORIGIN 
  ? process.env.ALLOWED_ORIGIN.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json({ limit: '10kb' })); // Limite la taille des requêtes JSON à 10ko

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

const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.mistral.ai/v1';

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
    
    const url = `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur SerpApi: ${response.status}`);
    }

    const data = await response.json();
    const jobs = data.jobs_results || [];

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
      return res.status(401).json({ error: "Clé API Mistral manquante dans les en-têtes." });
    }
    AI_API_KEY = AI_API_KEY.trim();

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

    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-small-latest', 
        messages: [{ role: "user", content: prompt }],
        response_format: { type: 'json_object' } 
      }),
    });

    if (!response.ok) {
      console.error(`Erreur Mistral API (${response.status}): La requête a échoué.`);
      throw new Error(`Erreur Mistral: ${response.status}`);
    }

    const data = await response.json();
    const contentText = data.choices[0].message.content;
    const parsedData = JSON.parse(contentText);
    
    res.json(parsedData);
  } catch (error) {
    console.error("Erreur serveur (/api/ai/evaluate):", error.message);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Exportation de l'application Express pour Vercel (PAS de app.listen ici !)
export default app;
