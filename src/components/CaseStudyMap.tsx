import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { caseStudies, CaseStudy } from '../data/caseStudies';
import { models } from '../data/models';

// ===== STAC + TiTiler integration =====

const STAC_API = 'https://earth-search.aws.element84.com/v1/search';
const TITILER_BASE = 'https://titiler.xyz/cog';

interface STACResult {
  cogUrl: string;
  thumbnailUrl: string;
  date: string;
  cloudCover: number;
  id: string;
  bounds: [number, number, number, number];
}

async function searchSTAC(
  bbox: [number, number, number, number],
  dateRange: string,
  collection: string = 'sentinel-2-l2a'
): Promise<STACResult | null> {
  try {
    const resp = await fetch(STAC_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collections: [collection],
        bbox,
        datetime: dateRange,
        limit: 5,
        query: { 'eo:cloud_cover': { lt: 30 } },
        sortby: [{ field: 'properties.eo:cloud_cover', direction: 'asc' }]
      })
    });
    const data = await resp.json();
    if (!data.features?.length) return null;

    const feature = data.features[0];
    const visual = feature.assets?.visual;
    const thumbnail = feature.assets?.thumbnail;
    if (!visual?.href) return null;

    return {
      cogUrl: visual.href,
      thumbnailUrl: thumbnail?.href || '',
      date: feature.properties?.datetime || '',
      cloudCover: feature.properties?.['eo:cloud_cover'] ?? -1,
      id: feature.id || '',
      bounds: feature.bbox || bbox,
    };
  } catch (e) {
    console.warn('STAC search failed:', e);
    return null;
  }
}

function getTileJsonUrl(cogUrl: string): string {
  const encoded = encodeURIComponent(cogUrl);
  return `${TITILER_BASE}/WebMercatorQuad/tilejson.json?url=${encoded}`;
}

function getTileUrl(cogUrl: string): string {
  const encoded = encodeURIComponent(cogUrl);
  return `${TITILER_BASE}/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?url=${encoded}`;
}

// ===== Thumbnail component =====

function STACThumbnail({
  bbox,
  dateRange,
  label,
  isActive,
  onClick,
}: {
  bbox: [number, number, number, number];
  dateRange: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const [result, setResult] = useState<STACResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    searchSTAC(bbox, dateRange).then(r => {
      if (cancelled) return;
      if (r) {
        setResult(r);
      } else {
        setError(true);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [bbox, dateRange]);

  const dateStr = result?.date
    ? new Date(result.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

  return (
    <div
      className={`stac-thumb-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <span className="stac-label">{label}</span>
      <div className="stac-thumb-inner">
        {loading && (
          <div className="stac-loading">
            <div className="stac-spinner" />
            <span>Searching Sentinel-2…</span>
          </div>
        )}
        {error && !loading && (
          <div className="stac-error">
            <span>No imagery found</span>
          </div>
        )}
        {result && !loading && (
          <>
            {result.thumbnailUrl ? (
              <img
                src={result.thumbnailUrl}
                alt={`Sentinel-2 ${label}`}
                className="stac-image"
                onError={() => setError(true)}
              />
            ) : (
              <div className="stac-no-thumb">COG available (no preview)</div>
            )}
          </>
        )}
      </div>
      {result && !loading && (
        <div className="stac-meta">
          <span className="stac-date">{dateStr}</span>
          {result.cloudCover >= 0 && (
            <span className="stac-cloud">☁ {result.cloudCover.toFixed(0)}%</span>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Case Study Panel =====

function CaseStudyPanel({
  study,
  onClose,
  onLoadOverlay,
  overlayLoading,
  activeOverlay,
}: {
  study: CaseStudy;
  onClose: () => void;
  onLoadOverlay: (dateRange: string, label: string) => void;
  overlayLoading: boolean;
  activeOverlay: string | null;
}) {
  const model = models.find(m => m.id === study.modelId);

  return (
    <div className="case-study-panel">
      <button className="case-study-panel-close" onClick={onClose}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="case-study-panel-header" style={{ borderLeftColor: study.color }}>
        <span className="case-study-panel-model" style={{ color: study.color }}>
          {model?.icon} {study.modelName}
        </span>
        <h3>{study.title}</h3>
        <span className="case-study-panel-location">{study.location}</span>
      </div>

      <p className="case-study-panel-desc">{study.detail}</p>

      <div className="stac-overlay-hint">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        Click a thumbnail to load Sentinel-2 imagery on the map
      </div>

      <div className="stac-imagery-grid">
        <STACThumbnail
          bbox={study.bbox}
          dateRange={study.beforeDate}
          label="Before"
          isActive={activeOverlay === 'before'}
          onClick={() => onLoadOverlay(study.beforeDate, 'before')}
        />
        <STACThumbnail
          bbox={study.bbox}
          dateRange={study.afterDate}
          label="After"
          isActive={activeOverlay === 'after'}
          onClick={() => onLoadOverlay(study.afterDate, 'after')}
        />
      </div>

      {overlayLoading && (
        <div className="overlay-loading-bar">
          <div className="overlay-loading-progress" />
          <span>Loading COG tiles on map…</span>
        </div>
      )}

      <div className="case-study-coords">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span>{study.coords[1].toFixed(2)}°{study.coords[1] >= 0 ? 'N' : 'S'}, {Math.abs(study.coords[0]).toFixed(2)}°{study.coords[0] >= 0 ? 'E' : 'W'}</span>
      </div>

      <div className="stac-source-note">
        <span>Imagery: Sentinel-2 L2A via Element84 STAC · Tiles: TiTiler</span>
      </div>
    </div>
  );
}

// ===== Main Map Component =====

export default function CaseStudyMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [selectedStudy, setSelectedStudy] = useState<CaseStudy | null>(null);
  const [filterModel, setFilterModel] = useState<string>('all');
  const [overlayLoading, setOverlayLoading] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [layerVisibility, setLayerVisibility] = useState({ sentinel: true, markers: true });
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);

  const uniqueModels = Array.from(new Set(caseStudies.map(s => s.modelId)));

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
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
            attribution: '© Esri, Maxar, Earthstar Geographics'
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
      center: [10, 20],
      zoom: 1.8,
      attributionControl: false,
      maxZoom: 18
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when filter or visibility changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!layerVisibility.markers) return;

    const filtered = filterModel === 'all'
      ? caseStudies
      : caseStudies.filter(s => s.modelId === filterModel);

    filtered.forEach(study => {
      const el = document.createElement('div');
      el.className = 'map-marker';
      el.style.setProperty('--marker-color', study.color);
      el.innerHTML = `
        <div class="map-marker-dot"></div>
        <div class="map-marker-ring"></div>
        <div class="map-marker-label">${study.title}</div>
      `;

      el.addEventListener('click', () => {
        selectStudy(study);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(study.coords)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [filterModel, layerVisibility.markers]);

  // Toggle Sentinel overlay visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      if (map.getLayer('sentinel-overlay-layer')) {
        map.setLayoutProperty('sentinel-overlay-layer', 'visibility', layerVisibility.sentinel ? 'visible' : 'none');
      }
    } catch (_) {}
  }, [layerVisibility.sentinel]);

  const selectStudy = useCallback((study: CaseStudy) => {
    setSelectedStudy(study);
    setActiveOverlay(null);
    removeOverlayLayer();

    mapRef.current?.flyTo({
      center: study.coords,
      zoom: study.zoom,
      duration: 2000,
      essential: true
    });
  }, []);

  const removeOverlayLayer = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      if (map.getLayer('sentinel-overlay-layer')) map.removeLayer('sentinel-overlay-layer');
      if (map.getSource('sentinel-overlay')) map.removeSource('sentinel-overlay');
    } catch (_) { /* layer may not exist */ }
  }, []);

  const handleLoadOverlay = useCallback(async (dateRange: string, label: string) => {
    if (!selectedStudy || !mapRef.current) return;
    const map = mapRef.current;

    setOverlayLoading(true);

    try {
      // Search STAC for imagery
      const result = await searchSTAC(selectedStudy.bbox, dateRange);
      if (!result) {
        console.warn('No STAC results for', dateRange);
        setOverlayLoading(false);
        return;
      }

      // Remove previous overlay
      removeOverlayLayer();

      // Get tilejson to determine bounds and zoom range
      const tjResp = await fetch(getTileJsonUrl(result.cogUrl));
      const tj = await tjResp.json();

      if (!tj.tiles?.length) {
        console.warn('No tiles in tilejson');
        setOverlayLoading(false);
        return;
      }

      // Add COG tiles as raster source
      map.addSource('sentinel-overlay', {
        type: 'raster',
        tiles: [getTileUrl(result.cogUrl)],
        tileSize: 256,
        bounds: tj.bounds,
        minzoom: tj.minzoom || 6,
        maxzoom: tj.maxzoom || 14,
        attribution: `Sentinel-2 ${result.id} (${new Date(result.date).toLocaleDateString()})`
      });

      map.addLayer({
        id: 'sentinel-overlay-layer',
        type: 'raster',
        source: 'sentinel-overlay',
        paint: {
          'raster-opacity': 0.92,
          'raster-fade-duration': 300
        }
      });

      setActiveOverlay(label);

      // Fit to COG bounds if available
      const b = tj.bounds;
      if (b) {
        map.fitBounds([[b[0], b[1]], [b[2], b[3]]], {
          padding: 40,
          duration: 1000,
          maxZoom: 14
        });
      }
    } catch (err) {
      console.error('Failed to load COG overlay:', err);
    }

    setOverlayLoading(false);
  }, [selectedStudy, removeOverlayLayer]);

  const handleClose = useCallback(() => {
    setSelectedStudy(null);
    setActiveOverlay(null);
    removeOverlayLayer();
    mapRef.current?.flyTo({
      center: [10, 20],
      zoom: 1.8,
      duration: 1500
    });
  }, [removeOverlayLayer]);

  return (
    <section className="section map-section" data-section="map">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">Real-World Validation</span>
          <h2>Global Case Studies</h2>
          <p className="section-subtitle">
            Foundation models prove their worth in real-world applications. These case 
            studies demonstrate how dense vector embeddings solve specific geospatial 
            challenges — from flood mapping to crop classification — validating model 
            performance across diverse environments and tasks.
          </p>
          <p className="section-hint">
            Click a marker to explore a case study · Load Sentinel-2 imagery with Before/After thumbnails
          </p>
        </div>
      </div>
      <div className="map-wrapper fade-in">
        <div className="map-filter-bar">
          <button
            className={`map-filter-btn ${filterModel === 'all' ? 'active' : ''}`}
            onClick={() => setFilterModel('all')}
          >
            All Models
          </button>
          {uniqueModels.map(mId => {
            const m = models.find(mod => mod.id === mId);
            return m ? (
              <button
                key={mId}
                className={`map-filter-btn ${filterModel === mId ? 'active' : ''}`}
                onClick={() => setFilterModel(mId)}
                style={{ '--btn-color': m.color } as React.CSSProperties}
              >
                {m.icon} {m.name}
              </button>
            ) : null;
          })}
        </div>
        <div className="map-container-wrapper">
          <div ref={mapContainer} className="map-container" />

          {/* Layer control panel */}
          <div className={`map-layer-control ${layerPanelOpen ? 'open' : ''}`}>
            <button className="map-layer-toggle" onClick={() => setLayerPanelOpen(!layerPanelOpen)} title="Layer control">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              {layerPanelOpen && <span>Layers</span>}
            </button>
            {layerPanelOpen && (
              <div className="map-layer-options">
                <label className="map-layer-option">
                  <input
                    type="checkbox"
                    checked={layerVisibility.markers}
                    onChange={() => setLayerVisibility(prev => ({ ...prev, markers: !prev.markers }))}
                  />
                  <span className="map-layer-option-dot" style={{ background: '#059669' }} />
                  Case Study Markers
                </label>
                <label className="map-layer-option">
                  <input
                    type="checkbox"
                    checked={layerVisibility.sentinel}
                    onChange={() => setLayerVisibility(prev => ({ ...prev, sentinel: !prev.sentinel }))}
                  />
                  <span className="map-layer-option-dot" style={{ background: '#1a73e8' }} />
                  Sentinel-2 Overlay
                </label>
              </div>
            )}
          </div>

          {activeOverlay && (
            <div className="overlay-badge">
              <span className="overlay-badge-dot" />
              Sentinel-2 overlay: {activeOverlay}
              <button className="overlay-badge-close" onClick={() => {
                removeOverlayLayer();
                setActiveOverlay(null);
              }}>×</button>
            </div>
          )}
          {selectedStudy && (
            <CaseStudyPanel
              study={selectedStudy}
              onClose={handleClose}
              onLoadOverlay={handleLoadOverlay}
              overlayLoading={overlayLoading}
              activeOverlay={activeOverlay}
            />
          )}
        </div>
      </div>
    </section>
  );
}
