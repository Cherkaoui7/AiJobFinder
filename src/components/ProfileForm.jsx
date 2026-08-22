import { useState } from 'react'
import './ProfileForm.css'

function ProfileForm({ onUpdate, isLoading }) {
  const [title, setTitle] = useState(localStorage.getItem('jobTitle') || "Développeur React")
  const [location, setLocation] = useState(localStorage.getItem('jobLocation') || "Remote")
  const [skills, setSkills] = useState(localStorage.getItem('jobSkills') || "React, TypeScript, UI/UX")

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Sauvegarde dans le navigateur pour ne pas avoir à les retaper
    localStorage.setItem('jobTitle', title)
    localStorage.setItem('jobLocation', location)
    localStorage.setItem('jobSkills', skills)

    onUpdate({ title, location, skills })
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <h3>Vos critères de recherche</h3>
      <div className="input-group">
        <input 
          type="text" 
          placeholder="Métier (ex: Développeur React)" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input 
          type="text" 
          placeholder="Localisation (ex: Paris ou Remote)" 
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <div className="input-group">
        <input 
          type="text" 
          placeholder="Compétences clés" 
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />
      </div>

      <button type="submit" className="btn-update" disabled={isLoading}>
        {isLoading ? "Analyse par l'IA en cours..." : "Lancer la recherche IA"}
      </button>
    </form>
  )
}

export default ProfileForm
