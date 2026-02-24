import React, { useState } from 'react';
import { models } from '../data/models';

const modelTabs = models.filter(m => m.codeExample).slice(0, 5);

export default function GettingStarted() {
  const [activeTab, setActiveTab] = useState(modelTabs[0]?.id || '');

  const activeModel = models.find(m => m.id === activeTab);

  return (
    <section className="section getting-started-section" data-section="code">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">Get Started</span>
          <h2>Code Examples</h2>
          <p className="section-subtitle">
            Start generating geo-embeddings with LEOMs today. 
            Each example shows the core pattern: load model → input imagery → get embeddings.
          </p>
        </div>

        <div className="code-tabs-container fade-in">
          <div className="code-tabs">
            {modelTabs.map(m => (
              <button
                key={m.id}
                className={`code-tab ${activeTab === m.id ? 'active' : ''}`}
                onClick={() => setActiveTab(m.id)}
                style={{ '--tab-color': m.color } as React.CSSProperties}
              >
                <span className="code-tab-icon">{m.icon}</span>
                <span className="code-tab-name">{m.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          <div className="code-panel">
            {activeModel && (
              <>
                <div className="code-panel-header">
                  <div className="code-panel-info">
                    <h3>{activeModel.name}</h3>
                    <span className="code-panel-org">{activeModel.org}</span>
                  </div>
                  <div className="code-panel-links">
                    {activeModel.links.map((link, i) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="code-panel-link">
                        {link.label}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
                {activeModel.id === 'alphaearth' && (
                  <div className="auth-notice">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>Requires a <a href="https://earthengine.google.com/signup/" target="_blank" rel="noopener noreferrer">Google Earth Engine account</a> (free for research). Run in the <a href="https://code.earthengine.google.com" target="_blank" rel="noopener noreferrer">GEE Code Editor</a>.</span>
                  </div>
                )}
                {(activeModel.id === 'clay' || activeModel.id === 'prithvi') && (
                  <div className="auth-notice open">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>Open source — weights on HuggingFace, runs locally with a GPU. No API key required.</span>
                  </div>
                )}
                <div className="code-block-wrapper">
                  <div className="code-block-header">
                    <div className="code-dots">
                      <span className="code-dot red" />
                      <span className="code-dot yellow" />
                      <span className="code-dot green" />
                    </div>
                    <span className="code-lang">
                      {activeModel.id === 'alphaearth' ? 'JavaScript (Earth Engine)' : 'Python'}
                    </span>
                  </div>
                  <pre className="code-block-content">
                    <code>{activeModel.codeExample}</code>
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick start cards */}
        <div className="quickstart-grid fade-in">
          <div className="quickstart-card">
            <div className="quickstart-icon"></div>
            <h4>Google Earth Engine</h4>
            <p>
              Access AlphaEarth embeddings directly in GEE. 
              No downloads, no GPU required — just JavaScript in the Code Editor.
            </p>
            <a href="https://code.earthengine.google.com/" target="_blank" rel="noopener noreferrer" className="quickstart-link">
              Open Code Editor →
            </a>
          </div>
          <div className="quickstart-card">
            <div className="quickstart-icon"></div>
            <h4>HuggingFace Hub</h4>
            <p>
              Download Clay and Prithvi model weights directly. 
              Fine-tune with PyTorch on your own GPU or Colab.
            </p>
            <a href="https://huggingface.co/ibm-nasa-geospatial" target="_blank" rel="noopener noreferrer" className="quickstart-link">
              Browse Models →
            </a>
          </div>
          <div className="quickstart-card">
            <div className="quickstart-icon"></div>
            <h4>TerraTorch Toolkit</h4>
            <p>
              IBM's fine-tuning framework for Prithvi. 
              Task adapters for segmentation, classification, and regression.
            </p>
            <a href="https://github.com/IBM/terratorch" target="_blank" rel="noopener noreferrer" className="quickstart-link">
              View on GitHub →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
