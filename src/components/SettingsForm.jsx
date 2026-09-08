import { useState } from 'react'
import './SettingsForm.css'

function SettingsForm({ onSave, onCancel }) {
  const [mistralKey, setMistralKey] = useState(localStorage.getItem('mistralKey') || "")
  const [serpapiKey, setSerpapiKey] = useState(localStorage.getItem('serpapiKey') || "")
  const [aiBaseUrl, setAiBaseUrl] = useState(localStorage.getItem('aiBaseUrl') || "https://api.mistral.ai/v1")
  const [aiModel, setAiModel] = useState(localStorage.getItem('aiModel') || "mistral-small-latest")
  const [isSaved, setIsSaved] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Sauvegarde dans le navigateur
    localStorage.setItem('mistralKey', mistralKey)
    localStorage.setItem('serpapiKey', serpapiKey)
    localStorage.setItem('aiBaseUrl', aiBaseUrl)
    localStorage.setItem('aiModel', aiModel)

    setIsSaved(true)
    setTimeout(() => {
      onSave() // Retour à l'accueil après 1 seconde
    }, 1000)
  }

  const handleDeleteKeys = () => {
    localStorage.removeItem('mistralKey')
    localStorage.removeItem('serpapiKey')
    localStorage.removeItem('aiBaseUrl')
    localStorage.removeItem('aiModel')
    setMistralKey("")
    setSerpapiKey("")
    setAiBaseUrl("https://api.mistral.ai/v1")
    setAiModel("mistral-small-latest")
    setIsSaved(false)
  }

  return (
    <div className="settings-container">
      <h2 className="settings-title">Paramètres du Profil</h2>
      
      <div className="settings-card">
        <form onSubmit={handleSubmit}>
          
          <h3 className="settings-section-title">🔑 Configuration API (BYOK)</h3>
          <p className="settings-description">
            Pour garantir la gratuité de ce service, veuillez utiliser vos propres clés API. <br/>
            Elles seront stockées <strong>uniquement</strong> dans votre navigateur (localStorage).
          </p>

          <div className="settings-info-box">
            ℹ️ <strong>Transparence :</strong> Vos clés transitent par notre serveur sécurisé (Vercel) agissant comme un proxy pour interroger les IA et Google Jobs, mais elles n'y sont jamais enregistrées.
          </div>

          <div className="settings-field">
            <label>Clé API IA (Mistral, OpenRouter, Groq...)</label>
            <input 
              type="password" 
              placeholder="Ex: abcdef1234567890" 
              value={mistralKey}
              onChange={(e) => { setMistralKey(e.target.value); setIsSaved(false); }}
              required
            />
          </div>

          <div className="settings-field">
            <label>Clé API SerpApi (Google Jobs)</label>
            <input 
              type="password" 
              placeholder="Ex: abcdef1234567890" 
              value={serpapiKey}
              onChange={(e) => { setSerpapiKey(e.target.value); setIsSaved(false); }}
              required
            />
          </div>

          <div className="settings-divider"></div>

          <h3 className="settings-section-title">🌐 Avancé : Modèle et Fournisseur (BYOM)</h3>
          <p className="settings-description">
            Vous utilisez OpenRouter, OpenAI ou Groq ? Changez l'URL et le nom du modèle ci-dessous. (Par défaut : Mistral)
          </p>

          <div className="settings-field">
            <label>URL de Base de l'API</label>
            <input 
              type="text" 
              placeholder="Ex: https://openrouter.ai/api/v1" 
              value={aiBaseUrl}
              onChange={(e) => { setAiBaseUrl(e.target.value); setIsSaved(false); }}
              required
            />
          </div>

          <div className="settings-field">
            <label>Modèle IA (ID exact)</label>
            <input 
              type="text" 
              placeholder="Ex: deepseek/deepseek-chat" 
              value={aiModel}
              onChange={(e) => { setAiModel(e.target.value); setIsSaved(false); }}
              required
            />
          </div>

          <div className="settings-actions">
            <button type="button" onClick={handleDeleteKeys} className="btn-delete">
              Supprimer mes clés
            </button>
            <button type="button" onClick={onCancel} className="btn-cancel">
              Annuler
            </button>
            <button type="submit" className={`btn-save ${isSaved ? 'saved' : ''}`}>
              {isSaved ? "✔ Sauvegardé !" : "Sauvegarder"}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default SettingsForm
