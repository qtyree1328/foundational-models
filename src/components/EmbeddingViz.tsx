import React, { useEffect, useRef, useState, useCallback } from 'react';

// ===== Synthetic embedding data generation =====
interface DataPoint {
  embedding: number[];
  label: string;
  color: string;
  x?: number;
  y?: number;
}

const LAND_COVER_TYPES = [
  { label: 'Cropland', color: '#eab308', center: [2, -1, 0.5] },
  { label: 'Forest', color: '#16a34a', center: [-2, 1, 1] },
  { label: 'Urban', color: '#6366f1', center: [1, 2, -1] },
  { label: 'Water', color: '#0ea5e9', center: [-1, -2, -0.5] },
  { label: 'Desert', color: '#c67b2e', center: [3, 0, -2] },
  { label: 'Wetland', color: '#059669', center: [-0.5, -1, 2] },
];

function generateEmbeddings(nPerClass: number, dims: number): DataPoint[] {
  const points: DataPoint[] = [];
  LAND_COVER_TYPES.forEach(type => {
    for (let i = 0; i < nPerClass; i++) {
      const embedding: number[] = [];
      for (let d = 0; d < dims; d++) {
        const base = d < 3 ? type.center[d] : (Math.random() - 0.5) * 0.5;
        embedding.push(base + (Math.random() - 0.5) * 1.2);
      }
      points.push({ embedding, label: type.label, color: type.color });
    }
  });
  return points;
}

// Simple PCA: compute top-k principal components
function computePCA(data: number[][], k: number): { projected: number[][]; explained: number[] } {
  const n = data.length;
  const dims = data[0].length;

  // Center the data
  const mean = new Array(dims).fill(0);
  data.forEach(row => row.forEach((v, d) => mean[d] += v));
  mean.forEach((_, d) => mean[d] /= n);

  const centered = data.map(row => row.map((v, d) => v - mean[d]));

  // Power iteration for top-k eigenvectors
  const components: number[][] = [];
  const eigenvalues: number[] = [];
  const residual = centered.map(r => [...r]);

  for (let comp = 0; comp < k; comp++) {
    let vec = new Array(dims).fill(0).map(() => Math.random() - 0.5);
    let norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    vec = vec.map(v => v / norm);

    for (let iter = 0; iter < 50; iter++) {
      // Compute A^T * A * vec
      const projections = residual.map(row => row.reduce((s, v, d) => s + v * vec[d], 0));
      const newVec = new Array(dims).fill(0);
      residual.forEach((row, i) => row.forEach((v, d) => newVec[d] += v * projections[i]));

      norm = Math.sqrt(newVec.reduce((s, v) => s + v * v, 0));
      vec = newVec.map(v => v / (norm || 1));
    }

    const eigenvalue = residual.reduce((s, row) => {
      const proj = row.reduce((ss, v, d) => ss + v * vec[d], 0);
      return s + proj * proj;
    }, 0) / n;

    components.push(vec);
    eigenvalues.push(eigenvalue);

    // Deflate
    residual.forEach(row => {
      const proj = row.reduce((s, v, d) => s + v * vec[d], 0);
      vec.forEach((_, d) => row[d] -= proj * vec[d]);
    });
  }

  const projected = centered.map(row =>
    components.map(comp => row.reduce((s, v, d) => s + v * comp[d], 0))
  );

  const totalVar = eigenvalues.reduce((s, v) => s + v, 0);
  const explained = eigenvalues.map(v => v / totalVar);

  return { projected, explained };
}

// ===== PCA Visualization =====
function PCAVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const pointsRef = useRef<(DataPoint & { sx: number; sy: number })[]>([]);

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

    const data = generateEmbeddings(25, 64);
    const { projected, explained } = computePCA(data.map(d => d.embedding), 2);

    // Scale to canvas
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    projected.forEach(p => {
      minX = Math.min(minX, p[0]);
      maxX = Math.max(maxX, p[0]);
      minY = Math.min(minY, p[1]);
      maxY = Math.max(maxY, p[1]);
    });

    const pad = 50;
    const scaleX = (w - 2 * pad) / (maxX - minX || 1);
    const scaleY = (h - 2 * pad) / (maxY - minY || 1);
    const scale = Math.min(scaleX, scaleY);

    // Background
    ctx.fillStyle = '#fafaf8';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#e8e6e0';
    ctx.lineWidth = 0.5;
    const cx = w / 2;
    const cy = h / 2;
    for (let i = -5; i <= 5; i++) {
      const gx = cx + i * 40;
      const gy = cy + i * 40;
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#c4c0b8';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, cy); ctx.lineTo(w - pad, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, pad); ctx.lineTo(cx, h - pad); ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '11px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`PC1 (${(explained[0] * 100).toFixed(0)}% var)`, w / 2, h - 12);
    ctx.save();
    ctx.translate(14, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`PC2 (${(explained[1] * 100).toFixed(0)}% var)`, 0, 0);
    ctx.restore();

    // Draw points
    const screenPoints: (DataPoint & { sx: number; sy: number })[] = [];
    data.forEach((point, i) => {
      const sx = cx + (projected[i][0] - (minX + maxX) / 2) * scale;
      const sy = cy - (projected[i][1] - (minY + maxY) / 2) * scale;

      // Glow
      ctx.beginPath();
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.fillStyle = point.color + '20';
      ctx.fill();

      // Point
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fillStyle = point.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();

      screenPoints.push({ ...point, sx, sy });
    });

    pointsRef.current = screenPoints;

    // Legend
    const legendX = w - 120;
    let legendY = 20;
    ctx.fillStyle = 'rgba(250, 250, 248, 0.9)';
    ctx.fillRect(legendX - 10, legendY - 5, 120, LAND_COVER_TYPES.length * 22 + 10);

    LAND_COVER_TYPES.forEach(type => {
      ctx.beginPath();
      ctx.arc(legendX + 6, legendY + 8, 4, 0, Math.PI * 2);
      ctx.fillStyle = type.color;
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.font = '11px "DM Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(type.label, legendX + 16, legendY + 12);
      legendY += 22;
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let closest: (DataPoint & { sx: number; sy: number }) | null = null;
    let minDist = 20;
    pointsRef.current.forEach(p => {
      const d = Math.sqrt((p.sx - mx) ** 2 + (p.sy - my) ** 2);
      if (d < minDist) { minDist = d; closest = p; }
    });
    setHoveredPoint(closest);
  }, []);

  return (
    <div className="viz-container">
      <div className="viz-header">
        <h4>PCA Projection</h4>
        <p>64-dimensional embeddings projected to 2D. Points cluster by land cover type.</p>
      </div>
      <div className="viz-canvas-wrap" style={{ position: 'relative' }}>
        <canvas ref={canvasRef} className="viz-canvas" onMouseMove={handleMouseMove} />
        {hoveredPoint && (
          <div className="viz-tooltip" style={{
            background: hoveredPoint.color + 'ee',
            color: '#fff',
          }}>
            {hoveredPoint.label}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== K-Means Clustering Demo =====
function KMeansDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [k, setK] = useState(6);
  const [step, setStep] = useState(0);
  const dataRef = useRef<DataPoint[]>([]);
  const centroidsRef = useRef<number[][]>([]);
  const assignmentsRef = useRef<number[]>([]);

  const clusterColors = ['#eab308', '#16a34a', '#6366f1', '#0ea5e9', '#c67b2e', '#059669', '#ec4899', '#f97316'];

  const initData = useCallback(() => {
    dataRef.current = generateEmbeddings(20, 64);
    const { projected } = computePCA(dataRef.current.map(d => d.embedding), 2);
    dataRef.current.forEach((p, i) => {
      p.x = projected[i][0];
      p.y = projected[i][1];
    });

    // Random initial centroids
    const indices = Array.from({ length: dataRef.current.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    centroidsRef.current = indices.slice(0, k).map(i => [dataRef.current[i].x!, dataRef.current[i].y!]);
    assignmentsRef.current = new Array(dataRef.current.length).fill(-1);
    setStep(0);
  }, [k]);

  useEffect(() => { initData(); }, [initData]);

  const runStep = useCallback(() => {
    const points = dataRef.current;
    const centroids = centroidsRef.current;

    // Assign points to nearest centroid
    const assignments = points.map(p => {
      let minD = Infinity, minC = 0;
      centroids.forEach((c, ci) => {
        const d = Math.sqrt((p.x! - c[0]) ** 2 + (p.y! - c[1]) ** 2);
        if (d < minD) { minD = d; minC = ci; }
      });
      return minC;
    });
    assignmentsRef.current = assignments;

    // Update centroids
    const newCentroids = centroids.map((_, ci) => {
      const members = points.filter((_, pi) => assignments[pi] === ci);
      if (members.length === 0) return centroids[ci];
      return [
        members.reduce((s, p) => s + p.x!, 0) / members.length,
        members.reduce((s, p) => s + p.y!, 0) / members.length
      ];
    });
    centroidsRef.current = newCentroids;
    setStep(s => s + 1);
  }, []);

  // Draw
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
    const points = dataRef.current;
    const centroids = centroidsRef.current;
    const assignments = assignmentsRef.current;

    if (points.length === 0) return;

    // Get bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
      minX = Math.min(minX, p.x!); maxX = Math.max(maxX, p.x!);
      minY = Math.min(minY, p.y!); maxY = Math.max(maxY, p.y!);
    });
    const pad = 40;
    const sx = (v: number) => pad + ((v - minX) / (maxX - minX || 1)) * (w - 2 * pad);
    const sy = (v: number) => h - pad - ((v - minY) / (maxY - minY || 1)) * (h - 2 * pad);

    // Background
    ctx.fillStyle = '#fafaf8';
    ctx.fillRect(0, 0, w, h);

    // Draw Voronoi-like regions (simple)
    if (step > 0) {
      for (let px = 0; px < w; px += 6) {
        for (let py = 0; py < h; py += 6) {
          const realX = minX + ((px - pad) / (w - 2 * pad)) * (maxX - minX);
          const realY = maxY - ((py - pad) / (h - 2 * pad)) * (maxY - minY);
          let minD = Infinity, minC = 0;
          centroids.forEach((c, ci) => {
            const d = (realX - c[0]) ** 2 + (realY - c[1]) ** 2;
            if (d < minD) { minD = d; minC = ci; }
          });
          ctx.fillStyle = clusterColors[minC % clusterColors.length] + '08';
          ctx.fillRect(px, py, 6, 6);
        }
      }
    }

    // Lines from points to centroids
    if (step > 0) {
      ctx.lineWidth = 0.5;
      points.forEach((p, i) => {
        const ci = assignments[i];
        if (ci >= 0 && ci < centroids.length) {
          ctx.strokeStyle = clusterColors[ci % clusterColors.length] + '30';
          ctx.beginPath();
          ctx.moveTo(sx(p.x!), sy(p.y!));
          ctx.lineTo(sx(centroids[ci][0]), sy(centroids[ci][1]));
          ctx.stroke();
        }
      });
    }

    // Points
    points.forEach((p, i) => {
      const color = step > 0 ? clusterColors[assignments[i] % clusterColors.length] : '#94a3b8';
      ctx.beginPath();
      ctx.arc(sx(p.x!), sy(p.y!), 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Centroids
    centroids.forEach((c, ci) => {
      ctx.beginPath();
      ctx.arc(sx(c[0]), sy(c[1]), 8, 0, Math.PI * 2);
      ctx.fillStyle = clusterColors[ci % clusterColors.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Cross
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx(c[0]) - 4, sy(c[1]));
      ctx.lineTo(sx(c[0]) + 4, sy(c[1]));
      ctx.moveTo(sx(c[0]), sy(c[1]) - 4);
      ctx.lineTo(sx(c[0]), sy(c[1]) + 4);
      ctx.stroke();
    });

    // Step indicator
    ctx.fillStyle = '#64748b';
    ctx.font = '11px "DM Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Iteration: ${step}`, 10, h - 10);
  }, [step, k]);

  return (
    <div className="viz-container">
      <div className="viz-header">
        <h4>K-Means Clustering</h4>
        <p>Watch how embeddings naturally group into land cover clusters.</p>
      </div>
      <div className="viz-controls">
        <label>
          k = {k}
          <input
            type="range"
            min="2"
            max="8"
            value={k}
            onChange={e => setK(Number(e.target.value))}
          />
        </label>
        <button className="viz-btn" onClick={runStep}>Step →</button>
        <button className="viz-btn secondary" onClick={initData}>Reset</button>
      </div>
      <canvas ref={canvasRef} className="viz-canvas" />
    </div>
  );
}

// ===== Similarity Search Demo =====
function SimilarityDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const dataRef = useRef<(DataPoint & { px: number; py: number })[]>([]);

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

    const data = generateEmbeddings(20, 64);
    const { projected } = computePCA(data.map(d => d.embedding), 2);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    projected.forEach(p => {
      minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
      minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
    });

    const pad = 40;
    const sx = (v: number) => pad + ((v - minX) / (maxX - minX || 1)) * (w - 2 * pad);
    const sy = (v: number) => h - pad - ((v - minY) / (maxY - minY || 1)) * (h - 2 * pad);

    const screenData = data.map((d, i) => ({
      ...d,
      px: sx(projected[i][0]),
      py: sy(projected[i][1])
    }));
    dataRef.current = screenData;

    // Compute cosine similarities if a point is selected
    let similarities: number[] = [];
    if (selectedIdx !== null && selectedIdx < data.length) {
      const refEmb = data[selectedIdx].embedding;
      const refNorm = Math.sqrt(refEmb.reduce((s, v) => s + v * v, 0));
      similarities = data.map(d => {
        const dot = d.embedding.reduce((s, v, i) => s + v * refEmb[i], 0);
        const norm = Math.sqrt(d.embedding.reduce((s, v) => s + v * v, 0));
        return dot / (norm * refNorm || 1);
      });
    }

    // Background
    ctx.fillStyle = '#fafaf8';
    ctx.fillRect(0, 0, w, h);

    // Draw connections for similar points
    if (selectedIdx !== null) {
      screenData.forEach((p, i) => {
        if (i === selectedIdx) return;
        const sim = similarities[i];
        if (sim > 0.7) {
          ctx.beginPath();
          ctx.moveTo(screenData[selectedIdx].px, screenData[selectedIdx].py);
          ctx.lineTo(p.px, p.py);
          ctx.strokeStyle = `rgba(13, 79, 79, ${sim * 0.5})`;
          ctx.lineWidth = sim * 3;
          ctx.stroke();
        }
      });
    }

    // Points
    screenData.forEach((p, i) => {
      const isSelected = i === selectedIdx;
      const sim = selectedIdx !== null ? similarities[i] : 1;
      const alpha = selectedIdx !== null ? Math.max(0.15, sim) : 1;

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.px, p.py, isSelected ? 8 : 5, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#0d4f4f' : '#fff';
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.stroke();

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(p.px, p.py, 16, 0, Math.PI * 2);
        ctx.strokeStyle = '#0d4f4f40';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Show similarity score
      if (selectedIdx !== null && i !== selectedIdx && sim > 0.6) {
        ctx.fillStyle = '#1e293b';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(sim.toFixed(2), p.px, p.py - 10);
      }
    });

    // Instruction
    if (selectedIdx === null) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px "DM Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Click any point to find similar embeddings', w / 2, h - 12);
    }
  }, [selectedIdx]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let closest = -1;
    let minD = 20;
    dataRef.current.forEach((p, i) => {
      const d = Math.sqrt((p.px - mx) ** 2 + (p.py - my) ** 2);
      if (d < minD) { minD = d; closest = i; }
    });

    setSelectedIdx(closest >= 0 ? closest : null);
  }, []);

  return (
    <div className="viz-container">
      <div className="viz-header">
        <h4>Similarity Search</h4>
        <p>Click a point to find areas with similar embeddings. Line thickness = cosine similarity.</p>
      </div>
      <canvas ref={canvasRef} className="viz-canvas clickable" onClick={handleClick} />
    </div>
  );
}

// ===== Change Detection Demo =====
function ChangeDetectionDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [year, setYear] = useState(2020);

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

    // Simulate a grid of embedding dot products showing change magnitude
    const gridSize = 40;
    const cellW = w / gridSize;
    const cellH = h / gridSize;

    // Create synthetic change map with realistic patterns
    // Simulate deforestation front, urban growth, and seasonal changes
    for (let gx = 0; gx < gridSize; gx++) {
      for (let gy = 0; gy < gridSize; gy++) {
        const nx = gx / gridSize;
        const ny = gy / gridSize;

        // Base change value (most areas stable)
        let change = 0.02 + Math.random() * 0.03;

        // Deforestation front (diagonal band that moves with year)
        const frontPos = 0.3 + (year - 2017) * 0.04;
        const distToFront = Math.abs(nx - ny * 0.7 - frontPos);
        if (distToFront < 0.08) {
          change = 0.6 + Math.random() * 0.3;
        }

        // Urban expansion (growing circle)
        const urbanDist = Math.sqrt((nx - 0.7) ** 2 + (ny - 0.3) ** 2);
        const urbanRadius = 0.05 + (year - 2017) * 0.015;
        if (urbanDist < urbanRadius && urbanDist > urbanRadius - 0.03) {
          change = 0.4 + Math.random() * 0.3;
        }

        // River/wetland seasonal change
        if (Math.abs(ny - 0.6 - Math.sin(nx * 8) * 0.05) < 0.03) {
          change = 0.15 + Math.random() * 0.15;
        }

        // Color: low change = blue/green (stable), high change = red/orange
        let r, g, b;
        if (change < 0.1) {
          r = 30; g = 100 + change * 500; b = 100;
        } else if (change < 0.3) {
          const t = (change - 0.1) / 0.2;
          r = 30 + t * 200; g = 150 - t * 50; b = 100 - t * 80;
        } else {
          const t = Math.min((change - 0.3) / 0.5, 1);
          r = 230; g = 100 - t * 80; b = 20;
        }

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(gx * cellW, gy * cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    // Legend
    ctx.fillStyle = 'rgba(250, 250, 248, 0.92)';
    ctx.fillRect(8, h - 50, 180, 42);
    ctx.strokeStyle = '#ccc';
    ctx.strokeRect(8, h - 50, 180, 42);

    // Gradient bar
    const gradW = 100;
    for (let i = 0; i < gradW; i++) {
      const t = i / gradW;
      let r2, g2, b2;
      if (t < 0.3) {
        r2 = 30; g2 = 100 + t * 500 / 3; b2 = 100;
      } else if (t < 0.6) {
        const tt = (t - 0.3) / 0.3;
        r2 = 30 + tt * 200; g2 = 150 - tt * 50; b2 = 100 - tt * 80;
      } else {
        const tt = (t - 0.6) / 0.4;
        r2 = 230; g2 = 100 - tt * 80; b2 = 20;
      }
      ctx.fillStyle = `rgb(${r2},${g2},${b2})`;
      ctx.fillRect(14 + i, h - 38, 1, 12);
    }

    ctx.fillStyle = '#1e293b';
    ctx.font = '10px "DM Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Stable', 14, h - 14);
    ctx.textAlign = 'right';
    ctx.fillText('Changed', 114, h - 14);
    ctx.textAlign = 'left';
    ctx.font = '9px "DM Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('1 - dot(emb_t1, emb_t2)', 124, h - 26);

    // Year label
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px "Space Grotesk", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${year} vs ${year - 1}`, w - 14, 26);
  }, [year]);

  return (
    <div className="viz-container">
      <div className="viz-header">
        <h4>Temporal Change Detection</h4>
        <p>Dot product between annual embeddings reveals landscape change. Red = significant change.</p>
      </div>
      <div className="viz-controls">
        <label>
          Year: {year}
          <input
            type="range"
            min="2018"
            max="2024"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
          />
        </label>
      </div>
      <canvas ref={canvasRef} className="viz-canvas" />
    </div>
  );
}

// ===== Main Export =====
export default function EmbeddingViz() {
  const [activeTab, setActiveTab] = useState<'pca' | 'kmeans' | 'similarity' | 'change'>('pca');

  const tabs = [
    { id: 'pca' as const, label: 'PCA Projection', icon: '📊' },
    { id: 'kmeans' as const, label: 'K-Means Clustering', icon: '🎯' },
    { id: 'similarity' as const, label: 'Similarity Search', icon: '🔍' },
    { id: 'change' as const, label: 'Change Detection', icon: '📈' },
  ];

  return (
    <section className="section embedding-section" data-section="embeddings">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">Educational Demos</span>
          <h2>Embedding Visualizations</h2>
          <p className="section-subtitle">
            Learn how foundation model embeddings encode landscape information through 
            interactive algorithms running in your browser.
          </p>
        </div>

        {/* Simulation notice */}
        <div className="viz-simulation-notice fade-in">
          <span className="simulation-badge-small">📊 SYNTHETIC DATA</span>
          <span className="simulation-notice-text">
            These visualizations use <strong>generated data</strong> that mimics the statistical 
            properties of real embeddings (64D unit vectors, land cover clustering). The algorithms 
            (PCA, K-means, cosine similarity) are real — only the input data is synthetic for 
            educational purposes. See <a href="#explorer">Live Explorer</a> for real GEE data.
          </span>
        </div>
        <div className="viz-tabs fade-in">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`viz-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="viz-tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="viz-panel fade-in">
          {activeTab === 'pca' && <PCAVisualization />}
          {activeTab === 'kmeans' && <KMeansDemo />}
          {activeTab === 'similarity' && <SimilarityDemo />}
          {activeTab === 'change' && <ChangeDetectionDemo />}
        </div>
      </div>
    </section>
  );
}
