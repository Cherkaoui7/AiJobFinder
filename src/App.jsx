import { useState } from 'react'
import './App.css'
import JobCard from './components/JobCard'
import ProfileForm from './components/ProfileForm'
import SettingsForm from './components/SettingsForm'
import { fetchRealJobs } from './services/jobs'
import { evaluateJob } from './services/ai'

function App() {
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [currentView, setCurrentView] = useState('home') // 'home' ou 'profile'

  const handleProfileUpdate = async (userProfile) => {
    setIsLoading(true)
    setStatusMessage("Recherche d'offres en direct...")
    
    try {
      // 1. Récupération des vraies offres sur internet (filtre Google Jobs par titre + localisation)
      const realJobs = await fetchRealJobs(userProfile.title, userProfile.location);
      
      if (realJobs.length === 0) {
        setStatusMessage("Aucune offre trouvée pour ce métier aujourd'hui.")
        setJobs([])
        return;
      }

      setStatusMessage(`Analyse de ${realJobs.length} offres par Mistral AI...`)

      // 2. Pour chaque vraie offre trouvée, on demande à Mistral d'évaluer le match
      let failedEvaluations = 0
      const evaluatedJobs = await Promise.all(
        realJobs.map(async (job) => {
          const aiResult = await evaluateJob(job, userProfile);
          
          if (aiResult) {
            return {
              ...job,
              matchScore: aiResult.matchScore,
              aiSummary: aiResult.aiSummary
            }
          }
          // En cas d'erreur de l'IA, on retourne l'offre avec un score par défaut
          failedEvaluations += 1
          return { ...job, matchScore: 0, aiSummary: "Analyse IA non disponible." }; 
        })
      )
      
      // On trie par score décroissant
      evaluatedJobs.sort((a, b) => b.matchScore - a.matchScore)
      setJobs(evaluatedJobs)
      setStatusMessage(
        failedEvaluations > 0
          ? `${failedEvaluations} analyse(s) IA indisponible(s). Vérifiez votre clé Mistral ou réessayez plus tard.`
          : ""
      )
      
    } catch (error) {
      console.error("Erreur globale lors de l'évaluation :", error)
      setStatusMessage("Une erreur est survenue.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo" onClick={() => setCurrentView('home')} style={{ cursor: 'pointer' }}>
          JobFinder <span>AI</span>
        </div>
        <div className="user-profile">
          <button 
            onClick={() => setCurrentView(currentView === 'home' ? 'profile' : 'home')}
            style={{
              background: 'transparent',
              border: '1px solid var(--card-border)',
              color: 'var(--text-main)',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              cursor: 'pointer'
            }}
          >
            {currentView === 'home' ? 'Paramètres' : 'Retour'}
          </button>
        </div>
      </header>
      
      <main>
        {currentView === 'profile' ? (
          <SettingsForm 
            onSave={() => setCurrentView('home')} 
            onCancel={() => setCurrentView('home')} 
          />
        ) : (
          <>
            <ProfileForm onUpdate={handleProfileUpdate} isLoading={isLoading} />
            
            <div className="job-list">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem', color: 'var(--text-muted)' }}>
            Vos offres sélectionnées par l'IA
          </h2>
          
          {statusMessage && <p style={{ color: isLoading ? 'var(--accent-primary)' : 'var(--text-muted)', marginBottom: '1rem' }}>{statusMessage}</p>}
          
          {!isLoading && jobs.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>
              {statusMessage || "Remplissez votre profil et lancez la recherche pour trouver des offres !"}
            </p>
          )}

          {jobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
          </>
        )}
      </main>
    </div>
  )
}

export default App
