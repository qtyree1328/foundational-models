import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';

// ===== GEE Proxy Config =====
const GEE_PROXY_URL = import.meta.env.PROD
  ? 'https://gee-proxy-787413290356.us-east1.run.app'
  : '/gee';

// ===== Types =====
type LayerType = 'before' | 'after' | 'change' | 'optical' | 'cdl' | 'burn' | 'degradation' | 'clusters';

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
  question: string; // What question does this case study answer?
}

interface CustomLocation {
  coords: [number, number];
  zoom: number;
  name: string;
  year: number;
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
    source: 'CAL FIRE',
    question: 'Can FM identify burn scars without fire-specific training?'
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
    source: 'CAL FIRE',
    question: 'Does embedding change correlate with burn severity (dNBR)?'
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
    description: 'Heart of US corn/soybean production. Compare FM embeddings vs CDL crop classifier.',
    source: 'USDA NASS',
    question: 'How does a general FM compare to a specialized crop model (CDL)?'
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
    source: 'CDFA',
    question: 'Can FM distinguish diverse crops as well as specialized classifiers?'
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
    description: 'Brazil\'s INPE PRODES deforestation monitoring region. Process vector approach.',
    source: 'INPE PRODES',
    question: 'Can FM reveal forest degradation gradients using process vectors?'
  },
  // URBAN
  {
    id: 'philadelphia-urban',
    name: 'Philadelphia (Element 84 Study)',
    category: 'urban',
    icon: '🏙️',
    coords: [-75.16, 39.95],
    zoom: 11,
    bbox: [-75.28, 39.87, -75.04, 40.03],
    beforeYear: 2022,
    afterYear: 2024,
    description: 'Element 84 found Dim 26=airports, Dims 6/20/24=buildings here. Try "Airport" preset!',
    source: 'Element 84 Research',
    question: 'Can we validate Element 84\'s dimension discoveries (airports, tall buildings)?'
  },
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
    source: 'US Census',
    question: 'Can FM detect urban expansion without urban-specific training?'
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
    source: 'NOAA',
    question: 'Does embedding change capture flood impact and recovery?'
  }
];

// ===== Band Presets (Research-Based) =====
// Source: Element 84 analysis + Google tutorials
const BAND_PRESETS = [
  { name: 'Default', r: 1, g: 16, b: 9, desc: 'Google tutorial standard - highlights urban' },
  { name: 'Buildings', r: 6, g: 20, b: 24, desc: 'Tall buildings (Element 84 research)' },
  { name: 'Airport', r: 26, g: 16, b: 9, desc: 'Dim 26 detects airports (Element 84)' },
  { name: 'Industrial', r: 51, g: 16, b: 9, desc: 'Dim 51 = industrial areas' },
  { name: 'Spread', r: 0, g: 31, b: 63, desc: 'Full range distribution' },
  { name: 'Sequential', r: 0, g: 1, b: 2, desc: 'First 3 axes' },
];

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  fire: '#ef4444',
  agriculture: '#eab308',
  deforestation: '#22c55e',
  urban: '#8b5cf6',
  flooding: '#3b82f6'
};

// Layer info
const LAYER_INFO: Record<LayerType, { label: string; emoji: string; description: string }> = {
  before: { label: 'Before', emoji: '📅', description: 'Embedding from before the event. Pre-event baseline.' },
  after: { label: 'After', emoji: '📅', description: 'Embedding after the event. Post-event state.' },
  change: { label: 'Change', emoji: '📈', description: 'Embedding difference between years. Bright = large change in 64D vector.' },
  optical: { label: 'Optical', emoji: '🛰️', description: 'Sentinel-2 true color imagery for visual reference.' },
  cdl: { label: 'CDL', emoji: '🌾', description: 'USDA Cropland Data Layer — purpose-trained crop classifier. Compare to FM.' },
  burn: { label: 'dNBR', emoji: '🔥', description: 'Differenced Normalized Burn Ratio. Red = severe burn, blue = unburned.' },
  degradation: { label: 'Degradation', emoji: '🌳', description: 'Process vector projection. Red = high deforestation similarity, green = healthy.' },
  clusters: { label: 'K-Means', emoji: '🎯', description: 'K-means clustering on ALL 64 dims. Often reveals more than RGB visualization.' }
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
  const [loading, setLoading] = useState(false);
  const [tilesReady, setTilesReady] = useState(false);
  const [activeLayer, setActiveLayer] = useState<LayerType>('after');
  
  // Band controls
  const [bandR, setBandR] = useState(1);
  const [bandG, setBandG] = useState(16);
  const [bandB, setBandB] = useState(9);
  
  // Single band mode
  const [viewMode, setViewMode] = useState<'rgb' | 'single'>('rgb');
  const [singleBand, setSingleBand] = useState(26); // Default to airport dimension
  
  // Tile cache for instant switching
  const [tileCache, setTileCache] = useState<Record<string, string>>({});
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  
  // Custom location controls
  const [customLocation, setCustomLocation] = useState<CustomLocation | null>(null);
  const [inputLat, setInputLat] = useState('');
  const [inputLon, setInputLon] = useState('');
  const [inputYear, setInputYear] = useState('2023');
  const [clickToExplore, setClickToExplore] = useState(false);

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
      center: [-85, 12],  // Americas center
      zoom: 2.5,
      maxZoom: 16
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    // Add event markers as GeoJSON (pins stick to map)
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

  // Select an event and pre-load ALL tile URLs
  const selectEvent = useCallback(async (event: RealEvent) => {
    const map = mapRef.current;
    if (!map) return;

    setSelectedEvent(event);
    setLoading(true);
    setTilesReady(false);
    setTileCache({});
    setActiveLayerId(null);
    setActiveLayer('after');

    // Clear existing layers
    ['fm-layer'].forEach(id => {
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
    const bands = viewMode === 'single' 
      ? `A${singleBand.toString().padStart(2,'0')}`
      : `A${bandR.toString().padStart(2,'0')},A${bandG.toString().padStart(2,'0')},A${bandB.toString().padStart(2,'0')}`;
    
    // Single band requests use colorbar visualization
    const visualizationType = viewMode === 'single' ? 'single' : 'rgb';
    const minMax = viewMode === 'single' ? '&min=-0.5&max=0.5&palette=viridis' : '&min=-0.3&max=0.3';
    
    try {
      // Build all requests for this event type
      const requests: { key: string; url: string }[] = [
        { key: 'before', url: `${GEE_PROXY_URL}/api/tiles/embeddings?year=${event.beforeYear}&bands=${bands}&viz=${visualizationType}${minMax}` },
        { key: 'after', url: `${GEE_PROXY_URL}/api/tiles/embeddings?year=${event.afterYear}&bands=${bands}&viz=${visualizationType}${minMax}` },
        { key: 'change', url: `${GEE_PROXY_URL}/api/tiles/change?year1=${event.beforeYear}&year2=${event.afterYear}&bands=${bands}&viz=${visualizationType}` },
        { key: 'optical', url: `${GEE_PROXY_URL}/api/tiles/optical?year=${event.afterYear}&bbox=${event.bbox.join(',')}` },
        // K-means clustering on ALL 64 dims (often better than RGB viz)
        { key: 'clusters', url: `${GEE_PROXY_URL}/api/tiles/clustering?year=${event.afterYear}&lat=${event.coords[1]}&lng=${event.coords[0]}&zoom=${event.zoom}&clusters=7` }
      ];

      // Add category-specific layers
      if (event.category === 'agriculture') {
        requests.push({ key: 'cdl', url: `${GEE_PROXY_URL}/api/tiles/cdl?year=${event.afterYear}` });
      }
      if (event.category === 'fire') {
        requests.push({ key: 'burn', url: `${GEE_PROXY_URL}/api/tiles/burn?before_year=${event.beforeYear}&after_year=${event.afterYear}&bbox=${event.bbox.join(',')}` });
      }
      if (event.category === 'deforestation') {
        requests.push({ key: 'degradation', url: `${GEE_PROXY_URL}/api/tiles/deforestation?year=${event.afterYear}&bbox=${event.bbox.join(',')}` });
      }

      // Fetch all in parallel
      const responses = await Promise.all(
        requests.map(async (req) => {
          try {
            const resp = await fetch(req.url);
            const data = await resp.json();
            return { key: req.key, tileUrl: data.tileUrl };
          } catch (err) {
            console.error(`Failed to fetch ${req.key}:`, err);
            return { key: req.key, tileUrl: null };
          }
        })
      );

      // Build cache
      const cache: Record<string, string> = {};
      responses.forEach(r => {
        if (r.tileUrl) cache[r.key] = r.tileUrl;
      });
      setTileCache(cache);

      // Add the 'after' layer by default
      if (cache.after) {
        addTileLayer(map, cache.after);
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
  }, [bandR, bandG, bandB, viewMode, singleBand]);

  // Add a tile layer to the map
  const addTileLayer = useCallback((map: maplibregl.Map, tileUrl: string) => {
    // Remove existing layer if any
    if (map.getLayer('fm-layer')) map.removeLayer('fm-layer');
    if (map.getSource('fm-layer')) map.removeSource('fm-layer');

    map.addSource('fm-layer', {
      type: 'raster',
      tiles: [tileUrl],
      tileSize: 256
    });
    map.addLayer({
      id: 'fm-layer',
      type: 'raster',
      source: 'fm-layer',
      paint: { 'raster-opacity': 0.85 }
    }, 'events-glow');
    setActiveLayerId('fm-layer');
  }, []);

  // Switch visualization layer (instant - from cache)
  const switchLayer = useCallback((layerType: LayerType) => {
    const map = mapRef.current;
    if (!map || !tileCache[layerType]) return;

    addTileLayer(map, tileCache[layerType]);
    setActiveLayer(layerType);
  }, [tileCache, addTileLayer]);

  // Apply preset bands
  const applyPreset = (preset: typeof BAND_PRESETS[0]) => {
    setBandR(preset.r);
    setBandG(preset.g);
    setBandB(preset.b);
  };

  // Randomize bands
  const randomizeBands = () => {
    setBandR(Math.floor(Math.random() * 64));
    setBandG(Math.floor(Math.random() * 64));
    setBandB(Math.floor(Math.random() * 64));
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

    if (map.getLayer('fm-layer')) map.removeLayer('fm-layer');
    if (map.getSource('fm-layer')) map.removeSource('fm-layer');

    setSelectedEvent(null);
    setCustomLocation(null);
    setTileCache({});
    setActiveLayerId(null);
    setTilesReady(false);

    map.flyTo({
      center: [-85, 12],
      zoom: 2.5,
      duration: 1200
    });
  }, []);

  // Custom location functions
  const loadCustomLocation = useCallback(async (coords: [number, number], year: number, name: string) => {
    const map = mapRef.current;
    if (!map) return;

    setLoading(true);
    setTilesReady(false);
    setTileCache({});

    try {
      // Create a synthetic event object for custom location
      const customEvent: RealEvent = {
        id: 'custom',
        name: name,
        category: 'urban', // default category
        icon: '📍',
        coords: coords,
        zoom: 12,
        bbox: [coords[0] - 0.1, coords[1] - 0.1, coords[0] + 0.1, coords[1] + 0.1],
        beforeYear: year - 1,
        afterYear: year,
        description: `Custom location at ${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`,
        source: 'User Input',
        question: 'What patterns can we discover at this location?'
      };

      setCustomLocation({ coords, zoom: 12, name, year });
      setSelectedEvent(customEvent);

      // Fly to location
      map.flyTo({
        center: coords,
        zoom: 12,
        duration: 1500
      });

      // Load embedding tiles
      await selectEvent(customEvent);
    } catch (error) {
      console.error('Failed to load custom location:', error);
      setLoading(false);
    }
  }, [selectEvent]);

  const handleCoordinateInput = () => {
    const lat = parseFloat(inputLat);
    const lon = parseFloat(inputLon);
    const year = parseInt(inputYear);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      alert('Please enter valid coordinates:\nLatitude: -90 to 90\nLongitude: -180 to 180');
      return;
    }

    if (year < 2017 || year > 2024) {
      alert('Please enter a year between 2017-2024 (AlphaEarth coverage)');
      return;
    }

    const name = `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
    loadCustomLocation([lon, lat], year, name);
  };

  // Handle map click for exploration
  const handleMapClick = useCallback((e: maplibregl.MapMouseEvent) => {
    if (!clickToExplore) return;

    const { lng, lat } = e.lngLat;
    const year = parseInt(inputYear) || 2023;
    const name = `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
    
    loadCustomLocation([lng, lat], year, name);
    setClickToExplore(false); // Turn off click mode
  }, [clickToExplore, inputYear, loadCustomLocation]);

  // Add click handler to map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (clickToExplore) {
      map.getCanvas().style.cursor = 'crosshair';
      map.on('click', handleMapClick);
    } else {
      map.getCanvas().style.cursor = '';
      map.off('click', handleMapClick);
    }

    return () => {
      if (map) {
        map.off('click', handleMapClick);
        map.getCanvas().style.cursor = '';
      }
    };
  }, [clickToExplore, handleMapClick]);

  // Get available layers for current event
  const getAvailableLayers = (): LayerType[] => {
    if (!selectedEvent) return [];
    const base: LayerType[] = ['before', 'after', 'change', 'optical', 'clusters'];
    if (selectedEvent.category === 'agriculture') base.push('cdl');
    if (selectedEvent.category === 'fire') base.push('burn');
    if (selectedEvent.category === 'deforestation') base.push('degradation');
    return base.filter(l => tileCache[l]);
  };

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
          <div className="fm-external-links">
            <a href="https://earthengine-ai.projects.earthengine.app/view/embedding-similarity-search" target="_blank" rel="noopener">
              🔍 Google Similarity Demo
            </a>
            <a href="https://element84.com/machine-learning/exploring-alphaearth-embeddings/" target="_blank" rel="noopener">
              📊 Element 84 Research
            </a>
            <a href="https://developers.google.com/earth-engine/tutorials/community/satellite-embedding-01-introduction" target="_blank" rel="noopener">
              📚 GEE Tutorials
            </a>
          </div>
        </div>

        {/* Category legend */}
        <div className="fm-categories fade-in">
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <div key={cat} className="fm-category-item">
              <span className="fm-cat-dot" style={{ background: color }} />
              <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="fm-explorer-layout fade-in">
        {/* Left sidebar - Controls */}
        <div className="fm-sidebar">
          {/* Band controls */}
          <div className="fm-control-group">
            <h4>🎨 Band Visualization</h4>
            <p className="fm-hint">Explore embedding dimensions: RGB composite or single band with colorbar. Element 84 found Dim 26 = airports!</p>
            
            {/* View Mode Switcher */}
            <div className="fm-view-modes">
              <button
                className={`fm-mode-btn ${viewMode === 'rgb' ? 'active' : ''}`}
                onClick={() => setViewMode('rgb')}
              >
                🌈 RGB Composite
              </button>
              <button
                className={`fm-mode-btn ${viewMode === 'single' ? 'active' : ''}`}
                onClick={() => setViewMode('single')}
              >
                📊 Single Band + Colorbar
              </button>
            </div>
            
            {viewMode === 'rgb' ? (
              <>
                <BandSlider label="R" value={bandR} onChange={setBandR} color="#ef4444" />
                <BandSlider label="G" value={bandG} onChange={setBandG} color="#22c55e" />
                <BandSlider label="B" value={bandB} onChange={setBandB} color="#3b82f6" />
              </>
            ) : (
              <div className="fm-single-band-control">
                <div className="fm-band-label" style={{ color: '#8b5cf6' }}>
                  Single Band: A{singleBand.toString().padStart(2, '0')}
                </div>
                <input
                  type="range"
                  min="0"
                  max="63"
                  value={singleBand}
                  onChange={e => setSingleBand(Number(e.target.value))}
                  style={{ 
                    accentColor: '#8b5cf6',
                    background: `linear-gradient(to right, #8b5cf6 ${(singleBand/63)*100}%, #334155 ${(singleBand/63)*100}%)`
                  }}
                />
                <p className="fm-single-hint">
                  🎯 <strong>A{singleBand.toString().padStart(2, '0')}:</strong> {
                    singleBand === 26 ? 'Airports & Infrastructure (Element 84)' :
                    singleBand === 6 ? 'Buildings (Element 84)' :
                    singleBand === 20 ? 'Urban structures (Element 84)' :
                    singleBand === 24 ? 'Tall buildings (Element 84)' :
                    singleBand === 51 ? 'Industrial areas' :
                    `Embedding dimension ${singleBand} - meaning unknown`
                  }
                </p>
              </div>
            )}

            {viewMode === 'rgb' && (
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
                <button
                  className="fm-preset-btn random"
                  onClick={randomizeBands}
                  title="Discover new band combinations"
                >
                  🎲 Random
                </button>
              </div>
            )}
            
            {viewMode === 'single' && (
              <div className="fm-single-presets">
                <button
                  className={`fm-preset-btn ${singleBand === 26 ? 'active' : ''}`}
                  onClick={() => setSingleBand(26)}
                  title="Element 84 discovered: airports & runways"
                >
                  ✈️ Airports (26)
                </button>
                <button
                  className={`fm-preset-btn ${singleBand === 6 ? 'active' : ''}`}
                  onClick={() => setSingleBand(6)}
                  title="Element 84 discovered: building structures"
                >
                  🏢 Buildings (6)
                </button>
                <button
                  className={`fm-preset-btn ${singleBand === 51 ? 'active' : ''}`}
                  onClick={() => setSingleBand(51)}
                  title="Industrial areas"
                >
                  🏭 Industrial (51)
                </button>
                <button
                  className="fm-preset-btn random"
                  onClick={() => setSingleBand(Math.floor(Math.random() * 64))}
                  title="Discover what other dimensions capture"
                >
                  🎲 Random
                </button>
              </div>
            )}

            {selectedEvent && tilesReady && (
              <button className="fm-reload-btn" onClick={reloadWithBands}>
                🔄 Apply New Bands
              </button>
            )}
          </div>

          {/* Custom Location Controls */}
          <div className="fm-control-group">
            <h4>🌍 Custom Location</h4>
            <p className="fm-hint">Explore any coordinates with AlphaEarth embeddings</p>
            
            <div className="fm-custom-location">
              <div className="fm-coord-inputs">
                <div className="fm-coord-input">
                  <label>Latitude</label>
                  <input
                    type="number"
                    placeholder="e.g. 40.7128"
                    value={inputLat}
                    onChange={(e) => setInputLat(e.target.value)}
                    step="0.0001"
                    min="-90"
                    max="90"
                  />
                </div>
                <div className="fm-coord-input">
                  <label>Longitude</label>
                  <input
                    type="number"
                    placeholder="e.g. -74.0060"
                    value={inputLon}
                    onChange={(e) => setInputLon(e.target.value)}
                    step="0.0001"
                    min="-180"
                    max="180"
                  />
                </div>
                <div className="fm-coord-input">
                  <label>Year</label>
                  <select
                    value={inputYear}
                    onChange={(e) => setInputYear(e.target.value)}
                  >
                    {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="fm-custom-buttons">
                <button
                  className="fm-custom-btn"
                  onClick={handleCoordinateInput}
                  disabled={!inputLat || !inputLon}
                >
                  🎯 Explore Location
                </button>
                
                <button
                  className={`fm-custom-btn ${clickToExplore ? 'active' : ''}`}
                  onClick={() => setClickToExplore(!clickToExplore)}
                >
                  {clickToExplore ? '✋ Cancel Click' : '👆 Click to Explore'}
                </button>
              </div>
              
              {clickToExplore && (
                <p className="fm-click-hint">
                  🗺️ Click anywhere on the map to explore that location
                </p>
              )}

              {customLocation && (
                <div className="fm-custom-active">
                  <strong>📍 Active:</strong> {customLocation.name}
                </div>
              )}
            </div>
          </div>

          {/* Event list */}
          <div className="fm-control-group">
            <h4>📍 Real Events</h4>
            <p className="fm-hint">Click to explore with embeddings</p>
            
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

          {/* Layer toggles (when loaded) */}
          {tilesReady && selectedEvent && (
            <div className="fm-layer-toggle">
              {getAvailableLayers().map(layerType => (
                <button
                  key={layerType}
                  className={`fm-toggle-btn ${activeLayer === layerType ? 'active' : ''} ${layerType}`}
                  onClick={() => switchLayer(layerType)}
                  title={LAYER_INFO[layerType].description}
                >
                  {layerType === 'before' ? selectedEvent.beforeYear :
                   layerType === 'after' ? selectedEvent.afterYear :
                   layerType === 'change' ? 'Δ Change' :
                   LAYER_INFO[layerType].label}
                </button>
              ))}
            </div>
          )}

          {/* Event info panel */}
          {selectedEvent && tilesReady && (
            <div className="fm-info-panel">
              <button className="fm-info-close" onClick={clearSelection}>×</button>
              <h3>{selectedEvent.name}</h3>
              <p>{selectedEvent.description}</p>
              
              {/* Research question */}
              <div className="fm-question">
                <strong>❓ Research Question:</strong>
                <span>{selectedEvent.question}</span>
              </div>
              
              {/* Layer explanation */}
              <div className="fm-layer-explain">
                <p className="fm-explain">
                  {LAYER_INFO[activeLayer].emoji} <strong>{LAYER_INFO[activeLayer].label}:</strong> {LAYER_INFO[activeLayer].description}
                </p>
              </div>
              
              <div className="fm-info-meta">
                <span className="fm-info-source">Source: {selectedEvent.source}</span>
                <span className="fm-info-bands">
                  {viewMode === 'rgb' ? 
                    `RGB: A${bandR.toString().padStart(2,'0')}, A${bandG.toString().padStart(2,'0')}, A${bandB.toString().padStart(2,'0')}` :
                    `Single Band: A${singleBand.toString().padStart(2,'0')} with Viridis colorbar`
                  }
                </span>
              </div>
              
              <div className="fm-research-tip">
                💡 <strong>Tip:</strong> {viewMode === 'single' ? 
                  'Single band mode shows exactly what one dimension captures. Try A26 for airports or A06 for buildings!' :
                  'Try "Buildings" preset for urban areas, "Airport" for infrastructure. Switch to single band mode to see individual dimensions.'
                }
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
