import React, { useState } from 'react';
import { models } from '../data/models';

type SortKey = 'name' | 'org' | 'params' | 'resolution' | 'license';

function ModalityBar({ modalities }: { modalities: string[] }) {
  return (
    <div className="modality-bar">
      {modalities.map((m, i) => (
        <span key={i} className="modality-pill">{m}</span>
      ))}
    </div>
  );
}

export default function ComparisonMatrix() {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedModels(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const sortedModels = [...models].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    const aVal = a[sortKey] || '';
    const bVal = b[sortKey] || '';
    return aVal.localeCompare(bVal) * dir;
  });

  const displayModels = selectedModels.length > 0
    ? sortedModels.filter(m => selectedModels.includes(m.id))
    : sortedModels;

  const SortIcon = ({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`sort-icon ${active ? 'active' : ''}`}>
      <path d="M6 2L9 5H3L6 2Z" fill={active && dir === 'asc' ? 'currentColor' : '#cbd5e1'} />
      <path d="M6 10L3 7H9L6 10Z" fill={active && dir === 'desc' ? 'currentColor' : '#cbd5e1'} />
    </svg>
  );

  return (
    <section className="section comparison-section" data-section="comparison">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">Side by Side</span>
          <h2>Model Comparison</h2>
          <p className="section-subtitle">
            Compare architectures, capabilities, and specifications across all eight 
            geospatial foundation models. Click model names to filter.
          </p>
        </div>

        <div className="comparison-filters fade-in">
          {models.map(m => (
            <button
              key={m.id}
              className={`comparison-filter-btn ${selectedModels.includes(m.id) ? 'active' : ''}`}
              onClick={() => toggleSelect(m.id)}
              style={{ '--filter-color': m.color } as React.CSSProperties}
            >
              {m.icon} {m.name.split(' ')[0]}
            </button>
          ))}
          {selectedModels.length > 0 && (
            <button className="comparison-filter-btn clear" onClick={() => setSelectedModels([])}>
              Clear filters
            </button>
          )}
        </div>

        <div className="comparison-table-wrap fade-in">
          <table className="comparison-table">
            <thead>
              <tr>
                <th className="th-model" onClick={() => toggleSort('name')}>
                  Model <SortIcon active={sortKey === 'name'} dir={sortDir} />
                </th>
                <th onClick={() => toggleSort('org')}>
                  Organization <SortIcon active={sortKey === 'org'} dir={sortDir} />
                </th>
                <th onClick={() => toggleSort('params')}>
                  Parameters <SortIcon active={sortKey === 'params'} dir={sortDir} />
                </th>
                <th onClick={() => toggleSort('resolution')}>
                  Resolution <SortIcon active={sortKey === 'resolution'} dir={sortDir} />
                </th>
                <th>Modalities</th>
                <th onClick={() => toggleSort('license')}>
                  License <SortIcon active={sortKey === 'license'} dir={sortDir} />
                </th>
                <th>Key Strength</th>
              </tr>
            </thead>
            <tbody>
              {displayModels.map(model => (
                <tr key={model.id}>
                  <td className="td-model">
                    <span className="td-model-icon" style={{ color: model.color }}>{model.icon}</span>
                    <span className="td-model-name">{model.name}</span>
                  </td>
                  <td>{model.org}</td>
                  <td><span className="td-mono">{model.params}</span></td>
                  <td><span className="td-mono">{model.resolution}</span></td>
                  <td><ModalityBar modalities={model.modalities} /></td>
                  <td>
                    <span className={`license-badge ${model.license.includes('Apache') ? 'open' : model.license.includes('MIT') ? 'open' : 'restricted'}`}>
                      {model.license}
                    </span>
                  </td>
                  <td className="td-strength">{model.keyStrength}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Architecture comparison cards */}
        <div className="arch-comparison fade-in">
          <h3 className="arch-title">Architecture Overview</h3>
          <div className="arch-grid">
            <div className="arch-card">
              <div className="arch-card-header">
                <span className="arch-card-icon">🔄</span>
                <h4>Masked Autoencoder (MAE)</h4>
              </div>
              <p>Mask random patches of satellite imagery, train model to reconstruct them. Learns spatial features.</p>
              <div className="arch-models">
                <span style={{ color: '#e07a2f' }}>Clay</span>
                <span style={{ color: '#8b5cf6' }}>SatMAE</span>
              </div>
              <div className="arch-diagram">
                <svg viewBox="0 0 200 60" fill="none">
                  <rect x="5" y="10" width="40" height="40" rx="4" fill="#f1f0ec" stroke="#c4c0b8" />
                  <rect x="10" y="15" width="10" height="10" fill="#0d4f4f" opacity="0.5" />
                  <rect x="25" y="15" width="10" height="10" fill="#e8e6e0" stroke="#ccc" strokeDasharray="2" />
                  <rect x="10" y="30" width="10" height="10" fill="#e8e6e0" stroke="#ccc" strokeDasharray="2" />
                  <rect x="25" y="30" width="10" height="10" fill="#0d4f4f" opacity="0.5" />
                  <path d="M50 30 L75 30" stroke="#0d4f4f" strokeWidth="1.5" markerEnd="url(#arrow)" />
                  <rect x="80" y="15" width="40" height="30" rx="4" fill="#0d4f4f" opacity="0.15" stroke="#0d4f4f" strokeWidth="1" />
                  <text x="100" y="34" textAnchor="middle" fill="#0d4f4f" fontSize="8" fontFamily="monospace">ViT</text>
                  <path d="M125 30 L150 30" stroke="#0d4f4f" strokeWidth="1.5" />
                  <rect x="155" y="10" width="40" height="40" rx="4" fill="#f1f0ec" stroke="#059669" />
                  <rect x="160" y="15" width="10" height="10" fill="#0d4f4f" opacity="0.5" />
                  <rect x="175" y="15" width="10" height="10" fill="#059669" opacity="0.5" />
                  <rect x="160" y="30" width="10" height="10" fill="#059669" opacity="0.5" />
                  <rect x="175" y="30" width="10" height="10" fill="#0d4f4f" opacity="0.5" />
                  <defs><marker id="arrow" viewBox="0 0 6 6" refX="6" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L6 3L0 6z" fill="#0d4f4f" /></marker></defs>
                </svg>
              </div>
            </div>

            <div className="arch-card">
              <div className="arch-card-header">
                <span className="arch-card-icon">⏱️</span>
                <h4>Temporal Vision Transformer</h4>
              </div>
              <p>3D spatiotemporal attention across multiple dates. Captures phenological change patterns.</p>
              <div className="arch-models">
                <span style={{ color: '#059669' }}>Prithvi</span>
                <span style={{ color: '#8b5cf6' }}>SatMAE</span>
              </div>
              <div className="arch-diagram">
                <svg viewBox="0 0 200 60" fill="none">
                  <rect x="5" y="5" width="25" height="25" rx="3" fill="#059669" opacity="0.2" stroke="#059669" />
                  <text x="17" y="20" textAnchor="middle" fill="#059669" fontSize="7">T1</text>
                  <rect x="15" y="15" width="25" height="25" rx="3" fill="#059669" opacity="0.3" stroke="#059669" />
                  <text x="27" y="30" textAnchor="middle" fill="#059669" fontSize="7">T2</text>
                  <rect x="25" y="25" width="25" height="25" rx="3" fill="#059669" opacity="0.4" stroke="#059669" />
                  <text x="37" y="40" textAnchor="middle" fill="#059669" fontSize="7">T3</text>
                  <path d="M55 30 L75 30" stroke="#059669" strokeWidth="1.5" />
                  <rect x="80" y="10" width="50" height="40" rx="4" fill="#059669" opacity="0.1" stroke="#059669" />
                  <text x="105" y="28" textAnchor="middle" fill="#059669" fontSize="7" fontFamily="monospace">3D</text>
                  <text x="105" y="38" textAnchor="middle" fill="#059669" fontSize="7" fontFamily="monospace">Attn</text>
                  <path d="M135 30 L155 30" stroke="#059669" strokeWidth="1.5" />
                  <rect x="160" y="15" width="35" height="30" rx="4" fill="#059669" opacity="0.15" stroke="#059669" />
                  <text x="177" y="34" textAnchor="middle" fill="#059669" fontSize="7" fontFamily="monospace">Emb</text>
                </svg>
              </div>
            </div>

            <div className="arch-card">
              <div className="arch-card-header">
                <span className="arch-card-icon">🔗</span>
                <h4>Multi-Modal Fusion</h4>
              </div>
              <p>Separate encoders for optical, SAR, and other modalities with cross-attention fusion.</p>
              <div className="arch-models">
                <span style={{ color: '#1a73e8' }}>AlphaEarth</span>
                <span style={{ color: '#0ea5e9' }}>SkySense</span>
                <span style={{ color: '#f59e0b' }}>CROMA</span>
              </div>
              <div className="arch-diagram">
                <svg viewBox="0 0 200 60" fill="none">
                  <rect x="5" y="5" width="30" height="20" rx="3" fill="#1a73e8" opacity="0.2" stroke="#1a73e8" />
                  <text x="20" y="18" textAnchor="middle" fill="#1a73e8" fontSize="7">Optical</text>
                  <rect x="5" y="35" width="30" height="20" rx="3" fill="#f59e0b" opacity="0.2" stroke="#f59e0b" />
                  <text x="20" y="48" textAnchor="middle" fill="#f59e0b" fontSize="7">SAR</text>
                  <path d="M40 15 L60 25" stroke="#1a73e8" strokeWidth="1" />
                  <path d="M40 45 L60 35" stroke="#f59e0b" strokeWidth="1" />
                  <circle cx="70" cy="30" r="10" fill="#6366f1" opacity="0.15" stroke="#6366f1" />
                  <text x="70" y="33" textAnchor="middle" fill="#6366f1" fontSize="6">×</text>
                  <path d="M82 30 L100 30" stroke="#6366f1" strokeWidth="1.5" />
                  <rect x="105" y="15" width="35" height="30" rx="4" fill="#6366f1" opacity="0.1" stroke="#6366f1" />
                  <text x="122" y="34" textAnchor="middle" fill="#6366f1" fontSize="7" fontFamily="monospace">Fused</text>
                  <path d="M145 30 L160 30" stroke="#6366f1" strokeWidth="1.5" />
                  <rect x="165" y="20" width="30" height="20" rx="3" fill="#6366f1" opacity="0.15" stroke="#6366f1" />
                  <text x="180" y="33" textAnchor="middle" fill="#6366f1" fontSize="6">64-d</text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
