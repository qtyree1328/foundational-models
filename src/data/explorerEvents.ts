export type EventCategory = 'fire' | 'agriculture' | 'deforestation' | 'urban' | 'flooding';
export type LayerType = 'before' | 'after' | 'change' | 'optical' | 'cdl' | 'burn' | 'degradation' | 'clusters';

export interface ExplorerEvent {
  id: string;
  name: string;
  category: EventCategory;
  coords: [number, number];
  zoom: number;
  bbox: [number, number, number, number];
  beforeYear: number;
  afterYear: number;
  beforeMonth?: number;
  afterMonth?: number;
  description: string;
  detail?: string;
  source: string;
  sourceUrl?: string;
  question: string;
  color: string;
  yearSelectable?: boolean;
  availableYears?: number[];
}

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  fire: '#ef4444',
  agriculture: '#eab308',
  deforestation: '#22c55e',
  urban: '#8b5cf6',
  flooding: '#3b82f6'
};

export const LAYER_INFO: Record<LayerType, { label: string; description: string }> = {
  before: { label: 'Before', description: 'Embedding from before the event. Pre-event baseline.' },
  after: { label: 'After', description: 'Embedding after the event. Post-event state.' },
  change: { label: 'Change', description: 'Embedding difference between years. Bright = large change in 64D vector.' },
  optical: { label: 'Optical', description: 'Sentinel-2 true color imagery for visual reference.' },
  cdl: { label: 'CDL', description: 'USDA Cropland Data Layer — purpose-trained crop classifier. Compare to FM.' },
  burn: { label: 'dNBR', description: 'Differenced Normalized Burn Ratio. Red = severe burn, blue = unburned.' },
  degradation: { label: 'Degradation', description: 'Process vector projection. Red = high deforestation similarity, green = healthy.' },
  clusters: { label: 'K-Means', description: 'K-means clustering on ALL 64 dims. Often reveals more than RGB visualization.' }
};

export const BAND_PRESETS = [
  { name: 'Default', r: 1, g: 16, b: 9, desc: 'Google tutorial standard - highlights urban' },
  { name: 'Buildings', r: 6, g: 20, b: 24, desc: 'Tall buildings (Element 84 research - dims 6,20,24)' },
  { name: 'Airport', r: 26, g: 16, b: 9, desc: 'Dim 26 detects airports (Element 84) — validated on Philadelphia!' },
  { name: 'Industrial', r: 51, g: 16, b: 9, desc: 'Dim 51 = industrial areas (Element 84 research)' },
  { name: 'Water Focus', r: 8, g: 32, b: 48, desc: 'Water-sensitive dimensions (experimental — not published)' },
  { name: 'Vegetation', r: 12, g: 28, b: 44, desc: 'Natural vegetation patterns (experimental — not published)' },
  { name: 'Spread', r: 0, g: 31, b: 63, desc: 'Full range distribution' },
  { name: 'Sequential', r: 0, g: 1, b: 2, desc: 'First 3 axes' },
];

// Merged from FMExplorer's REAL_EVENTS + CaseStudyMap's caseStudies
// CaseStudy entries enriched with beforeMonth/afterMonth, yearSelectable, detail, sourceUrl
export const explorerEvents: ExplorerEvent[] = [
  // === FIRE ===
  {
    id: 'creek-fire',
    name: 'Creek Fire 2020',
    category: 'fire',
    coords: [-119.3, 37.2],
    zoom: 10,
    bbox: [-119.6, 37.0, -119.0, 37.5],
    beforeYear: 2020,
    afterYear: 2020,
    beforeMonth: 8,
    afterMonth: 11,
    description: 'One of California\'s largest fires. 379,895 acres burned in Sierra National Forest.',
    detail: 'The Creek Fire started September 4, 2020 and burned 379,895 acres across Fresno and Madera Counties. Comparing August 2020 (pre-fire) to November 2020 (post-fire) imagery shows immediate burn severity patterns.',
    source: 'CAL FIRE / Sierra RCD',
    sourceUrl: 'https://sierrarcd.com/creekfirerecovery/',
    question: 'Can FM identify burn scars without fire-specific training?',
    color: '#ea580c',
  },
  {
    id: 'camp-fire',
    name: 'Camp Fire 2018 (Paradise)',
    category: 'fire',
    coords: [-121.6, 39.76],
    zoom: 11,
    bbox: [-121.8, 39.6, -121.4, 39.9],
    beforeYear: 2018,
    afterYear: 2018,
    beforeMonth: 10,
    afterMonth: 12,
    description: 'Deadliest wildfire in California history. Destroyed the town of Paradise.',
    detail: 'The Camp Fire ignited November 8, 2018 and burned 153,336 acres, destroying the town of Paradise and killing 85 people. Comparing October 2018 (pre-fire) to December 2018 (post-fire) imagery reveals burn severity and the complete loss of urban structures.',
    source: 'CAL FIRE',
    sourceUrl: 'https://www.fire.ca.gov/incidents/2018/11/8/camp-fire/',
    question: 'Does embedding change correlate with burn severity (dNBR)?',
    color: '#dc2626',
  },

  // === AGRICULTURE ===
  {
    id: 'iowa-corn',
    name: 'Iowa Corn Belt',
    category: 'agriculture',
    coords: [-93.5, 42.0],
    zoom: 10,
    bbox: [-94.0, 41.5, -93.0, 42.5],
    beforeYear: 2022,
    afterYear: 2022,
    description: 'Heart of US corn/soybean production. Compare FM embeddings vs CDL crop classifier.',
    detail: 'The USDA Cropland Data Layer (CDL) provides annual crop type maps at 30m resolution using supervised classification. AlphaEarth embeddings cluster crops by phenology WITHOUT any training labels — corn, soybeans, and other crops form distinct groups in embedding space. Select a year to compare.',
    source: 'USDA NASS Cropland Data Layer',
    sourceUrl: 'https://nassgeodata.gmu.edu/CropScape/',
    question: 'How does a general FM compare to a specialized crop model (CDL)?',
    color: '#ca8a04',
    yearSelectable: true,
    availableYears: [2019, 2020, 2021, 2022, 2023],
  },
  {
    id: 'ca-central-valley',
    name: 'CA Central Valley Drought',
    category: 'agriculture',
    coords: [-120.5, 37.0],
    zoom: 9,
    bbox: [-121.0, 36.5, -120.0, 37.5],
    beforeYear: 2019,
    afterYear: 2022,
    description: 'One of California\'s worst droughts on record. Compare normal (2019) vs extreme drought (2022).',
    detail: 'The 2021-2022 California drought was one of the most severe in state history, leading to widespread field fallowing, reservoir depletion, and crop losses across the Central Valley. Comparing 2019 (normal water year) to 2022 (extreme drought) reveals how embeddings capture drought stress patterns without drought-specific training.',
    source: 'CA Dept of Water Resources',
    sourceUrl: 'https://water.ca.gov/Water-Basics/Drought',
    question: 'Can embeddings detect drought stress and fallowed fields without drought-specific training?',
    color: '#ca8a04',
  },
  {
    id: 'cocoa-farms-ghana',
    name: 'Cocoa Plantations, Ghana',
    category: 'agriculture',
    coords: [-1.85, 6.15],
    zoom: 12,
    bbox: [-1.95, 6.05, -1.75, 6.25],
    beforeYear: 2023,
    afterYear: 2023,
    description: 'West African cocoa belt. Test whether embedding clustering can distinguish cocoa from surrounding tropical forest.',
    detail: 'Ghana is the world\'s second-largest cocoa producer. Cocoa plantations have distinct spectral and structural signatures compared to natural tropical forest. This is a single-year clustering study — can unsupervised K-means on AlphaEarth embeddings separate cocoa from forest without labeled training data?',
    source: 'Exploratory analysis',
    question: 'Can embedding clustering distinguish cocoa plantations from surrounding tropical forest?',
    color: '#ca8a04',
  },

  // === DEFORESTATION / FORESTRY ===
  {
    id: 'maine-forest-carbon',
    name: 'Maine Forest Carbon (Renoster)',
    category: 'deforestation',
    coords: [-69.0, 45.3],
    zoom: 7,
    bbox: [-71.1, 43.0, -66.9, 47.5],
    beforeYear: 2024,
    afterYear: 2024,
    description: 'Renoster uses AlphaEarth + LiDAR to map forest canopy height and biomass for carbon offset verification.',
    detail: 'Published Feb 4, 2026 by Renoster on Google Earth Medium. Real production use case — AlphaEarth embeddings combined with USGS 3DEP LiDAR data to predict forest canopy height and aboveground biomass across Maine. An ElasticNet regression on 64 embedding dimensions achieves strong prediction of LiDAR-derived canopy height. K-means clustering on embeddings naturally separates forest types (hardwood, softwood, mixed).',
    source: 'Renoster / Google Earth Blog',
    sourceUrl: 'https://medium.com/google-earth/improved-forest-carbon-estimation-with-alphaearth-foundations-and-airborne-lidar-data-af2d93e94c55',
    question: 'Can AlphaEarth embeddings predict forest canopy height when combined with LiDAR training data?',
    color: '#16a34a',
  },
  {
    id: 'amazon-rondonia',
    name: 'Amazon Rondônia',
    category: 'deforestation',
    coords: [-63.0, -10.5],
    zoom: 9,
    bbox: [-63.5, -11.0, -62.5, -10.0],
    beforeYear: 2018,
    afterYear: 2022,
    description: 'Brazil\'s INPE PRODES deforestation monitoring region. Fishbone deforestation patterns.',
    detail: 'Brazil\'s INPE has monitored Amazon deforestation via satellite since 1988. This region in Rondônia shows classic fishbone deforestation patterns along roads. Embedding change detection identifies where landscape vectors shifted from forest-like to cleared signatures.',
    source: 'INPE PRODES',
    sourceUrl: 'http://terrabrasilis.dpi.inpe.br/app/dashboard/deforestation/biomes/legal_amazon/rates',
    question: 'Can FM reveal forest degradation gradients using process vectors?',
    color: '#16a34a',
  },

  // === URBAN ===
  {
    id: 'philadelphia-urban',
    name: 'Philadelphia (Element 84 Study)',
    category: 'urban',
    coords: [-75.16, 39.95],
    zoom: 11,
    bbox: [-75.28, 39.87, -75.04, 40.03],
    beforeYear: 2018,
    afterYear: 2024,
    description: 'Element 84 found Dim 26=airports, Dims 6/20/24=buildings here. Try "Airport" preset!',
    detail: 'Element 84\'s Dec 2025 blog used Philadelphia as their primary analysis site, discovering: dim 26 = airports, dims 6/20/24 = tall buildings, dim 51 = industrial areas. Also used for change detection (2018→2024). The wider bbox includes PHL airport — use the Airport band preset to validate.',
    source: 'Element 84 Research',
    sourceUrl: 'https://element84.com/machine-learning/exploring-alphaearth-embeddings/',
    question: 'Can we validate Element 84\'s dimension discoveries (airports, tall buildings)?',
    color: '#8b5cf6',
  },
  {
    id: 'gerd-dam',
    name: 'Great Ethiopian Renaissance Dam',
    category: 'urban',
    coords: [35.09, 11.22],
    zoom: 12,
    bbox: [35.0, 11.15, 35.2, 11.30],
    beforeYear: 2018,
    afterYear: 2024,
    description: 'Africa\'s largest hydroelectric dam project on Blue Nile. Featured in Element 84 research.',
    detail: 'Used by Element 84 as a change detection example alongside Starbase TX and Julius Nyerere Dam. Africa\'s largest hydroelectric project — massive landscape transformation from dam construction and reservoir filling between 2018 and 2024.',
    source: 'Element 84 AlphaEarth Analysis',
    sourceUrl: 'https://element84.com/machine-learning/exploring-alphaearth-embeddings/',
    question: 'Can embeddings detect major infrastructure and water impoundment changes?',
    color: '#8b5cf6',
  },

  // === FLOODING ===
  {
    id: 'harvey-houston',
    name: 'Hurricane Harvey Recovery',
    category: 'flooding',
    coords: [-95.4, 29.76],
    zoom: 10,
    bbox: [-95.8, 29.4, -95.0, 30.1],
    beforeYear: 2017,
    afterYear: 2020,
    description: 'Track post-flood urban and ecological recovery across Houston over 3 years.',
    detail: 'Hurricane Harvey made landfall August 25, 2017, dumping 27 trillion gallons of rain on Houston. Annual embeddings integrate the full year, so 2017 includes both pre- and post-flood pixels. Rather than detecting the flood itself, this study tracks recovery: comparing 2017 (hurricane year) to 2020 (3 years post) reveals which areas recovered and which experienced lasting change.',
    source: 'NOAA National Hurricane Center',
    sourceUrl: 'https://www.weather.gov/crp/hurricane_harvey',
    question: 'Can annual embeddings track post-flood urban and ecological recovery over multiple years?',
    color: '#3b82f6',
  },
];
