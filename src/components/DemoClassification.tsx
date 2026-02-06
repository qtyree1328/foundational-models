import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════
// Synthetic AlphaEarth Embedding Data (64D unit vectors on S⁶³)
// ═══════════════════════════════════════════════════════════════

interface EmbeddingPoint {
  id: number;
  embedding: number[];
  label: string;
  color: string;
}

const LAND_COVER_CLASSES = [
  { label: 'Cropland', color: '#eab308', count: 60 },
  { label: 'Forest', color: '#16a34a', count: 60 },
  { label: 'Water', color: '#0ea5e9', count: 50 },
  { label: 'Urban', color: '#6366f1', count: 50 },
  { label: 'Wetland', color: '#059669', count: 40 },
  { label: 'Bare Soil', color: '#c67b2e', count: 40 },
] as const;

// Seeded PRNG for reproducibility
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate cluster centers on 64D hypersphere
// Based on known spectral/structural properties of AlphaEarth embeddings:
// - Vegetation types share "greenness" axes (dims 0-10)
// - Water has distinct negative signature on vegetation axes
// - Urban/Bare Soil cluster in "built/dry" subspace
function generateClusterCenters(rng: () => number): Record<string, number[]> {
  const DIM = 64;

  // Define interpretable base directions for first ~20 dims
  // Remaining dims are random but stable per class
  const centers: Record<string, number[]> = {};

  // Vegetation axes: dims 0-9 positive for green classes
  // Moisture axes: dims 10-19
  // Structure/texture axes: dims 20-29
  // Other: dims 30-63

  const templates: Record<string, { veg: number; water: number; structure: number; thermal: number }> = {
    'Forest': { veg: 0.8, water: 0.2, structure: 0.6, thermal: -0.1 },
    'Cropland': { veg: 0.6, water: 0.1, structure: -0.2, thermal: 0.1 },
    'Wetland': { veg: 0.4, water: 0.5, structure: 0.1, thermal: 0.0 },
    'Water': { veg: -0.6, water: 0.8, structure: -0.4, thermal: -0.3 },
    'Urban': { veg: -0.5, water: -0.3, structure: 0.7, thermal: 0.5 },
    'Bare Soil': { veg: -0.4, water: -0.5, structure: -0.3, thermal: 0.6 },
  };

  for (const [label, t] of Object.entries(templates)) {
    const vec: number[] = new Array(DIM);
    for (let d = 0; d < DIM; d++) {
      if (d < 8) {
        // Vegetation-correlated axes
        vec[d] = t.veg + (rng() - 0.5) * 0.3;
      } else if (d < 16) {
        // Moisture-correlated axes
        vec[d] = t.water + (rng() - 0.5) * 0.3;
      } else if (d < 24) {
        // Structure/texture axes
        vec[d] = t.structure + (rng() - 0.5) * 0.3;
      } else if (d < 32) {
        // Thermal/brightness axes
        vec[d] = t.thermal + (rng() - 0.5) * 0.3;
      } else {
        // Higher-order features (less interpretable)
        vec[d] = (rng() - 0.5) * 0.4;
      }
    }
    // Normalize to unit sphere
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    centers[label] = vec.map(v => v / norm);
  }

  return centers;
}

function generateDataset(): EmbeddingPoint[] {
  const rng = mulberry32(42);
  const centers = generateClusterCenters(rng);
  const points: EmbeddingPoint[] = [];
  let id = 0;

  for (const cls of LAND_COVER_CLASSES) {
    const center = centers[cls.label];
    for (let i = 0; i < cls.count; i++) {
      const embedding = new Array(64);
      for (let d = 0; d < 64; d++) {
        // Add noise around center — von Mises-Fisher-like distribution
        const noise = (rng() - 0.5) * 0.4 + (rng() - 0.5) * 0.2;
        embedding[d] = center[d] + noise;
      }
      // Normalize to unit sphere
      const norm = Math.sqrt(embedding.reduce((s: number, v: number) => s + v * v, 0));
      for (let d = 0; d < 64; d++) embedding[d] /= norm;

      points.push({ id: id++, embedding, label: cls.label, color: cls.color });
    }
  }

  return points;
}

// ═══════════════════════════════════════════════════════════════
// Math Utilities (all client-side, no deps)
// ═══════════════════════════════════════════════════════════════

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
}

// PCA via power iteration
function computePCA2D(data: number[][]): { x: number[]; y: number[]; explained: [number, number] } {
  const n = data.length;
  const dims = data[0].length;

  // Center
  const mean = new Array(dims).fill(0);
  for (const row of data) for (let d = 0; d < dims; d++) mean[d] += row[d];
  for (let d = 0; d < dims; d++) mean[d] /= n;
  const centered = data.map(row => row.map((v, d) => v - mean[d]));

  // Covariance (only compute dot products we need via power iteration)
  const getComponent = (prevComp?: number[]): { vec: number[]; eigenval: number } => {
    let vec = new Array(dims);
    const rng = mulberry32(123);
    for (let d = 0; d < dims; d++) vec[d] = rng() - 0.5;

    for (let iter = 0; iter < 50; iter++) {
      // Multiply by X^T X
      const newVec = new Array(dims).fill(0);
      for (const row of centered) {
        let dot = 0;
        for (let d = 0; d < dims; d++) dot += row[d] * vec[d];
        for (let d = 0; d < dims; d++) newVec[d] += row[d] * dot;
      }

      // Deflate if needed
      if (prevComp) {
        let dot = 0;
        for (let d = 0; d < dims; d++) dot += newVec[d] * prevComp[d];
        for (let d = 0; d < dims; d++) newVec[d] -= dot * prevComp[d];
      }

      // Normalize
      let norm = 0;
      for (let d = 0; d < dims; d++) norm += newVec[d] * newVec[d];
      norm = Math.sqrt(norm);
      for (let d = 0; d < dims; d++) vec[d] = newVec[d] / (norm + 1e-10);
    }

    // Eigenvalue
    const proj = centered.map(row => {
      let dot = 0;
      for (let d = 0; d < dims; d++) dot += row[d] * vec[d];
      return dot;
    });
    const eigenval = proj.reduce((s, v) => s + v * v, 0) / n;

    return { vec, eigenval };
  };

  const pc1 = getComponent();
  const pc2 = getComponent(pc1.vec);

  const totalVar = centered.reduce((s, row) => s + row.reduce((ss, v) => ss + v * v, 0), 0) / n;

  const x = centered.map(row => {
    let dot = 0;
    for (let d = 0; d < dims; d++) dot += row[d] * pc1.vec[d];
    return dot;
  });
  const y = centered.map(row => {
    let dot = 0;
    for (let d = 0; d < dims; d++) dot += row[d] * pc2.vec[d];
    return dot;
  });

  return {
    x,
    y,
    explained: [
      (pc1.eigenval / totalVar) * 100,
      (pc2.eigenval / totalVar) * 100,
    ],
  };
}

// K-Means clustering
function kMeans(data: number[][], k: number, maxIter: number = 30): { labels: number[]; centroids: number[][] } {
  const n = data.length;
  const dims = data[0].length;
  const rng = mulberry32(7);

  // Init centroids randomly from data
  const indices = new Set<number>();
  while (indices.size < k) indices.add(Math.floor(rng() * n));
  let centroids = Array.from(indices).map(i => [...data[i]]);
  let labels = new Array(n).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    // Assign
    let changed = false;
    for (let i = 0; i < n; i++) {
      let bestDist = Infinity;
      let bestK = 0;
      for (let c = 0; c < k; c++) {
        // Use 1 - cosine similarity as distance (for unit vectors)
        const sim = cosineSimilarity(data[i], centroids[c]);
        const dist = 1 - sim;
        if (dist < bestDist) { bestDist = dist; bestK = c; }
      }
      if (labels[i] !== bestK) { labels[i] = bestK; changed = true; }
    }
    if (!changed) break;

    // Update centroids
    const newCentroids = Array.from({ length: k }, () => new Array(dims).fill(0));
    const counts = new Array(k).fill(0);
    for (let i = 0; i < n; i++) {
      counts[labels[i]]++;
      for (let d = 0; d < dims; d++) newCentroids[labels[i]][d] += data[i][d];
    }
    centroids = newCentroids.map((c, ci) => {
      if (counts[ci] === 0) return c;
      const norm = Math.sqrt(c.reduce((s, v) => s + v * v, 0));
      return c.map(v => v / (norm + 1e-10));  // Normalize to sphere
    });
  }

  return { labels, centroids };
}

// Nearest-centroid classifier
function trainNearestCentroid(trainData: number[][], trainLabels: string[]): (point: number[]) => string {
  const classes = [...new Set(trainLabels)];
  const centroids: Record<string, number[]> = {};

  for (const cls of classes) {
    const classData = trainData.filter((_, i) => trainLabels[i] === cls);
    const dims = classData[0].length;
    const mean = new Array(dims).fill(0);
    for (const d of classData) for (let i = 0; i < dims; i++) mean[i] += d[i];
    const norm = Math.sqrt(mean.reduce((s, v) => s + v * v, 0));
    centroids[cls] = mean.map(v => v / (norm + 1e-10));
  }

  return (point: number[]) => {
    let bestSim = -Infinity;
    let bestClass = classes[0];
    for (const cls of classes) {
      const sim = cosineSimilarity(point, centroids[cls]);
      if (sim > bestSim) { bestSim = sim; bestClass = cls; }
    }
    return bestClass;
  };
}

// ═══════════════════════════════════════════════════════════════
// Canvas Visualizations
// ═══════════════════════════════════════════════════════════════

interface ScatterProps {
  points: EmbeddingPoint[];
  pcaX: number[];
  pcaY: number[];
  explained: [number, number];
  clusterLabels?: number[];
  clusterColors?: string[];
  hoveredId: number | null;
  selectedId: number | null;
  onHover: (id: number | null) => void;
  onSelect: (id: number | null) => void;
  highlightCorrect?: Map<number, boolean>;
}

function ScatterCanvas({ points, pcaX, pcaY, explained, clusterLabels, clusterColors, hoveredId, selectedId, onHover, onSelect, highlightCorrect }: ScatterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointPositions = useRef<{ id: number; sx: number; sy: number }[]>([]);

  // Compute screen positions
  const getScreenPositions = useCallback((w: number, h: number) => {
    const pad = 40;
    const xMin = Math.min(...pcaX);
    const xMax = Math.max(...pcaX);
    const yMin = Math.min(...pcaY);
    const yMax = Math.max(...pcaY);
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    return points.map((p, i) => ({
      id: p.id,
      sx: pad + ((pcaX[i] - xMin) / xRange) * (w - pad * 2),
      sy: pad + ((pcaY[i] - yMin) / yRange) * (h - pad * 2),
    }));
  }, [points, pcaX, pcaY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    // Background
    ctx.fillStyle = '#fafaf8';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#e8e6e0';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 8; i++) {
      const x = (i / 8) * w;
      const y = (i / 8) * h;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Compute positions
    const positions = getScreenPositions(w, h);
    pointPositions.current = positions;

    // Draw points
    positions.forEach((pos, i) => {
      const p = points[i];
      const isHovered = hoveredId === p.id;
      const isSelected = selectedId === p.id;

      let color = p.color;
      let alpha = 0.7;
      let radius = 4;

      if (clusterLabels && clusterColors) {
        color = clusterColors[clusterLabels[i] % clusterColors.length];
        alpha = 0.7;
      }

      if (highlightCorrect) {
        const correct = highlightCorrect.get(p.id);
        if (correct === false) {
          alpha = 1;
          radius = 5;
          // Draw X for misclassified
          ctx.save();
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pos.sx - 6, pos.sy - 6);
          ctx.lineTo(pos.sx + 6, pos.sy + 6);
          ctx.moveTo(pos.sx + 6, pos.sy - 6);
          ctx.lineTo(pos.sx - 6, pos.sy + 6);
          ctx.stroke();
          ctx.restore();
        }
      }

      if (isHovered || isSelected) {
        alpha = 1;
        radius = 7;
        // Glow
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(pos.sx, pos.sy, radius + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.sx, pos.sy, radius, 0, Math.PI * 2);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    });

    // Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`PC1 (${explained[0].toFixed(1)}% var.)`, w / 2, h - 6);
    ctx.save();
    ctx.translate(12, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`PC2 (${explained[1].toFixed(1)}% var.)`, 0, 0);
    ctx.restore();
  }, [points, pcaX, pcaY, explained, clusterLabels, clusterColors, hoveredId, selectedId, highlightCorrect, getScreenPositions]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let closest: number | null = null;
    let closestDist = 20; // threshold in px
    for (const pos of pointPositions.current) {
      const dx = pos.sx - mx;
      const dy = pos.sy - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = pos.id;
      }
    }
    onHover(closest);
  }, [onHover]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let closest: number | null = null;
    let closestDist = 20;
    for (const pos of pointPositions.current) {
      const dx = pos.sx - mx;
      const dy = pos.sy - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = pos.id;
      }
    }
    onSelect(closest);
  }, [onSelect]);

  return (
    <canvas
      ref={canvasRef}
      className="demo-scatter-canvas"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => onHover(null)}
      onClick={handleClick}
    />
  );
}

// Embedding bar chart for hovered/selected point
function EmbeddingBarChart({ embedding, label, color }: { embedding: number[]; label: string; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    const pad = { top: 24, bottom: 20, left: 8, right: 8 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    const barW = plotW / 64;
    const midY = pad.top + plotH / 2;

    // Zero line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(pad.left, midY);
    ctx.lineTo(w - pad.right, midY);
    ctx.stroke();

    // Bars
    const maxAbs = Math.max(...embedding.map(Math.abs), 0.3);
    embedding.forEach((v, i) => {
      const x = pad.left + i * barW;
      const barH = (v / maxAbs) * (plotH / 2);
      const y = v >= 0 ? midY - barH : midY;
      const bh = Math.abs(barH);

      // Color based on dimension group
      let barColor = color;
      if (i < 8) barColor = '#16a34a'; // Vegetation axes
      else if (i < 16) barColor = '#0ea5e9'; // Moisture axes
      else if (i < 24) barColor = '#6366f1'; // Structure axes
      else if (i < 32) barColor = '#f59e0b'; // Thermal axes
      else barColor = '#94a3b8'; // Other

      ctx.fillStyle = barColor;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(x + 0.5, y, barW - 1, bh);
    });
    ctx.globalAlpha = 1;

    // Title
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${label} — 64D embedding vector (‖v‖ = 1.0)`, pad.left, 14);

    // Dim group labels
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#16a34a';
    ctx.fillText('veg', pad.left + 4 * barW, h - 4);
    ctx.fillStyle = '#0ea5e9';
    ctx.fillText('moisture', pad.left + 12 * barW, h - 4);
    ctx.fillStyle = '#6366f1';
    ctx.fillText('struct', pad.left + 20 * barW, h - 4);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('thermal', pad.left + 28 * barW, h - 4);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('higher-order', pad.left + 48 * barW, h - 4);
  }, [embedding, label, color]);

  return <canvas ref={canvasRef} className="demo-bar-canvas" />;
}

// Confusion Matrix
function ConfusionMatrix({ matrix, labels }: { matrix: number[][]; labels: string[] }) {
  const maxVal = Math.max(...matrix.flat(), 1);

  return (
    <div className="demo-confusion-wrap">
      <div className="demo-confusion-label">Predicted →</div>
      <div className="demo-confusion-grid" style={{ gridTemplateColumns: `80px repeat(${labels.length}, 1fr)` }}>
        <div className="demo-confusion-corner">True ↓</div>
        {labels.map(l => (
          <div key={`h-${l}`} className="demo-confusion-header">{l.substring(0, 6)}</div>
        ))}
        {labels.map((rowLabel, r) => (
          <React.Fragment key={r}>
            <div className="demo-confusion-row-label">{rowLabel.substring(0, 6)}</div>
            {matrix[r].map((val, c) => {
              const intensity = val / maxVal;
              const isCorrect = r === c;
              return (
                <div
                  key={`${r}-${c}`}
                  className={`demo-confusion-cell ${isCorrect ? 'correct' : ''}`}
                  style={{
                    backgroundColor: isCorrect
                      ? `rgba(22, 163, 74, ${0.1 + intensity * 0.7})`
                      : val > 0
                        ? `rgba(220, 38, 38, ${0.05 + intensity * 0.5})`
                        : 'transparent',
                  }}
                >
                  {val}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Demo Component
// ═══════════════════════════════════════════════════════════════

type DemoMode = 'scatter' | 'kmeans' | 'classify';

export default function DemoClassification() {
  // Generate dataset once
  const dataset = useMemo(() => generateDataset(), []);

  const [mode, setMode] = useState<DemoMode>('scatter');
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showHow, setShowHow] = useState(false);

  // K-means state
  const [kmeansK, setKmeansK] = useState(6);
  const [kmeansResult, setKmeansResult] = useState<{ labels: number[]; centroids: number[][] } | null>(null);
  const [kmeansARI, setKmeansARI] = useState<number | null>(null);

  // Classification state
  const [trainRatio, setTrainRatio] = useState(0.3);
  const [classifyResult, setClassifyResult] = useState<{
    predictions: string[];
    testIndices: number[];
    accuracy: number;
    confusionMatrix: number[][];
    classLabels: string[];
  } | null>(null);

  // PCA projection (computed once)
  const pca = useMemo(() => {
    const embeddings = dataset.map(p => p.embedding);
    return computePCA2D(embeddings);
  }, [dataset]);

  // K-Means colors
  const kmeansColors = ['#dc2626', '#059669', '#0ea5e9', '#eab308', '#6366f1', '#ec4899', '#f97316', '#14b8a6', '#8b5cf6', '#84cc16'];

  // Run K-Means
  const runKMeans = useCallback(() => {
    const embeddings = dataset.map(p => p.embedding);
    const result = kMeans(embeddings, kmeansK);
    setKmeansResult(result);

    // Compute Adjusted Rand Index (simplified)
    const trueLabels = dataset.map(p => p.label);
    const uniqueTrue = [...new Set(trueLabels)];
    const trueIndices = trueLabels.map(l => uniqueTrue.indexOf(l));

    // Purity measure
    let correctCount = 0;
    for (let c = 0; c < kmeansK; c++) {
      const clusterMembers = result.labels.reduce<number[]>((acc, l, i) => {
        if (l === c) acc.push(trueIndices[i]);
        return acc;
      }, []);
      if (clusterMembers.length === 0) continue;
      const freq = new Map<number, number>();
      for (const m of clusterMembers) freq.set(m, (freq.get(m) || 0) + 1);
      correctCount += Math.max(...freq.values());
    }
    setKmeansARI(correctCount / dataset.length);
  }, [dataset, kmeansK]);

  // Run Classification
  const runClassification = useCallback(() => {
    const rng = mulberry32(99);
    const n = dataset.length;
    const nTrain = Math.floor(n * trainRatio);

    // Shuffle indices
    const indices = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const trainIdx = indices.slice(0, nTrain);
    const testIdx = indices.slice(nTrain);

    const trainData = trainIdx.map(i => dataset[i].embedding);
    const trainLabels = trainIdx.map(i => dataset[i].label);

    const classifier = trainNearestCentroid(trainData, trainLabels);

    const predictions = testIdx.map(i => classifier(dataset[i].embedding));
    const trueLabels = testIdx.map(i => dataset[i].label);

    // Accuracy
    let correct = 0;
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] === trueLabels[i]) correct++;
    }

    // Confusion matrix
    const classLabels: string[] = LAND_COVER_CLASSES.map(c => c.label as string);
    const matrix = classLabels.map(() => classLabels.map(() => 0));
    for (let i = 0; i < predictions.length; i++) {
      const trueIdx = classLabels.indexOf(trueLabels[i]);
      const predIdx = classLabels.indexOf(predictions[i]);
      if (trueIdx >= 0 && predIdx >= 0) matrix[trueIdx][predIdx]++;
    }

    setClassifyResult({
      predictions,
      testIndices: testIdx,
      accuracy: correct / predictions.length,
      confusionMatrix: matrix,
      classLabels,
    });
  }, [dataset, trainRatio]);

  // Highlight map for classification correctness
  const highlightCorrect = useMemo<Map<number, boolean> | undefined>(() => {
    if (mode !== 'classify' || !classifyResult) return undefined;
    const map = new Map<number, boolean>();
    classifyResult.testIndices.forEach((idx, i) => {
      map.set(dataset[idx].id, classifyResult.predictions[i] === dataset[idx].label);
    });
    return map;
  }, [mode, classifyResult, dataset]);

  // Info panel for hovered/selected point
  const activePoint = selectedId !== null
    ? dataset.find(p => p.id === selectedId)
    : hoveredId !== null
      ? dataset.find(p => p.id === hoveredId)
      : null;

  return (
    <section className="section demo-section" data-section="demo-classify">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">Interactive Demo</span>
          <h2>Geo-Embedding Classification Lab</h2>
          <p className="section-subtitle">
            See how geo-embeddings make classification trivial — once a LEOM has compressed 
            satellite imagery into 64-dimensional vectors, a simple K-means or linear classifier 
            can separate land cover types. All computed client-side in your browser.
            This demo uses synthetic data — not real satellite imagery. The embeddings are generated to mimic AlphaEarth's statistical properties (unit-length 64D vectors with land cover clustering), letting you learn the concepts without GEE access. For real data, see the <a href="#explorer">Live Explorer</a> above.
          </p>
        </div>

        {/* Learning objectives */}
        <div className="demo-learning-objectives fade-in">
          <h4>What You'll Learn</h4>
          <ul>
            <li><strong>PCA Scatter:</strong> High-dimensional embeddings cluster by land cover type — similar landscapes have similar vectors</li>
            <li><strong>K-Means:</strong> Unsupervised clustering on embeddings discovers natural landscape groupings without labels</li>
            <li><strong>Classification:</strong> A simple nearest-centroid classifier achieves high accuracy because embeddings encode semantic meaning</li>
          </ul>
        </div>

        {/* Mode Selector */}
        <div className="demo-modes fade-in">
          <button
            className={`demo-mode-btn ${mode === 'scatter' ? 'active' : ''}`}
            onClick={() => setMode('scatter')}
          >
            <span className="demo-mode-icon">🗺️</span>
            <span>PCA Scatter</span>
          </button>
          <button
            className={`demo-mode-btn ${mode === 'kmeans' ? 'active' : ''}`}
            onClick={() => setMode('kmeans')}
          >
            <span className="demo-mode-icon">🔮</span>
            <span>K-Means Clustering</span>
          </button>
          <button
            className={`demo-mode-btn ${mode === 'classify' ? 'active' : ''}`}
            onClick={() => setMode('classify')}
          >
            <span className="demo-mode-icon">🎯</span>
            <span>Nearest Centroid</span>
          </button>
        </div>

        <div className="demo-layout fade-in">
          {/* Main visualization */}
          <div className="demo-main">
            {/* Controls */}
            <div className="demo-controls">
              {mode === 'scatter' && (
                <div className="demo-control-text">
                  <strong>{dataset.length} points</strong> projected from 64D → 2D via PCA.
                  Each point is a simulated AlphaEarth embedding for a 10m pixel.
                  <strong> Click</strong> a point to inspect its embedding vector.
                </div>
              )}

              {mode === 'kmeans' && (
                <div className="demo-control-row">
                  <label className="demo-control-label">
                    K = {kmeansK}
                    <input
                      type="range"
                      min={2}
                      max={10}
                      value={kmeansK}
                      onChange={e => setKmeansK(parseInt(e.target.value))}
                    />
                  </label>
                  <button className="demo-run-btn" onClick={runKMeans}>
                    Run K-Means
                  </button>
                  {kmeansARI !== null && (
                    <span className="demo-metric">
                      Purity: <strong>{(kmeansARI * 100).toFixed(1)}%</strong>
                    </span>
                  )}
                </div>
              )}

              {mode === 'classify' && (
                <div className="demo-control-row">
                  <label className="demo-control-label">
                    Train: {Math.round(trainRatio * 100)}%
                    <input
                      type="range"
                      min={10}
                      max={80}
                      step={5}
                      value={trainRatio * 100}
                      onChange={e => setTrainRatio(parseInt(e.target.value) / 100)}
                    />
                  </label>
                  <button className="demo-run-btn" onClick={runClassification}>
                    Train & Test
                  </button>
                  {classifyResult && (
                    <span className="demo-metric">
                      Accuracy: <strong>{(classifyResult.accuracy * 100).toFixed(1)}%</strong>
                      <span className="demo-metric-sub">
                        ({Math.round(trainRatio * dataset.length)} train / {dataset.length - Math.round(trainRatio * dataset.length)} test)
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Canvas */}
            <div className="demo-canvas-wrap">
              <ScatterCanvas
                points={dataset}
                pcaX={pca.x}
                pcaY={pca.y}
                explained={pca.explained}
                clusterLabels={mode === 'kmeans' && kmeansResult ? kmeansResult.labels : undefined}
                clusterColors={mode === 'kmeans' ? kmeansColors : undefined}
                hoveredId={hoveredId}
                selectedId={selectedId}
                onHover={setHoveredId}
                onSelect={setSelectedId}
                highlightCorrect={highlightCorrect}
              />

              {/* Legend */}
              <div className="demo-legend">
                {mode === 'kmeans' && kmeansResult
                  ? Array.from({ length: kmeansK }, (_, i) => (
                    <span key={i} className="demo-legend-item">
                      <span className="demo-legend-dot" style={{ background: kmeansColors[i] }} />
                      Cluster {i + 1}
                    </span>
                  ))
                  : LAND_COVER_CLASSES.map(c => (
                    <span key={c.label} className="demo-legend-item">
                      <span className="demo-legend-dot" style={{ background: c.color }} />
                      {c.label} ({c.count})
                    </span>
                  ))
                }
              </div>
            </div>

            {/* Embedding bar chart */}
            {activePoint && (
              <div className="demo-bar-panel">
                <EmbeddingBarChart
                  embedding={activePoint.embedding}
                  label={activePoint.label}
                  color={activePoint.color}
                />
              </div>
            )}

            {/* Confusion matrix for classification mode */}
            {mode === 'classify' && classifyResult && (
              <div className="demo-confusion-panel">
                <h4>Confusion Matrix</h4>
                <ConfusionMatrix
                  matrix={classifyResult.confusionMatrix}
                  labels={classifyResult.classLabels}
                />
              </div>
            )}
          </div>

          {/* Side panel */}
          <div className="demo-sidebar">
            {/* Point info */}
            {activePoint ? (
              <div className="demo-point-info">
                <div className="demo-point-header">
                  <span className="demo-point-dot" style={{ background: activePoint.color }} />
                  <span className="demo-point-label">{activePoint.label}</span>
                  <span className="demo-point-id">#{activePoint.id}</span>
                </div>
                <div className="demo-point-stats">
                  <div className="demo-point-stat">
                    <span className="demo-point-stat-label">‖v‖</span>
                    <span className="demo-point-stat-value">
                      {Math.sqrt(activePoint.embedding.reduce((s, v) => s + v * v, 0)).toFixed(4)}
                    </span>
                  </div>
                  <div className="demo-point-stat">
                    <span className="demo-point-stat-label">max dim</span>
                    <span className="demo-point-stat-value">
                      {Math.max(...activePoint.embedding).toFixed(3)}
                    </span>
                  </div>
                  <div className="demo-point-stat">
                    <span className="demo-point-stat-label">min dim</span>
                    <span className="demo-point-stat-value">
                      {Math.min(...activePoint.embedding).toFixed(3)}
                    </span>
                  </div>
                </div>

                {/* Similarity to class centroids */}
                <div className="demo-similarities">
                  <span className="demo-sim-title">Cosine sim to class centroids:</span>
                  {LAND_COVER_CLASSES.map(cls => {
                    const centroid = dataset
                      .filter(p => p.label === cls.label)
                      .reduce((acc, p) => {
                        p.embedding.forEach((v, i) => { acc[i] = (acc[i] || 0) + v; });
                        return acc;
                      }, new Array(64).fill(0));
                    const norm = Math.sqrt(centroid.reduce((s: number, v: number) => s + v * v, 0));
                    const normalized = centroid.map((v: number) => v / (norm + 1e-10));
                    const sim = cosineSimilarity(activePoint.embedding, normalized);

                    return (
                      <div key={cls.label} className="demo-sim-row">
                        <span className="demo-sim-label">
                          <span className="demo-sim-dot" style={{ background: cls.color }} />
                          {cls.label}
                        </span>
                        <div className="demo-sim-bar-wrap">
                          <div
                            className="demo-sim-bar"
                            style={{
                              width: `${Math.max(0, sim) * 100}%`,
                              background: cls.color,
                            }}
                          />
                        </div>
                        <span className="demo-sim-val">{sim.toFixed(3)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="demo-point-placeholder">
                <span className="demo-point-placeholder-icon">👆</span>
                <p>Hover or click a point to inspect its 64D embedding vector and similarity profile.</p>
              </div>
            )}

            {/* How It Works */}
            <button className="demo-how-toggle" onClick={() => setShowHow(!showHow)}>
              {showHow ? '▾' : '▸'} How This Works
            </button>
            {showHow && (
              <div className="demo-how-panel">
                <div className="demo-how-item">
                  <strong>Data:</strong> {dataset.length} synthetic 64D unit vectors simulating AlphaEarth embeddings.
                  Class centers are defined by interpretable axes (vegetation, moisture, structure, thermal),
                  with von Mises-Fisher noise for realism.
                </div>
                <div className="demo-how-item">
                  <strong>PCA:</strong> Principal Component Analysis projects 64D → 2D via power iteration
                  (top 2 eigenvectors of the covariance matrix). Preserves the most variance.
                </div>
                <div className="demo-how-item">
                  <strong>K-Means:</strong> Iteratively assigns points to K clusters using cosine distance
                  (1 - cosine similarity), then updates centroids on the unit sphere.
                  Purity measures how well clusters align with true labels.
                </div>
                <div className="demo-how-item">
                  <strong>Nearest Centroid:</strong> Computes the mean embedding per class from training data,
                  then classifies test points by highest cosine similarity to class centroids.
                  This is equivalent to a linear classifier in embedding space.
                </div>
                <div className="demo-how-item">
                  <strong>All math runs in your browser</strong> — no server calls, no Python, no external libraries.
                  Just TypeScript + Canvas.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
