// src/services/ai.js

/**
 * Appelle notre serveur Backend pour évaluer une offre d'emploi.
 * Le frontend ne communique plus directement avec Mistral AI.
 */
export async function evaluateJob(job, userProfile) {
  try {
    const aiKey = localStorage.getItem('mistralKey');
    const aiBaseUrl = localStorage.getItem('aiBaseUrl') || "https://api.mistral.ai/v1";
    const aiModel = localStorage.getItem('aiModel') || "mistral-small-latest";
    
    if (!aiKey) {
      throw new Error("Clé API manquante.");
    }

    console.log(`[DEBUG] Demande d'évaluation au backend pour "${job.title}"...`);
    
    const response = await fetch('/api/ai/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ai-key': aiKey,
        'x-ai-base-url': aiBaseUrl,
        'x-ai-model': aiModel
      },
      body: JSON.stringify({ job, userProfile }),
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      console.error(`[DEBUG] Erreur Backend (Statut ${response.status}):`, errorDetail);
      return null;
    }

    const parsedData = await response.json();
    return parsedData;
    
  } catch (error) {
    console.error(`[DEBUG] Erreur réseau lors de la communication avec le backend:`, error);
    return null; 
  }
}
