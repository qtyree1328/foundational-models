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
  { name: 'Water Focus', r: 8, g: 32, b: 48, desc: 'Water-sensitive dimensions for dam/reservoir detection' },
  { name: 'Vegetation', r: 12, g: 28, b: 44, desc: 'Natural vegetation and forest patterns' },
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
    name: 'CA Central Valley',
    category: 'agriculture',
    coords: [-120.5, 37.0],
    zoom: 9,
    bbox: [-121.0, 36.5, -120.0, 37.5],
    beforeYear: 2022,
    afterYear: 2023,
    description: '250+ crop types. Most diverse agricultural region in the US.',
    source: 'CDFA',
    question: 'Can FM distinguish diverse crops as well as specialized classifiers?',
    color: '#ca8a04',
  },
  {
    id: 'cocoa-farms-ghana',
    name: 'Cocoa Plantations, Ghana',
    category: 'agriculture',
    coords: [-1.85, 6.15],
    zoom: 12,
    bbox: [-1.95, 6.05, -1.75, 6.25],
    beforeYear: 2021,
    afterYear: 2023,
    description: 'Cocoa farming region for testing dimension 12 (agricultural patterns). Partnership with Airbus and Barry Callebaut.',
    source: 'Airbus + Barry Callebaut study',
    question: 'Can dimension 12 accurately identify specific crop types like cocoa plantations?',
    color: '#ca8a04',
  },

  // === DEFORESTATION ===
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
    beforeYear: 2022,
    afterYear: 2024,
    description: 'Element 84 found Dim 26=airports, Dims 6/20/24=buildings here. Try "Airport" preset!',
    source: 'Element 84 Research',
    question: 'Can we validate Element 84\'s dimension discoveries (airports, tall buildings)?',
    color: '#8b5cf6',
  },
  {
    id: 'phoenix-expansion',
    name: 'Phoenix Urban Expansion',
    category: 'urban',
    coords: [-112.0, 33.5],
    zoom: 10,
    bbox: [-112.5, 33.0, -111.5, 34.0],
    beforeYear: 2017,
    afterYear: 2023,
    description: 'Fastest-growing US metro. Track urban sprawl with embeddings.',
    source: 'US Census',
    question: 'Can FM detect urban expansion without urban-specific training?',
    color: '#8b5cf6',
  },
  {
    id: 'gerd-dam',
    name: 'Great Ethiopian Renaissance Dam',
    category: 'urban',
    coords: [35.09, 11.22],
    zoom: 12,
    bbox: [35.05, 11.18, 35.13, 11.26],
    beforeYear: 2018,
    afterYear: 2023,
    description: 'Africa\'s largest hydroelectric dam project on Blue Nile. Featured in Element 84 research.',
    source: 'Element 84 AlphaEarth Analysis',
    question: 'Can embeddings detect major infrastructure and water impoundment changes?',
    color: '#8b5cf6',
  },
  {
    id: 'philadelphia-airport',
    name: 'Philadelphia Intl Airport',
    category: 'urban',
    coords: [-75.24, 39.87],
    zoom: 13,
    bbox: [-75.28, 39.85, -75.20, 39.89],
    beforeYear: 2022,
    afterYear: 2023,
    description: 'Test AlphaEarth dimension 26 (airport detection). Multiple long runways, clear aviation patterns.',
    source: 'Element 84 validation study',
    question: 'Does dimension 26 accurately highlight airport runways and aviation infrastructure?',
    color: '#8b5cf6',
  },
  {
    id: 'singapore-changi',
    name: 'Singapore Changi Airport',
    category: 'urban',
    coords: [103.99, 1.35],
    zoom: 13,
    bbox: [103.95, 1.32, 104.03, 1.38],
    beforeYear: 2022,
    afterYear: 2023,
    description: 'One of world\'s busiest airports. Test dimension 26 across different geographic regions.',
    source: 'Global airport validation',
    question: 'Does airport detection dimension generalize globally across different climates?',
    color: '#8b5cf6',
  },
  {
    id: 'port-rotterdam',
    name: 'Port of Rotterdam',
    category: 'urban',
    coords: [4.47, 51.95],
    zoom: 12,
    bbox: [4.35, 51.90, 4.59, 52.00],
    beforeYear: 2021,
    afterYear: 2023,
    description: 'Europe\'s largest port. Test industrial/logistics infrastructure detection. Dims 41 + 48.',
    source: 'Infrastructure analysis research',
    question: 'Do transport and coastal development dimensions capture major port logistics infrastructure?',
    color: '#8b5cf6',
  },

  // === FLOODING ===
  {
    id: 'harvey-houston',
    name: 'Hurricane Harvey 2017',
    category: 'flooding',
    coords: [-95.4, 29.76],
    zoom: 10,
    bbox: [-95.8, 29.4, -95.0, 30.1],
    beforeYear: 2017,
    afterYear: 2018,
    description: 'Catastrophic flooding in Houston. 27 trillion gallons of rain.',
    source: 'NOAA',
    question: 'Does embedding change capture flood impact and recovery?',
    color: '#3b82f6',
  },
];
