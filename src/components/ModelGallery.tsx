import React, { useState } from 'react';
import { models, Model } from '../data/models';

// Model hero images — real FM output/architecture visualizations
const BASE = import.meta.env.BASE_URL;
const MODEL_IMAGES: Record<string, { src: string; alt: string }> = {
  alphaearth: { src: `${BASE}imagery/alphaearth-composite.jpg`, alt: 'AlphaEarth 64-dim embedding false-color composite across 3 regions' },
  clay: { src: `${BASE}imagery/clay-embedding-viz.jpg`, alt: 'Clay Foundation model embedding visualization' },
  prithvi: { src: `${BASE}imagery/prithvi-flood-mapping.png`, alt: 'Prithvi-EO flood mapping results on Sen1Floods11' },
  satmae: { src: `${BASE}imagery/satmae-teaser.png`, alt: 'SatMAE temporal-spectral masked autoencoder approach' },
  spectralgpt: { src: `${BASE}imagery/spectralgpt-workflow.jpg`, alt: 'SpectralGPT 3D spectral masking workflow' },
  skysense: { src: `${BASE}imagery/skysense-architecture.png`, alt: 'SkySense factorized multi-modal encoder architecture' },
  croma: { src: `${BASE}imagery/croma-sar-optical.png`, alt: 'CROMA SAR-optical cross-modal alignment' },
  dofa: { src: `${BASE}imagery/dofa-architecture.png`, alt: 'DOFA wavelength-conditioned hypernetwork architecture' },
};

function ModelCard({ model, onClick, isActive }: { model: Model; onClick: () => void; isActive: boolean }) {
  const img = MODEL_IMAGES[model.id];
  return (
    <div
      className={`model-card fade-in ${isActive ? 'active' : ''}`}
      onClick={onClick}
      style={{ '--model-color': model.color } as React.CSSProperties}
    >
      {img && (
        <div className="model-card-image">
          <img src={img.src} alt={img.alt} loading="lazy" />
          <div className="model-card-image-overlay" />
        </div>
      )}
      <div className="model-card-header">
        <span className="model-card-icon">{model.icon}</span>
        <span className="model-card-org">{model.org}</span>
      </div>
      <h3 className="model-card-name">{model.name}</h3>
      <p className="model-card-tagline">{model.tagline}</p>
      <div className="model-card-stats">
        <div className="model-card-stat">
          <span className="stat-label">Params</span>
          <span className="stat-value">{model.params}</span>
        </div>
        <div className="model-card-stat">
          <span className="stat-label">Resolution</span>
          <span className="stat-value">{model.resolution}</span>
        </div>
        <div className="model-card-stat">
          <span className="stat-label">License</span>
          <span className="stat-value">{model.license}</span>
        </div>
      </div>
      <div className="model-card-modalities">
        {model.modalities.slice(0, 3).map((m, i) => (
          <span key={i} className="modality-tag">{m}</span>
        ))}
        {model.modalities.length > 3 && (
          <span className="modality-tag more">+{model.modalities.length - 3}</span>
        )}
      </div>
      <div className="model-card-footer">
        <span className="model-card-cta">Explore →</span>
      </div>
    </div>
  );
}

function ModelDetail({ model, onClose }: { model: Model; onClose: () => void }) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="model-detail-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="model-detail" style={{ '--model-color': model.color } as React.CSSProperties}>
        <button className="model-detail-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="model-detail-hero">
          <span className="model-detail-icon">{model.icon}</span>
          <div>
            <span className="model-detail-org">{model.org}</span>
            <h2>{model.name}</h2>
          </div>
        </div>

        {MODEL_IMAGES[model.id] && (
          <div className="model-detail-image">
            <img 
              src={MODEL_IMAGES[model.id].src} 
              alt={MODEL_IMAGES[model.id].alt} 
              loading="lazy" 
            />
            <span className="model-detail-image-caption">{MODEL_IMAGES[model.id].alt}</span>
          </div>
        )}

        <p className="model-detail-desc">{model.description}</p>

        <div className="model-detail-grid">
          <div className="detail-stat-card">
            <span className="detail-stat-label">Parameters</span>
            <span className="detail-stat-value">{model.params}</span>
          </div>
          <div className="detail-stat-card">
            <span className="detail-stat-label">Resolution</span>
            <span className="detail-stat-value">{model.resolution}</span>
          </div>
          <div className="detail-stat-card">
            <span className="detail-stat-label">License</span>
            <span className="detail-stat-value">{model.license}</span>
          </div>
          <div className="detail-stat-card">
            <span className="detail-stat-label">Key Strength</span>
            <span className="detail-stat-value small">{model.keyStrength}</span>
          </div>
        </div>

        <div className="model-detail-section">
          <h3>Modalities</h3>
          <div className="modality-list">
            {model.modalities.map((m, i) => (
              <span key={i} className="modality-tag large">{m}</span>
            ))}
          </div>
        </div>

        <div className="model-detail-section">
          <h3>Data Source</h3>
          <p>{model.dataSource}</p>
        </div>

        {model.id === 'alphaearth' && (
          <div className="model-detail-section">
            <div className="auth-notice">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Access via <a href="https://earthengine.google.com/signup/" target="_blank" rel="noopener noreferrer">Google Earth Engine</a> (free for research, requires OAuth). Also available on Google Cloud Storage (requester-pays).</span>
            </div>
          </div>
        )}
        {(model.license.includes('Apache') || model.license.includes('MIT')) && (
          <div className="model-detail-section">
            <div className="auth-notice open">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>Open source — download weights and run locally. No API key needed.</span>
            </div>
          </div>
        )}

        {/* Architecture details */}
        <div className="model-detail-section">
          <h3>Architecture</h3>
          <div className="detail-arch-grid">
            <div className="detail-arch-item">
              <span className="detail-arch-label">Type</span>
              <span className="detail-arch-value">{model.architecture.type}</span>
            </div>
            <div className="detail-arch-item">
              <span className="detail-arch-label">Encoder</span>
              <span className="detail-arch-value">{model.architecture.encoder}</span>
            </div>
            <div className="detail-arch-item">
              <span className="detail-arch-label">Embedding Dim</span>
              <span className="detail-arch-value">{model.architecture.embeddingDim}</span>
            </div>
            {model.architecture.patchSize && (
              <div className="detail-arch-item">
                <span className="detail-arch-label">Patch Size</span>
                <span className="detail-arch-value">{model.architecture.patchSize}</span>
              </div>
            )}
            {model.architecture.maskRatio && (
              <div className="detail-arch-item">
                <span className="detail-arch-label">Mask Ratio</span>
                <span className="detail-arch-value">{(model.architecture.maskRatio * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>
          <p className="detail-pretrain-desc">{model.architecture.pretrainingStrategy}</p>
        </div>

        {/* Pros & Cons */}
        <div className="model-detail-section">
          <h3>Strengths & Limitations</h3>
          <div className="detail-pros-cons">
            <div className="detail-pros">
              {model.pros.slice(0, 4).map((p, i) => (
                <span key={i} className="detail-pro-item">✓ {p}</span>
              ))}
            </div>
            <div className="detail-cons">
              {model.cons.slice(0, 3).map((c, i) => (
                <span key={i} className="detail-con-item">⚠ {c}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Benchmarks */}
        {model.benchmarks.length > 0 && (
          <div className="model-detail-section">
            <h3>Published Benchmarks</h3>
            <div className="detail-benchmarks">
              {model.benchmarks.map((b, i) => (
                <div key={i} className="detail-benchmark-item">
                  <span className="benchmark-task">{b.task}</span>
                  <span className="benchmark-value">{b.value}{b.unit.startsWith('%') ? b.unit : ` ${b.unit}`}</span>
                  {b.citation && <span className="benchmark-cite">{b.citation}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {model.codeExample && (
          <div className="model-detail-section">
            <button
              className="code-toggle"
              onClick={() => setShowCode(!showCode)}
            >
              {showCode ? 'Hide' : 'Show'} Code Example
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ transform: showCode ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showCode && (
              <pre className="code-block">
                <code>{model.codeExample}</code>
              </pre>
            )}
          </div>
        )}

        <div className="model-detail-links">
          {model.links.map((link, i) => (
            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="detail-link">
              {link.label}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ModelGallery() {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  return (
    <section className="section model-gallery-section" data-section="models">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">The LEOMs</span>
          <h2>Large Earth Observation Models</h2>
          <p className="section-subtitle">
            The major LEOMs producing geo-embeddings today. Each takes a different approach 
            to encoding Earth — from multi-temporal optical to SAR fusion to hyperspectral. 
            Click any card for architecture, benchmarks, and code.
          </p>
        </div>
        <div className="model-grid">
          {models.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              isActive={selectedModel?.id === model.id}
              onClick={() => setSelectedModel(model)}
            />
          ))}
        </div>
      </div>
      {selectedModel && (
        <ModelDetail model={selectedModel} onClose={() => setSelectedModel(null)} />
      )}
    </section>
  );
}
