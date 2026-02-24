import { useState, useRef, useEffect } from 'react';

const BASE = import.meta.env.BASE_URL;

// ─── Before/After comparison for text search vs earth search ───
const PARADIGM_COMPARISON = [
  {
    era: 'Text Search Evolution',
    icon: '',
    before: 'Keyword matching — "apple" returns every document with that string, whether about fruit, companies, or orchards. No understanding of context or meaning.',
    after: 'Language embeddings (Word2Vec → BERT → GPT) — "apple" near "fruit" vs "apple" near "iPhone" map to different high-dimensional vectors. Semantic similarity enables "find documents like this one" without keyword matching.',
  },
  {
    era: 'Earth Observation Revolution',
    icon: '',
    before: 'Task-specific pixel classification — train separate models per sensor (Landsat vs Sentinel-2), per region (tropics vs arctic), per application (crops vs buildings). Every new question requires new labeled training data.',
    after: 'Large Earth Observation Models (LEOMs) — AlphaEarth compresses petabytes of multi-sensor data into 64-dimensional unit vectors on a hypersphere. "Find places similar to this hospital in terms of local food access" becomes embedding similarity search across global coverage.',
  },
];

// ─── Applications table ───
const APPLICATIONS = [
  { task: 'Land Cover Classification', method: 'K-means clustering on 64D AlphaEarth embeddings', effort: 'Minutes', traditional: 'Weeks of labeled training data + per-region models' },
  { task: 'Change Detection', method: 'Dot product stability maps (AlphaEarth annual)', effort: 'Seconds', traditional: 'Bi-temporal NDVI differencing + manual thresholding' },
  { task: 'Flood Mapping', method: 'Fine-tune 300M Prithvi-EO-2.0 (95.5% accuracy)', effort: '2-4 hours', traditional: 'Sen1Floods11 baseline methods (88% accuracy)' },
  { task: 'Similarity Search', method: 'Cosine similarity in embedding space', effort: 'Milliseconds', traditional: 'Manual spectral index combinations per query type' },
  { task: 'Crop Type Mapping', method: 'Few-shot learning (Dionelis et al. 2024: superior with limited labels)', effort: 'Hours', traditional: 'Thousands of field-verified training samples' },
  { task: 'Airport Detection', method: 'Single band visualization (A26 dimension)', effort: 'Instant', traditional: 'Manual feature engineering + validation flights' },
  { task: 'Cross-Sensor Fusion', method: 'Clay dynamic embedding: any sensor combination', effort: 'Minutes', traditional: 'Separate models per sensor + manual co-registration' },
  { task: 'Industrial Infrastructure', method: 'AlphaEarth A51 dimension (oil/gas facilities)', effort: 'Seconds', traditional: 'Specialized spectral signatures + ground truth verification' },
];

// ─── Preset locations for comparison ───
// Note: Only locations with available=true have downloaded imagery
const LOCATIONS = [
  { id: 'chesapeake', name: 'Chesapeake Bay', desc: 'Mountains, agriculture, forest, coast', available: true },
  { id: 'california', name: 'Central Valley', desc: 'Agriculture, urban, Sierra foothills', available: true },
  { id: 'florida', name: 'Florida Everglades', desc: 'Wetlands, coast, urban edge', available: true },
  { id: 'midwest', name: 'Iowa Farmland', desc: 'Agricultural heartland, river systems', available: true },
  { id: 'southwest', name: 'Phoenix Metro', desc: 'Desert, urban, irrigated agriculture', available: true },
  { id: 'pacific', name: 'Puget Sound', desc: 'Forest, water, urban, mountains', available: true },
];

// ─── Image comparison slider ───
function ImageSlider() {
  const [sliderPos, setSliderPos] = useState(50);
  const [activeLocation, setActiveLocation] = useState('chesapeake');
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    isDragging.current = true;
  };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      e.preventDefault();
      handleMove(e.clientX);
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const up = () => { isDragging.current = false; };
    const preventSelect = (e: Event) => { if (isDragging.current) e.preventDefault(); };
    window.addEventListener('mouseup', up);
    window.addEventListener('selectstart', preventSelect);
    return () => {
      window.removeEventListener('mouseup', up);
      window.removeEventListener('selectstart', preventSelect);
    };
  }, []);

  const loc = LOCATIONS.find(l => l.id === activeLocation) || LOCATIONS[0];

  return (
    <div className="image-slider-container fade-in">
      {/* Location selector - only show available locations */}
      <div className="slider-location-selector">
        {LOCATIONS.filter(l => l.available).map(l => (
          <button
            key={l.id}
            className={`slider-location-btn ${activeLocation === l.id ? 'active' : ''}`}
            onClick={() => setActiveLocation(l.id)}
            title={l.desc}
          >
            {l.name}
          </button>
        ))}
        {LOCATIONS.filter(l => l.available).length < LOCATIONS.length && (
          <span className="slider-location-more">+ more locations coming</span>
        )}
      </div>

      <div className="image-slider-labels">
        <span className="slider-label left">Optical Imagery</span>
        <span className="slider-label right">AlphaEarth Embedding RGB</span>
      </div>
      <div
        ref={containerRef}
        className="image-slider"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onDragStart={e => e.preventDefault()}
      >
        <img 
          src={`${BASE}imagery/optical-${activeLocation}.jpg`} 
          alt={`Optical satellite imagery - ${loc.name}`} 
          className="slider-img bottom" 
          draggable={false}
        />
        <div className="slider-img-wrapper" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
          <img 
            src={`${BASE}imagery/alphaearth-${activeLocation}.jpg`} 
            alt={`AlphaEarth embedding visualization - ${loc.name}`} 
            className="slider-img top" 
            draggable={false}
          />
        </div>
        <div className="slider-handle" style={{ left: `${sliderPos}%` }}>
          <div className="slider-handle-line" />
          <div className="slider-handle-grip">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" fill="white" stroke="var(--accent)" strokeWidth="2"/>
              <path d="M7 10H13M7 10L9 8M7 10L9 12M13 10L11 8M13 10L11 12" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </div>
      <p className="slider-caption">
        <strong>{loc.name}:</strong> {loc.desc}. Drag to compare optical imagery (left) vs AlphaEarth's 
        64-dimensional embedding RGB (right). Similar colors = similar landscape characteristics.
      </p>
    </div>
  );
}

export default function ParadigmShift() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} className="section paradigm-section" data-section="paradigm">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">The Paradigm Shift</span>
          <h2>From Research to Operational Deployment</h2>
          <p className="section-subtitle">
            The geo-embedding revolution has moved beyond research into production. Vantor is deploying 
            Google Earth AI in air-gapped government environments. Planet Labs and Airbus are integrating 
            vision-language models into commercial workflows. LGND raised $9M to build geo-embedding 
            infrastructure. The same paradigm shift that transformed text search (keywords → embeddings) 
            and image search (tags → vectors) is now operationally deployed for Earth observation — 
            geospatial analysis has shifted from pixel classification to geo-embeddings, a first-order 
            data object that lets AI reason spatially at planetary scale.
          </p>
        </div>

        {/* ── Before/After Comparison Table ── */}
        <div className="paradigm-comparison-table fade-in">
          <div className="comparison-header">
            <span className="comparison-col"></span>
            <span className="comparison-col">Before</span>
            <span className="comparison-col">After</span>
          </div>
          {PARADIGM_COMPARISON.map((row, i) => (
            <div key={i} className="comparison-row">
              <div className="comparison-era">
                <span className="era-icon">{row.icon}</span>
                <span className="era-name">{row.era}</span>
              </div>
              <div className="comparison-before">{row.before}</div>
              <div className="comparison-after">{row.after}</div>
            </div>
          ))}
        </div>

        {/* ── Image Slider ── */}
        <ImageSlider />

        {/* ── What They Unlock ── */}
        <div className="paradigm-unlock fade-in">
          <h3 className="paradigm-sub-header">What They Unlock</h3>
          <p className="paradigm-unlock-desc">
            The magic of geo-embeddings: compute them once, use them everywhere. The same 64-dim vector 
            that classifies land cover also detects floods, finds anomalies, and enables planetary-scale 
            similarity search — with no additional training. Recent research (Dionelis et al. 2024) 
            confirms that Large Earth Observation Models consistently outperform task-specific models 
            when labeled training data is limited, validating the label efficiency advantage of 
            foundation model approaches.
          </p>
          
          <div className="applications-table">
            <div className="applications-header">
              <span>Application</span>
              <span>With Geo-Embeddings</span>
              <span>Effort</span>
              <span>Traditional Approach</span>
            </div>
            {APPLICATIONS.map((app, i) => (
              <div key={i} className="applications-row">
                <span className="app-task">{app.task}</span>
                <span className="app-method">{app.method}</span>
                <span className="app-effort">{app.effort}</span>
                <span className="app-traditional">{app.traditional}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
