import { models } from '../data/models';

interface RealApplication {
  id: string;
  company: string;
  companyDetail: string;
  sector: string;
  sectorColor: string;
  title: string;
  modelsUsed: string[];
  methodology: string;
  keyResult: string;
  insight: string;
  source: string;
  sourceUrl: string;
}

const applications: RealApplication[] = [
  {
    id: 'renoster',
    company: 'Renoster',
    companyDetail: 'Maine, USA',
    sector: 'Carbon & Forestry',
    sectorColor: '#16a34a',
    title: 'Forest Carbon Estimation with AlphaEarth + LiDAR',
    modelsUsed: ['alphaearth'],
    methodology: 'Sample 5,000 forested points. Extract LiDAR canopy height + 64 AlphaEarth embedding values per point. Fit ElasticNet regression to predict above-ground biomass. Deploy model across 20,000 acres via Google Earth Engine. Separately, a French study trained U-Net++ on AlphaEarth embeddings to predict surface height, achieving R\u00B2 = 0.84 over 7,865 km\u00B2.',
    keyResult: 'Significantly improved carbon stock estimation in mixed-species forests. First supplier under Isometric\'s Improved Forest Management Protocol — 37 landowners across 20,000 acres in Maine.',
    insight: '"Benefits of time-series data without the headaches" — embeddings replace an entire satellite preprocessing pipeline. This is a regression task (continuous variable), not classification, proving embeddings work for continuous prediction too.',
    source: 'Google Earth Blog / arXiv 2602.17250',
    sourceUrl: 'https://arxiv.org/html/2602.17250',
  },
  {
    id: 'vantor',
    company: 'Vantor',
    companyDetail: 'Defense & Intelligence',
    sector: 'Defense',
    sectorColor: '#475569',
    title: 'Geospatial Intelligence with Foundation Models',
    modelsUsed: ['google-rsfm', 'alphaearth'],
    methodology: 'Leverages Google\'s RSFM (vision-language models) via the Tensorglobe platform for automated object detection, scene classification, and change monitoring across satellite imagery at operational scale.',
    keyResult: 'Production deployment for defense applications — automated detection and classification workflows that previously required manual analyst review.',
    insight: 'Foundation models enable defense-grade geospatial analysis without building custom models for each task. The vision-language interface allows analysts to query imagery with natural language.',
    source: 'Google Trusted Tester Program',
    sourceUrl: 'https://cloud.google.com/blog/products/ai-machine-learning/earth-ai-remote-sensing-foundation-models',
  },
  {
    id: 'planet',
    company: 'Planet Labs',
    companyDetail: 'San Francisco, USA',
    sector: 'Agriculture',
    sectorColor: '#ca8a04',
    title: 'Global Agriculture Monitoring at Scale',
    modelsUsed: ['google-rsfm'],
    methodology: 'Integrates geospatial foundation models with Planet\'s daily satellite constellation to monitor crop health, estimate yields, and detect anomalies across millions of hectares. Combines Planet\'s high-frequency revisit imagery with FM-derived features for enhanced temporal resolution.',
    keyResult: 'Foundation model features combined with Planet\'s daily imagery enable agricultural insights at global scale — monitoring crop conditions across entire growing seasons.',
    insight: 'Combining high-frequency commercial imagery with foundation model understanding creates capabilities neither can achieve alone. The FM provides spectral-temporal context; Planet provides daily revisit.',
    source: 'Google Trusted Tester Program',
    sourceUrl: 'https://cloud.google.com/blog/products/ai-machine-learning/earth-ai-remote-sensing-foundation-models',
  },
  {
    id: 'element84',
    company: 'Element 84',
    companyDetail: 'Arlington, USA',
    sector: 'Geospatial Search',
    sectorColor: '#7c3aed',
    title: 'Embedding-Based Similarity Search Across Petabytes',
    modelsUsed: ['alphaearth'],
    methodology: 'Uses AlphaEarth 64-dimensional embeddings to build vector indices over petabyte-scale satellite imagery archives. Airport detection validated using specific embedding bands (AlphaEarth A26). Users click a location of interest and find visually similar locations globally in seconds.',
    keyResult: 'Practical similarity search across massive imagery archives — find all airports, ports, or industrial sites by example rather than labeled training data.',
    insight: 'Embeddings transform the search problem: instead of building classifiers for each object type, users search by similarity in embedding space. One-shot search replaces months of labeling.',
    source: 'Element 84 / Google Earth Engine',
    sourceUrl: 'https://earthengine.google.com/',
  },
];

export default function RealApplications() {
  return (
    <section className="section real-apps-section" data-section="real-apps">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">Production Evidence</span>
          <h2>Real-World Applications</h2>
          <p className="section-subtitle">
            Foundation models are already deployed in production for forest carbon credits,
            defense intelligence, agriculture monitoring, and geospatial search.
          </p>
        </div>
        <div className="real-apps-grid">
          {applications.map(app => (
            <div key={app.id} className="real-app-card fade-in">
              <div className="real-app-header">
                <div>
                  <strong className="real-app-company">{app.company}</strong>
                  <span className="real-app-detail">{app.companyDetail}</span>
                </div>
                <span className="real-app-sector" style={{ background: app.sectorColor + '15', color: app.sectorColor }}>
                  {app.sector}
                </span>
              </div>
              <h4 className="real-app-title">{app.title}</h4>
              <div className="real-app-block">
                <span className="real-app-label">Methodology</span>
                <p>{app.methodology}</p>
              </div>
              <div className="real-app-block">
                <span className="real-app-label">Key Result</span>
                <p>{app.keyResult}</p>
              </div>
              <div className="real-app-models">
                {app.modelsUsed.map(id => {
                  const m = models.find(x => x.id === id);
                  return m ? (
                    <span key={id} className="real-app-model-pill" style={{ borderColor: m.color, color: m.color }}>
                      {m.name}
                    </span>
                  ) : null;
                })}
              </div>
              <blockquote className="real-app-insight">{app.insight}</blockquote>
              {app.sourceUrl && (
                <a href={app.sourceUrl} target="_blank" rel="noopener noreferrer" className="real-app-source">
                  {app.source}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
