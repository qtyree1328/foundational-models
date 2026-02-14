# LEOM Explorer — CLAUDE.md

> **Purpose**: This document preserves critical code patterns, architecture decisions, and implementation details to prevent accidental breakage during future edits.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Commands](#commands)
4. [Key Files & Structure](#key-files--structure)
5. [Component Reference](#component-reference)
6. [Data Models](#data-models)
7. [GEE Proxy Integration](#gee-proxy-integration)
8. [Styling System](#styling-system)
9. [Critical Implementation Details](#critical-implementation-details)
10. [Known Issues & Constraints](#known-issues--constraints)

---

## Project Overview

**LEOM Explorer** (Large Earth Observation Models Explorer) is an expert-level interactive dashboard for understanding and comparing geospatial foundation models.

| Property | Value |
|----------|-------|
| Location | `~/clawd/projects/foundational-models/` |
| URL (Local) | http://localhost:3003 |
| URL (Tailscale) | http://100.68.227.27:3003 |
| Domain | geospatialfms.com (future) |
| Stack | Vite + React 18 + TypeScript + MapLibre GL |
| Lines of Code | 10,000+ across 16 components |

### What It Does
- **Model Gallery**: Detailed specs for 9 LEOMs (AlphaEarth, Clay, Prithvi, etc.) with paper-verified data
- **Live Explorer**: Real-time GEE AlphaEarth embeddings with PCA/UMAP visualization
- **Case Study Map**: Before/after/embedding comparisons for fire, agriculture, deforestation events
- **Deep Comparison**: Radar charts, side-by-side specs, benchmark tables
- **Model Recommender**: Task-based recommendations with justifications
- **Demo Classification**: Interactive K-means clustering demo

---

## Architecture

### Stack
```
Vite 4.3                   # Build tool
React 18.2                 # UI framework  
TypeScript 5.0             # Type safety
MapLibre GL 3.6            # Mapping (NOT Mapbox)
Lucide React               # Icons
```

### File Structure
```
foundational-models/
├── index.html              # Entry point
├── package.json            # Dependencies
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript config
│
├── public/
│   └── imagery/            # Pre-computed satellite imagery
│       └── manifest.json   # Imagery registry
│
├── src/
│   ├── main.tsx            # React entry
│   ├── App.tsx             # Root component with navigation
│   ├── index.css           # Master stylesheet (156KB!)
│   │
│   ├── components/         # 16 section components
│   │   ├── Hero.tsx              # Animated globe header
│   │   ├── Pipeline.tsx          # How LEOMs work
│   │   ├── ParadigmShift.tsx     # Pixel → embedding paradigm
│   │   ├── ModelGallery.tsx      # 9 model cards with details
│   │   ├── DeepComparison.tsx    # Radar charts, specs table
│   │   ├── Ecosystem.tsx         # Industry landscape
│   │   ├── LiveExplorer.tsx      # GEE AlphaEarth demo
│   │   ├── DemoClassification.tsx # K-means clustering
│   │   ├── CaseStudyMap.tsx      # Before/after/embedding maps
│   │   ├── FMExplorer.tsx        # Advanced embedding explorer
│   │   ├── ExpertInsights.tsx    # Research citations
│   │   ├── ModelRecommender.tsx  # Task-based selection tool
│   │   ├── EmbeddingViz.tsx      # PCA/UMAP visualization
│   │   ├── Sources.tsx           # Bibliography
│   │   ├── GettingStarted.tsx    # Quick start guide
│   │   └── ComparisonMatrix.tsx  # (unused)
│   │
│   ├── hooks/
│   │   └── useInView.ts    # Intersection Observer for nav
│   │
│   ├── data/
│   │   ├── models.ts       # Model specifications (1200+ lines)
│   │   └── caseStudies.ts  # Case study locations
│   │
│   └── lib/
│       └── gee-config.ts   # GEE proxy configuration
│
└── dist/                   # Production build
```

---

## Commands

```bash
# Development
npm run dev          # Start dev server on port 3003

# Production
npm run build        # Build to dist/
npm run preview      # Preview production build

# PM2 (if running as service)
pm2 restart foundational-models
```

### Port Configuration
The dev server runs on port 3003 by default. This is configured in the npm script or can be overridden:
```bash
npm run dev -- --port 3003
```

---

## Key Files & Structure

### App.tsx (Root Component)
- Manages active section state via Intersection Observer
- Renders sticky navigation bar with section links
- Lazy loads heavy components (ExpertInsights, DemoClassification)
- Section order defines page flow

**NAV_ITEMS** (defines navigation):
```typescript
const NAV_ITEMS = [
  { id: 'pipeline', label: 'How It Works' },
  { id: 'paradigm', label: 'Why It Matters' },
  { id: 'models', label: 'Models' },
  { id: 'deep-compare', label: 'Compare' },
  { id: 'ecosystem', label: 'Ecosystem' },
  { id: 'explorer', label: 'Live Explorer' },
  { id: 'demo-classify', label: 'Demo' },
  { id: 'cases', label: 'Case Studies' },
  { id: 'insights', label: 'Expert' },
  { id: 'recommender', label: 'Recommender' },
  { id: 'sources', label: 'Sources' },
];
```

### models.ts (Model Database)
**CRITICAL FILE** — 1200+ lines of paper-verified model specifications.

Each model has:
```typescript
interface Model {
  id: string;                    // URL-safe ID
  name: string;                  // Display name
  org: string;                   // Organization
  tagline: string;               // One-line description
  description: string;           // Full description
  params: string;                // Parameter count
  paramsNum: number;             // Numeric for sorting
  resolution: string;            // Spatial resolution
  modalities: string[];          // Input sensors
  license: string;               // Apache-2.0, Proprietary, etc.
  dataSource: string;            // Training data
  keyStrength: string;           // Main advantage
  color: string;                 // Brand color (hex)
  icon: string;                  // Emoji icon
  paperYear: number;             // Publication year
  paperVenue?: string;           // Conference/journal
  temporal: boolean;             // Supports multi-temporal?
  openWeights: boolean;          // Weights publicly available?
  
  architecture: {
    type: string;                // MAE, GPT, etc.
    encoder: string;             // ViT variant
    encoderDepth?: number;
    encoderHeads?: number;
    embeddingDim: number;        // 64, 768, 1024, etc.
    patchSize?: number;
    maskRatio?: number;
    pretrainingStrategy: string;
  };
  
  training: {
    dataset: string;
    samples: string;
    sensors: string[];
    computeDetails?: string;
    epochs?: number;
    geoCoverage: string;
    temporalRange?: string;
  };
  
  benchmarks: ModelBenchmark[];
  pros: string[];
  cons: string[];
  useCases: string[];
  links: { label: string; url: string }[];
  codeExample?: string;
  
  scores: {                      // Radar chart (0-10 scale)
    parameters: number;
    resolution: number;
    modalities: number;
    temporal: number;
    openness: number;
    benchmarks: number;
  };
}
```

**Models included:**
1. AlphaEarth (Google DeepMind) — 64D embeddings, GEE-native
2. Clay v1.5 (Clay Foundation) — 632M params, Apache-2.0
3. HLS Geospatial FM (NASA/IBM) — First open-source from NASA
4. Prithvi-EO 2.0 (NASA/IBM) — 300M/600M, temporal
5. SatMAE (Stanford) — NeurIPS 2022
6. SpectralGPT (Wuhan) — Hyperspectral specialist
7. SkySense (Wuhan/SenseTime) — 2.06B params
8. CROMA (NeurIPS 2023) — SAR-optical alignment
9. DOFA (TU Munich) — Any-sensor hypernetwork

### taskModelMatrix (models.ts)
Task-based recommendations with benchmarks:
```typescript
const taskModelMatrix: Record<string, {
  best: string[];      // Top picks
  good: string[];      // Viable alternatives
  limited: string[];   // Not recommended
  benchmarks?: string; // Performance notes
}>;
```

Tasks covered: Crop Mapping, Flood Detection, Change Detection, SAR Analysis, Hyperspectral, Land Cover, Object Detection, Similarity Search, Multi-Sensor Fusion, Production Deployment.

---

## Component Reference

### Hero.tsx
- Canvas-based animated globe with orbital paths
- Particles and scan lines effect
- Title: "Large Earth Observation Models"
- Subtitle with model count and benchmark info

### Pipeline.tsx
4-step visualization: Satellite Imagery → LEOM Processing → Geo-Embeddings → Applications

### ParadigmShift.tsx
Explains the paradigm transition:
- Text → Language Embeddings (NLP analogy)
- Pixels → Geo-Embeddings (our domain)

### ModelGallery.tsx
- Grid of 9 model cards
- Click to expand → detailed modal with:
  - Architecture specs
  - Training details
  - Benchmarks
  - Pros/Cons
  - Code examples
  - External links

### DeepComparison.tsx
- Interactive radar charts (6 axes per model)
- Side-by-side specification table
- Benchmark comparison
- Select up to 3 models to compare

### LiveExplorer.tsx
- Real GEE AlphaEarth embeddings via proxy
- MapLibre map with tile layers
- Band combination selector
- Before/after toggle
- Location presets (Chesapeake Bay, California, etc.)

### CaseStudyMap.tsx
**Complex component — handle with care.**

- 6 real-world case studies (fire, agriculture, deforestation)
- Before/After/Embedding layer toggles
- MapLibre with pre-fetched tile URLs
- GeoJSON markers for locations

**Key patterns:**
```typescript
// GeoJSON markers (not HTML) — critical for performance
map.addSource('locations', {
  type: 'geojson',
  data: { type: 'FeatureCollection', features: [...] }
});

// Pre-fetch all tile URLs on selection for instant switching
const tileUrls = await Promise.all([beforeUrl, afterUrl, embeddingUrl]);

// Loading overlay with map.once('idle') to wait for tiles
map.once('idle', () => setLoading(false));
```

### FMExplorer.tsx
Advanced embedding analysis:
- Custom location input
- PCA projection visualization
- K-means clustering
- Similarity search demo
- Single dimension viewer

### ModelRecommender.tsx
- Task selector dropdown
- Shows best/good/limited models for each task
- Includes benchmark justifications
- Links to model cards

### DemoClassification.tsx (Lazy-loaded)
- Interactive K-means demo
- Confusion matrix visualization
- Adjustable cluster count

### ExpertInsights.tsx (Lazy-loaded)
- Research citations and quotes
- Industry analyst perspectives
- Future directions

---

## Data Models

### Case Study Events (caseStudies.ts)
```typescript
interface RealEvent {
  id: string;
  name: string;
  category: 'fire' | 'agriculture' | 'deforestation' | 'urban' | 'flooding';
  icon: string;
  coords: [number, number];    // [lng, lat]
  zoom: number;
  bbox: [number, number, number, number];  // [west, south, east, north]
  beforeYear: number;
  afterYear: number;
  description: string;
  source: string;              // Data source (CAL FIRE, USDA, etc.)
  question: string;            // What FM question does this answer?
}
```

**Current events:**
- Creek Fire 2020 (California)
- Camp Fire 2018 (Paradise)
- Iowa Corn Belt (agriculture)
- CA Central Valley (agriculture)
- Amazon Rondônia (deforestation)
- ... more

---

## GEE Proxy Integration

### Configuration (lib/gee-config.ts)
```typescript
const GEE_PROXY_URL = import.meta.env.PROD
  ? 'https://gee-proxy-787413290356.us-east1.run.app'  // Production
  : '/gee';  // Development (Vite proxy)
```

### Vite Proxy (vite.config.ts)
```typescript
server: {
  proxy: {
    '/gee': {
      target: 'http://127.0.0.1:3013',  // Local GEE proxy server
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/gee/, '')
    }
  }
}
```

### GEE Proxy Server
Runs on port 3013, provides:
- AlphaEarth embedding tile URLs
- Sentinel-2 optical tile URLs
- Pre-computed imagery for case studies

### Tile URL Pattern
```typescript
const getTileUrl = async (year: number, bands: string[], bbox: number[]) => {
  const response = await fetch(`${GEE_PROXY_URL}/tiles`, {
    method: 'POST',
    body: JSON.stringify({ year, bands, bbox })
  });
  return response.json();  // { urlTemplate: "https://..." }
};
```

---

## Styling System

### Master Stylesheet (index.css)
**WARNING: 156KB, 3000+ lines. Edit carefully.**

Uses CSS custom properties for theming:
```css
:root {
  --bg-primary: #0a1628;       /* Dark blue background */
  --bg-secondary: #0f2038;
  --accent: #0d4f4f;           /* Teal accent */
  --accent-light: #1a8a7a;
  --text-primary: #e8f0f7;
  --text-secondary: #8db4d4;
  --border: rgba(141, 180, 212, 0.15);
}
```

### Section Structure
Each section uses:
```css
.section {
  padding: 100px 0;
  position: relative;
}
.section[data-section="id"] {
  /* Section-specific styles */
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}
```

### Component-Specific Styles
Components have dedicated CSS blocks:
- `.model-card`, `.model-modal` — ModelGallery
- `.radar-chart` — DeepComparison
- `.case-study-map` — CaseStudyMap
- `.live-explorer` — LiveExplorer

### Map Styling (Critical)
```css
.case-study-map .maplibregl-map {
  height: 700px;  /* Bigger than default */
}

/* Loading overlay */
.map-loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 22, 40, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

## Critical Implementation Details

### 1. GeoJSON Markers (Not HTML)
**IMPORTANT:** Use GeoJSON markers instead of HTML markers for map pins.
```typescript
// ✅ CORRECT — pins stick to map, no lag
map.addSource('locations', {
  type: 'geojson',
  data: geoJsonFeatures
});
map.addLayer({
  id: 'location-markers',
  type: 'circle',
  source: 'locations',
  paint: { 'circle-radius': 8, 'circle-color': '#ff6b6b' }
});

// ❌ WRONG — causes rendering issues
new maplibregl.Marker().setLngLat([lng, lat]).addTo(map);
```

### 2. Pre-fetch Tile URLs
Pre-fetch all tiles on event selection, then toggle layers instantly:
```typescript
// On event select — fetch all URLs
const [beforeUrl, afterUrl, embeddingUrl] = await Promise.all([
  getTileUrl(event.beforeYear, opticalBands, event.bbox),
  getTileUrl(event.afterYear, opticalBands, event.bbox),
  getTileUrl(event.afterYear, embeddingBands, event.bbox)
]);

// Store URLs, then toggle with setLayoutProperty
map.setLayoutProperty('before-layer', 'visibility', 'visible');
map.setLayoutProperty('after-layer', 'visibility', 'none');
```

### 3. Loading State with map.once('idle')
Wait for tiles to load before hiding spinner:
```typescript
setLoading(true);
map.addSource('imagery', { type: 'raster', tiles: [url] });
map.once('idle', () => setLoading(false));
```

### 4. Light Basemap
Use Carto Voyager (light) instead of dark themes:
```typescript
const map = new maplibregl.Map({
  style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  center: [-85, 12],  // Americas center
  zoom: 2.5
});
```

### 5. Compact Toggle Buttons
```css
.layer-toggle {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 4px;
}
```

### 6. Section Observation for Navigation
```typescript
// useInView.ts
const useSectionInView = (callback: (id: string) => void) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback(entry.target.getAttribute('data-section') || '');
          }
        });
      },
      { threshold: 0.3 }
    );
    document.querySelectorAll('[data-section]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [callback]);
};
```

---

## Known Issues & Constraints

### 1. Large CSS File
`index.css` is 156KB — consider splitting into component-level CSS modules if this grows.

### 2. GEE Proxy Dependency
LiveExplorer and CaseStudyMap require the GEE proxy server running on port 3013 for development. In production, uses Cloud Run endpoint.

### 3. AlphaEarth Embedding Bands
The 64-band AlphaEarth output (A00-A63) has no official documentation on what each band represents. Current RGB combinations are experimental:
- A01, A16, A09 — Default visualization
- Research ongoing for validated combinations

### 4. Case Study Data Freshness
Case studies use pre-2024 events to ensure satellite data availability. Adding new events requires verifying GEE data coverage.

### 5. Model Data Maintenance
`models.ts` requires manual updates when:
- New papers are published
- Benchmarks are updated
- New models are released

### 6. Mobile Responsiveness
The dashboard is optimized for desktop. Mobile experience is functional but not ideal for data-heavy sections.

---

## Quick Reference

### Adding a New Model
1. Add entry to `models` array in `src/data/models.ts`
2. Include all required fields (see interface above)
3. Add to `taskModelMatrix` for relevant tasks
4. Test radar chart rendering in DeepComparison

### Adding a Case Study
1. Add to `REAL_EVENTS` array in `CaseStudyMap.tsx` or `caseStudies.ts`
2. Verify GEE data availability for before/after years
3. Define meaningful `question` field

### Changing Map Center/Zoom
In CaseStudyMap.tsx:
```typescript
const map = new maplibregl.Map({
  center: [-85, 12],  // Americas center
  zoom: 2.5           // Continent level
});
```

### Updating GEE Proxy URL
In `lib/gee-config.ts`:
```typescript
const GEE_PROXY_URL = import.meta.env.PROD
  ? 'https://your-production-url.run.app'
  : '/gee';
```

---

*Last updated: February 2026*
*Generated from codebase analysis*
