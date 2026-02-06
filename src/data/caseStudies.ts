export interface CaseStudy {
  id: string;
  title: string;
  location: string;
  coords: [number, number]; // [lng, lat]
  description: string;
  detail: string;
  source: string; // Citation/source for the real event
  sourceUrl: string;
  bbox: [number, number, number, number]; // [west, south, east, north]
  beforeYear: number;
  afterYear: number;
  zoom: number;
  color: string;
  application: 'change-detection' | 'classification' | 'urban-analysis' | 'disaster';
}

// REAL case studies with documented sources - US and South America only
export const caseStudies: CaseStudy[] = [
  {
    id: 'palisades-fire',
    title: 'Palisades Fire (2025)',
    location: 'Los Angeles, CA',
    coords: [-118.53, 34.05], // Pacific Palisades
    description: 'Mapping burn extent from the January 2025 LA fires',
    detail: 'The Palisades Fire ignited January 7, 2025 and burned ~24,000 acres in one week. Embedding comparison between 2024 (pre-fire) and 2025 (post-fire) reveals burn severity — areas with large embedding shifts indicate vegetation loss.',
    source: 'NASA Earth Observatory',
    sourceUrl: 'https://earthobservatory.nasa.gov/images/153831/the-palisades-fires-footprint',
    bbox: [-118.65, 33.95, -118.40, 34.15],
    beforeYear: 2024,
    afterYear: 2025,
    zoom: 11,
    color: '#dc2626',
    application: 'disaster'
  },
  {
    id: 'amazon-prodes',
    title: 'Amazon Deforestation',
    location: 'Rondônia, Brazil',
    coords: [-63.0, -10.5], // Rondônia state - documented deforestation hotspot
    description: 'INPE PRODES monitoring of forest loss',
    detail: 'Brazil\'s INPE monitors Amazon deforestation via satellite since 1988. PRODES detected 5,796 km² of deforestation in 2024-2025. Embedding change detection identifies where landscape vectors shifted from forest-like to cleared signatures.',
    source: 'INPE PRODES / Mongabay',
    sourceUrl: 'https://news.mongabay.com/2025/10/heading-into-cop-brazils-amazon-deforestation-rate-is-falling-what-about-fires/',
    bbox: [-63.5, -11.0, -62.5, -10.0],
    beforeYear: 2020,
    afterYear: 2024,
    zoom: 9,
    color: '#16a34a',
    application: 'change-detection'
  },
  {
    id: 'iowa-cdl',
    title: 'Iowa Cropland (CDL)',
    location: 'Central Iowa, USA',
    coords: [-93.5, 42.0],
    description: 'USDA Cropland Data Layer classification',
    detail: 'The USDA Cropland Data Layer provides annual crop type maps at 30m resolution. AlphaEarth embeddings cluster by crop phenology — corn, soybeans, and other crops form distinct groups in embedding space without any training labels.',
    source: 'USDA NASS Cropland Data Layer',
    sourceUrl: 'https://nassgeodata.gmu.edu/CropScape/',
    bbox: [-94.0, 41.5, -93.0, 42.5],
    beforeYear: 2023,
    afterYear: 2024,
    zoom: 10,
    color: '#ca8a04',
    application: 'classification'
  },
  {
    id: 'creek-fire',
    title: 'Creek Fire (2020)',
    location: 'Fresno County, CA',
    coords: [-119.3, 37.2], // Sierra National Forest
    description: 'One of California\'s largest wildfires',
    detail: 'The Creek Fire started September 4, 2020 and burned 379,895 acres across Fresno and Madera Counties. Comparing 2019 (pre-fire) to 2021 (post-fire) embeddings shows burn severity patterns and early vegetation recovery.',
    source: 'CAL FIRE / Sierra RCD',
    sourceUrl: 'https://sierrarcd.com/creekfirerecovery/',
    bbox: [-119.6, 37.0, -119.0, 37.5],
    beforeYear: 2019,
    afterYear: 2021,
    zoom: 10,
    color: '#ea580c',
    application: 'disaster'
  }
];
