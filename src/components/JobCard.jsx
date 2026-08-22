import './JobCard.css'

function JobCard({ job }) {
  return (
    <div className="job-card">
      <div className="job-card-header">
        <div className="job-info">
          <h2>{job.title}</h2>
          <p className="company-details">
            {job.company} • {job.location} • {job.type}
          </p>
        </div>
        <div className="match-score">
          <div className="score-circle">
            <span>{job.matchScore}%</span>
            <small>Match</small>
          </div>
        </div>
      </div>
      
      <div className="ai-summary">
        <div className="ai-summary-title">✨ AI Summary</div>
        <p>{job.aiSummary}</p>
      </div>

      <div className="tags">
        {job.tags.map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>

      <div className="job-card-actions">
        {job.url && job.url.startsWith("http") ? (
          <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none' }}>
            Apply Now
          </a>
        ) : (
          <button className="btn-primary">Apply Now</button>
        )}
        <button className="btn-secondary">Save</button>
      </div>
    </div>
  )
}

export default JobCard
