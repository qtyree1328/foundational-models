import React, { useState, useMemo } from 'react';
import { models, Model } from '../data/models';

// ─── Types ───
interface UserNeeds {
  taskType: string;
  dataTypes: string[];
  resolution: string;
  license: string;
  compute: string;
}

interface Recommendation {
  model: Model;
  score: number;
  maxScore: number;
  reasons: string[];
  warnings: string[];
}

// ─── Options ───
const TASK_TYPES = [
  { id: 'classification', label: 'Classification', icon: '🏷️', desc: 'Land cover, scene type, crop ID' },
  { id: 'segmentation', label: 'Segmentation', icon: '🗺️', desc: 'Pixel-level class maps' },
  { id: 'change_detection', label: 'Change Detection', icon: '🔄', desc: 'Before/after comparison' },
  { id: 'similarity', label: 'Similarity Search', icon: '🔍', desc: 'Find similar locations' },
  { id: 'regression', label: 'Regression', icon: '📈', desc: 'Continuous values (biomass, flux)' },
  { id: 'object_detection', label: 'Object Detection', icon: '📦', desc: 'Buildings, ships, vehicles' },
];

const DATA_TYPES = [
  { id: 'optical', label: 'Optical (RGB/MS)', icon: '🌅' },
  { id: 'sar', label: 'SAR (Radar)', icon: '📡' },
  { id: 'hyperspectral', label: 'Hyperspectral', icon: '🌈' },
  { id: 'multitemporal', label: 'Multi-temporal', icon: '📅' },
  { id: 'lidar', label: 'LiDAR / Elevation', icon: '🏔️' },
];

const RESOLUTIONS = [
  { id: 'sub1m', label: '<1m', desc: 'VHR (aerial, drone)' },
  { id: '1to10m', label: '1–10m', desc: 'Sentinel-2, NAIP' },
  { id: '10to30m', label: '10–30m', desc: 'HLS, Landsat' },
  { id: 'gt30m', label: '>30m', desc: 'MODIS, coarse' },
];

const LICENSES = [
  { id: 'open', label: 'Must be open source', icon: '🔓' },
  { id: 'any', label: 'Any (including proprietary)', icon: '🔑' },
];

const COMPUTE = [
  { id: 'low', label: 'Low (laptop/CPU)', icon: '💻' },
  { id: 'medium', label: 'Medium (single GPU)', icon: '🖥️' },
  { id: 'high', label: 'High (multi-GPU/cluster)', icon: '🏢' },
];

// ─── Scoring Engine ───
function scoreModel(model: Model, needs: UserNeeds): Recommendation {
  let score = 0;
  let maxScore = 0;
  const reasons: string[] = [];
  const warnings: string[] = [];

  // Task type scoring (weight: 3)
  maxScore += 3;
  const taskScores: Record<string, Record<string, number>> = {
    classification: { alphaearth: 3, clay: 3, prithvi: 3, satmae: 3, dofa: 2, skysense: 3, spectralgpt: 2, croma: 2 },
    segmentation: { prithvi: 3, clay: 3, skysense: 3, alphaearth: 1, satmae: 2, dofa: 2, spectralgpt: 2, croma: 2 },
    change_detection: { prithvi: 3, alphaearth: 3, skysense: 3, clay: 2, satmae: 2, croma: 1, dofa: 1, spectralgpt: 1 },
    similarity: { alphaearth: 3, clay: 3, croma: 3, dofa: 1, prithvi: 1, satmae: 1, skysense: 1, spectralgpt: 1 },
    regression: { prithvi: 3, clay: 2, alphaearth: 2, skysense: 2, satmae: 1, dofa: 1, croma: 1, spectralgpt: 1 },
    object_detection: { skysense: 3, clay: 2, dofa: 2, prithvi: 1, alphaearth: 1, satmae: 1, croma: 1, spectralgpt: 1 },
  };
  const ts = taskScores[needs.taskType]?.[model.id] || 0;
  score += ts;
  if (ts >= 3) reasons.push(`Top-tier for ${TASK_TYPES.find(t => t.id === needs.taskType)?.label}`);
  else if (ts >= 2) reasons.push(`Good for ${TASK_TYPES.find(t => t.id === needs.taskType)?.label}`);
  else if (ts <= 1) warnings.push(`Limited ${TASK_TYPES.find(t => t.id === needs.taskType)?.label} capability`);

  // Data type scoring (weight: 2 each)
  needs.dataTypes.forEach(dt => {
    maxScore += 2;
    const dataScores: Record<string, Record<string, number>> = {
      optical: { alphaearth: 2, clay: 2, prithvi: 2, satmae: 2, skysense: 2, croma: 2, dofa: 2, spectralgpt: 1 },
      sar: { croma: 2, alphaearth: 2, skysense: 2, clay: 2, dofa: 2, prithvi: 0, satmae: 0, spectralgpt: 0 },
      hyperspectral: { spectralgpt: 2, dofa: 1, clay: 1, alphaearth: 0, prithvi: 0, satmae: 0, skysense: 0, croma: 0 },
      multitemporal: { prithvi: 2, alphaearth: 2, skysense: 2, satmae: 2, clay: 1, dofa: 1, croma: 0, spectralgpt: 0 },
      lidar: { alphaearth: 2, dofa: 1, clay: 0, prithvi: 0, satmae: 0, skysense: 0, croma: 0, spectralgpt: 0 },
    };
    const ds = dataScores[dt]?.[model.id] || 0;
    score += ds;
    const dtLabel = DATA_TYPES.find(d => d.id === dt)?.label || dt;
    if (ds >= 2) reasons.push(`Native ${dtLabel} support`);
    else if (ds === 0) warnings.push(`No ${dtLabel} support`);
  });

  // Resolution scoring (weight: 2)
  maxScore += 2;
  const resScores: Record<string, Record<string, number>> = {
    sub1m: { skysense: 2, clay: 1, dofa: 1, alphaearth: 0, prithvi: 0, satmae: 1, croma: 0, spectralgpt: 1 },
    '1to10m': { alphaearth: 2, clay: 2, dofa: 2, croma: 1, satmae: 2, skysense: 2, prithvi: 1, spectralgpt: 1 },
    '10to30m': { prithvi: 2, alphaearth: 2, clay: 2, satmae: 2, dofa: 2, skysense: 2, croma: 2, spectralgpt: 2 },
    gt30m: { alphaearth: 1, clay: 2, prithvi: 2, dofa: 2, satmae: 1, skysense: 1, croma: 1, spectralgpt: 1 },
  };
  const rs = resScores[needs.resolution]?.[model.id] || 0;
  score += rs;
  if (rs >= 2) reasons.push(`Good at ${RESOLUTIONS.find(r => r.id === needs.resolution)?.label} resolution`);
  else if (rs === 0) warnings.push(`Not designed for ${RESOLUTIONS.find(r => r.id === needs.resolution)?.label} resolution`);

  // License scoring (weight: 2)
  maxScore += 2;
  if (needs.license === 'open') {
    if (model.openWeights) {
      score += 2;
      reasons.push(`Open source (${model.license})`);
    } else {
      warnings.push('Closed/proprietary model — no downloadable weights');
    }
  } else {
    score += 2; // Any license is fine
  }

  // Compute scoring (weight: 2)
  maxScore += 2;
  const computeScores: Record<string, Record<string, number>> = {
    low: { dofa: 2, croma: 2, satmae: 1, prithvi: 1, clay: 0, alphaearth: 2, skysense: 0, spectralgpt: 0 },
    medium: { dofa: 2, croma: 2, satmae: 2, prithvi: 2, clay: 1, alphaearth: 2, skysense: 0, spectralgpt: 1 },
    high: { skysense: 2, clay: 2, prithvi: 2, satmae: 2, dofa: 2, croma: 2, alphaearth: 2, spectralgpt: 2 },
  };
  const cs = computeScores[needs.compute]?.[model.id] || 0;
  score += cs;
  if (cs === 0) warnings.push('Requires more compute than your budget');
  if (model.id === 'alphaearth' && needs.license === 'open') {
    // Special: AlphaEarth is accessed via GEE, no local compute needed, but not open
  } else if (model.id === 'alphaearth') {
    reasons.push('Pre-computed embeddings — no local GPU needed (GEE)');
  }

  return { model, score, maxScore, reasons, warnings };
}

// ─── Components ───
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="rec-steps">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`rec-step ${i < current ? 'done' : ''} ${i === current ? 'active' : ''}`}>
          <div className="rec-step-dot">{i < current ? '✓' : i + 1}</div>
          <span className="rec-step-label">
            {['Task', 'Data', 'Resolution', 'License', 'Compute'][i]}
          </span>
        </div>
      ))}
    </div>
  );
}

function OptionCard({ selected, onClick, icon, label, desc }: {
  selected: boolean; onClick: () => void; icon: string; label: string; desc?: string;
}) {
  return (
    <button className={`rec-option ${selected ? 'selected' : ''}`} onClick={onClick}>
      <span className="rec-option-icon">{icon}</span>
      <span className="rec-option-label">{label}</span>
      {desc && <span className="rec-option-desc">{desc}</span>}
    </button>
  );
}

function ResultCard({ rec, rank }: { rec: Recommendation; rank: number }) {
  const pct = Math.round((rec.score / rec.maxScore) * 100);
  const grade = pct >= 80 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D';
  const gradeColor = pct >= 80 ? '#059669' : pct >= 60 ? '#f59e0b' : pct >= 40 ? '#f97316' : '#ef4444';

  return (
    <div className={`rec-result-card ${rank === 0 ? 'top' : ''}`}
      style={{ '--rc': rec.model.color } as React.CSSProperties}
    >
      <div className="rec-result-header">
        <div className="rec-result-rank" style={{ background: rank === 0 ? '#059669' : rank === 1 ? '#f59e0b' : rank === 2 ? '#f97316' : 'var(--text-muted)' }}>
          #{rank + 1}
        </div>
        <div className="rec-result-model">
          <span className="rec-result-icon">{rec.model.icon}</span>
          <div>
            <h4>{rec.model.name}</h4>
            <span className="rec-result-org">{rec.model.org}</span>
          </div>
        </div>
        <div className="rec-result-score">
          <span className="rec-score-grade" style={{ color: gradeColor }}>{grade}</span>
          <span className="rec-score-pct">{pct}% match</span>
        </div>
      </div>

      <div className="rec-result-bar">
        <div className="rec-result-bar-fill" style={{ width: `${pct}%`, background: rec.model.color }} />
      </div>

      {rec.reasons.length > 0 && (
        <div className="rec-result-reasons">
          {rec.reasons.map((r, i) => (
            <span key={i} className="rec-reason good">✓ {r}</span>
          ))}
        </div>
      )}
      {rec.warnings.length > 0 && (
        <div className="rec-result-warnings">
          {rec.warnings.map((w, i) => (
            <span key={i} className="rec-reason warn">⚠ {w}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───
export default function ModelRecommender() {
  const [step, setStep] = useState(0);
  const [needs, setNeeds] = useState<UserNeeds>({
    taskType: '',
    dataTypes: [],
    resolution: '',
    license: '',
    compute: '',
  });
  const [showResults, setShowResults] = useState(false);

  const toggleDataType = (dt: string) => {
    setNeeds(prev => ({
      ...prev,
      dataTypes: prev.dataTypes.includes(dt)
        ? prev.dataTypes.filter(d => d !== dt)
        : [...prev.dataTypes, dt],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return needs.taskType !== '';
      case 1: return needs.dataTypes.length > 0;
      case 2: return needs.resolution !== '';
      case 3: return needs.license !== '';
      case 4: return needs.compute !== '';
      default: return false;
    }
  };

  const recommendations = useMemo(() => {
    if (!showResults) return [];
    return models
      .map(m => scoreModel(m, needs))
      .sort((a, b) => b.score - a.score);
  }, [showResults, needs]);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else {
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (showResults) {
      setShowResults(false);
    } else if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleReset = () => {
    setStep(0);
    setNeeds({ taskType: '', dataTypes: [], resolution: '', license: '', compute: '' });
    setShowResults(false);
  };

  return (
    <section className="section recommender-section" data-section="recommender">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">Interactive Tool</span>
          <h2>Model Recommender</h2>
          <p className="section-subtitle">
            Answer five questions about your project and get ranked model recommendations
            based on verified capabilities, data compatibility, and practical constraints.
          </p>
        </div>

        <div className="rec-wizard fade-in">
          {!showResults ? (
            <>
              <StepIndicator current={step} total={5} />

              <div className="rec-content">
                {step === 0 && (
                  <div className="rec-step-content">
                    <h3 className="rec-question">What task are you solving?</h3>
                    <div className="rec-options-grid">
                      {TASK_TYPES.map(t => (
                        <OptionCard key={t.id}
                          selected={needs.taskType === t.id}
                          onClick={() => setNeeds({ ...needs, taskType: t.id })}
                          icon={t.icon} label={t.label} desc={t.desc}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="rec-step-content">
                    <h3 className="rec-question">What data do you have? <span className="rec-multi">(select all)</span></h3>
                    <div className="rec-options-grid">
                      {DATA_TYPES.map(d => (
                        <OptionCard key={d.id}
                          selected={needs.dataTypes.includes(d.id)}
                          onClick={() => toggleDataType(d.id)}
                          icon={d.icon} label={d.label}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="rec-step-content">
                    <h3 className="rec-question">What spatial resolution?</h3>
                    <div className="rec-options-grid">
                      {RESOLUTIONS.map(r => (
                        <OptionCard key={r.id}
                          selected={needs.resolution === r.id}
                          onClick={() => setNeeds({ ...needs, resolution: r.id })}
                          icon="📐" label={r.label} desc={r.desc}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="rec-step-content">
                    <h3 className="rec-question">License requirements?</h3>
                    <div className="rec-options-grid wide">
                      {LICENSES.map(l => (
                        <OptionCard key={l.id}
                          selected={needs.license === l.id}
                          onClick={() => setNeeds({ ...needs, license: l.id })}
                          icon={l.icon} label={l.label}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="rec-step-content">
                    <h3 className="rec-question">Compute budget?</h3>
                    <div className="rec-options-grid">
                      {COMPUTE.map(c => (
                        <OptionCard key={c.id}
                          selected={needs.compute === c.id}
                          onClick={() => setNeeds({ ...needs, compute: c.id })}
                          icon={c.icon} label={c.label}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rec-actions">
                {step > 0 && (
                  <button className="rec-btn back" onClick={handleBack}>← Back</button>
                )}
                <button
                  className="rec-btn next"
                  disabled={!canProceed()}
                  onClick={handleNext}
                >
                  {step === 4 ? 'Get Recommendations →' : 'Next →'}
                </button>
              </div>
            </>
          ) : (
            <div className="rec-results">
              <div className="rec-results-header">
                <h3>Your Recommendations</h3>
                <div className="rec-results-actions">
                  <button className="rec-btn back" onClick={handleBack}>← Adjust</button>
                  <button className="rec-btn reset" onClick={handleReset}>Start Over</button>
                </div>
              </div>

              <div className="rec-summary">
                <span className="rec-summary-item">🎯 {TASK_TYPES.find(t => t.id === needs.taskType)?.label}</span>
                {needs.dataTypes.map(dt => (
                  <span key={dt} className="rec-summary-item">{DATA_TYPES.find(d => d.id === dt)?.icon} {DATA_TYPES.find(d => d.id === dt)?.label}</span>
                ))}
                <span className="rec-summary-item">📐 {RESOLUTIONS.find(r => r.id === needs.resolution)?.label}</span>
                <span className="rec-summary-item">{needs.license === 'open' ? '🔓 Open source' : '🔑 Any license'}</span>
                <span className="rec-summary-item">{COMPUTE.find(c => c.id === needs.compute)?.icon} {COMPUTE.find(c => c.id === needs.compute)?.label}</span>
              </div>

              <div className="rec-results-list">
                {recommendations.map((rec, i) => (
                  <ResultCard key={rec.model.id} rec={rec} rank={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
