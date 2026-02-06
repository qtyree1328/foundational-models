import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';

// ===== GEE Proxy Config =====
const GEE_PROXY_URL = import.meta.env.PROD
  ? 'https://gee-proxy-787413290356.us-east1.run.app'
  : '/gee';

// ===== Types =====
type VizMode = 'embeddings' | 'change' | 'cdl-compare' | 'burn-scar';

interface RealEvent {
  id: string;
  name: string;
  category: 'fire' | 'agriculture' | 'deforestation' | 'urban' | 'flooding';
  icon: string;
  coords: [number, number];
  zoom: number;
  bbox: [number, number, number, number];
  beforeYear: number;
  afterYear: number;
  description: string;
  source: string;
}

// ===== Real Events (all pre-2024) =====
const REAL_EVENTS: RealEvent[] = [
  // FIRE
  {
    id: 'creek-fire',
    name: 'Creek Fire 2020',
    category: 'fire',
    icon: '🔥',
    coords: [-119.3, 37.2],
    zoom: 10,
    bbox: [-119.6, 37.0, -119.0, 37.5],
    beforeYear: 2019,
    afterYear: 2021,
    description: 'One of California\'s largest fires. 379,895 acres burned in Sierra National Forest.',
    source: 'CAL FIRE'
  },
  {
    id: 'paradise-fire',
    name: 'Camp Fire 2018 (Paradise)',
    category: 'fire',
    icon: '🔥',
    coords: [-121.6, 39.76],
    zoom: 11,
    bbox: [-121.75, 39.65, -121.45, 39.87],
    beforeYear: 2017,
    afterYear: 2019,
    description: 'Deadliest wildfire in California history. Destroyed the town of Paradise.',
    source: 'CAL FIRE'
  },
  // AGRICULTURE
  {
    id: 'iowa-corn',
    name: 'Iowa Corn Belt',
    category: 'agriculture',
    icon: '🌾',
    coords: [-93.5, 42.0],
    zoom: 10,
    bbox: [-94.0, 41.5, -93.0, 42.5],
    beforeYear: 2022,
    afterYear: 2023,
    description: 'Heart of US corn/soybean production. Compare embeddings vs CDL crop classifier.',
    source: 'USDA NASS'
  },
  {
    id: 'ca-central-valley',
    name: 'CA Central Valley',
    category: 'agriculture',
    icon: '🌾',
    coords: [-120.5, 37.0],
    zoom: 9,
    bbox: [-121.0, 36.5, -120.0, 37.5],
    beforeYear: 2022,
    afterYear: 2023,
    description: '250+ crop types. Most diverse agricultural region in the US.',
    source: 'CDFA'
  },
  // DEFORESTATION
  {
    id: 'amazon-rondonia',
    name: 'Amazon Rondônia',
    category: 'deforestation',
    icon: '🌳',
    coords: [-63.0, -10.5],
    zoom: 9,
    bbox: [-63.5, -11.0, -62.5, -10.0],
    beforeYear: 2018,
    afterYear: 2023,
    description: 'Brazil\'s INPE PRODES deforestation monitoring region.',
    source: 'INPE PRODES'
  },
  // URBAN
  {
    id: 'phoenix-expansion',
    name: 'Phoenix Urban Expansion',
    category: 'urban',
    icon: '🏙️',
    coords: [-112.0, 33.5],
    zoom: 10,
    bbox: [-112.5, 33.0, -111.5, 34.0],
    beforeYear: 2017,
    afterYear: 2023,
    description: 'Fastest-growing US metro. Track urban sprawl with embeddings.',
    source: 'US Census'
  },
  // FLOODING
  {
    id: 'harvey-houston',
    name: 'Hurricane Harvey 2017',
    category: 'flooding',
    icon: '💧',
    coords: [-95.4, 29.76],
    zoom: 10,
    bbox: [-95.8, 29.4, -95.0, 30.1],
    beforeYear: 2017,
    afterYear: 2018,
    description: 'Catastrophic flooding in Houston. 27 trillion gallons of rain.',
    source: 'NOAA'
  }
];

// ===== Band Presets =====
const BAND_PRESETS = [
  { name: 'Default', r: 1, g: 16, b: 9, desc: 'Google tutorial standard' },
  { name: 'Sequential', r: 0, g: 1, b: 2, desc: 'First 3 axes' },
  { name: 'Spread', r: 0, g: 21, b: 42, desc: 'Even distribution' },
  { name: 'High Dims', r: 50, g: 55, b: 60, desc: 'Later axes' },
];

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  fire: '#ef4444',
  agriculture: '#eab308',
  deforestation: '#22c55e',
  urban: '#8b5cf6',
  flooding: '#3b82f6'
};

// ===== Helper Components =====
function BandSlider({ 
  label, 
  value, 
  onChange, 
  color 
}: { 
  label: string; 
  value: number; 
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div className="fm-band-slider">
      <div className="fm-band-label" style={{ color }}>
        {label}: A{value.toString().padStart(2, '0')}
      </div>
      <input
        type="range"
        min="0"
        max="63"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ 
          accentColor: color,
          background: `linear-gradient(to right, ${color} ${(value/63)*100}%, #334155 ${(value/63)*100}%)`
        }}
      />
    </div>
  );
}

// ===== Main Component =====
export default function FMExplorer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  
  // State
  const [geeAvailable, setGeeAvailable] = useState<boolean | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<RealEvent | null>(null);
  const [vizMode, setVizMode] = useState<VizMode>('embeddings');
  const [loading, setLoading] = useState(false);
  const [tilesReady, setTilesReady] = useState(false);
  const [activeYear, setActiveYear] = useState<'before' | 'after'>('after');
  
  // Band controls
  const [bandR, setBandR] = useState(1);
  const [bandG, setBandG] = useState(16);
  const [bandB, setBandB] = useState(9);
  
  // Tile cache for instant switching
  const [tileCache, setTileCache] = useState<Record<string, string>>({});
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [showCDL, setShowCDL] = useState(false);

  // Check GEE availability
  useEffect(() => {
    const checkGEE = async () => {
      try {
        const resp = await fetch(`${GEE_PROXY_URL}/api/health`, { 
          signal: AbortSignal.timeout(15000) 
        });
        const data = await resp.json();
        setGeeAvailable(data.status === 'ok');
      } catch {
        setGeeAvailable(false);
      }
    };
    checkGEE();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current || geeAvailable !== true) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-voyager': {
            type: 'raster',
            tiles: ['https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'],
            tileSize: 256,
            attribution: '© CARTO'
          }
        },
        layers: [{ id: 'basemap', type: 'raster', source: 'carto-voyager' }]
      },
      center: [-98, 38],
      zoom: 4,
      maxZoom: 16
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    // Add event markers as GeoJSON
    map.on('load', () => {
      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: REAL_EVENTS.map(e => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: e.coords },
          properties: { 
            id: e.id, 
            name: e.name, 
            category: e.category,
            color: CATEGORY_COLORS[e.category]
          }
        }))
      };

      map.addSource('events', { type: 'geojson', data: geojson });

      map.addLayer({
        id: 'events-glow',
        type: 'circle',
        source: 'events',
        paint: {
          'circle-radius': 16,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.3,
          'circle-blur': 1
        }
      });

      map.addLayer({
        id: 'events-markers',
        type: 'circle',
        source: 'events',
        paint: {
          'circle-radius': 8,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      map.on('click', 'events-markers', (e) => {
        if (e.features?.[0]) {
          const id = e.features[0].properties?.id;
          const event = REAL_EVENTS.find(ev => ev.id === id);
          if (event) selectEvent(event);
        }
      });

      map.on('mouseenter', 'events-markers', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'events-markers', () => {
        map.getCanvas().style.cursor = '';
      });
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [geeAvailable]);

  // Select an event and pre-load tiles
  const selectEvent = useCallback(async (event: RealEvent) => {
    const map = mapRef.current;
    if (!map) return;

    setSelectedEvent(event);
    setLoading(true);
    setTilesReady(false);
    setTileCache({});
    setActiveLayerId(null);
    setActiveYear('after');

    // Clear existing layers
    ['fm-layer-before', 'fm-layer-after', 'fm-layer-change'].forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });

    // Fly to location
    map.flyTo({
      center: event.coords,
      zoom: event.zoom,
      duration: 1500
    });

    // Pre-load all tile URLs in parallel
    const bands = `A${bandR.toString().padStart(2,'0')},A${bandG.toString().padStart(2,'0')},A${bandB.toString().padStart(2,'0')}`;
    
    try {
      // Base requests for all events
      const requests: Promise<Response>[] = [
        fetch(`${GEE_PROXY_URL}/api/tiles/embeddings?year=${event.beforeYear}&bands=${bands}&min=-0.3&max=0.3`),
        fetch(`${GEE_PROXY_URL}/api/tiles/embeddings?year=${event.afterYear}&bands=${bands}&min=-0.3&max=0.3`),
        fetch(`${GEE_PROXY_URL}/api/tiles/change?year1=${event.beforeYear}&year2=${event.afterYear}&bands=${bands}`),
        fetch(`${GEE_PROXY_URL}/api/tiles/optical?year=${event.afterYear}&bbox=${event.bbox.join(',')}`)
      ];

      // Add CDL for agriculture events
      if (event.category === 'agriculture') {
        requests.push(fetch(`${GEE_PROXY_URL}/api/tiles/cdl?year=${event.afterYear}`));
      }

      // Add burn severity for fire events
      if (event.category === 'fire') {
        requests.push(fetch(`${GEE_PROXY_URL}/api/tiles/burn?before_year=${event.beforeYear}&after_year=${event.afterYear}&bbox=${event.bbox.join(',')}`));
      }

      const responses = await Promise.all(requests);
      const dataPromises = responses.map(r => r.json());
      const results = await Promise.all(dataPromises);

      const cache: Record<string, string> = {
        before: results[0].tileUrl,
        after: results[1].tileUrl,
        change: results[2].tileUrl,
        optical: results[3].tileUrl
      };

      // Add category-specific layers
      if (event.category === 'agriculture' && results[4]) {
        cache.cdl = results[4].tileUrl;
      }
      if (event.category === 'fire' && results[4]) {
        cache.burn = results[4].tileUrl;
      }

      setTileCache(cache);

      // Add the 'after' layer by default
      if (cache.after) {
        const layerId = 'fm-layer-after';
        map.addSource(layerId, {
          type: 'raster',
          tiles: [cache.after],
          tileSize: 256
        });
        map.addLayer({
          id: layerId,
          type: 'raster',
          source: layerId,
          paint: { 'raster-opacity': 0.85 }
        }, 'events-glow');
        setActiveLayerId(layerId);
      }

      // Wait for tiles to render
      map.once('idle', () => {
        setLoading(false);
        setTilesReady(true);
      });
    } catch (err) {
      console.error('Failed to load tiles:', err);
      setLoading(false);
    }
  }, [bandR, bandG, bandB]);

  // Switch visualization layer (instant - from cache)
  const switchLayer = useCallback((mode: 'before' | 'after' | 'change') => {
    const map = mapRef.current;
    if (!map || !tileCache[mode]) return;

    // Remove current layer
    if (activeLayerId) {
      if (map.getLayer(activeLayerId)) map.removeLayer(activeLayerId);
      if (map.getSource(activeLayerId)) map.removeSource(activeLayerId);
    }

    const layerId = `fm-layer-${mode}`;
    map.addSource(layerId, {
      type: 'raster',
      tiles: [tileCache[mode]],
      tileSize: 256
    });
    map.addLayer({
      id: layerId,
      type: 'raster',
      source: layerId,
      paint: { 'raster-opacity': 0.85 }
    }, 'events-glow');

    setActiveLayerId(layerId);
    if (mode === 'before') setActiveYear('before');
    else if (mode === 'after') setActiveYear('after');
  }, [tileCache, activeLayerId]);

  // Apply preset bands
  const applyPreset = (preset: typeof BAND_PRESETS[0]) => {
    setBandR(preset.r);
    setBandG(preset.g);
    setBandB(preset.b);
  };

  // Reload tiles with new bands
  const reloadWithBands = useCallback(async () => {
    if (!selectedEvent) return;
    await selectEvent(selectedEvent);
  }, [selectedEvent, selectEvent]);

  // Clear selection
  const clearSelection = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (activeLayerId) {
      if (map.getLayer(activeLayerId)) map.removeLayer(activeLayerId);
      if (map.getSource(activeLayerId)) map.removeSource(activeLayerId);
    }

    setSelectedEvent(null);
    setTileCache({});
    setActiveLayerId(null);
    setTilesReady(false);

    map.flyTo({
      center: [-98, 38],
      zoom: 4,
      duration: 1200
    });
  }, [activeLayerId]);

  // Render
  if (geeAvailable === null) {
    return (
      <section className="section fm-explorer-section" data-section="fm-explorer">
        <div className="container">
          <div className="section-header fade-in">
            <span className="section-label">Foundation Model Explorer</span>
            <h2>FM Explorer</h2>
          </div>
          <div className="fm-loading-state">
            <div className="fm-spinner" />
            <span>Connecting to Google Earth Engine...</span>
          </div>
        </div>
      </section>
    );
  }

  if (geeAvailable === false) {
    return (
      <section className="section fm-explorer-section" data-section="fm-explorer">
        <div className="container">
          <div className="section-header fade-in">
            <span className="section-label">Foundation Model Explorer</span>
            <h2>FM Explorer</h2>
          </div>
          <div className="fm-error-state">
            <span>⚠️</span>
            <h3>GEE Proxy Not Available</h3>
            <p>Start the proxy server to enable live exploration.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section fm-explorer-section" data-section="fm-explorer">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">Foundation Model Explorer</span>
          <h2>FM Explorer</h2>
          <p className="section-subtitle">
            Explore real events with AlphaEarth embeddings. Each 64-dimensional vector 
            captures a year of multi-sensor satellite data. Test different band combinations
            to discover what the model learned.
          </p>
        </div>

        {/* Category filters */}
        <div className="fm-categories fade-in">
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <button
              key={cat}
              className="fm-category-btn"
              style={{ '--cat-color': color } as React.CSSProperties}
            >
              <span className="fm-cat-dot" style={{ background: color }} />
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="fm-explorer-layout fade-in">
        {/* Left sidebar - Controls */}
        <div className="fm-sidebar">
          {/* Band controls */}
          <div className="fm-control-group">
            <h4>Band Combination</h4>
            <p className="fm-hint">Map 3 of 64 embedding dimensions to RGB</p>
            
            <BandSlider label="R" value={bandR} onChange={setBandR} color="#ef4444" />
            <BandSlider label="G" value={bandG} onChange={setBandG} color="#22c55e" />
            <BandSlider label="B" value={bandB} onChange={setBandB} color="#3b82f6" />

            <div className="fm-presets">
              {BAND_PRESETS.map(p => (
                <button
                  key={p.name}
                  className={`fm-preset-btn ${bandR === p.r && bandG === p.g && bandB === p.b ? 'active' : ''}`}
                  onClick={() => applyPreset(p)}
                  title={p.desc}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {selectedEvent && tilesReady && (
              <button className="fm-reload-btn" onClick={reloadWithBands}>
                🔄 Apply New Bands
              </button>
            )}
          </div>

          {/* Event list */}
          <div className="fm-control-group">
            <h4>Real Events</h4>
            <p className="fm-hint">Click to explore before/after with embeddings</p>
            
            <div className="fm-event-list">
              {REAL_EVENTS.map(event => (
                <button
                  key={event.id}
                  className={`fm-event-btn ${selectedEvent?.id === event.id ? 'active' : ''}`}
                  onClick={() => selectEvent(event)}
                  style={{ '--event-color': CATEGORY_COLORS[event.category] } as React.CSSProperties}
                >
                  <span className="fm-event-icon">{event.icon}</span>
                  <div className="fm-event-info">
                    <span className="fm-event-name">{event.name}</span>
                    <span className="fm-event-years">
                      {event.beforeYear} → {event.afterYear}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Map container */}
        <div className="fm-map-wrapper">
          {loading && (
            <div className="fm-map-loading">
              <div className="fm-spinner" />
              <span>Loading all imagery layers...</span>
            </div>
          )}

          <div ref={mapContainer} className="fm-map-container" />

          {/* Layer toggle (when loaded) */}
          {tilesReady && selectedEvent && (
            <div className="fm-layer-toggle">
              <button
                className={`fm-toggle-btn ${activeYear === 'before' ? 'active' : ''}`}
                onClick={() => switchLayer('before')}
              >
                {selectedEvent.beforeYear}
              </button>
              <button
                className={`fm-toggle-btn ${activeYear === 'after' ? 'active' : ''}`}
                onClick={() => switchLayer('after')}
              >
                {selectedEvent.afterYear}
              </button>
              <button
                className={`fm-toggle-btn change ${activeLayerId?.includes('change') ? 'active' : ''}`}
                onClick={() => switchLayer('change')}
              >
                Δ Change
              </button>
              {tileCache.optical && (
                <button
                  className={`fm-toggle-btn optical ${activeLayerId?.includes('optical') ? 'active' : ''}`}
                  onClick={() => switchLayer('optical')}
                >
                  Optical
                </button>
              )}
              {tileCache.cdl && (
                <button
                  className={`fm-toggle-btn cdl ${activeLayerId?.includes('cdl') ? 'active' : ''}`}
                  onClick={() => switchLayer('cdl')}
                >
                  CDL
                </button>
              )}
              {tileCache.burn && (
                <button
                  className={`fm-toggle-btn burn ${activeLayerId?.includes('burn') ? 'active' : ''}`}
                  onClick={() => switchLayer('burn')}
                >
                  dNBR
                </button>
              )}
            </div>
          )}

          {/* Event info panel */}
          {selectedEvent && tilesReady && (
            <div className="fm-info-panel">
              <button className="fm-info-close" onClick={clearSelection}>×</button>
              <h3>{selectedEvent.name}</h3>
              <p>{selectedEvent.description}</p>
              <div className="fm-info-meta">
                <span className="fm-info-source">Source: {selectedEvent.source}</span>
                <span className="fm-info-bands">
                  Bands: A{bandR.toString().padStart(2,'0')}, A{bandG.toString().padStart(2,'0')}, A{bandB.toString().padStart(2,'0')}
                </span>
              </div>
            </div>
          )}

          {/* Instructions */}
          {!selectedEvent && (
            <div className="fm-instructions">
              <span>👆 Click a marker or select an event from the sidebar</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
