import app from './api/index.js';

const PORT = process.env.PORT || 3000;

// Démarrage du serveur local (utilisé uniquement pour le développement)
app.listen(PORT, () => {
  console.log(`🚀 Serveur Local démarré sur http://localhost:${PORT}`);
});
