import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { caseStudies, CaseStudy } from '../data/caseStudies';

// GEE Proxy for AlphaEarth tiles
const GEE_PROXY_URL = import.meta.env.PROD
  ? 'https://gee-proxy-787413290356.us-east1.run.app'
  : '/gee';

type ViewMode = 'before' | 'after' | 'alphaearth';

const APPLICATION_LABELS: Record<string, string> = {
  'change-detection': 'Change Detection',
  'classification': 'Classification',
  'urban-analysis': 'Urban Analysis',
  'disaster': 'Disaster Response'
};

// ===== Study Panel Component =====
function StudyPanel({
  study,
  viewMode,
  setViewMode,
  loading,
  onClose
}: {
  study: CaseStudy;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="case-study-panel">
      <div className="case-panel-header">
        <div className="case-panel-title">
          <h3>{study.title}</h3>
          <span className="case-panel-location">{study.location}</span>
        </div>
        <button className="case-panel-close" onClick={onClose} title="Close and zoom out">
          ✕
        </button>
      </div>
      
      <p className="case-panel-desc">{study.detail}</p>
      
      <div className="case-panel-app">
        <span className="case-app-badge">{APPLICATION_LABELS[study.application]}</span>
      </div>

      {loading ? (
        <div className="case-panel-loading">
          <div className="loading-spinner"></div>
          <span>Loading imagery...</span>
        </div>
      ) : (
        <>
          <div className="case-panel-legend">
            <span className="legend-label">Visualization:</span>
            <div className="legend-buttons">
              <button
                className={`legend-btn ${viewMode === 'before' ? 'active' : ''}`}
                onClick={() => setViewMode('before')}
              >
                <span className="legend-icon">📅</span>
                Before ({study.beforeYear})
              </button>
              <button
                className={`legend-btn ${viewMode === 'after' ? 'active' : ''}`}
                onClick={() => setViewMode('after')}
              >
                <span className="legend-icon">📅</span>
                After ({study.afterYear})
              </button>
              <button
                className={`legend-btn ${viewMode === 'alphaearth' ? 'active' : ''}`}
                onClick={() => setViewMode('alphaearth')}
              >
                <span className="legend-icon">🧠</span>
                AlphaEarth
              </button>
            </div>
          </div>
          
          <p className="case-panel-hint">
            {viewMode === 'alphaearth' 
              ? 'AlphaEarth embedding visualization (RGB from 64D). Similar colors = similar landscape types.'
              : `Sentinel-2 optical imagery from ${viewMode === 'before' ? study.beforeYear : study.afterYear}.`
            }
          </p>
        </>
      )}
    </div>
  );
}

// ===== Main Component =====
export default function CaseStudyMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  
  const [selectedStudy, setSelectedStudy] = useState<CaseStudy | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('before');
  const [loading, setLoading] = useState(false);
  const [geeLayerId, setGeeLayerId] = useState<string | null>(null);

  // Americas-centered view
  const INITIAL_CENTER: [number, number] = [-70, 5];
  const INITIAL_ZOOM = 3;

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
            tileSize: 256,
            attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
          }
        },
        layers: [{ id: 'carto-dark-layer', type: 'raster', source: 'carto-dark' }]
      },
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      maxZoom: 15
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    // Add markers for each study
    map.on('load', () => {
      caseStudies.forEach(study => {
        const el = document.createElement('div');
        el.className = 'case-marker';
        el.style.backgroundColor = study.color;
        el.innerHTML = `<span class="case-marker-pulse"></span>`;
        el.title = study.title;

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(study.coords)
          .addTo(map);

        el.addEventListener('click', () => selectStudy(study));
        markersRef.current.push(marker);
      });
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle study selection
  const selectStudy = useCallback((study: CaseStudy) => {
    const map = mapRef.current;
    if (!map) return;

    setSelectedStudy(study);
    setViewMode('before');
    setLoading(true);

    // Zoom to study area
    map.flyTo({
      center: study.coords,
      zoom: study.zoom,
      duration: 1500
    });

    // Simulate loading then show imagery
    setTimeout(() => {
      setLoading(false);
      loadImagery(study, 'before');
    }, 800);
  }, []);

  // Load imagery based on view mode
  const loadImagery = useCallback(async (study: CaseStudy, mode: ViewMode) => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing GEE layer
    if (geeLayerId && map.getLayer(geeLayerId)) {
      map.removeLayer(geeLayerId);
      map.removeSource(geeLayerId);
    }

    const layerId = `gee-layer-${Date.now()}`;
    
    try {
      let tileUrl: string;
      
      if (mode === 'alphaearth') {
        // Get AlphaEarth embedding tiles
        const resp = await fetch(
          `${GEE_PROXY_URL}/api/tiles/embeddings?year=${study.afterYear}&bands=A01,A16,A09&min=-0.3&max=0.3`
        );
        const data = await resp.json();
        tileUrl = data.tileUrl;
      } else {
        // Get Sentinel-2 optical tiles via GEE
        const year = mode === 'before' ? study.beforeYear : study.afterYear;
        const resp = await fetch(
          `${GEE_PROXY_URL}/api/tiles/optical?year=${year}&bbox=${study.bbox.join(',')}`
        );
        const data = await resp.json();
        tileUrl = data.tileUrl;
      }

      if (tileUrl) {
        map.addSource(layerId, {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256
        });

        map.addLayer({
          id: layerId,
          type: 'raster',
          source: layerId,
          paint: { 'raster-opacity': 0.85 }
        }, 'carto-dark-layer');

        setGeeLayerId(layerId);
      }
    } catch (err) {
      console.error('Failed to load imagery:', err);
    }
  }, [geeLayerId]);

  // Update imagery when view mode changes
  useEffect(() => {
    if (selectedStudy && !loading) {
      loadImagery(selectedStudy, viewMode);
    }
  }, [viewMode, selectedStudy, loading]);

  // Close panel and zoom out
  const handleClose = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove imagery layer
    if (geeLayerId && map.getLayer(geeLayerId)) {
      map.removeLayer(geeLayerId);
      map.removeSource(geeLayerId);
    }
    setGeeLayerId(null);
    setSelectedStudy(null);

    // Zoom back out
    map.flyTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      duration: 1200
    });
  }, [geeLayerId]);

  return (
    <section className="section case-study-section" data-section="cases">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">Real Applications</span>
          <h2>Case Studies</h2>
          <p className="section-subtitle">
            Explore real-world applications of LEOMs. Click a location to see before/after satellite imagery 
            and AlphaEarth embedding visualizations. These examples demonstrate how geo-embeddings 
            enable change detection, classification, and analysis without custom model training.
          </p>
        </div>

        <div className="case-study-container fade-in">
          <div className="case-map-wrapper" ref={mapContainerRef}>
            {/* Map renders here */}
          </div>

          {selectedStudy && (
            <StudyPanel
              study={selectedStudy}
              viewMode={viewMode}
              setViewMode={setViewMode}
              loading={loading}
              onClose={handleClose}
            />
          )}

          {!selectedStudy && (
            <div className="case-instructions">
              <div className="case-instruction-icon">📍</div>
              <p>Click a marker to explore a case study</p>
              <div className="case-study-list">
                {caseStudies.map(s => (
                  <button 
                    key={s.id} 
                    className="case-study-chip"
                    style={{ borderColor: s.color }}
                    onClick={() => selectStudy(s)}
                  >
                    <span className="chip-dot" style={{ backgroundColor: s.color }}></span>
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
