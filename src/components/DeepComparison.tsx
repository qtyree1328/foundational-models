import { useState } from 'react';
import { models, Model, taskModelMatrix } from '../data/models';

// ─── Radar Chart (SVG) ───
function RadarChart({ model }: { model: Model }) {
  const dims = ['parameters', 'resolution', 'modalities', 'temporal', 'openness', 'benchmarks'] as const;
  const labels = ['Params', 'Resolution', 'Modalities', 'Temporal', 'Openness', 'Benchmarks'];
  const cx = 90, cy = 90, r = 70;
  const angleStep = (2 * Math.PI) / dims.length;

  const pointsForModel = (m: Model) =>
    dims.map((d, i) => {
      const val = m.scores[d] / 10;
      const angle = i * angleStep - Math.PI / 2;
      return { x: cx + r * val * Math.cos(angle), y: cy + r * val * Math.sin(angle) };
    });

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const pts = pointsForModel(model);
  const polygon = pts.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox="0 0 180 180" className="radar-svg">
      {/* Grid */}
      {gridLevels.map(level => (
        <polygon
          key={level}
          points={dims.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            return `${cx + r * level * Math.cos(angle)},${cy + r * level * Math.sin(angle)}`;
          }).join(' ')}
          fill="none"
          stroke="var(--border)"
          strokeWidth="0.5"
          opacity={0.6}
        />
      ))}
      {/* Axes */}
      {dims.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return (
          <line key={i} x1={cx} y1={cy}
            x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)}
            stroke="var(--border)" strokeWidth="0.5" opacity="0.4" />
        );
      })}
      {/* Data polygon */}
      <polygon points={polygon} fill={model.color} fillOpacity={0.15} stroke={model.color} strokeWidth="1.5" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={model.color} />
      ))}
      {/* Labels */}
      {dims.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const lx = cx + (r + 16) * Math.cos(angle);
        const ly = cy + (r + 16) * Math.sin(angle);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fill="var(--text-light)" fontSize="7" fontFamily="var(--font-body)">
            {labels[i]}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Radar Grid (all models) ───
function RadarGrid() {
  return (
    <div className="radar-grid">
      {models.map(m => (
        <div key={m.id} className="radar-card fade-in">
          <div className="radar-card-header">
            <span style={{ color: m.color }}>{m.icon}</span>
            <span className="radar-card-name">{m.name.split(' ')[0]}</span>
          </div>
          <RadarChart model={m} />
        </div>
      ))}
    </div>
  );
}

// ─── Specs Table ───
type SpecKey = 'params' | 'embDim' | 'patchSize' | 'resolution' | 'training' | 'license' | 'temporal' | 'pretraining';

const specRows: { key: SpecKey; label: string; extract: (m: Model) => string }[] = [
  { key: 'params', label: 'Parameters', extract: m => m.params },
  { key: 'embDim', label: 'Embedding Dim', extract: m => String(m.architecture.embeddingDim) },
  { key: 'patchSize', label: 'Patch Size', extract: m => m.architecture.patchSize ? String(m.architecture.patchSize) : '—' },
  { key: 'resolution', label: 'Resolution', extract: m => m.resolution },
  { key: 'training', label: 'Training Scale', extract: m => m.training.samples },
  { key: 'pretraining', label: 'Pre-training', extract: m => m.architecture.type },
  { key: 'temporal', label: 'Temporal', extract: m => m.temporal ? '✓ Yes' : '✗ No' },
  { key: 'license', label: 'License', extract: m => m.license },
];

function SpecsTable({ selectedIds }: { selectedIds: string[] }) {
  const display = selectedIds.length > 0
    ? models.filter(m => selectedIds.includes(m.id))
    : models;

  return (
    <div className="specs-table-wrap">
      <table className="specs-table">
        <thead>
          <tr>
            <th className="specs-label-col">Specification</th>
            {display.map(m => (
              <th key={m.id} style={{ borderBottom: `3px solid ${m.color}` }}>
                <span className="specs-model-icon">{m.icon}</span>
                <span className="specs-model-name">{m.name.split(' ')[0]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {specRows.map(row => (
            <tr key={row.key}>
              <td className="specs-label">{row.label}</td>
              {display.map(m => (
                <td key={m.id} className="specs-value">
                  <span className={row.key === 'temporal' && m.temporal ? 'temporal-yes' : row.key === 'temporal' ? 'temporal-no' : ''}>
                    {row.extract(m)}
                  </span>
                </td>
              ))}
            </tr>
          ))}
          {/* Sensors row */}
          <tr>
            <td className="specs-label">Sensors</td>
            {display.map(m => (
              <td key={m.id} className="specs-value">
                <div className="specs-sensors">
                  {m.training.sensors.slice(0, 3).map((s, i) => (
                    <span key={i} className="sensor-pill">{s}</span>
                  ))}
                  {m.training.sensors.length > 3 && (
                    <span className="sensor-pill more">+{m.training.sensors.length - 3}</span>
                  )}
                </div>
              </td>
            ))}
          </tr>
          {/* Open weights */}
          <tr>
            <td className="specs-label">Open Weights</td>
            {display.map(m => (
              <td key={m.id} className="specs-value">
                <span className={m.openWeights ? 'temporal-yes' : 'temporal-no'}>
                  {m.openWeights ? '✓ Available' : '✗ Closed'}
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Best-For Guide ───
function BestForGuide() {
  const [selectedTask, setSelectedTask] = useState('Crop Mapping');
  const tasks = Object.keys(taskModelMatrix);
  const matrix = taskModelMatrix[selectedTask];

  const getModel = (id: string) => models.find(m => m.id === id);

  return (
    <div className="best-for-section fade-in">
      <h3 className="deep-subtitle">Best Model for Your Task</h3>
      <p className="deep-subtitle-desc">Select a task to see which models are recommended and why.</p>
      <div className="task-pills">
        {tasks.map(t => (
          <button
            key={t}
            className={`task-pill ${selectedTask === t ? 'active' : ''}`}
            onClick={() => setSelectedTask(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="best-for-grid">
        <div className="best-for-col best">
          <div className="best-for-header">🏆 Best Choice</div>
          {matrix.best.map(id => {
            const m = getModel(id);
            if (!m) return null;
            return (
              <div key={id} className="best-for-card" style={{ borderLeft: `3px solid ${m.color}` }}>
                <span className="best-for-icon">{m.icon}</span>
                <div>
                  <strong>{m.name}</strong>
                  <p className="best-for-reason">{m.keyStrength}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="best-for-col good">
          <div className="best-for-header">👍 Good Option</div>
          {matrix.good.map(id => {
            const m = getModel(id);
            if (!m) return null;
            return (
              <div key={id} className="best-for-card" style={{ borderLeft: `3px solid ${m.color}` }}>
                <span className="best-for-icon">{m.icon}</span>
                <div>
                  <strong>{m.name}</strong>
                  <p className="best-for-reason">{m.keyStrength}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="best-for-col limited">
          <div className="best-for-header">⚠️ Limited Fit</div>
          {matrix.limited.map(id => {
            const m = getModel(id);
            if (!m) return null;
            return (
              <div key={id} className="best-for-card muted" style={{ borderLeft: `3px solid ${m.color}`, opacity: 0.6 }}>
                <span className="best-for-icon">{m.icon}</span>
                <div>
                  <strong>{m.name}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Training Data Viz ───
function TrainingDataViz() {
  const sensorColors: Record<string, string> = {
    'Sentinel-1': '#f59e0b',
    'Sentinel-2': '#059669',
    'Landsat': '#1a73e8',
    'Landsat 8/9': '#1a73e8',
    'NAIP': '#8b5cf6',
    'MODIS': '#ec4899',
    'GEDI LiDAR': '#6366f1',
    'SAR': '#f59e0b',
    'Optical': '#059669',
    'Hyperspectral': '#ec4899',
  };

  const getColor = (sensor: string) => {
    for (const [key, color] of Object.entries(sensorColors)) {
      if (sensor.toLowerCase().includes(key.toLowerCase())) return color;
    }
    return '#94a3b8';
  };

  return (
    <div className="training-viz fade-in">
      <h3 className="deep-subtitle">Training Data by Model</h3>
      <p className="deep-subtitle-desc">What each model was trained on — sensors, scale, and geographic coverage.</p>
      <div className="training-grid">
        {models.map(m => (
          <div key={m.id} className="training-card" style={{ '--tc': m.color } as React.CSSProperties}>
            <div className="training-card-head">
              <span>{m.icon}</span>
              <span className="training-card-name">{m.name.split(' ')[0]}</span>
            </div>
            <div className="training-card-scale">
              <span className="training-scale-label">Scale</span>
              <span className="training-scale-value">{m.training.samples}</span>
            </div>
            <div className="training-card-coverage">
              <span className="training-scale-label">Coverage</span>
              <span className="training-scale-value">{m.training.geoCoverage}</span>
            </div>
            {m.training.temporalRange && (
              <div className="training-card-temporal">
                <span className="training-scale-label">Period</span>
                <span className="training-scale-value">{m.training.temporalRange}</span>
              </div>
            )}
            <div className="training-sensors">
              {m.training.sensors.map((s, i) => (
                <span key={i} className="training-sensor-pill" style={{ background: getColor(s) + '18', color: getColor(s), borderColor: getColor(s) + '40' }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Architecture Comparison ───
function ArchitectureDiagrams() {
  const archs = [
    {
      name: 'Masked Autoencoder (MAE)',
      models: ['Clay', 'SatMAE', 'Prithvi'],
      colors: ['#e07a2f', '#8b5cf6', '#059669'],
      description: 'Mask 75% of image patches, train the ViT encoder to reconstruct them. Forces the model to learn global spatial relationships. Clay adds DINOv2 teacher loss; Prithvi extends to 3D spatiotemporal patches.',
      diagram: (
        <svg viewBox="0 0 340 80" fill="none" className="arch-diagram-svg">
          {/* Input image */}
          <rect x="5" y="10" width="60" height="60" rx="4" fill="#f1f0ec" stroke="#c4c0b8" />
          {[0,1,2,3].map(row => [0,1,2,3].map(col => {
            const masked = [1,2,5,6,8,9,11,12,13,14].includes(row*4+col);
            return (
              <rect key={`${row}-${col}`} x={10+col*13} y={15+row*13} width="11" height="11"
                fill={masked ? '#e8e6e0' : '#0d4f4f'} opacity={masked ? 0.4 : 0.5}
                stroke={masked ? '#ccc' : 'none'} strokeDasharray={masked ? '2' : '0'} rx="1" />
            );
          }))}
          <text x="35" y="78" textAnchor="middle" fill="var(--text-light)" fontSize="7" fontFamily="var(--font-body)">75% masked</text>
          {/* Arrow */}
          <path d="M70 40 L95 40" stroke="#0d4f4f" strokeWidth="1.5" markerEnd="url(#arrowDeep)" />
          {/* Encoder */}
          <rect x="100" y="15" width="55" height="50" rx="4" fill="#0d4f4f" opacity="0.1" stroke="#0d4f4f" />
          <text x="127" y="38" textAnchor="middle" fill="#0d4f4f" fontSize="8" fontFamily="var(--font-mono)">ViT</text>
          <text x="127" y="50" textAnchor="middle" fill="#0d4f4f" fontSize="6" fontFamily="var(--font-mono)">Encoder</text>
          {/* Arrow */}
          <path d="M160 40 L185 40" stroke="#0d4f4f" strokeWidth="1.5" markerEnd="url(#arrowDeep)" />
          {/* Latent */}
          <rect x="190" y="20" width="40" height="40" rx="20" fill="#059669" opacity="0.12" stroke="#059669" />
          <text x="210" y="44" textAnchor="middle" fill="#059669" fontSize="7" fontFamily="var(--font-mono)">z</text>
          {/* Arrow */}
          <path d="M235 40 L255 40" stroke="#0d4f4f" strokeWidth="1.5" markerEnd="url(#arrowDeep)" />
          {/* Decoder */}
          <rect x="260" y="15" width="40" height="50" rx="4" fill="#8b5cf6" opacity="0.1" stroke="#8b5cf6" />
          <text x="280" y="38" textAnchor="middle" fill="#8b5cf6" fontSize="7" fontFamily="var(--font-mono)">Decoder</text>
          <text x="280" y="48" textAnchor="middle" fill="#8b5cf6" fontSize="6" fontFamily="var(--font-mono)">Reconstruct</text>
          <defs>
            <marker id="arrowDeep" viewBox="0 0 6 6" refX="6" refY="3" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0 0L6 3L0 6z" fill="#0d4f4f" />
            </marker>
          </defs>
        </svg>
      ),
    },
    {
      name: 'Cross-Modal Contrastive + MAE',
      models: ['CROMA', 'SkySense'],
      colors: ['#f59e0b', '#0ea5e9'],
      description: 'Separate encoders for SAR and optical data learn modality-specific features. A contrastive objective aligns representations in shared space, while MAE reconstructs each modality. CROMA uses dual ViTs; SkySense adds a third ViT-G encoder.',
      diagram: (
        <svg viewBox="0 0 340 100" fill="none" className="arch-diagram-svg">
          {/* SAR input */}
          <rect x="5" y="5" width="40" height="30" rx="3" fill="#f59e0b" opacity="0.15" stroke="#f59e0b" />
          <text x="25" y="23" textAnchor="middle" fill="#f59e0b" fontSize="7" fontWeight="600">SAR</text>
          {/* Optical input */}
          <rect x="5" y="50" width="40" height="30" rx="3" fill="#059669" opacity="0.15" stroke="#059669" />
          <text x="25" y="68" textAnchor="middle" fill="#059669" fontSize="7" fontWeight="600">Optical</text>
          {/* SAR encoder */}
          <path d="M48 20 L75 20" stroke="#f59e0b" strokeWidth="1" />
          <rect x="78" y="5" width="50" height="30" rx="4" fill="#f59e0b" opacity="0.08" stroke="#f59e0b" />
          <text x="103" y="23" textAnchor="middle" fill="#f59e0b" fontSize="7" fontFamily="var(--font-mono)">ViT SAR</text>
          {/* Optical encoder */}
          <path d="M48 65 L75 65" stroke="#059669" strokeWidth="1" />
          <rect x="78" y="50" width="50" height="30" rx="4" fill="#059669" opacity="0.08" stroke="#059669" />
          <text x="103" y="68" textAnchor="middle" fill="#059669" fontSize="7" fontFamily="var(--font-mono)">ViT Opt</text>
          {/* Contrastive */}
          <path d="M131 20 L155 40" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3" />
          <path d="M131 65 L155 45" stroke="#059669" strokeWidth="1" strokeDasharray="3" />
          <circle cx="165" cy="42" r="15" fill="#6366f1" opacity="0.1" stroke="#6366f1" />
          <text x="165" y="40" textAnchor="middle" fill="#6366f1" fontSize="6" fontFamily="var(--font-mono)">Contra-</text>
          <text x="165" y="48" textAnchor="middle" fill="#6366f1" fontSize="6" fontFamily="var(--font-mono)">stive</text>
          {/* Fusion */}
          <path d="M182 42 L210 42" stroke="#6366f1" strokeWidth="1.5" markerEnd="url(#arrowDeep)" />
          <rect x="215" y="25" width="55" height="34" rx="4" fill="#6366f1" opacity="0.1" stroke="#6366f1" />
          <text x="242" y="40" textAnchor="middle" fill="#6366f1" fontSize="7" fontFamily="var(--font-mono)">Multimodal</text>
          <text x="242" y="50" textAnchor="middle" fill="#6366f1" fontSize="7" fontFamily="var(--font-mono)">Encoder</text>
          {/* Output */}
          <path d="M273 42 L295 42" stroke="#6366f1" strokeWidth="1.5" markerEnd="url(#arrowDeep)" />
          <rect x="298" y="28" width="35" height="28" rx="14" fill="#6366f1" opacity="0.12" stroke="#6366f1" />
          <text x="315" y="45" textAnchor="middle" fill="#6366f1" fontSize="7" fontFamily="var(--font-mono)">Fused</text>
          {/* Label */}
          <text x="165" y="95" textAnchor="middle" fill="var(--text-light)" fontSize="7">Aligned embedding space</text>
        </svg>
      ),
    },
    {
      name: 'Wavelength-Conditioned Hypernetwork',
      models: ['DOFA'],
      colors: ['#6366f1'],
      description: 'A hypernetwork takes band wavelengths as input and dynamically generates the patch embedding weights. This means a single ViT can process any sensor — Sentinel-2 (13 bands), Landsat (7 bands), NAIP (4 bands), or even SAR — without retraining.',
      diagram: (
        <svg viewBox="0 0 340 80" fill="none" className="arch-diagram-svg">
          {/* Wavelengths */}
          <rect x="5" y="10" width="55" height="25" rx="3" fill="#6366f1" opacity="0.1" stroke="#6366f1" />
          <text x="32" y="18" textAnchor="middle" fill="#6366f1" fontSize="6" fontFamily="var(--font-mono)">λ: 443,490,</text>
          <text x="32" y="28" textAnchor="middle" fill="#6366f1" fontSize="6" fontFamily="var(--font-mono)">560,665nm</text>
          {/* Input patches */}
          <rect x="5" y="45" width="55" height="25" rx="3" fill="#059669" opacity="0.1" stroke="#059669" />
          <text x="32" y="60" textAnchor="middle" fill="#059669" fontSize="7" fontFamily="var(--font-mono)">Any Bands</text>
          {/* Hypernetwork */}
          <path d="M63 22 L95 35" stroke="#6366f1" strokeWidth="1" />
          <path d="M63 57 L95 45" stroke="#059669" strokeWidth="1" />
          <rect x="98" y="20" width="60" height="40" rx="4" fill="#6366f1" opacity="0.08" stroke="#6366f1" strokeDasharray="4" />
          <text x="128" y="37" textAnchor="middle" fill="#6366f1" fontSize="7" fontFamily="var(--font-mono)" fontWeight="600">Hyper</text>
          <text x="128" y="48" textAnchor="middle" fill="#6366f1" fontSize="7" fontFamily="var(--font-mono)" fontWeight="600">Network</text>
          {/* Dynamic weights arrow */}
          <path d="M161 40 L185 40" stroke="#6366f1" strokeWidth="1.5" markerEnd="url(#arrowDeep)" />
          <text x="173" y="35" textAnchor="middle" fill="#6366f1" fontSize="5" fontFamily="var(--font-mono)">W(λ)</text>
          {/* ViT */}
          <rect x="190" y="15" width="60" height="50" rx="4" fill="#0d4f4f" opacity="0.1" stroke="#0d4f4f" />
          <text x="220" y="38" textAnchor="middle" fill="#0d4f4f" fontSize="8" fontFamily="var(--font-mono)">Shared</text>
          <text x="220" y="50" textAnchor="middle" fill="#0d4f4f" fontSize="8" fontFamily="var(--font-mono)">ViT</text>
          {/* Output */}
          <path d="M255 40 L280 40" stroke="#0d4f4f" strokeWidth="1.5" markerEnd="url(#arrowDeep)" />
          <rect x="285" y="22" width="45" height="36" rx="18" fill="#0d4f4f" opacity="0.1" stroke="#0d4f4f" />
          <text x="307" y="44" textAnchor="middle" fill="#0d4f4f" fontSize="7" fontFamily="var(--font-mono)">Emb</text>
        </svg>
      ),
    },
    {
      name: 'Embedding Field (Multi-Source Assimilation)',
      models: ['AlphaEarth'],
      colors: ['#1a73e8'],
      description: 'Not a standard ViT — a custom architecture that assimilates spatial, temporal, and measurement contexts from diverse sources (SAR, optical, LiDAR, climate) into unit-length 64-dimensional vectors on a hypersphere. Produces global annual composites.',
      diagram: (
        <svg viewBox="0 0 340 80" fill="none" className="arch-diagram-svg">
          {/* Multiple sources */}
          <rect x="5" y="5" width="35" height="18" rx="2" fill="#059669" opacity="0.15" stroke="#059669" />
          <text x="22" y="17" textAnchor="middle" fill="#059669" fontSize="6">S2 MSI</text>
          <rect x="5" y="28" width="35" height="18" rx="2" fill="#f59e0b" opacity="0.15" stroke="#f59e0b" />
          <text x="22" y="40" textAnchor="middle" fill="#f59e0b" fontSize="6">S1 SAR</text>
          <rect x="5" y="51" width="35" height="18" rx="2" fill="#8b5cf6" opacity="0.15" stroke="#8b5cf6" />
          <text x="22" y="63" textAnchor="middle" fill="#8b5cf6" fontSize="6">LiDAR</text>
          <rect x="45" y="5" width="35" height="18" rx="2" fill="#1a73e8" opacity="0.15" stroke="#1a73e8" />
          <text x="62" y="17" textAnchor="middle" fill="#1a73e8" fontSize="6">Landsat</text>
          <rect x="45" y="28" width="35" height="18" rx="2" fill="#ec4899" opacity="0.15" stroke="#ec4899" />
          <text x="62" y="40" textAnchor="middle" fill="#ec4899" fontSize="6">Climate</text>
          <rect x="45" y="51" width="35" height="18" rx="2" fill="#6366f1" opacity="0.15" stroke="#6366f1" />
          <text x="62" y="63" textAnchor="middle" fill="#6366f1" fontSize="5">NLCD/CDL</text>
          {/* Arrow */}
          <path d="M85 38 L110 38" stroke="#1a73e8" strokeWidth="1.5" markerEnd="url(#arrowDeep)" />
          {/* Assimilation */}
          <rect x="115" y="10" width="80" height="55" rx="4" fill="#1a73e8" opacity="0.08" stroke="#1a73e8" />
          <text x="155" y="30" textAnchor="middle" fill="#1a73e8" fontSize="7" fontFamily="var(--font-mono)" fontWeight="600">Multi-Source</text>
          <text x="155" y="42" textAnchor="middle" fill="#1a73e8" fontSize="7" fontFamily="var(--font-mono)" fontWeight="600">Assimilation</text>
          <text x="155" y="55" textAnchor="middle" fill="#1a73e8" fontSize="6" fontFamily="var(--font-mono)">Temporal Fusion</text>
          {/* Arrow */}
          <path d="M200 38 L225 38" stroke="#1a73e8" strokeWidth="1.5" markerEnd="url(#arrowDeep)" />
          {/* Unit sphere */}
          <circle cx="260" cy="38" r="25" fill="#1a73e8" opacity="0.08" stroke="#1a73e8" />
          <text x="260" y="34" textAnchor="middle" fill="#1a73e8" fontSize="7" fontFamily="var(--font-mono)" fontWeight="600">64D</text>
          <text x="260" y="44" textAnchor="middle" fill="#1a73e8" fontSize="6" fontFamily="var(--font-mono)">unit sphere</text>
          {/* Output label */}
          <text x="315" y="35" textAnchor="start" fill="var(--text-light)" fontSize="6" fontFamily="var(--font-mono)">A00–</text>
          <text x="315" y="45" textAnchor="start" fill="var(--text-light)" fontSize="6" fontFamily="var(--font-mono)">A63</text>
        </svg>
      ),
    },
  ];

  return (
    <div className="arch-diagrams-section fade-in">
      <h3 className="deep-subtitle">Pre-training Architectures Compared</h3>
      <p className="deep-subtitle-desc">Four distinct approaches to learning from Earth observation data.</p>
      <div className="arch-diagrams-grid">
        {archs.map((a, i) => (
          <div key={i} className="arch-diagram-card">
            <div className="arch-diagram-header">
              <h4>{a.name}</h4>
              <div className="arch-diagram-models">
                {a.models.map((name, j) => (
                  <span key={j} className="arch-model-tag" style={{ color: a.colors[j], background: a.colors[j] + '12', borderColor: a.colors[j] + '30' }}>{name}</span>
                ))}
              </div>
            </div>
            <div className="arch-diagram-visual">{a.diagram}</div>
            <p className="arch-diagram-desc">{a.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───
export default function DeepComparison() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'specs' | 'radar' | 'tasks' | 'training' | 'arch'>('specs');

  const toggleModel = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const tabs = [
    { id: 'specs' as const, label: 'Specifications', icon: '📊' },
    { id: 'radar' as const, label: 'Radar Profiles', icon: '🕸️' },
    { id: 'tasks' as const, label: 'Best For', icon: '🎯' },
    { id: 'training' as const, label: 'Training Data', icon: '🗄️' },
    { id: 'arch' as const, label: 'Architectures', icon: '🏗️' },
  ];

  return (
    <section className="section deep-comparison-section" data-section="deep-compare">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">Deep Dive</span>
          <h2>Model Comparison</h2>
          <p className="section-subtitle">
            Every architecture detail, training specification, and benchmark result — verified from published papers.
            Compare how each LEOM generates geo-embeddings and which dimensions matter for your use case.
          </p>
        </div>

        {/* Model filter pills */}
        <div className="deep-filter-bar fade-in">
          {models.map(m => (
            <button key={m.id}
              className={`deep-filter-pill ${selectedIds.includes(m.id) ? 'active' : ''}`}
              onClick={() => toggleModel(m.id)}
              style={{ '--fc': m.color } as React.CSSProperties}
            >
              {m.icon} {m.name.split(' ')[0]}
            </button>
          ))}
          {selectedIds.length > 0 && (
            <button className="deep-filter-pill clear" onClick={() => setSelectedIds([])}>Clear</button>
          )}
        </div>

        {/* Tab switcher */}
        <div className="deep-tabs fade-in">
          {tabs.map(t => (
            <button key={t.id}
              className={`deep-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="deep-tab-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="deep-tab-content">
          {activeTab === 'specs' && <SpecsTable selectedIds={selectedIds} />}
          {activeTab === 'radar' && <RadarGrid />}
          {activeTab === 'tasks' && <BestForGuide />}
          {activeTab === 'training' && <TrainingDataViz />}
          {activeTab === 'arch' && <ArchitectureDiagrams />}
        </div>
      </div>
    </section>
  );
}
