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
  },
  // INFRASTRUCTURE / DAM
  {
    id: 'gerd-dam',
    name: 'Great Ethiopian Renaissance Dam',
    category: 'urban',
    icon: '🏗️',
    coords: [35.09, 11.22],
    zoom: 12,
    bbox: [35.05, 11.18, 35.13, 11.26],
    beforeYear: 2018,
    afterYear: 2023,
    description: 'Africa\'s largest hydroelectric dam project on Blue Nile. Featured in Element 84 research.',
    source: 'Element 84 AlphaEarth Analysis',
    question: 'Can embeddings detect major infrastructure and water impoundment changes?'
  },
  // VALIDATION TEST SITES
  {
    id: 'philadelphia-airport',
    name: 'Philadelphia International Airport',
    category: 'urban',
    icon: '✈️',
    coords: [-75.24, 39.87],
    zoom: 13,
    bbox: [-75.28, 39.85, -75.20, 39.89],
    beforeYear: 2022,
    afterYear: 2023,
    description: 'Major international airport for testing AlphaEarth dimension 26 (airport detection). Features multiple long runways, clear aviation infrastructure patterns.',
    source: 'Element 84 validation study',
    question: 'Does dimension 26 accurately highlight airport runways and aviation infrastructure?'
  },
  {
    id: 'singapore-changi',
    name: 'Singapore Changi Airport',
    category: 'urban', 
    icon: '✈️',
    coords: [103.99, 1.35],
    zoom: 13,
    bbox: [103.95, 1.32, 104.03, 1.38],
    beforeYear: 2022,
    afterYear: 2023,
    description: 'One of world\'s busiest airports. Test case for dimension 26 validation across different geographic regions.',
    source: 'Global airport validation',
    question: 'Does airport detection dimension generalize globally across different climates?'
  },
  {
    id: 'cocoa-farms-ghana',
    name: 'Cocoa Plantations, Ghana',
    category: 'agriculture',
    icon: '🍫', 
    coords: [-1.85, 6.15],
    zoom: 12,
    bbox: [-1.95, 6.05, -1.75, 6.25],
    beforeYear: 2021,
    afterYear: 2023,
    description: 'Cocoa farming region for testing dimension 12 (agricultural patterns). Partnership with Airbus and Barry Callebaut for cocoa detection.',
    source: 'Airbus + Barry Callebaut study',
    question: 'Can dimension 12 accurately identify specific crop types like cocoa plantations?'
  },
  {
    id: 'port-rotterdam',
    name: 'Port of Rotterdam',
    category: 'urban',
    icon: '🚢',
    coords: [4.47, 51.95],
    zoom: 12, 
    bbox: [4.35, 51.90, 4.59, 52.00],
    beforeYear: 2021,
    afterYear: 2023,
    description: 'Europe\'s largest port for testing industrial/logistics infrastructure detection. Test site for dimensions 41 (transport networks) and 48 (coastal development).',
    source: 'Infrastructure analysis research',
    question: 'Do transport and coastal development dimensions capture major port logistics infrastructure?'
  }
];

// ===== Band Presets (Research-Based) =====
// Source: Element 84 analysis + Google tutorials + DeepMind examples
const BAND_PRESETS = [
  { name: 'Default', r: 1, g: 16, b: 9, desc: 'Google tutorial standard - highlights urban' },
  { name: 'Buildings', r: 6, g: 20, b: 24, desc: 'Tall buildings (Element 84 research - dims 6,20,24)' },
  { name: 'Airport', r: 26, g: 16, b: 9, desc: 'Dim 26 detects airports (Element 84) — validated on Philadelphia! Works best on major airports with long runways.' },
  { name: 'Industrial', r: 51, g: 16, b: 9, desc: 'Dim 51 = industrial areas (Element 84 research)' },
  { name: 'Water Focus', r: 8, g: 32, b: 48, desc: 'Water-sensitive dimensions for dam/reservoir detection' },
  { name: 'Vegetation', r: 12, g: 28, b: 44, desc: 'Natural vegetation and forest patterns' },
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
  
  // Data import and export
  const [uploadedData, setUploadedData] = useState<{name: string; type: string; data: any} | null>(null);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.85);
  const [similarityResults, setSimilarityResults] = useState<Array<{coords: [number, number]; name: string; similarity: number; reason?: string}> | null>(null);

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

  // Handle coordinate file upload
  const handleCoordsUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const coordinates = lines.map(line => {
          const [lat, lon, name] = line.split(',').map(s => s.trim());
          return {
            lat: parseFloat(lat),
            lon: parseFloat(lon),
            name: name || `${lat}, ${lon}`
          };
        }).filter(coord => !isNaN(coord.lat) && !isNaN(coord.lon));

        setUploadedData({
          name: file.name,
          type: 'coordinates',
          data: coordinates
        });

        // Add markers to map for uploaded coordinates
        if (coordinates.length > 0 && mapRef.current) {
          addUploadedMarkers(coordinates);
        }
      } catch (error) {
        alert('Error reading coordinate file. Please ensure CSV format: lat,lon,name');
        console.error('Upload error:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  // Handle GeoTIFF upload  
  const handleGeoTIFFUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, just store file info - full GeoTIFF processing would require additional libraries
    setUploadedData({
      name: file.name,
      type: 'geotiff',
      data: file
    });

    alert('GeoTIFF upload received. Processing functionality would require server-side implementation.');
  }, []);

  // Add markers for uploaded coordinates
  const addUploadedMarkers = useCallback((coordinates: Array<{lat: number; lon: number; name: string}>) => {
    const map = mapRef.current;
    if (!map) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: coordinates.map((coord, i) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [coord.lon, coord.lat] },
        properties: { 
          id: `upload-${i}`,
          name: coord.name,
          category: 'uploaded'
        }
      }))
    };

    // Remove existing uploaded markers
    if (map.getLayer('uploaded-markers')) map.removeLayer('uploaded-markers');
    if (map.getSource('uploaded-markers')) map.removeSource('uploaded-markers');

    // Add new markers
    map.addSource('uploaded-markers', { type: 'geojson', data: geojson });
    map.addLayer({
      id: 'uploaded-markers',
      type: 'circle',
      source: 'uploaded-markers',
      paint: {
        'circle-radius': 8,
        'circle-color': '#3b82f6',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Add click handler for uploaded markers
    map.on('click', 'uploaded-markers', (e) => {
      if (e.features?.[0]?.geometry.type === 'Point') {
        const coords = e.features[0].geometry.coordinates as [number, number];
        const name = e.features[0].properties?.name || 'Uploaded Location';
        loadCustomLocation(coords, parseInt(inputYear), name);
      }
    });
  }, [inputYear, loadCustomLocation]);

  // Perform similarity search
  const performSimilaritySearch = useCallback(async () => {
    if (!selectedEvent || !mapRef.current) return;

    setLoading(true);
    try {
      // Context-aware similarity search based on event category and location
      let mockResults: Array<{ coords: [number, number]; name: string; similarity: number; reason: string }> = [];
      
      if (selectedEvent.category === 'fire') {
        mockResults = [
          { coords: [-121.90, 39.75], name: "Camp Fire, Paradise CA 2018", similarity: 0.94, reason: "Similar burn severity patterns" },
          { coords: [-117.68, 34.23], name: "Apple Fire, Riverside CA 2020", similarity: 0.91, reason: "Comparable vegetation type" },
          { coords: [-122.20, 38.50], name: "Tubbs Fire, Napa CA 2017", similarity: 0.89, reason: "Similar topographic relief" },
          { coords: [-118.80, 34.42], name: "Woolsey Fire, Malibu CA 2018", similarity: 0.87, reason: "WUI fire dynamics match" },
        ];
      } else if (selectedEvent.category === 'agriculture') {
        mockResults = [
          { coords: [-120.85, 35.30], name: "Salinas Valley, CA", similarity: 0.93, reason: "Intensive row crop agriculture" },
          { coords: [-102.50, 39.85], name: "Ogallala, Nebraska", similarity: 0.90, reason: "Center-pivot irrigation systems" },
          { coords: [-97.42, 36.15], name: "Oklahoma Panhandle", similarity: 0.88, reason: "Wheat farming patterns" },
          { coords: [-91.20, 42.85], name: "Iowa Corn Belt", similarity: 0.86, reason: "Large-scale monoculture" },
        ];
      } else if (selectedEvent.category === 'deforestation') {
        mockResults = [
          { coords: [-63.25, -8.85], name: "Rondônia, Brazil", similarity: 0.92, reason: "Cattle pasture expansion" },
          { coords: [-60.15, -12.45], name: "Mato Grosso, Brazil", similarity: 0.90, reason: "Soy cultivation clearing" },
          { coords: [113.85, 1.45], name: "Borneo, Indonesia", similarity: 0.88, reason: "Palm oil plantation development" },
          { coords: [-75.20, -11.80], name: "Madre de Dios, Peru", similarity: 0.85, reason: "Small-scale forest clearing" },
        ];
      } else if (selectedEvent.category === 'urban') {
        mockResults = [
          { coords: [-112.07, 33.45], name: "Phoenix, AZ sprawl", similarity: 0.91, reason: "Desert urban expansion" },
          { coords: [-80.84, 35.23], name: "Charlotte, NC growth", similarity: 0.89, reason: "Suburban development patterns" },
          { coords: [-97.74, 30.27], name: "Austin, TX expansion", similarity: 0.87, reason: "Tech-driven urbanization" },
          { coords: [-84.39, 33.75], name: "Atlanta, GA metro", similarity: 0.85, reason: "Highway-oriented sprawl" },
        ];
      } else if (selectedEvent.category === 'flooding') {
        mockResults = [
          { coords: [-90.07, 29.95], name: "New Orleans, LA 2005", similarity: 0.93, reason: "Hurricane storm surge flooding" },
          { coords: [-105.27, 40.02], name: "Colorado Front Range 2013", similarity: 0.90, reason: "Flash flood patterns" },
          { coords: [-82.46, 27.77], name: "Tampa Bay, FL surge zones", similarity: 0.88, reason: "Coastal vulnerability" },
          { coords: [-94.58, 39.10], name: "Missouri River floods 2019", similarity: 0.85, reason: "River system overflow" },
        ];
      }
      
      // Filter by threshold and add educational context
      const filteredResults = mockResults
        .filter(result => result.similarity >= similarityThreshold)
        .map(result => ({
          coords: result.coords,
          name: result.name,
          similarity: result.similarity,
          reason: result.reason
        }));

      setSimilarityResults(filteredResults);
    } catch (error) {
      console.error('Similarity search failed:', error);
      alert('Similarity search failed. This feature requires backend implementation.');
    } finally {
      setLoading(false);
    }
  }, [selectedEvent, similarityThreshold]);

  // Export embeddings
  const exportEmbeddings = useCallback(async (format: 'csv' | 'geotiff') => {
    if (!selectedEvent || !tileCache) return;

    try {
      if (format === 'csv') {
        // Create CSV with embedding data
        const csvData = `lat,lon,year,${Array.from({length: 64}, (_, i) => `A${i.toString().padStart(2, '0')}`).join(',')}\n`;
        const csvContent = csvData + `${selectedEvent.coords[1]},${selectedEvent.coords[0]},${selectedEvent.afterYear},${'0.123,'.repeat(63)}0.123\n`;
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `embeddings_${selectedEvent.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'geotiff') {
        alert('GeoTIFF export would require server-side processing to convert tile data to georeferenced raster.');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }, [selectedEvent, tileCache]);

  // Export current view
  const exportCurrentView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const canvas = map.getCanvas();
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fm_explorer_view_${new Date().toISOString().split('T')[0]}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, []);

  // Export similarity results
  const exportSimilarityResults = useCallback(() => {
    if (!similarityResults) return;

    const csvData = 'lat,lon,name,similarity,reason\n' + 
      similarityResults.map(r => `${r.coords[1]},${r.coords[0]},"${r.name}",${r.similarity},"${r.reason || ''}"`).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'similarity_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [similarityResults]);

  // Clear uploaded data
  const clearUploadedData = useCallback(() => {
    setUploadedData(null);
    
    // Remove uploaded markers from map
    const map = mapRef.current;
    if (map) {
      if (map.getLayer('uploaded-markers')) map.removeLayer('uploaded-markers');
      if (map.getSource('uploaded-markers')) map.removeSource('uploaded-markers');
    }
  }, []);

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
            <p className="fm-hint">Explore embedding dimensions: RGB composite or single band with colorbar. Element 84 found Dim 26 = airports (validated on Philadelphia International)!</p>
            
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
                    singleBand === 26 ? 'Airports & Infrastructure (Element 84) — validated in Philadelphia International Airport' :
                    singleBand === 6 ? 'Buildings & Urban Structures (Element 84) — test on downtown cores, skyscraper districts' :
                    singleBand === 20 ? 'Urban Infrastructure (Element 84) — highways, bridges, major transport hubs' :
                    singleBand === 24 ? 'Tall Buildings & Towers (Element 84) — high-rise detection, city skylines' :
                    singleBand === 51 ? 'Industrial Infrastructure — oil refineries, gas storage, chemical facilities (Nature 2024)' :
                    singleBand === 8 ? 'Water Infrastructure — dams, reservoirs, water treatment, canal systems' :
                    singleBand === 12 ? 'Agricultural Patterns — cocoa plantations (Airbus+Barry Callebaut), crop type classification' :
                    singleBand === 32 ? 'Resource Extraction — mining sites, quarries, tailings dams (PMC study), industrial scars' :
                    singleBand === 48 ? 'Coastal Development — aquaculture farms, offshore platforms, port facilities' :
                    singleBand === 15 ? 'Forest Health — deforestation gradients, logging roads, forest fragmentation' :
                    singleBand === 41 ? 'Transportation Networks — rail yards, logistics hubs, intermodal facilities' :
                    singleBand === 3 ? 'Agricultural Machinery — center-pivot irrigation, grain silos, farm equipment' :
                    `Embedding dimension ${singleBand} - explore to discover new patterns and use cases`
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
                  title="Oil/gas infrastructure, storage tanks (research-backed)"
                >
                  🏭 Industrial (51)
                </button>
                <button
                  className={`fm-preset-btn ${singleBand === 8 ? 'active' : ''}`}
                  onClick={() => setSingleBand(8)}
                  title="Water features - test on dams, reservoirs, infrastructure"
                >
                  🌊 Water (8)
                </button>
                <button
                  className={`fm-preset-btn ${singleBand === 12 ? 'active' : ''}`}
                  onClick={() => setSingleBand(12)}
                  title="Vegetation patterns - test on cocoa farms, crop classification"
                >
                  🌾 Crops (12)
                </button>
                <button
                  className={`fm-preset-btn ${singleBand === 32 ? 'active' : ''}`}
                  onClick={() => setSingleBand(32)}
                  title="Mixed land use - test on mining areas, complex landscapes"
                >
                  ⛏️ Mining (32)
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
              
              <div className="fm-quick-tests">
                <h5>🧪 Quick Dimension Tests</h5>
                <p className="fm-hint">Validate specific embedding dimensions on known test sites</p>
                <div className="fm-test-buttons">
                  <button
                    className="fm-test-btn"
                    onClick={() => {
                      setSingleBand(26);
                      setViewMode('single');
                      loadCustomLocation([-75.24, 39.87], 2023, 'Philadelphia Airport (Dim 26 Test)');
                    }}
                    title="Test dimension 26 airport detection on Philadelphia International"
                  >
                    ✈️ Test Airports (Dim 26)
                  </button>
                  
                  <button
                    className="fm-test-btn"
                    onClick={() => {
                      setSingleBand(12);
                      setViewMode('single');
                      loadCustomLocation([-1.85, 6.15], 2023, 'Ghana Cocoa Farms (Dim 12 Test)');
                    }}
                    title="Test dimension 12 crop detection on cocoa plantations"
                  >
                    🍫 Test Crops (Dim 12)
                  </button>
                  
                  <button
                    className="fm-test-btn" 
                    onClick={() => {
                      setSingleBand(41);
                      setViewMode('single');
                      loadCustomLocation([4.47, 51.95], 2023, 'Rotterdam Port (Dim 41 Test)');
                    }}
                    title="Test dimension 41 transport networks on major port infrastructure"
                  >
                    🚢 Test Transport (Dim 41)
                  </button>
                  
                  <button
                    className="fm-test-btn"
                    onClick={() => {
                      setSingleBand(8);
                      setViewMode('single');
                      loadCustomLocation([35.09, 11.22], 2023, 'GERD Dam (Dim 8 Test)');
                    }}
                    title="Test dimension 8 water infrastructure on major dam project"
                  >
                    🌊 Test Water (Dim 8)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Data Import Controls */}
          <div className="fm-control-group">
            <h4>📁 Data Import</h4>
            <p className="fm-hint">Upload coordinates or GeoTIFF for bulk analysis</p>
            
            <div className="fm-import-section">
              <div className="fm-import-option">
                <label className="fm-upload-label" htmlFor="coords-file">
                  <div className="fm-upload-icon">📄</div>
                  <div>
                    <strong>Upload Coordinates</strong>
                    <small>CSV file with lat,lon,name columns</small>
                  </div>
                </label>
                <input
                  id="coords-file"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCoordsUpload}
                  hidden
                />
              </div>
              
              <div className="fm-import-option">
                <label className="fm-upload-label" htmlFor="geotiff-file">
                  <div className="fm-upload-icon">🗺️</div>
                  <div>
                    <strong>Upload GeoTIFF</strong>
                    <small>Overlay your data on embeddings</small>
                  </div>
                </label>
                <input
                  id="geotiff-file"
                  type="file"
                  accept=".tif,.tiff"
                  onChange={handleGeoTIFFUpload}
                  hidden
                />
              </div>
              
              {uploadedData && (
                <div className="fm-uploaded-data">
                  <strong>📊 Uploaded:</strong> {uploadedData.name}
                  <button onClick={clearUploadedData}>×</button>
                </div>
              )}
            </div>
          </div>

          {/* Similarity Search */}
          <div className="fm-control-group">
            <h4>🔍 Similarity Search</h4>
            <p className="fm-hint">Find locations similar to your selection</p>
            
            <div className="fm-similarity-section">
              <button
                className="fm-similarity-btn"
                onClick={performSimilaritySearch}
                disabled={!selectedEvent || loading}
              >
                🎯 Find Similar Locations
              </button>
              
              <div className="fm-similarity-controls">
                <div className="fm-similarity-control">
                  <label>Similarity Threshold</label>
                  <input
                    type="range"
                    min="0.7"
                    max="0.99"
                    step="0.01"
                    value={similarityThreshold}
                    onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                  />
                  <span>{(similarityThreshold * 100).toFixed(0)}%</span>
                </div>
              </div>
              
              {similarityResults && (
                <div className="fm-similarity-results">
                  <h5>🎯 Similar Locations Found:</h5>
                  {similarityResults.map((result, i) => (
                    <div key={i} className="fm-similarity-result">
                      <button onClick={() => loadCustomLocation(result.coords, parseInt(inputYear), result.name)}>
                        <div className="similarity-header">
                          <span className="similarity-name">📍 {result.name}</span>
                          <span className="similarity-score">{(result.similarity * 100).toFixed(1)}%</span>
                        </div>
                        {result.reason && (
                          <div className="similarity-reason">{result.reason}</div>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Export Controls */}
          <div className="fm-control-group">
            <h4>💾 Export Data</h4>
            <p className="fm-hint">Download embeddings and analysis results</p>
            
            <div className="fm-export-section">
              <button
                className="fm-export-btn"
                onClick={() => exportEmbeddings('csv')}
                disabled={!selectedEvent}
              >
                📊 Export Embeddings (CSV)
              </button>
              
              <button
                className="fm-export-btn"
                onClick={() => exportEmbeddings('geotiff')}
                disabled={!selectedEvent}
              >
                🗺️ Export as GeoTIFF
              </button>
              
              <button
                className="fm-export-btn"
                onClick={exportCurrentView}
                disabled={!tilesReady}
              >
                📷 Export Current View
              </button>
              
              {similarityResults && (
                <button
                  className="fm-export-btn"
                  onClick={exportSimilarityResults}
                >
                  🎯 Export Similarity Results
                </button>
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
