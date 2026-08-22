import { useState } from 'react'
import './ProfileForm.css' // On réutilise les mêmes styles pour le moment

function SettingsForm({ onSave, onCancel }) {
  const [mistralKey, setMistralKey] = useState(localStorage.getItem('mistralKey') || "")
  const [serpapiKey, setSerpapiKey] = useState(localStorage.getItem('serpapiKey') || "")
  const [isSaved, setIsSaved] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Sauvegarde dans le navigateur
    localStorage.setItem('mistralKey', mistralKey)
    localStorage.setItem('serpapiKey', serpapiKey)

    setIsSaved(true)
    setTimeout(() => {
      onSave() // Retour à l'accueil après 1 seconde
    }, 1000)
  }

  const handleDeleteKeys = () => {
    localStorage.removeItem('mistralKey')
    localStorage.removeItem('serpapiKey')
    setMistralKey("")
    setSerpapiKey("")
    setIsSaved(false)
  }

  return (
    <div className="job-list" style={{ marginTop: '2rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
      <h2 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Paramètres du Profil</h2>
      
      <form className="profile-form" onSubmit={handleSubmit} style={{ margin: 0 }}>
        <h3 style={{ marginBottom: '1rem' }}>🔑 Configuration API (BYOK)</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Pour garantir la gratuité de ce service, veuillez utiliser vos propres clés API. <br/>
          Elles seront stockées <strong>uniquement</strong> dans votre navigateur (localStorage).<br/><br/>
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
            ℹ️ <strong>Transparence :</strong> Vos clés transitent par notre serveur sécurisé (Vercel) agissant comme un proxy pour interroger Mistral et Google Jobs, mais elles n'y sont jamais enregistrées.
          </span>
        </p>

        <div className="input-group" style={{ flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              Clé API Mistral (Intelligence Artificielle)
            </label>
            <input 
              type="password" 
              placeholder="Ex: abcdef1234567890" 
              value={mistralKey}
              onChange={(e) => { setMistralKey(e.target.value); setIsSaved(false); }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              Clé API SerpApi (Google Jobs)
            </label>
            <input 
              type="password" 
              placeholder="Ex: abcdef1234567890" 
              value={serpapiKey}
              onChange={(e) => { setSerpapiKey(e.target.value); setIsSaved(false); }}
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button type="button" onClick={handleDeleteKeys} className="btn-secondary" style={{ flex: 1 }}>
            Supprimer mes clés
          </button>
          <button type="button" onClick={onCancel} className="btn-update" style={{ background: 'transparent', border: '1px solid var(--card-border)', flex: 1 }}>
            Annuler
          </button>
          <button type="submit" className="btn-update" style={{ flex: 2, background: isSaved ? 'var(--success-color, #10b981)' : '' }}>
            {isSaved ? "✔ Sauvegardé !" : "Sauvegarder"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SettingsForm
