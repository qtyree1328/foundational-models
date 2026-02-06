import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { caseStudies, CaseStudy } from '../data/caseStudies';

// GEE Proxy for AlphaEarth tiles
const GEE_PROXY_URL = import.meta.env.PROD
  ? 'https://gee-proxy-787413290356.us-east1.run.app'
  : '/gee';

type ViewMode = 'before' | 'after' | 'alphaearth';

interface TileCache {
  before: string | null;
  after: string | null;
  alphaearth: string | null;
}

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
        <button className="case-panel-close" onClick={onClose} title="Close">
          ✕
        </button>
      </div>
      
      <p className="case-panel-desc">{study.detail}</p>
      
      <div className="case-panel-meta">
        <span className="case-app-badge">{APPLICATION_LABELS[study.application]}</span>
        <a href={study.sourceUrl} target="_blank" rel="noopener" className="case-source-link">
          {study.source} ↗
        </a>
      </div>

      <div className="case-panel-legend">
        <div className="legend-buttons-compact">
          <button
            className={`legend-btn-sm ${viewMode === 'before' ? 'active' : ''}`}
            onClick={() => setViewMode('before')}
            disabled={loading}
          >
            {study.beforeYear}
          </button>
          <button
            className={`legend-btn-sm ${viewMode === 'after' ? 'active' : ''}`}
            onClick={() => setViewMode('after')}
            disabled={loading}
          >
            {study.afterYear}
          </button>
          <button
            className={`legend-btn-sm alpha ${viewMode === 'alphaearth' ? 'active' : ''}`}
            onClick={() => setViewMode('alphaearth')}
            disabled={loading}
          >
            LEOM
          </button>
        </div>
      </div>
      
      <p className="case-panel-hint">
        {viewMode === 'alphaearth' 
          ? 'AlphaEarth embeddings — similar colors indicate similar land types.'
          : `Sentinel-2 imagery, ${viewMode === 'before' ? study.beforeYear : study.afterYear}`
        }
      </p>
    </div>
  );
}

// ===== Main Component =====
export default function CaseStudyMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  
  const [selectedStudy, setSelectedStudy] = useState<CaseStudy | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('before');
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [tileCache, setTileCache] = useState<TileCache>({ before: null, after: null, alphaearth: null });
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  // Central America centered, more zoomed out
  const INITIAL_CENTER: [number, number] = [-85, 12];
  const INITIAL_ZOOM = 2.5;

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'carto-voyager': {
            type: 'raster',
            tiles: ['https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'],
            tileSize: 256,
            attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
          }
        },
        layers: [{ id: 'basemap', type: 'raster', source: 'carto-voyager' }]
      },
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      maxZoom: 15
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      // Add case study points as GeoJSON (no lag)
      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: caseStudies.map(study => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: study.coords },
          properties: { id: study.id, title: study.title, color: study.color }
        }))
      };

      map.addSource('case-studies', { type: 'geojson', data: geojson });

      map.addLayer({
        id: 'case-markers-glow',
        type: 'circle',
        source: 'case-studies',
        paint: {
          'circle-radius': 18,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.25,
          'circle-blur': 1
        }
      });

      map.addLayer({
        id: 'case-markers',
        type: 'circle',
        source: 'case-studies',
        paint: {
          'circle-radius': 10,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      map.on('click', 'case-markers', (e) => {
        if (e.features && e.features[0]) {
          const id = e.features[0].properties?.id;
          const study = caseStudies.find(s => s.id === id);
          if (study) selectStudy(study);
        }
      });

      map.on('mouseenter', 'case-markers', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'case-markers', () => {
        map.getCanvas().style.cursor = '';
      });

      setMapReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Pre-load ALL 3 tile URLs when a study is selected
  const preloadAllLayers = useCallback(async (study: CaseStudy) => {
    setLoading(true);

    try {
      // Fetch all 3 tile URLs in parallel
      const [beforeResp, afterResp, alphaResp] = await Promise.all([
        fetch(`${GEE_PROXY_URL}/api/tiles/optical?year=${study.beforeYear}&bbox=${study.bbox.join(',')}`),
        fetch(`${GEE_PROXY_URL}/api/tiles/optical?year=${study.afterYear}&bbox=${study.bbox.join(',')}`),
        fetch(`${GEE_PROXY_URL}/api/tiles/embeddings?year=${study.afterYear}&bands=A01,A16,A09&min=-0.3&max=0.3`)
      ]);

      const [beforeData, afterData, alphaData] = await Promise.all([
        beforeResp.json(),
        afterResp.json(),
        alphaResp.json()
      ]);

      const cache: TileCache = {
        before: beforeData.tileUrl || null,
        after: afterData.tileUrl || null,
        alphaearth: alphaData.tileUrl || null
      };

      setTileCache(cache);

      // Now add the initial layer (before) to map
      if (cache.before) {
        showLayer('before', cache);
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to preload layers:', err);
      setLoading(false);
    }
  }, []);

  // Show a specific layer from cache (instant swap)
  const showLayer = useCallback((mode: ViewMode, cache?: TileCache) => {
    const map = mapRef.current;
    if (!map) return;

    const tiles = cache || tileCache;
    const tileUrl = tiles[mode];
    if (!tileUrl) return;

    // Remove existing layer
    if (activeLayerId) {
      if (map.getLayer(activeLayerId)) map.removeLayer(activeLayerId);
      if (map.getSource(activeLayerId)) map.removeSource(activeLayerId);
    }

    const layerId = `layer-${mode}-${Date.now()}`;

    map.addSource(layerId, {
      type: 'raster',
      tiles: [tileUrl],
      tileSize: 256
    });

    map.addLayer({
      id: layerId,
      type: 'raster',
      source: layerId,
      paint: { 'raster-opacity': 0.9 }
    }, 'case-markers-glow');

    setActiveLayerId(layerId);
  }, [activeLayerId, tileCache]);

  // Handle study selection
  const selectStudy = useCallback((study: CaseStudy) => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous layer
    if (activeLayerId) {
      if (map.getLayer(activeLayerId)) map.removeLayer(activeLayerId);
      if (map.getSource(activeLayerId)) map.removeSource(activeLayerId);
      setActiveLayerId(null);
    }

    setSelectedStudy(study);
    setViewMode('before');
    setTileCache({ before: null, after: null, alphaearth: null });

    // Zoom to study area
    map.flyTo({
      center: study.coords,
      zoom: study.zoom,
      duration: 1500
    });

    // Pre-load all 3 layers
    preloadAllLayers(study);
  }, [activeLayerId, preloadAllLayers]);

  // Switch layer when view mode changes (instant, no loading)
  useEffect(() => {
    if (selectedStudy && !loading && tileCache[viewMode]) {
      showLayer(viewMode);
    }
  }, [viewMode]);

  // Close panel and zoom out
  const handleClose = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (activeLayerId) {
      if (map.getLayer(activeLayerId)) map.removeLayer(activeLayerId);
      if (map.getSource(activeLayerId)) map.removeSource(activeLayerId);
    }

    setActiveLayerId(null);
    setSelectedStudy(null);
    setTileCache({ before: null, after: null, alphaearth: null });

    map.flyTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      duration: 1200
    });
  }, [activeLayerId]);

  return (
    <section className="section case-study-section" data-section="cases">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">Real Applications</span>
          <h2>Case Studies</h2>
          <p className="section-subtitle">
            Click a marker to explore real-world LEOM applications with before/after imagery.
          </p>
        </div>

        <div className="case-study-container fade-in">
          {loading && (
            <div className="case-loading-overlay">
              <div className="case-loading-spinner"></div>
              <span>Loading all imagery layers...</span>
            </div>
          )}

          <div className="case-map-wrapper" ref={mapContainerRef} />

          {selectedStudy && (
            <StudyPanel
              study={selectedStudy}
              viewMode={viewMode}
              setViewMode={setViewMode}
              loading={loading}
              onClose={handleClose}
            />
          )}

          {!selectedStudy && mapReady && (
            <div className="case-instructions-simple">
              <span>👆 Click a pin to explore</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
