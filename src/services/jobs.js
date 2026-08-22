// src/services/jobs.js

/**
 * Récupère de vraies offres d'emploi via notre serveur Backend sécurisé.
 * Le frontend ne communique plus directement avec SerpApi.
 */
export async function fetchRealJobs(title = "", location = "") {
  try {
    const serpapiKey = localStorage.getItem('serpapiKey');
    if (!serpapiKey) {
      throw new Error("Clé API SerpApi manquante. Veuillez la configurer dans votre profil.");
    }

    const url = `/api/jobs?title=${encodeURIComponent(title)}&location=${encodeURIComponent(location)}`;
    const response = await fetch(url, {
      headers: {
        'x-serpapi-key': serpapiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const jobs = await response.json();
    return jobs;

  } catch (error) {
    console.error("Erreur lors de la récupération des offres:", error);
    return [];
  }
}
