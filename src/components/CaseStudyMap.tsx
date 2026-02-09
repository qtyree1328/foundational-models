import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { caseStudies, CaseStudy } from '../data/caseStudies';

// GEE Proxy for AlphaEarth tiles
const GEE_PROXY_URL = import.meta.env.PROD
  ? 'https://gee-proxy-787413290356.us-east1.run.app'
  : '/gee';

type ViewMode = 'before' | 'after' | 'alphaearth' | 'cdl';

interface TileCache {
  before: string | null;
  after: string | null;
  alphaearth: string | null;
  cdl: string | null;
}

const APPLICATION_LABELS: Record<string, string> = {
  'change-detection': 'Change Detection',
  'classification': 'Classification',
  'urban-analysis': 'Urban Analysis',
  'disaster': 'Disaster Response'
};

// ===== Study Panel for Change Detection (before/after) =====
function ChangeDetectionPanel({
  study,
  viewMode,
  setViewMode,
  loading
}: {
  study: CaseStudy;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  loading: boolean;
}) {
  return (
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
  );
}

// ===== Study Panel for Classification (year selector + CDL/AlphaEarth slider) =====
function ClassificationPanel({
  study,
  sliderValue,
  setSliderValue,
  selectedYear,
  setSelectedYear,
  loading,
  onYearChange
}: {
  study: CaseStudy;
  sliderValue: number;
  setSliderValue: (val: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  loading: boolean;
  onYearChange: (year: number) => void;
}) {
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(e.target.value);
    setSelectedYear(year);
    onYearChange(year);
  };

  return (
    <div className="case-panel-legend">
      <div className="year-selector-row">
        <label>Year:</label>
        <select 
          value={selectedYear} 
          onChange={handleYearChange}
          disabled={loading}
          className="year-select"
        >
          {study.availableYears?.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      <div className="comparison-slider-container">
        <span className="slider-label-left">CDL</span>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={(e) => setSliderValue(parseInt(e.target.value))}
          disabled={loading}
          className="comparison-slider"
        />
        <span className="slider-label-right">LEOM</span>
      </div>
    </div>
  );
}

// ===== Study Panel Component =====
function StudyPanel({
  study,
  viewMode,
  setViewMode,
  sliderValue,
  setSliderValue,
  selectedYear,
  setSelectedYear,
  loading,
  onClose,
  onYearChange
}: {
  study: CaseStudy;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sliderValue: number;
  setSliderValue: (val: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  loading: boolean;
  onClose: () => void;
  onYearChange: (year: number) => void;
}) {
  const getHintText = () => {
    if (study.yearSelectable) {
      if (sliderValue <= 25) {
        return `USDA Cropland Data Layer ${selectedYear} — supervised classification of crop types.`;
      } else if (sliderValue >= 75) {
        return `AlphaEarth embeddings ${selectedYear} — unsupervised clustering reveals crop patterns.`;
      } else {
        return `Blending CDL (${100 - sliderValue}%) with AlphaEarth embeddings (${sliderValue}%).`;
      }
    }
    const beforeLabel = study.beforeMonth 
      ? `${getMonthName(study.beforeMonth)} ${study.beforeYear}` 
      : study.beforeYear;
    const afterLabel = study.afterMonth 
      ? `${getMonthName(study.afterMonth)} ${study.afterYear}` 
      : study.afterYear;
    return viewMode === 'alphaearth' 
      ? `AlphaEarth embeddings — similar colors indicate similar land types.`
      : `Sentinel-2 imagery, ${viewMode === 'before' ? beforeLabel : afterLabel}`;
  };

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

      {study.yearSelectable ? (
        <ClassificationPanel
          study={study}
          sliderValue={sliderValue}
          setSliderValue={setSliderValue}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          loading={loading}
          onYearChange={onYearChange}
        />
      ) : (
        <ChangeDetectionPanel
          study={study}
          viewMode={viewMode}
          setViewMode={setViewMode}
          loading={loading}
        />
      )}
      
      <p className="case-panel-hint">{getHintText()}</p>
    </div>
  );
}

// Helper function for month names
function getMonthName(month: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] || '';
}

// ===== Main Component =====
export default function CaseStudyMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  
  const [selectedStudy, setSelectedStudy] = useState<CaseStudy | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('before');
  const [selectedYear, setSelectedYear] = useState<number>(2022);
  const [sliderValue, setSliderValue] = useState<number>(0); // 0 = CDL, 100 = AlphaEarth
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [tileCache, setTileCache] = useState<TileCache>({ before: null, after: null, alphaearth: null, cdl: null });
  const [activeLayerIds, setActiveLayerIds] = useState<string[]>([]);
  const [allTilesPreloaded, setAllTilesPreloaded] = useState(false);

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

  // Pre-load ALL layers based on study type, keep loading until all are ready
  const preloadLayers = useCallback(async (study: CaseStudy, year?: number) => {
    const map = mapRef.current;
    if (!map) return;

    setLoading(true);
    setAllTilesPreloaded(false);

    try {
      let cache: TileCache = { before: null, after: null, alphaearth: null, cdl: null };

      if (study.yearSelectable) {
        // Classification study: load CDL and AlphaEarth for selected year
        const targetYear = year || study.availableYears?.[study.availableYears.length - 1] || 2022;
        
        const [cdlResp, alphaResp] = await Promise.all([
          fetch(`${GEE_PROXY_URL}/api/tiles/cdl?year=${targetYear}&bbox=${study.bbox.join(',')}`),
          fetch(`${GEE_PROXY_URL}/api/tiles/embeddings?year=${targetYear}&bands=A01,A16,A09&min=-0.3&max=0.3`)
        ]);

        const [cdlData, alphaData] = await Promise.all([
          cdlResp.json(),
          alphaResp.json()
        ]);

        cache = {
          before: null,
          after: null,
          cdl: cdlData.tileUrl || null,
          alphaearth: alphaData.tileUrl || null
        };

        setTileCache(cache);
        
        // Add BOTH layers and wait for them to load
        await addBothClassificationLayers(map, cache);
        
      } else {
        // Change detection study: load before/after/alphaearth with optional month params
        const beforeParams = new URLSearchParams({
          year: study.beforeYear.toString(),
          bbox: study.bbox.join(','),
          ...(study.beforeMonth && { month: study.beforeMonth.toString() })
        });
        const afterParams = new URLSearchParams({
          year: study.afterYear.toString(),
          bbox: study.bbox.join(','),
          ...(study.afterMonth && { month: study.afterMonth.toString() })
        });

        const [beforeResp, afterResp, alphaResp] = await Promise.all([
          fetch(`${GEE_PROXY_URL}/api/tiles/optical?${beforeParams}`),
          fetch(`${GEE_PROXY_URL}/api/tiles/optical?${afterParams}`),
          fetch(`${GEE_PROXY_URL}/api/tiles/embeddings?year=${study.afterYear}&bands=A01,A16,A09&min=-0.3&max=0.3`)
        ]);

        const [beforeData, afterData, alphaData] = await Promise.all([
          beforeResp.json(),
          afterResp.json(),
          alphaResp.json()
        ]);

        cache = {
          before: beforeData.tileUrl || null,
          after: afterData.tileUrl || null,
          alphaearth: alphaData.tileUrl || null,
          cdl: null
        };

        setTileCache(cache);
        
        // Add ALL three layers and wait for them to load
        await addAllChangeDetectionLayers(map, cache);
      }
    } catch (err) {
      console.error('Failed to preload layers:', err);
      setLoading(false);
    }
  }, []);

  // Add both CDL and AlphaEarth layers, return promise when both are loaded
  const addBothClassificationLayers = async (map: maplibregl.Map, cache: TileCache) => {
    // Clean up existing layers
    activeLayerIds.forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });

    const newLayerIds: string[] = [];
    const timestamp = Date.now();

    // Add CDL layer (visible, bottom)
    if (cache.cdl) {
      const cdlId = `layer-cdl-${timestamp}`;
      map.addSource(cdlId, { type: 'raster', tiles: [cache.cdl], tileSize: 256 });
      map.addLayer({ id: cdlId, type: 'raster', source: cdlId, paint: { 'raster-opacity': 1 } }, 'case-markers-glow');
      newLayerIds.push(cdlId);
    }

    // Add AlphaEarth layer (hidden, on top)
    if (cache.alphaearth) {
      const alphaId = `layer-alphaearth-${timestamp}`;
      map.addSource(alphaId, { type: 'raster', tiles: [cache.alphaearth], tileSize: 256 });
      map.addLayer({ id: alphaId, type: 'raster', source: alphaId, paint: { 'raster-opacity': 0 } }, 'case-markers-glow');
      newLayerIds.push(alphaId);
    }

    setActiveLayerIds(newLayerIds);
    setSliderValue(0); // Start with CDL

    // Wait for map to be idle (all tiles loaded)
    return new Promise<void>((resolve) => {
      map.once('idle', () => {
        setLoading(false);
        setAllTilesPreloaded(true);
        resolve();
      });
    });
  };

  // Add all three change detection layers, return promise when all are loaded
  const addAllChangeDetectionLayers = async (map: maplibregl.Map, cache: TileCache) => {
    // Clean up existing layers
    activeLayerIds.forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });

    const newLayerIds: string[] = [];
    const timestamp = Date.now();

    // Add before layer (visible)
    if (cache.before) {
      const beforeId = `layer-before-${timestamp}`;
      map.addSource(beforeId, { type: 'raster', tiles: [cache.before], tileSize: 256 });
      map.addLayer({ id: beforeId, type: 'raster', source: beforeId, paint: { 'raster-opacity': 0.9 } }, 'case-markers-glow');
      newLayerIds.push(beforeId);
    }

    // Add after layer (hidden)
    if (cache.after) {
      const afterId = `layer-after-${timestamp}`;
      map.addSource(afterId, { type: 'raster', tiles: [cache.after], tileSize: 256 });
      map.addLayer({ id: afterId, type: 'raster', source: afterId, paint: { 'raster-opacity': 0 } }, 'case-markers-glow');
      newLayerIds.push(afterId);
    }

    // Add alphaearth layer (hidden)
    if (cache.alphaearth) {
      const alphaId = `layer-alphaearth-${timestamp}`;
      map.addSource(alphaId, { type: 'raster', tiles: [cache.alphaearth], tileSize: 256 });
      map.addLayer({ id: alphaId, type: 'raster', source: alphaId, paint: { 'raster-opacity': 0 } }, 'case-markers-glow');
      newLayerIds.push(alphaId);
    }

    setActiveLayerIds(newLayerIds);
    setViewMode('before');

    // Wait for map to be idle (all tiles loaded)
    return new Promise<void>((resolve) => {
      map.once('idle', () => {
        setLoading(false);
        setAllTilesPreloaded(true);
        resolve();
      });
    });
  };

  // Update layer opacities for classification slider (instant, no loading)
  const updateSliderOpacities = useCallback((value: number) => {
    const map = mapRef.current;
    if (!map || !allTilesPreloaded) return;

    // value: 0 = 100% CDL, 100 = 100% AlphaEarth
    const cdlOpacity = 1 - (value / 100);
    const alphaOpacity = value / 100;

    activeLayerIds.forEach(id => {
      if (id.includes('cdl') && map.getLayer(id)) {
        map.setPaintProperty(id, 'raster-opacity', cdlOpacity);
      }
      if (id.includes('alphaearth') && map.getLayer(id)) {
        map.setPaintProperty(id, 'raster-opacity', alphaOpacity);
      }
    });
  }, [activeLayerIds, allTilesPreloaded]);

  // Update layer opacities for change detection toggle (instant, no loading)
  const updateChangeDetectionOpacities = useCallback((mode: ViewMode) => {
    const map = mapRef.current;
    if (!map || !allTilesPreloaded) return;

    activeLayerIds.forEach(id => {
      if (map.getLayer(id)) {
        let opacity = 0;
        if (mode === 'before' && id.includes('before')) opacity = 0.9;
        if (mode === 'after' && id.includes('after')) opacity = 0.9;
        if (mode === 'alphaearth' && id.includes('alphaearth')) opacity = 0.9;
        map.setPaintProperty(id, 'raster-opacity', opacity);
      }
    });
  }, [activeLayerIds, allTilesPreloaded]);

  // Handle study selection
  const selectStudy = useCallback((study: CaseStudy) => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous layers
    activeLayerIds.forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });
    setActiveLayerIds([]);

    setSelectedStudy(study);
    setTileCache({ before: null, after: null, alphaearth: null, cdl: null });
    setAllTilesPreloaded(false);

    // Set initial view mode based on study type
    if (study.yearSelectable) {
      setViewMode('cdl');
      setSliderValue(0);
      const defaultYear = study.availableYears?.[study.availableYears.length - 1] || 2022;
      setSelectedYear(defaultYear);
    } else {
      setViewMode('before');
    }

    // Zoom to study area
    map.flyTo({
      center: study.coords,
      zoom: study.zoom,
      duration: 1500
    });

    // Pre-load ALL layers (loading will stay until all are ready)
    preloadLayers(study);
  }, [activeLayerIds, preloadLayers]);

  // Handle year change for classification studies
  const handleYearChange = useCallback((year: number) => {
    if (!selectedStudy || !selectedStudy.yearSelectable) return;
    
    // Clear cache and reload all layers
    setTileCache({ before: null, after: null, alphaearth: null, cdl: null });
    setAllTilesPreloaded(false);
    preloadLayers(selectedStudy, year);
  }, [selectedStudy, preloadLayers]);

  // Instantly update opacity when slider changes (no loading, tiles already cached)
  useEffect(() => {
    if (selectedStudy?.yearSelectable && allTilesPreloaded) {
      updateSliderOpacities(sliderValue);
    }
  }, [sliderValue, updateSliderOpacities, selectedStudy, allTilesPreloaded]);

  // Instantly switch layer visibility when view mode changes (no loading, tiles already cached)
  useEffect(() => {
    if (selectedStudy && !selectedStudy.yearSelectable && allTilesPreloaded) {
      updateChangeDetectionOpacities(viewMode);
    }
  }, [viewMode, updateChangeDetectionOpacities, selectedStudy, allTilesPreloaded]);

  // Close panel and zoom out
  const handleClose = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    activeLayerIds.forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });

    setActiveLayerIds([]);
    setSelectedStudy(null);
    setTileCache({ before: null, after: null, alphaearth: null, cdl: null });
    setAllTilesPreloaded(false);

    map.flyTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      duration: 1200
    });
  }, [activeLayerIds]);

  return (
    <section className="section case-study-section" data-section="cases">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">Real Applications</span>
          <h2>Case Studies</h2>
          <p className="section-subtitle">
            Click a marker to explore real-world LEOM applications with satellite imagery comparisons.
          </p>
        </div>

        <div className="case-study-container fade-in">
          {loading && (
            <div className="case-loading-overlay">
              <div className="case-loading-spinner"></div>
              <span>Loading imagery...</span>
            </div>
          )}

          <div className="case-map-wrapper" ref={mapContainerRef} />

          {selectedStudy && (
            <StudyPanel
              study={selectedStudy}
              viewMode={viewMode}
              setViewMode={setViewMode}
              sliderValue={sliderValue}
              setSliderValue={setSliderValue}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              loading={loading || !allTilesPreloaded}
              onClose={handleClose}
              onYearChange={handleYearChange}
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
