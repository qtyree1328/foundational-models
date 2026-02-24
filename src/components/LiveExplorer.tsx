import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';

// ===== GEE Proxy Config =====
// Cloud Run GEE proxy - always use this (works from anywhere)
const GEE_PROXY_URL = 'https://gee-proxy-787413290356.us-east1.run.app';

type VizMode = 'embeddings' | 'clustering' | 'change' | 'similarity';

interface BandPresets {
  [key: string]: string;
}

const BAND_PRESETS: BandPresets = {
  'Default RGB': 'A01,A16,A09',
  'Infrastructure Focus': 'A26,A06,A20', // Element 84: A26=airports, A06=buildings, A20=urban structures
  'Industrial & Energy': 'A51,A08,A41', // A51=oil/gas facilities (Nature 2024), A08=water infra, A41=transport
  'Agriculture & Forest': 'A12,A03,A15', // A12=crops/cocoa (Airbus research), A03=ag machinery, A15=forest health
  'Water & Coastal': 'A08,A48,A15', // A08=water features, A48=coastal/aquaculture, A15=deforestation gradients
  'Mining & Resources': 'A32,A51,A03', // A32=mining sites (PMC study), A51=industrial, A03=heavy machinery
  'Change Sensitive': 'A01,A08,A32', // Keep original - good for detecting various change types
};

const MODE_DESCRIPTIONS: Record<VizMode, string> = {
  embeddings: 'Maps 3 of the 64 axes to R/G/B false-color. Similar colors = similar unit-length vectors on the embedding hypersphere. AlphaEarth learned these dimensions from petabytes of multi-sensor data without labels — Element 84 research shows A26 encodes airports, A51 captures industrial facilities.',
  clustering: 'Runs K-means on all 64 dimensions in the visible region. Each cluster represents a distinct landscape type discovered from embedding similarity. Used operationally for crop type mapping (Krishna Raja Sagara Reservoir, India) and Global Ecosystems Atlas land cover classification.',
  change: 'Computes cosine distance between annual embeddings (2017-2024). AlphaEarth stability mapping: values near 1.0 = stable landscape, values near 0 = major change events (fires, deforestation, urbanization). More sensitive than traditional NDVI differencing.',
  similarity: 'Click to compute cosine similarity across global 10m embeddings. Core functionality behind Google\'s similarity search demo and production ecosystem mapping. Find similar agricultural regions, urban patterns, or landscape types anywhere on Earth using the 64-dimensional embedding space.',
};

interface EmbeddingInfo {
  embedding: number[];
  landCover: {
    type: string;
    confidence: number;
    alternatives: { type: string; confidence: number }[];
    stats: {
      mean: number;
      std: number;
      max: number;
      min: number;
      positiveAxes: number;
      negativeAxes: number;
    };
  };
  year: string;
  lat: number;
  lng: number;
}

// ===== Embedding Bar Chart =====
function EmbeddingChart({ data }: { data: EmbeddingInfo }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const emb = data.embedding;
    const n = emb.length;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Find max absolute value
    const maxAbs = Math.max(...emb.map(Math.abs), 0.01);

    // Draw zero line
    const midY = h / 2;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    // Draw bars
    const barW = Math.max(1, (w - 4) / n);
    emb.forEach((v, i) => {
      const x = 2 + i * barW;
      const barH = (v / maxAbs) * (midY - 8);

      // Color: positive = teal, negative = coral
      if (v >= 0) {
        ctx.fillStyle = `rgba(20, 184, 166, ${0.5 + (v / maxAbs) * 0.5})`;
        ctx.fillRect(x, midY - barH, barW - 0.5, barH);
      } else {
        ctx.fillStyle = `rgba(239, 68, 68, ${0.5 + (-v / maxAbs) * 0.5})`;
        ctx.fillRect(x, midY, barW - 0.5, -barH);
      }
    });

    // Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('A00', 2, h - 2);
    ctx.textAlign = 'right';
    ctx.fillText('A63', w - 2, h - 2);
    ctx.textAlign = 'left';
    ctx.fillText(`+${maxAbs.toFixed(2)}`, 2, 10);
    ctx.fillText(`-${maxAbs.toFixed(2)}`, 2, h - 10);
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '120px', borderRadius: '6px' }}
    />
  );
}

// ===== Info Panel =====
function InfoPanel({
  info,
  loading,
  onClose,
}: {
  info: EmbeddingInfo | null;
  loading: boolean;
  onClose: () => void;
}) {
  if (!info && !loading) return null;

  return (
    <div className="live-info-panel">
      <button className="live-info-close" onClick={onClose}>×</button>
      {loading ? (
        <div className="live-info-loading">
          <div className="stac-spinner" />
          <span>Fetching embedding…</span>
        </div>
      ) : info ? (
        <>
          <div className="live-info-header">
            <span className="live-info-coords">
              {info.lat.toFixed(4)}°, {info.lng.toFixed(4)}°
            </span>
            <span className="live-info-year">{info.year}</span>
          </div>

          <div className="live-info-landcover">
            <span className="live-info-type">{info.landCover.type}</span>
            <span className="live-info-confidence">
              {(info.landCover.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>

          {info.landCover.alternatives.length > 0 && (
            <div className="live-info-alts">
              {info.landCover.alternatives.map((alt, i) => (
                <span key={i} className="live-info-alt">
                  {alt.type} ({(alt.confidence * 100).toFixed(0)}%)
                </span>
              ))}
            </div>
          )}

          <div className="live-info-chart-label">64-Dim Embedding Vector</div>
          <EmbeddingChart data={info} />

          <div className="live-info-stats">
            <div className="live-info-stat">
              <span className="live-info-stat-label">Mean</span>
              <span className="live-info-stat-value">{info.landCover.stats.mean.toFixed(4)}</span>
            </div>
            <div className="live-info-stat">
              <span className="live-info-stat-label">Std</span>
              <span className="live-info-stat-value">{info.landCover.stats.std.toFixed(4)}</span>
            </div>
            <div className="live-info-stat">
              <span className="live-info-stat-label">+Axes</span>
              <span className="live-info-stat-value">{info.landCover.stats.positiveAxes}</span>
            </div>
            <div className="live-info-stat">
              <span className="live-info-stat-label">-Axes</span>
              <span className="live-info-stat-value">{info.landCover.stats.negativeAxes}</span>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ===== Main Live Explorer Component =====
export default function LiveExplorer() {
  const sectionRef = useRef<HTMLElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [geeAvailable, setGeeAvailable] = useState<boolean | null>(null);
  const [vizMode, setVizMode] = useState<VizMode>('embeddings');
  const [year, setYear] = useState(2023);
  const [year2, setYear2] = useState(2020);
  const [bands, setBands] = useState('A01,A16,A09');
  const [clusters, setClusters] = useState(5);
  const [loading, setLoading] = useState(false);
  const [tileLoaded, setTileLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Point info state
  const [pointInfo, setPointInfo] = useState<EmbeddingInfo | null>(null);
  const [pointLoading, setPointLoading] = useState(false);
  const clickMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Similarity mode state
  const [simPoint, setSimPoint] = useState<{ lat: number; lng: number } | null>(null);

  // Ref for latest click handler (avoids stale closure in map event listener)
  const handleMapClickRef = useRef<(lng: number, lat: number) => void>(() => {});

  // Check GEE proxy availability
  useEffect(() => {
    // Cloud Run cold starts can take 15-20s; retry with generous timeout
    const tryHealth = (attempt: number) => {
      fetch(`${GEE_PROXY_URL}/api/health`, { signal: AbortSignal.timeout(15000) })
        .then(r => r.json())
        .then(d => setGeeAvailable(d.status === 'ok'))
        .catch(() => {
          if (attempt < 2) setTimeout(() => tryHealth(attempt + 1), 3000);
          else setGeeAvailable(false);
        });
    };
    tryHealth(0);
  }, []);

  // Observe fade-in elements within this component
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.05 }
    );
    el.querySelectorAll('.fade-in').forEach(child => observer.observe(child));
    return () => observer.disconnect();
  }, [geeAvailable]);

  // Initialize map — depends on geeAvailable so it runs after container renders
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    if (geeAvailable !== true) return;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'esri-world': {
              type: 'raster',
              tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
              ],
              tileSize: 256,
              attribution: '© Esri, Maxar'
            }
          },
          layers: [
            {
              id: 'esri-world-layer',
              type: 'raster',
              source: 'esri-world',
              minzoom: 0,
              maxzoom: 18
            }
          ]
        },
        center: [76.5, 12.5],
        zoom: 5,
        attributionControl: false,
        maxZoom: 16
      });
    } catch (e) {
      console.warn('WebGL not available for LiveExplorer:', e);
      return;
    }

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    // Map click handler (uses ref to avoid stale closure)
    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      handleMapClickRef.current(lng, lat);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [geeAvailable]);

  // Handle map click — fetch embedding info
  const handleMapClick = useCallback(async (lng: number, lat: number) => {
    if (!geeAvailable) return;

    // If in similarity mode, load similarity tiles from this point
    if (vizMode === 'similarity') {
      setSimPoint({ lat, lng });
      loadSimilarityTiles(lat, lng);
    }

    // Always fetch point info
    setPointLoading(true);
    setPointInfo(null);

    // Update marker — prominent pin style
    if (clickMarkerRef.current) clickMarkerRef.current.remove();
    const el = document.createElement('div');
    el.className = 'live-click-marker';
    const isSimMode = vizMode === 'similarity';
    el.innerHTML = `
      <div class="live-click-pin">
        <div class="live-click-pin-head"></div>
        <div class="live-click-pin-tail"></div>
      </div>
      ${isSimMode ? '<div class="live-click-pin-label">Reference Point</div>' : ''}
    `;
    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([lng, lat])
      .addTo(mapRef.current!);
    clickMarkerRef.current = marker;

    try {
      const resp = await fetch(
        `${GEE_PROXY_URL}/api/info?year=${year}&lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`
      );
      if (!resp.ok) {
        const data = await resp.json();
        setPointInfo(null);
        setError(data.error || 'No data at this location');
        setPointLoading(false);
        return;
      }
      const data = await resp.json();
      setPointInfo(data);
      setError(null);
    } catch (e) {
      setError('Failed to fetch embedding data');
    }
    setPointLoading(false);
  }, [geeAvailable, vizMode, year]);

  // Keep the ref up to date
  useEffect(() => {
    handleMapClickRef.current = handleMapClick;
  }, [handleMapClick]);

  // Load similarity tiles from a specific point
  const loadSimilarityTiles = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(
        `${GEE_PROXY_URL}/api/tiles/similarity?year=${year}&lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}&radius=500000`
      );
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      applyTileLayer(data.tileUrl);
    } catch (e: any) {
      setError(e.message || 'Failed to load similarity tiles');
    }
    setLoading(false);
  }, [year]);

  // Remove existing GEE tile layer
  const removeGEELayer = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      if (map.getLayer('gee-tiles-layer')) map.removeLayer('gee-tiles-layer');
      if (map.getSource('gee-tiles')) map.removeSource('gee-tiles');
    } catch (_) {}
    setTileLoaded(false);
  }, []);

  // Apply a GEE tile URL to the map
  const applyTileLayer = useCallback((tileUrl: string) => {
    const map = mapRef.current;
    if (!map) return;

    removeGEELayer();

    map.addSource('gee-tiles', {
      type: 'raster',
      tiles: [tileUrl],
      tileSize: 256,
      attribution: 'Google Earth Engine'
    });

    map.addLayer({
      id: 'gee-tiles-layer',
      type: 'raster',
      source: 'gee-tiles',
      paint: {
        'raster-opacity': 0.85,
        'raster-fade-duration': 300
      }
    });

    setTileLoaded(true);
  }, [removeGEELayer]);

  // Load tiles based on current viz mode
  const loadTiles = useCallback(async () => {
    if (!geeAvailable) return;
    setLoading(true);
    setError(null);

    try {
      let url = '';
      switch (vizMode) {
        case 'embeddings':
          url = `${GEE_PROXY_URL}/api/tiles/embeddings?year=${year}&bands=${bands}&min=-0.3&max=0.3`;
          break;
        case 'clustering': {
          const map = mapRef.current;
          const center = map ? map.getCenter() : { lat: 12.45, lng: 76.52 };
          const zoom = map ? Math.round(map.getZoom()) : 10;
          url = `${GEE_PROXY_URL}/api/tiles/clustering?year=${year}&lat=${center.lat.toFixed(4)}&lng=${center.lng.toFixed(4)}&zoom=${zoom}&clusters=${clusters}`;
          break;
        }
        case 'change':
          url = `${GEE_PROXY_URL}/api/tiles/change?year1=${year2}&year2=${year}&bands=${bands}`;
          break;
        case 'similarity':
          if (simPoint) {
            loadSimilarityTiles(simPoint.lat, simPoint.lng);
            return;
          } else {
            setLoading(false);
            setError('Click on the map to select a reference point');
            return;
          }
      }

      const resp = await fetch(url);
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      applyTileLayer(data.tileUrl);
    } catch (e: any) {
      setError(e.message || 'Failed to load tiles');
    }
    setLoading(false);
  }, [geeAvailable, vizMode, year, year2, bands, clusters, simPoint, applyTileLayer, loadSimilarityTiles]);

  const VIZ_MODES = [
    { id: 'embeddings' as VizMode, label: 'Embedding RGB', icon: '🎨', desc: 'Visualize 3 embedding axes as RGB' },
    { id: 'clustering' as VizMode, label: 'Clustering', icon: '🎯', desc: 'K-means on 64-dim embeddings' },
    { id: 'change' as VizMode, label: 'Change Detection', icon: '📈', desc: 'Embedding difference between years' },
    { id: 'similarity' as VizMode, label: 'Similarity Search', icon: '🔍', desc: 'Find similar areas to a point' },
  ];

  if (geeAvailable === false) {
    return (
      <section ref={sectionRef} className="section live-explorer-section" data-section="explorer">
        <div className="container">
          <div className="section-header fade-in">
            <span className="section-label">Live Earth Engine</span>
            <h2>Live Explorer</h2>
          </div>
          <div className="live-unavailable fade-in">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <h3>GEE Backend Not Available</h3>
            <p>
              The Google Earth Engine proxy server is not running on port 3013.
              View the static embedding demos below, or start the proxy server:
            </p>
            <code>cd ~/clawd/projects/foundational-models/gee-proxy && pm2 start server.py --name gee-proxy --interpreter python3</code>
          </div>
        </div>
      </section>
    );
  }

  if (geeAvailable === null) {
    return (
      <section ref={sectionRef} className="section live-explorer-section" data-section="explorer">
        <div className="container">
          <div className="section-header fade-in">
            <span className="section-label">Live Earth Engine</span>
            <h2>Live Explorer</h2>
          </div>
          <div className="live-unavailable fade-in">
            <div className="stac-spinner" />
            <span>Connecting to GEE proxy…</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="section live-explorer-section" data-section="explorer">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">Live Earth Engine</span>
          <h2>Live Explorer</h2>
          <p className="section-subtitle">
            Explore real AlphaEarth geo-embeddings — 64-dimensional vectors that encode 
            the Earth's surface at 4km resolution. Click anywhere to see what a LEOM 
            actually produces. Each pixel contains a 64-dimensional vector learned by 
            AlphaEarth from multi-modal satellite data (Sentinel-1/2, Landsat, GEDI LiDAR, climate). 
            These vectors are unit-length (normalized to the 64-dimensional hypersphere), 
            meaning similar landscapes have high dot product / cosine similarity.
            Recent benchmarking research confirms that Large Earth Observation Models like this 
            consistently outperform traditional task-specific models, especially when labeled training data is limited.
            This viewer displays actual embeddings from Google Earth Engine — the official AlphaEarth dataset: <a href="https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL" target="_blank" rel="noopener"><code>GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL</code></a>.
          </p>
        </div>

        {/* What They Unlock - 4 boxes */}
        <div className="live-unlock-boxes fade-in">
          <div className="live-unlock-box">
            <span className="unlock-icon">🔍</span>
            <strong>Similarity Search</strong>
            <p>Draw a box around deforestation in Brazil → instantly find every similar pattern globally. No training, no labels — just vector math.</p>
            <span className="unlock-stat">&lt; 1 sec global</span>
          </div>
          <div className="live-unlock-box">
            <span className="unlock-icon">🌾</span>
            <strong>Label Efficiency</strong>
            <p>Research shows foundation models consistently outperform task-specific models when training data is limited (Dionelis et al. 2024). A few labels on embeddings beat thousands of pixels for crop mapping.</p>
            <span className="unlock-stat">10× fewer labels</span>
          </div>
          <div className="live-unlock-box">
            <span className="unlock-icon">⏱️</span>
            <strong>Temporal Intelligence</strong>
            <p>Compare embeddings of the same location over time. Sudden vector shift = change event (fire, flood, deforestation, construction). No baselines required.</p>
            <span className="unlock-stat">64-dim monitoring</span>
          </div>
          <div className="live-unlock-box">
            <span className="unlock-icon">📡</span>
            <strong>Cross-Modal</strong>
            <p>SAR radar and optical imagery produce comparable embeddings — so cloudy regions still get analyzed. Shanghai and Chicago cluster together (urban), far from adjacent farmland.</p>
            <span className="unlock-stat">∞ weather independence</span>
          </div>
        </div>

      </div>

      <div className="live-wrapper fade-in">
        {/* Controls bar */}
        <div className="live-controls">
          <div className="live-mode-selector">
            {VIZ_MODES.map(mode => (
              <button
                key={mode.id}
                className={`live-mode-btn ${vizMode === mode.id ? 'active' : ''}`}
                onClick={() => {
                  setVizMode(mode.id);
                  removeGEELayer();
                  setSimPoint(null);
                }}
                title={mode.desc}
              >
                <span className="live-mode-icon">{mode.icon}</span>
                <span className="live-mode-label">{mode.label}</span>
              </button>
            ))}
          </div>

          <div className="live-params">
            {/* Year selector */}
            <div className="live-param">
              <label>Year</label>
              <select value={year} onChange={e => setYear(Number(e.target.value))}>
                {[2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Change detection: second year */}
            {vizMode === 'change' && (
              <div className="live-param">
                <label>Compare to</label>
                <select value={year2} onChange={e => setYear2(Number(e.target.value))}>
                  {[2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Band preset selector */}
            {(vizMode === 'embeddings' || vizMode === 'change') && (
              <div className="live-param">
                <label>Bands</label>
                <select value={bands} onChange={e => setBands(e.target.value)}>
                  {Object.entries(BAND_PRESETS).map(([name, val]) => (
                    <option key={name} value={val}>{name} ({val})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Cluster count */}
            {vizMode === 'clustering' && (
              <div className="live-param">
                <label>Clusters: {clusters}</label>
                <input
                  type="range"
                  min="2"
                  max="15"
                  value={clusters}
                  onChange={e => setClusters(Number(e.target.value))}
                />
              </div>
            )}

            {/* Load button */}
            <button
              className="live-load-btn"
              onClick={loadTiles}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="stac-spinner" style={{ width: 14, height: 14 }} />
                  Loading…
                </>
              ) : (
                vizMode === 'similarity' && !simPoint
                  ? '← Click map first'
                  : '🌍 Load Tiles'
              )}
            </button>

            {/* Clear overlay */}
            {tileLoaded && (
              <button
                className="live-clear-btn"
                onClick={() => {
                  removeGEELayer();
                  setSimPoint(null);
                }}
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {/* Current mode description */}
        <div className="live-mode-description fade-in">
          <span className="mode-desc-icon">{VIZ_MODES.find(m => m.id === vizMode)?.icon}</span>
          <span className="mode-desc-text">{MODE_DESCRIPTIONS[vizMode]}</span>
        </div>

        {/* Map */}
        <div className="live-map-container-wrapper">
          <div ref={mapContainer} className="live-map-container" />

          {/* Status badge */}
          {tileLoaded && (
            <div className="overlay-badge">
              <span className="overlay-badge-dot" />
              GEE: {VIZ_MODES.find(m => m.id === vizMode)?.label} ({year})
              <button className="overlay-badge-close" onClick={() => {
                removeGEELayer();
                setSimPoint(null);
              }}>×</button>
            </div>
          )}

          {/* Visualization Legend */}
          {tileLoaded && (
            <div className="live-legend">
              {vizMode === 'similarity' && (
                <>
                  <div className="live-legend-title">Cosine Similarity</div>
                  <div className="live-legend-gradient sim-gradient" />
                  <div className="live-legend-labels">
                    <span>1.0 — High</span>
                    <span>0.5</span>
                    <span>0.0 — Low</span>
                  </div>
                </>
              )}
              {vizMode === 'embeddings' && (
                <>
                  <div className="live-legend-title">Embedding RGB</div>
                  <div className="live-legend-desc">3 embedding axes → R/G/B channels</div>
                  <div className="live-legend-labels">
                    <span style={{color:'#ef4444'}}>■ {bands.split(',')[0]}</span>
                    <span style={{color:'#22c55e'}}>■ {bands.split(',')[1]}</span>
                    <span style={{color:'#3b82f6'}}>■ {bands.split(',')[2]}</span>
                  </div>
                </>
              )}
              {vizMode === 'clustering' && (
                <>
                  <div className="live-legend-title">K-Means Clusters</div>
                  <div className="live-legend-desc">{clusters} clusters on 64-dim embeddings</div>
                  <div className="live-legend-labels">
                    <span>Each color = distinct landscape group</span>
                  </div>
                </>
              )}
              {vizMode === 'change' && (
                <>
                  <div className="live-legend-title">Change Detection</div>
                  <div className="live-legend-gradient change-gradient" />
                  <div className="live-legend-labels">
                    <span>No change</span>
                    <span>Moderate</span>
                    <span>High change</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Click hint */}
          {!pointInfo && !pointLoading && geeAvailable && (
            <div className="live-click-hint">
              Click anywhere on the map to inspect the embedding vector
              {vizMode === 'similarity' && ' and find similar areas'}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="live-error">
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)}>✕</button>
            </div>
          )}

          {/* Info panel */}
          <InfoPanel
            info={pointInfo}
            loading={pointLoading}
            onClose={() => {
              setPointInfo(null);
              setPointLoading(false);
              if (clickMarkerRef.current) {
                clickMarkerRef.current.remove();
                clickMarkerRef.current = null;
              }
            }}
          />
        </div>

        {/* Help text */}
        <div className="live-help">
          <div className="live-help-item">
            <strong>🎨 Embedding RGB:</strong> Map 3 of the 64 embedding dimensions to Red/Green/Blue channels. Different colors = different landscape types.
          </div>
          <div className="live-help-item">
            <strong>🎯 Clustering:</strong> Run K-means on all 64 embedding dimensions in the visible area. Colors show natural landscape groupings.
          </div>
          <div className="live-help-item">
            <strong>📈 Change Detection:</strong> Subtract embeddings between two years. Bright colors indicate significant landscape changes.
          </div>
          <div className="live-help-item">
            <strong>🔍 Similarity:</strong> Click a point, then load tiles. Warm colors show areas with similar 64-dim embeddings (cosine similarity).
          </div>
        </div>
      </div>
    </section>
  );
}
