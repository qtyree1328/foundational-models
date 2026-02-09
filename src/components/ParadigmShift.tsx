import { useState, useRef, useEffect } from 'react';

const BASE = import.meta.env.BASE_URL;

// ─── Before/After comparison for text search vs earth search ───
const PARADIGM_COMPARISON = [
  {
    era: 'Text Search',
    icon: '📝',
    before: 'Keyword matching — "apple" returns every document with that string, whether about fruit, companies, or orchards',
    after: 'Word embeddings (Word2Vec → BERT) — "apple" near "fruit" vs "apple" near "iPhone" map to different vectors. Meaning is encoded.',
  },
  {
    era: 'Earth Search',
    icon: '🛰️',
    before: 'Pixel classification — train a model per task, per sensor, per region. Every new question requires a new model.',
    after: 'Geo-embeddings (LEOMs) — compress satellite imagery into universal vectors. Ask any question of any place without retraining. "Find places like this" becomes a vector similarity search.',
  },
];

// ─── Applications table ───
const APPLICATIONS = [
  { task: 'Land Cover Classification', method: 'Linear probe on embeddings', effort: 'Minutes', traditional: 'Weeks of labeled training data' },
  { task: 'Change Detection', method: 'Cosine distance between time steps', effort: 'Seconds', traditional: 'Bi-temporal model + thresholding' },
  { task: 'Anomaly Detection', method: 'Statistical outliers in embedding space', effort: 'Minutes', traditional: 'Domain-specific rule engineering' },
  { task: 'Similarity Search', method: 'Nearest-neighbor in vector DB', effort: 'Milliseconds', traditional: 'Manual feature engineering per query' },
  { task: 'Crop Type Mapping', method: 'Few-shot fine-tune (10 labels)', effort: 'Hours', traditional: 'Thousands of field-verified labels' },
  { task: 'Flood Extent', method: 'Threshold embedding shift from baseline', effort: 'Seconds', traditional: 'Water index + DEM + manual validation' },
  { task: 'Building Density', method: 'Label-efficient fine-tuning', effort: 'Hours', traditional: 'Extensive manual annotation campaigns' },
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
          <h2>Why Geo-Embeddings Can Change Everything</h2>
          <p className="section-subtitle">
            The same revolution that transformed text search (keywords → embeddings) and image search 
            (tags → vectors) is now happening for Earth observation. Geospatial analysis is shifting 
            from pixel classification to geo-embeddings — a new first-order data object that lets AI 
            reason spatially. The same embedding vector that identifies crop types also enables 
            similarity search (find places that look like this one globally), change detection 
            (what changed between these dates?), and anomaly detection — all without retraining. 
            These geo-embeddings have the potential to be as fundamental as the imagery itself.
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
