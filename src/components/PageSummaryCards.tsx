import { Link } from 'react-router-dom';

const SUMMARIES = [
  {
    path: '/models',
    title: 'Models & Architecture',
    description: 'Detailed specs for 16 foundation models — radar profiles, benchmark tables, training data, architecture diagrams, and task-based recommendations.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    path: '/explore',
    title: 'Live Explorer',
    description: 'Interact with real AlphaEarth embeddings via Google Earth Engine — 19 case studies, band experimentation, clustering, change detection, and similarity search.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    path: '/about',
    title: 'Research & Sources',
    description: 'Expert insights from leading researchers, academic citations, getting started guides, and links to papers and code repositories.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
];

export default function PageSummaryCards() {
  return (
    <section className="section page-summaries-section" data-section="summaries">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">Dive Deeper</span>
          <h2>What You'll Find</h2>
        </div>
        <div className="page-summary-cards fade-in">
          {SUMMARIES.map(s => (
            <Link key={s.path} to={s.path} className="page-summary-card">
              <div className="page-summary-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
              <span className="page-summary-link">
                Explore
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
