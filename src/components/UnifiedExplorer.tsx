import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import {
  ExplorerEvent,
  EventCategory,
  LayerType,
  explorerEvents,
  CATEGORY_COLORS,
  LAYER_INFO,
  BAND_PRESETS
} from '../data/explorerEvents';

// ===== GEE Proxy Config =====
const GEE_PROXY_URL = import.meta.env.PROD
  ? 'https://gee-proxy-787413290356.us-east1.run.app'
  : '/gee';

// ===== Local Types =====
interface CustomLocation {
  coords: [number, number];
  zoom: number;
  name: string;
  year: number;
}

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
          background: `linear-gradient(to right, ${color} ${(value / 63) * 100}%, #334155 ${(value / 63) * 100}%)`
        }}
      />
    </div>
  );
}

// ===== Main Component =====
export default function UnifiedExplorer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // GEE availability
  const [geeAvailable, setGeeAvailable] = useState<boolean | null>(null);

  // Event / location selection
  const [selectedEvent, setSelectedEvent] = useState<ExplorerEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [tilesReady, setTilesReady] = useState(false);
  const [activeLayer, setActiveLayer] = useState<LayerType>('after');

  // Band controls
  const [bandR, setBandR] = useState(1);
  const [bandG, setBandG] = useState(16);
  const [bandB, setBandB] = useState(9);

  // Single band mode
  const [viewMode, setViewMode] = useState<'rgb' | 'single'>('rgb');
  const [singleBand, setSingleBand] = useState(26);

  // Tile cache for instant layer switching
  const [tileCache, setTileCache] = useState<Record<string, string>>({});
  const [, setActiveLayerId] = useState<string | null>(null);

  // Classification mode (yearSelectable events)
  const [classificationYear, setClassificationYear] = useState<number>(2022);
  const [classificationSlider, setClassificationSlider] = useState(0); // 0 = CDL, 100 = AlphaEarth
  const [classificationLayerIds, setClassificationLayerIds] = useState<string[]>([]);
  const [classificationReady, setClassificationReady] = useState(false);

  // Custom location controls
  const [customLocation, setCustomLocation] = useState<CustomLocation | null>(null);
  const [inputLat, setInputLat] = useState('');
  const [inputLon, setInputLon] = useState('');
  const [inputYear, setInputYear] = useState('2023');
  const [clickToExplore, setClickToExplore] = useState(false);

  // Data import and export
  const [uploadedData, setUploadedData] = useState<{ name: string; type: string; data: any } | null>(null);

  // Similarity search (map overlay)
  const [similarityOpen, setSimilarityOpen] = useState(false);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.85);
  const [similarityResults, setSimilarityResults] = useState<Array<{ coords: [number, number]; name: string; similarity: number; reason?: string }> | null>(null);

  // Step-based sidebar
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [step1Complete, setStep1Complete] = useState(false);

  // ===== GEE Health Check =====
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

  // ===== Initialize Map =====
  useEffect(() => {
    if (!mapContainer.current || mapRef.current || geeAvailable !== true) return;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'carto-voyager': {
              type: 'raster',
              tiles: ['https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'],
              tileSize: 256,
              attribution: '&copy; CARTO'
            }
          },
          layers: [{ id: 'basemap', type: 'raster', source: 'carto-voyager' }]
        },
        center: [-85, 12],
        zoom: 2.5,
        maxZoom: 16
      });
    } catch (e) {
      console.warn('WebGL not available for UnifiedExplorer:', e);
      return;
    }

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      // GeoJSON event markers colored by category
      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: explorerEvents.map(ev => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: ev.coords },
          properties: {
            id: ev.id,
            name: ev.name,
            category: ev.category,
            color: CATEGORY_COLORS[ev.category]
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
          const event = explorerEvents.find(ev => ev.id === id);
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

  // ===== Add a raster tile layer =====
  const addTileLayer = useCallback((map: maplibregl.Map, tileUrl: string) => {
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

  // ===== Clean up classification layers =====
  const cleanupClassificationLayers = useCallback((map: maplibregl.Map) => {
    classificationLayerIds.forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });
    setClassificationLayerIds([]);
    setClassificationReady(false);
  }, [classificationLayerIds]);

  // ===== Select Event and pre-fetch all tiles =====
  const selectEvent = useCallback(async (event: ExplorerEvent) => {
    const map = mapRef.current;
    if (!map) return;

    // Set selection state
    setSelectedEvent(event);
    setLoading(true);
    setTilesReady(false);
    setTileCache({});
    setActiveLayerId(null);
    setActiveLayer('after');
    setSimilarityResults(null);
    setStep1Complete(true);
    setActiveStep(2);

    // Clean up existing layers
    if (map.getLayer('fm-layer')) map.removeLayer('fm-layer');
    if (map.getSource('fm-layer')) map.removeSource('fm-layer');
    cleanupClassificationLayers(map);

    // Fly to location
    map.flyTo({
      center: event.coords,
      zoom: event.zoom,
      duration: 1500
    });

    // Classification mode for yearSelectable events
    if (event.yearSelectable) {
      const defaultYear = event.availableYears?.[event.availableYears.length - 1] || 2022;
      setClassificationYear(defaultYear);
      setClassificationSlider(0);
      await loadClassificationTiles(map, event, defaultYear);
      return;
    }

    // Standard event: pre-load ALL tile URLs in parallel
    const bands = viewMode === 'single'
      ? `A${singleBand.toString().padStart(2, '0')}`
      : `A${bandR.toString().padStart(2, '0')},A${bandG.toString().padStart(2, '0')},A${bandB.toString().padStart(2, '0')}`;

    const visualizationType = viewMode === 'single' ? 'single' : 'rgb';
    const minMax = viewMode === 'single' ? '&min=-0.5&max=0.5&palette=viridis' : '&min=-0.3&max=0.3';

    try {
      const requests: { key: string; url: string }[] = [
        { key: 'before', url: `${GEE_PROXY_URL}/api/tiles/embeddings?year=${event.beforeYear}&bands=${bands}&viz=${visualizationType}${minMax}` },
        { key: 'after', url: `${GEE_PROXY_URL}/api/tiles/embeddings?year=${event.afterYear}&bands=${bands}&viz=${visualizationType}${minMax}` },
        { key: 'change', url: `${GEE_PROXY_URL}/api/tiles/change?year1=${event.beforeYear}&year2=${event.afterYear}&bands=${bands}&viz=${visualizationType}` },
        { key: 'clusters', url: `${GEE_PROXY_URL}/api/tiles/clustering?year=${event.afterYear}&lat=${event.coords[1]}&lng=${event.coords[0]}&zoom=${event.zoom}&clusters=7` }
      ];

      // Optical tiles with optional month params
      let opticalBeforeUrl = `${GEE_PROXY_URL}/api/tiles/optical?year=${event.beforeYear}&bbox=${event.bbox.join(',')}`;
      let opticalAfterUrl = `${GEE_PROXY_URL}/api/tiles/optical?year=${event.afterYear}&bbox=${event.bbox.join(',')}`;
      if (event.beforeMonth) opticalBeforeUrl += `&month=${event.beforeMonth}`;
      if (event.afterMonth) opticalAfterUrl += `&month=${event.afterMonth}`;

      requests.push({ key: 'optical', url: opticalAfterUrl });

      // Category-specific layers
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

      // Show 'after' layer by default
      if (cache.after) {
        addTileLayer(map, cache.after);
      }

      map.once('idle', () => {
        setLoading(false);
        setTilesReady(true);
      });
    } catch (err) {
      console.error('Failed to load tiles:', err);
      setLoading(false);
    }
  }, [bandR, bandG, bandB, viewMode, singleBand, addTileLayer, cleanupClassificationLayers]);

  // ===== Load classification tiles (CDL + AlphaEarth for yearSelectable events) =====
  const loadClassificationTiles = useCallback(async (map: maplibregl.Map, event: ExplorerEvent, year: number) => {
    setLoading(true);
    setClassificationReady(false);

    // Clean up old classification layers
    classificationLayerIds.forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });

    try {
      const [cdlResp, alphaResp] = await Promise.all([
        fetch(`${GEE_PROXY_URL}/api/tiles/cdl?year=${year}&bbox=${event.bbox.join(',')}`),
        fetch(`${GEE_PROXY_URL}/api/tiles/embeddings?year=${year}&bands=A01,A16,A09&min=-0.3&max=0.3`)
      ]);

      const [cdlData, alphaData] = await Promise.all([cdlResp.json(), alphaResp.json()]);

      const timestamp = Date.now();
      const newLayerIds: string[] = [];

      // CDL layer (visible, bottom)
      if (cdlData.tileUrl) {
        const cdlId = `layer-cdl-${timestamp}`;
        map.addSource(cdlId, { type: 'raster', tiles: [cdlData.tileUrl], tileSize: 256 });
        map.addLayer({ id: cdlId, type: 'raster', source: cdlId, paint: { 'raster-opacity': 1 } }, 'events-glow');
        newLayerIds.push(cdlId);
      }

      // AlphaEarth layer (hidden, on top)
      if (alphaData.tileUrl) {
        const alphaId = `layer-alphaearth-${timestamp}`;
        map.addSource(alphaId, { type: 'raster', tiles: [alphaData.tileUrl], tileSize: 256 });
        map.addLayer({ id: alphaId, type: 'raster', source: alphaId, paint: { 'raster-opacity': 0 } }, 'events-glow');
        newLayerIds.push(alphaId);
      }

      setClassificationLayerIds(newLayerIds);
      setClassificationSlider(0);

      map.once('idle', () => {
        setLoading(false);
        setTilesReady(true);
        setClassificationReady(true);
      });
    } catch (err) {
      console.error('Failed to load classification tiles:', err);
      setLoading(false);
    }
  }, [classificationLayerIds]);

  // ===== Update classification slider opacities =====
  useEffect(() => {
    if (!selectedEvent?.yearSelectable || !classificationReady) return;
    const map = mapRef.current;
    if (!map) return;

    const cdlOpacity = 1 - (classificationSlider / 100);
    const alphaOpacity = classificationSlider / 100;

    classificationLayerIds.forEach(id => {
      if (id.includes('cdl') && map.getLayer(id)) {
        map.setPaintProperty(id, 'raster-opacity', cdlOpacity);
      }
      if (id.includes('alphaearth') && map.getLayer(id)) {
        map.setPaintProperty(id, 'raster-opacity', alphaOpacity);
      }
    });
  }, [classificationSlider, classificationLayerIds, classificationReady, selectedEvent]);

  // ===== Handle classification year change =====
  const handleClassificationYearChange = useCallback((year: number) => {
    const map = mapRef.current;
    if (!map || !selectedEvent?.yearSelectable) return;
    setClassificationYear(year);
    loadClassificationTiles(map, selectedEvent, year);
  }, [selectedEvent, loadClassificationTiles]);

  // ===== Switch visualization layer (instant from cache) =====
  const switchLayer = useCallback((layerType: LayerType) => {
    const map = mapRef.current;
    if (!map || !tileCache[layerType]) return;

    addTileLayer(map, tileCache[layerType]);
    setActiveLayer(layerType);
  }, [tileCache, addTileLayer]);

  // ===== Band controls =====
  const applyPreset = (preset: typeof BAND_PRESETS[0]) => {
    setBandR(preset.r);
    setBandG(preset.g);
    setBandB(preset.b);
  };

  const randomizeBands = () => {
    setBandR(Math.floor(Math.random() * 64));
    setBandG(Math.floor(Math.random() * 64));
    setBandB(Math.floor(Math.random() * 64));
  };

  const reloadWithBands = useCallback(async () => {
    if (!selectedEvent) return;
    await selectEvent(selectedEvent);
  }, [selectedEvent, selectEvent]);

  // ===== Clear selection =====
  const clearSelection = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.getLayer('fm-layer')) map.removeLayer('fm-layer');
    if (map.getSource('fm-layer')) map.removeSource('fm-layer');
    cleanupClassificationLayers(map);

    setSelectedEvent(null);
    setCustomLocation(null);
    setTileCache({});
    setActiveLayerId(null);
    setTilesReady(false);
    setStep1Complete(false);
    setActiveStep(1);
    setSimilarityResults(null);
    setSimilarityOpen(false);
    setClassificationReady(false);

    map.flyTo({
      center: [-85, 12],
      zoom: 2.5,
      duration: 1200
    });
  }, [cleanupClassificationLayers]);

  // ===== Custom location =====
  const loadCustomLocation = useCallback(async (coords: [number, number], year: number, name: string) => {
    const map = mapRef.current;
    if (!map) return;

    setLoading(true);
    setTilesReady(false);
    setTileCache({});

    try {
      const customEvent: ExplorerEvent = {
        id: 'custom',
        name: name,
        category: 'urban',
        coords: coords,
        zoom: 12,
        bbox: [coords[0] - 0.1, coords[1] - 0.1, coords[0] + 0.1, coords[1] + 0.1],
        beforeYear: year - 1,
        afterYear: year,
        description: `Custom location at ${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`,
        source: 'User Input',
        question: 'What patterns can we discover at this location?',
        color: CATEGORY_COLORS['urban']
      };

      setCustomLocation({ coords, zoom: 12, name, year });
      setSelectedEvent(customEvent);

      map.flyTo({
        center: coords,
        zoom: 12,
        duration: 1500
      });

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

  // ===== Click-to-explore handler =====
  const handleMapClick = useCallback((e: maplibregl.MapMouseEvent) => {
    if (!clickToExplore) return;

    const { lng, lat } = e.lngLat;
    const year = parseInt(inputYear) || 2023;
    const name = `${lat.toFixed(3)}, ${lng.toFixed(3)}`;

    loadCustomLocation([lng, lat], year, name);
    setClickToExplore(false);
  }, [clickToExplore, inputYear, loadCustomLocation]);

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

  // ===== File upload handlers =====
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

  const handleGeoTIFFUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedData({
      name: file.name,
      type: 'geotiff',
      data: file
    });

    alert('GeoTIFF upload received. Processing functionality would require server-side implementation.');
  }, []);

  const addUploadedMarkers = useCallback((coordinates: Array<{ lat: number; lon: number; name: string }>) => {
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

    if (map.getLayer('uploaded-markers')) map.removeLayer('uploaded-markers');
    if (map.getSource('uploaded-markers')) map.removeSource('uploaded-markers');

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

    map.on('click', 'uploaded-markers', (e) => {
      if (e.features?.[0]?.geometry.type === 'Point') {
        const coords = e.features[0].geometry.coordinates as [number, number];
        const name = e.features[0].properties?.name || 'Uploaded Location';
        loadCustomLocation(coords, parseInt(inputYear), name);
      }
    });
  }, [inputYear, loadCustomLocation]);

  const clearUploadedData = useCallback(() => {
    setUploadedData(null);
    const map = mapRef.current;
    if (map) {
      if (map.getLayer('uploaded-markers')) map.removeLayer('uploaded-markers');
      if (map.getSource('uploaded-markers')) map.removeSource('uploaded-markers');
    }
  }, []);

  // ===== Similarity search =====
  const performSimilaritySearch = useCallback(async () => {
    if (!selectedEvent || !mapRef.current) return;

    setLoading(true);
    try {
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
          { coords: [-63.25, -8.85], name: "Rondonia, Brazil", similarity: 0.92, reason: "Cattle pasture expansion" },
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

  // ===== Export functions =====
  const exportEmbeddings = useCallback(async (format: 'csv' | 'geotiff') => {
    if (!selectedEvent || !tileCache) return;

    try {
      if (format === 'csv') {
        const csvData = `lat,lon,year,${Array.from({ length: 64 }, (_, i) => `A${i.toString().padStart(2, '0')}`).join(',')}\n`;
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

  // ===== Get available layers for current event =====
  const getAvailableLayers = (): LayerType[] => {
    if (!selectedEvent || selectedEvent.yearSelectable) return [];
    const base: LayerType[] = ['before', 'after', 'change', 'optical', 'clusters'];
    if (selectedEvent.category === 'agriculture') base.push('cdl');
    if (selectedEvent.category === 'fire') base.push('burn');
    if (selectedEvent.category === 'deforestation') base.push('degradation');
    return base.filter(l => tileCache[l]);
  };

  // ===== Group events by category =====
  const groupedEvents = explorerEvents.reduce<Record<EventCategory, ExplorerEvent[]>>((acc, ev) => {
    if (!acc[ev.category]) acc[ev.category] = [];
    acc[ev.category].push(ev);
    return acc;
  }, {} as Record<EventCategory, ExplorerEvent[]>);

  // ===== Render: loading state =====
  if (geeAvailable === null) {
    return (
      <section className="section fm-explorer-section" data-section="unified-explorer">
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

  // ===== Render: error state =====
  if (geeAvailable === false) {
    return (
      <section className="section fm-explorer-section" data-section="unified-explorer">
        <div className="container">
          <div className="section-header fade-in">
            <span className="section-label">Foundation Model Explorer</span>
            <h2>FM Explorer</h2>
          </div>
          <div className="fm-error-state">
            <span></span>
            <h3>GEE Proxy Not Available</h3>
            <p>Start the proxy server to enable live exploration.</p>
          </div>
        </div>
      </section>
    );
  }

  // ===== Render: main explorer =====
  return (
    <section className="section fm-explorer-section" data-section="unified-explorer">
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
              Google Similarity Demo
            </a>
            <a href="https://element84.com/machine-learning/exploring-alphaearth-embeddings/" target="_blank" rel="noopener">
              Element 84 Research
            </a>
            <a href="https://developers.google.com/earth-engine/tutorials/community/satellite-embedding-01-introduction" target="_blank" rel="noopener">
              GEE Tutorials
            </a>
          </div>
        </div>
      </div>

      <div className="fm-explorer-layout fade-in">
        {/* ===== Left sidebar with steps ===== */}
        <div className="fm-sidebar">

          {/* ===== STEP 1: Choose Location ===== */}
          <div className={`explorer-step ${activeStep === 1 ? 'expanded' : ''}`}>
            <button
              className="step-header"
              onClick={() => setActiveStep(1)}
            >
              <span className={`step-number ${step1Complete ? 'complete' : ''}`}>1</span>
              <span className="step-title">Choose Location</span>
              {step1Complete && selectedEvent && (
                <span className="step-summary">
                  <span className="fm-cat-dot" style={{ background: CATEGORY_COLORS[selectedEvent.category] }} />
                  {selectedEvent.name}
                </span>
              )}
              <span className={`step-chevron ${activeStep === 1 ? 'open' : ''}`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </button>

            <div className={`step-content ${activeStep !== 1 ? 'collapsed' : ''}`}>
              {/* Category legend */}
              <div className="fm-categories">
                {(Object.entries(CATEGORY_COLORS) as [EventCategory, string][]).map(([cat, color]) => (
                  <div key={cat} className="fm-category-item">
                    <span className="fm-cat-dot" style={{ background: color }} />
                    <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                  </div>
                ))}
              </div>

              {/* Event list grouped by category */}
              <div className="fm-event-list">
                {(Object.entries(groupedEvents) as [EventCategory, ExplorerEvent[]][]).map(([category, events]) => (
                  <div key={category} className="fm-event-group">
                    <div className="fm-event-group-header" style={{ color: CATEGORY_COLORS[category] }}>
                      <span className="fm-cat-dot" style={{ background: CATEGORY_COLORS[category] }} />
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </div>
                    {events.map(event => (
                      <button
                        key={event.id}
                        className={`fm-event-btn ${selectedEvent?.id === event.id ? 'active' : ''}`}
                        onClick={() => selectEvent(event)}
                        style={{ '--event-color': CATEGORY_COLORS[event.category] } as React.CSSProperties}
                      >
                        <div className="fm-event-info">
                          <span className="fm-event-name">{event.name}</span>
                          <span className="fm-event-years">
                            {event.yearSelectable
                              ? `${event.availableYears?.[0]} - ${event.availableYears?.[event.availableYears.length - 1]}`
                              : `${event.beforeYear} - ${event.afterYear}`}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {/* Custom Location Controls */}
              <div className="fm-control-group">
                <h4>Custom Location</h4>
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
                      Explore Location
                    </button>

                    <button
                      className={`fm-custom-btn ${clickToExplore ? 'active' : ''}`}
                      onClick={() => setClickToExplore(!clickToExplore)}
                    >
                      {clickToExplore ? 'Cancel Click' : 'Click to Explore'}
                    </button>
                  </div>

                  {clickToExplore && (
                    <p className="fm-click-hint">
                      Click anywhere on the map to explore that location
                    </p>
                  )}

                  {customLocation && (
                    <div className="fm-custom-active">
                      <strong>Active:</strong> {customLocation.name}
                    </div>
                  )}

                  {/* Quick dimension tests */}
                  <div className="fm-quick-tests">
                    <h5>Quick Dimension Tests</h5>
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
                        Test Airports (Dim 26)
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
                        Test Crops (Dim 12)
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
                        Test Transport (Dim 41)
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
                        Test Water (Dim 8)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== STEP 2: Adjust Visualization ===== */}
          <div className={`explorer-step ${activeStep === 2 ? 'expanded' : ''}`}>
            <button
              className="step-header"
              onClick={() => { if (step1Complete) setActiveStep(2); }}
              disabled={!step1Complete}
            >
              <span className={`step-number ${!step1Complete ? 'disabled' : ''}`}>2</span>
              <span className="step-title">Adjust Visualization</span>
              <span className={`step-chevron ${activeStep === 2 ? 'open' : ''}`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </button>

            <div className={`step-content ${activeStep !== 2 ? 'collapsed' : ''}`}>

              {/* Classification mode for yearSelectable events */}
              {selectedEvent?.yearSelectable && (
                <div className="fm-control-group">
                  <h4>Classification Comparison</h4>
                  <p className="fm-hint">Compare USDA CDL (supervised) with AlphaEarth (unsupervised) across years</p>

                  <div className="fm-year-selector">
                    <label>Year:</label>
                    <select
                      value={classificationYear}
                      onChange={(e) => handleClassificationYearChange(parseInt(e.target.value))}
                      disabled={loading}
                    >
                      {selectedEvent.availableYears?.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div className="fm-classification-slider">
                    <div className="fm-classification-labels">
                      <span>CDL</span>
                      <span>AlphaEarth</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={classificationSlider}
                      onChange={(e) => setClassificationSlider(parseInt(e.target.value))}
                      disabled={loading || !classificationReady}
                    />
                    <p className="fm-hint">
                      {classificationSlider <= 25
                        ? `USDA Cropland Data Layer ${classificationYear} -- supervised classification of crop types.`
                        : classificationSlider >= 75
                          ? `AlphaEarth embeddings ${classificationYear} -- unsupervised clustering reveals crop patterns.`
                          : `Blending CDL (${100 - classificationSlider}%) with AlphaEarth (${classificationSlider}%).`}
                    </p>
                  </div>
                </div>
              )}

              {/* Band visualization controls (non-classification mode) */}
              {!selectedEvent?.yearSelectable && (
                <div className="fm-control-group">
                  <h4>Band Visualization</h4>
                  <p className="fm-hint">Explore embedding dimensions: RGB composite or single band with colorbar. Element 84 found Dim 26 = airports!</p>

                  {/* View Mode Switcher */}
                  <div className="fm-view-modes">
                    <button
                      className={`fm-mode-btn ${viewMode === 'rgb' ? 'active' : ''}`}
                      onClick={() => setViewMode('rgb')}
                    >
                      RGB Composite
                    </button>
                    <button
                      className={`fm-mode-btn ${viewMode === 'single' ? 'active' : ''}`}
                      onClick={() => setViewMode('single')}
                    >
                      Single Band + Colorbar
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
                          background: `linear-gradient(to right, #8b5cf6 ${(singleBand / 63) * 100}%, #334155 ${(singleBand / 63) * 100}%)`
                        }}
                      />
                      <p className="fm-single-hint">
                        <strong>A{singleBand.toString().padStart(2, '0')}:</strong> {
                          singleBand === 26 ? 'Airports & Infrastructure (Element 84) -- validated in Philadelphia International Airport' :
                          singleBand === 6 ? 'Buildings & Urban Structures (Element 84) -- test on downtown cores, skyscraper districts' :
                          singleBand === 20 ? 'Urban Infrastructure (Element 84) -- highways, bridges, major transport hubs' :
                          singleBand === 24 ? 'Tall Buildings & Towers (Element 84) -- high-rise detection, city skylines' :
                          singleBand === 51 ? 'Industrial Infrastructure -- oil refineries, gas storage, chemical facilities (Nature 2024)' :
                          singleBand === 8 ? 'Water Infrastructure -- dams, reservoirs, water treatment, canal systems' :
                          singleBand === 12 ? 'Agricultural Patterns -- cocoa plantations (Airbus+Barry Callebaut), crop type classification' :
                          singleBand === 32 ? 'Resource Extraction -- mining sites, quarries, tailings dams (PMC study), industrial scars' :
                          singleBand === 48 ? 'Coastal Development -- aquaculture farms, offshore platforms, port facilities' :
                          singleBand === 15 ? 'Forest Health -- deforestation gradients, logging roads, forest fragmentation' :
                          singleBand === 41 ? 'Transportation Networks -- rail yards, logistics hubs, intermodal facilities' :
                          singleBand === 3 ? 'Agricultural Machinery -- center-pivot irrigation, grain silos, farm equipment' :
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
                        Random
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
                        Airports (26)
                      </button>
                      <button
                        className={`fm-preset-btn ${singleBand === 6 ? 'active' : ''}`}
                        onClick={() => setSingleBand(6)}
                        title="Element 84 discovered: building structures"
                      >
                        Buildings (6)
                      </button>
                      <button
                        className={`fm-preset-btn ${singleBand === 51 ? 'active' : ''}`}
                        onClick={() => setSingleBand(51)}
                        title="Oil/gas infrastructure, storage tanks (research-backed)"
                      >
                        Industrial (51)
                      </button>
                      <button
                        className={`fm-preset-btn ${singleBand === 8 ? 'active' : ''}`}
                        onClick={() => setSingleBand(8)}
                        title="Water features - test on dams, reservoirs, infrastructure"
                      >
                        Water (8)
                      </button>
                      <button
                        className={`fm-preset-btn ${singleBand === 12 ? 'active' : ''}`}
                        onClick={() => setSingleBand(12)}
                        title="Vegetation patterns - test on cocoa farms, crop classification"
                      >
                        Crops (12)
                      </button>
                      <button
                        className={`fm-preset-btn ${singleBand === 32 ? 'active' : ''}`}
                        onClick={() => setSingleBand(32)}
                        title="Mixed land use - test on mining areas, complex landscapes"
                      >
                        Mining (32)
                      </button>
                      <button
                        className="fm-preset-btn random"
                        onClick={() => setSingleBand(Math.floor(Math.random() * 64))}
                        title="Discover what other dimensions capture"
                      >
                        Random
                      </button>
                    </div>
                  )}

                  {selectedEvent && tilesReady && (
                    <button className="fm-reload-btn" onClick={reloadWithBands}>
                      Apply New Bands
                    </button>
                  )}
                </div>
              )}

              {/* Data Import Controls */}
              <div className="fm-control-group">
                <h4>Data Import</h4>
                <p className="fm-hint">Upload coordinates or GeoTIFF for bulk analysis</p>

                <div className="fm-import-section">
                  <div className="fm-import-option">
                    <label className="fm-upload-label" htmlFor="coords-file-unified">
                      <div className="fm-upload-icon"></div>
                      <div>
                        <strong>Upload Coordinates</strong>
                        <small>CSV file with lat,lon,name columns</small>
                      </div>
                    </label>
                    <input
                      id="coords-file-unified"
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleCoordsUpload}
                      hidden
                    />
                  </div>

                  <div className="fm-import-option">
                    <label className="fm-upload-label" htmlFor="geotiff-file-unified">
                      <div className="fm-upload-icon"></div>
                      <div>
                        <strong>Upload GeoTIFF</strong>
                        <small>Overlay your data on embeddings</small>
                      </div>
                    </label>
                    <input
                      id="geotiff-file-unified"
                      type="file"
                      accept=".tif,.tiff"
                      onChange={handleGeoTIFFUpload}
                      hidden
                    />
                  </div>

                  {uploadedData && (
                    <div className="fm-uploaded-data">
                      <strong>Uploaded:</strong> {uploadedData.name}
                      <button onClick={clearUploadedData}>&times;</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Export Controls */}
              <div className="fm-control-group">
                <h4>Export Data</h4>
                <p className="fm-hint">Download embeddings and analysis results</p>

                <div className="fm-export-section">
                  <button
                    className="fm-export-btn"
                    onClick={() => exportEmbeddings('csv')}
                    disabled={!selectedEvent}
                  >
                    Export Embeddings (CSV)
                  </button>

                  <button
                    className="fm-export-btn"
                    onClick={() => exportEmbeddings('geotiff')}
                    disabled={!selectedEvent}
                  >
                    Export as GeoTIFF
                  </button>

                  <button
                    className="fm-export-btn"
                    onClick={exportCurrentView}
                    disabled={!tilesReady}
                  >
                    Export Current View
                  </button>

                  {similarityResults && (
                    <button
                      className="fm-export-btn"
                      onClick={exportSimilarityResults}
                    >
                      Export Similarity Results
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ===== Map container ===== */}
        <div className="fm-map-wrapper">
          {loading && (
            <div className="fm-map-loading">
              <div className="fm-spinner" />
              <span>Loading all imagery layers...</span>
            </div>
          )}

          <div ref={mapContainer} className="fm-map-container" />

          {/* Similarity search floating control */}
          <div className="similarity-search-control">
            <button
              className={`similarity-trigger ${similarityOpen ? 'active' : ''}`}
              onClick={() => setSimilarityOpen(!similarityOpen)}
              title="Similarity Search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            {similarityOpen && (
              <div className="similarity-popover">
                <h4>Similarity Search</h4>
                <p className="similarity-desc">Find locations with similar embedding patterns</p>
                <button
                  className="fm-similarity-btn"
                  onClick={performSimilaritySearch}
                  disabled={!selectedEvent || loading}
                >
                  Find Similar Locations
                </button>
                <div className="similarity-threshold-control">
                  <label>Threshold: {(similarityThreshold * 100).toFixed(0)}%</label>
                  <input
                    type="range"
                    min="0.7"
                    max="0.99"
                    step="0.01"
                    value={similarityThreshold}
                    onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                  />
                </div>
                {similarityResults && (
                  <div className="fm-similarity-results">
                    <h5>Similar Locations Found:</h5>
                    {similarityResults.map((result, i) => (
                      <div key={i} className="fm-similarity-result">
                        <button onClick={() => loadCustomLocation(result.coords, parseInt(inputYear), result.name)}>
                          <div className="similarity-header">
                            <span className="similarity-name">{result.name}</span>
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
                {similarityResults && (
                  <button className="fm-export-btn" onClick={exportSimilarityResults}>
                    Export Results
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Layer toggles (non-classification mode) */}
          {tilesReady && selectedEvent && !selectedEvent.yearSelectable && (
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
                   layerType === 'change' ? '\u0394 Change' :
                   LAYER_INFO[layerType].label}
                </button>
              ))}
            </div>
          )}

          {/* Event info panel */}
          {selectedEvent && tilesReady && (
            <div className="fm-info-panel">
              <button className="fm-info-close" onClick={clearSelection}>&times;</button>
              <h3>{selectedEvent.name}</h3>
              <p>{selectedEvent.detail || selectedEvent.description}</p>

              {/* Research question */}
              <div className="fm-question">
                <strong>Research Question:</strong>
                <span>{selectedEvent.question}</span>
              </div>

              {/* Layer explanation (non-classification) */}
              {!selectedEvent.yearSelectable && (
                <div className="fm-layer-explain">
                  <p className="fm-explain">
                    <strong>{LAYER_INFO[activeLayer].label}:</strong> {LAYER_INFO[activeLayer].description}
                  </p>
                </div>
              )}

              <div className="fm-info-meta">
                <span className="fm-info-source">
                  Source: {selectedEvent.source}
                  {selectedEvent.sourceUrl && (
                    <a href={selectedEvent.sourceUrl} target="_blank" rel="noopener"> &#x2197;</a>
                  )}
                </span>
                {!selectedEvent.yearSelectable && (
                  <span className="fm-info-bands">
                    {viewMode === 'rgb'
                      ? `RGB: A${bandR.toString().padStart(2, '0')}, A${bandG.toString().padStart(2, '0')}, A${bandB.toString().padStart(2, '0')}`
                      : `Single Band: A${singleBand.toString().padStart(2, '0')} with Viridis colorbar`
                    }
                  </span>
                )}
              </div>

              <div className="fm-research-tip">
                <strong>Tip:</strong> {selectedEvent.yearSelectable
                  ? 'Move the slider to compare CDL (supervised crop map) with AlphaEarth (unsupervised embeddings). Try different years!'
                  : viewMode === 'single'
                    ? 'Single band mode shows exactly what one dimension captures. Try A26 for airports or A06 for buildings!'
                    : 'Try "Buildings" preset for urban areas, "Airport" for infrastructure. Switch to single band mode to see individual dimensions.'
                }
              </div>
            </div>
          )}

          {/* Instructions */}
          {!selectedEvent && (
            <div className="fm-instructions">
              <span>Click a marker or select an event from the sidebar</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
