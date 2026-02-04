import React from 'react';

const steps = [
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="pipeline-icon">
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <line x1="24" y1="4" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" />
        <line x1="24" y1="36" x2="24" y2="44" stroke="currentColor" strokeWidth="1.5" />
        <line x1="4" y1="24" x2="12" y2="24" stroke="currentColor" strokeWidth="1.5" />
        <line x1="36" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="14" cy="14" r="3" fill="currentColor" opacity="0.3" />
        <circle cx="30" cy="18" r="4" fill="currentColor" opacity="0.2" />
        <circle cx="20" cy="32" r="3.5" fill="currentColor" opacity="0.25" />
      </svg>
    ),
    title: 'Satellite Imagery',
    desc: 'Multi-spectral bands from Sentinel-1/2, Landsat, LiDAR, and climate sensors'
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="pipeline-icon">
        <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="18" cy="18" r="3" fill="currentColor" opacity="0.4" />
        <circle cx="30" cy="18" r="3" fill="currentColor" opacity="0.4" />
        <circle cx="18" cy="30" r="3" fill="currentColor" opacity="0.4" />
        <circle cx="30" cy="30" r="3" fill="currentColor" opacity="0.4" />
        <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.6" />
        <line x1="18" y1="18" x2="24" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <line x1="30" y1="18" x2="24" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <line x1="18" y1="30" x2="24" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <line x1="30" y1="30" x2="24" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      </svg>
    ),
    title: 'Foundation Model',
    desc: 'Vision Transformers with masked autoencoder pre-training on billions of patches'
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="pipeline-icon">
        <rect x="6" y="20" width="4" height="14" rx="1" fill="currentColor" opacity="0.5" />
        <rect x="12" y="16" width="4" height="18" rx="1" fill="currentColor" opacity="0.55" />
        <rect x="18" y="12" width="4" height="22" rx="1" fill="currentColor" opacity="0.6" />
        <rect x="24" y="18" width="4" height="16" rx="1" fill="currentColor" opacity="0.65" />
        <rect x="30" y="14" width="4" height="20" rx="1" fill="currentColor" opacity="0.7" />
        <rect x="36" y="22" width="4" height="12" rx="1" fill="currentColor" opacity="0.75" />
        <text x="24" y="44" textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.5" fontFamily="monospace">64-dim</text>
      </svg>
    ),
    title: 'Dense Embeddings',
    desc: '64–768 dimensional vectors encoding landscape features, phenology, and structure'
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="pipeline-icon">
        <rect x="6" y="6" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="26" y="6" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="6" y="26" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="26" y="26" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <text x="14" y="16" textAnchor="middle" fontSize="8" fill="currentColor">🌾</text>
        <text x="34" y="16" textAnchor="middle" fontSize="8" fill="currentColor">🌊</text>
        <text x="14" y="36" textAnchor="middle" fontSize="8" fill="currentColor">🔥</text>
        <text x="34" y="36" textAnchor="middle" fontSize="8" fill="currentColor">🏗️</text>
      </svg>
    ),
    title: 'Applications',
    desc: 'Crop mapping, flood detection, change monitoring, building detection, and more'
  }
];

const Arrow = () => (
  <div className="pipeline-arrow">
    <svg viewBox="0 0 40 16" fill="none">
      <path d="M0 8H32M32 8L26 2M32 8L26 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  </div>
);

export default function Pipeline() {
  return (
    <section className="section pipeline-section" data-section="pipeline">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">How It Works</span>
          <h2>From Pixels to Understanding</h2>
          <p className="section-subtitle">
            Geospatial foundation models transform raw satellite imagery into 
            dense vector representations that encode everything about a location — 
            vegetation type, soil moisture, urban density, elevation, and seasonal patterns.
          </p>
        </div>
        <div className="pipeline-flow fade-in">
          {steps.map((step, i) => (
            <React.Fragment key={i}>
              <div className="pipeline-step">
                <div className="pipeline-step-icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
              {i < steps.length - 1 && <Arrow />}
            </React.Fragment>
          ))}
        </div>
        <div className="pipeline-detail fade-in">
          <div className="pipeline-detail-card">
            <div className="pipeline-detail-header">
              <span className="pipeline-detail-tag">Key Insight</span>
            </div>
            <p>
              Unlike task-specific models that must be retrained for each application, 
              foundation model embeddings are <strong>general-purpose</strong>. The same 
              64-dimensional vector that enables crop type classification also supports 
              change detection, similarity search, and anomaly detection — all without 
              additional training.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
