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
  // Optional month ranges for more precise date filtering (1-12)
  beforeMonth?: number;
  afterMonth?: number;
  zoom: number;
  color: string;
  application: 'change-detection' | 'classification' | 'urban-analysis' | 'disaster';
  // For classification studies like Iowa - allows year selection instead of before/after
  yearSelectable?: boolean;
  availableYears?: number[];
}

// REAL case studies with documented sources - ALL PRE-2024 (AlphaEarth training cutoff)
export const caseStudies: CaseStudy[] = [
  {
    id: 'camp-fire',
    title: 'Camp Fire (2018)',
    location: 'Paradise, CA',
    coords: [-121.6, 39.76],
    description: 'California\'s deadliest wildfire destroyed Paradise',
    detail: 'The Camp Fire ignited November 8, 2018 and burned 153,336 acres, destroying the town of Paradise and killing 85 people. Comparing October 2018 (pre-fire) to December 2018 (post-fire) imagery reveals burn severity and the complete loss of urban structures.',
    source: 'CAL FIRE',
    sourceUrl: 'https://www.fire.ca.gov/incidents/2018/11/8/camp-fire/',
    bbox: [-121.8, 39.6, -121.4, 39.9],
    beforeYear: 2018,
    afterYear: 2018,
    beforeMonth: 10, // October - before Nov 8 fire
    afterMonth: 12, // December - after fire contained
    zoom: 11,
    color: '#dc2626',
    application: 'disaster'
  },
  {
    id: 'amazon-prodes',
    title: 'Amazon Deforestation',
    location: 'Rondônia, Brazil',
    coords: [-63.0, -10.5],
    description: 'INPE PRODES monitoring of forest loss',
    detail: 'Brazil\'s INPE has monitored Amazon deforestation via satellite since 1988. This region in Rondônia shows classic fishbone deforestation patterns along roads. Embedding change detection identifies where landscape vectors shifted from forest-like to cleared signatures.',
    source: 'INPE PRODES',
    sourceUrl: 'http://terrabrasilis.dpi.inpe.br/app/dashboard/deforestation/biomes/legal_amazon/rates',
    bbox: [-63.5, -11.0, -62.5, -10.0],
    beforeYear: 2018,
    afterYear: 2022,
    zoom: 9,
    color: '#16a34a',
    application: 'change-detection'
  },
  {
    id: 'iowa-cdl',
    title: 'Iowa Cropland',
    location: 'Central Iowa, USA',
    coords: [-93.5, 42.0],
    description: 'Compare USDA Cropland Data Layer with AlphaEarth embeddings',
    detail: 'The USDA Cropland Data Layer (CDL) provides annual crop type maps at 30m resolution using supervised classification. AlphaEarth embeddings cluster crops by phenology WITHOUT any training labels — corn, soybeans, and other crops form distinct groups in embedding space. Select a year to compare.',
    source: 'USDA NASS Cropland Data Layer',
    sourceUrl: 'https://nassgeodata.gmu.edu/CropScape/',
    bbox: [-94.0, 41.5, -93.0, 42.5],
    beforeYear: 2022,
    afterYear: 2022,
    zoom: 10,
    color: '#ca8a04',
    application: 'classification',
    yearSelectable: true,
    availableYears: [2019, 2020, 2021, 2022, 2023]
  },
  {
    id: 'creek-fire',
    title: 'Creek Fire (2020)',
    location: 'Fresno County, CA',
    coords: [-119.3, 37.2],
    description: 'One of California\'s largest wildfires',
    detail: 'The Creek Fire started September 4, 2020 and burned 379,895 acres across Fresno and Madera Counties. Comparing August 2020 (pre-fire) to November 2020 (post-fire) imagery shows immediate burn severity patterns.',
    source: 'CAL FIRE / Sierra RCD',
    sourceUrl: 'https://sierrarcd.com/creekfirerecovery/',
    bbox: [-119.6, 37.0, -119.0, 37.5],
    beforeYear: 2020,
    afterYear: 2020,
    beforeMonth: 8, // August - before Sept 4 fire
    afterMonth: 11, // November - after fire contained
    zoom: 10,
    color: '#ea580c',
    application: 'disaster'
  }
];
