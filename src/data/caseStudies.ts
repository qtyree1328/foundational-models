export interface CaseStudy {
  id: string;
  title: string;
  location: string;
  coords: [number, number]; // [lng, lat]
  description: string;
  detail: string;
  bbox: [number, number, number, number]; // [west, south, east, north]
  beforeYear: number;
  afterYear: number;
  zoom: number;
  color: string;
  // What this study demonstrates
  application: 'change-detection' | 'classification' | 'urban-analysis' | 'disaster';
}

// Real case studies in US and South America only
export const caseStudies: CaseStudy[] = [
  {
    id: 'amazon-deforestation',
    title: 'Amazon Deforestation',
    location: 'Amazonas, Brazil',
    coords: [-60.0, -3.0],
    description: 'Tracking deforestation using embedding change detection',
    detail: 'Compare annual AlphaEarth embeddings to detect where the landscape changed significantly. Areas with large embedding shifts indicate deforestation, degradation, or regrowth — no labels needed.',
    bbox: [-60.5, -3.5, -59.5, -2.5],
    beforeYear: 2020,
    afterYear: 2023,
    zoom: 9,
    color: '#e07a2f',
    application: 'change-detection'
  },
  {
    id: 'iowa-cropland',
    title: 'Iowa Cropland',
    location: 'Iowa, USA',
    coords: [-93.5, 42.0],
    description: 'Crop type classification from embeddings alone',
    detail: 'AlphaEarth embeddings capture phenological signatures unique to each crop type. Different crops cluster naturally in embedding space — corn, soy, and other crops form distinct groups without any training.',
    bbox: [-94.0, 41.5, -93.0, 42.5],
    beforeYear: 2022,
    afterYear: 2023,
    zoom: 10,
    color: '#1a73e8',
    application: 'classification'
  },
  {
    id: 'california-wildfire',
    title: 'California Wildfire Recovery',
    location: 'Los Angeles, CA',
    coords: [-118.5, 34.1],
    description: 'Mapping burn severity and vegetation recovery',
    detail: 'Temporal embedding comparison reveals burn severity gradations and tracks vegetation recovery over time. The embedding shift magnitude correlates with fire damage intensity.',
    bbox: [-118.8, 33.9, -118.2, 34.3],
    beforeYear: 2019,
    afterYear: 2023,
    zoom: 10,
    color: '#dc2626',
    application: 'disaster'
  },
  {
    id: 'sao-paulo-urban',
    title: 'São Paulo Urban Expansion',
    location: 'São Paulo, Brazil',
    coords: [-46.63, -23.55],
    description: 'Urban sprawl detection through embedding similarity',
    detail: 'Urban areas have distinct embedding signatures from vegetation and water. Tracking where embeddings shift toward "urban-like" patterns reveals expansion at city edges over time.',
    bbox: [-46.9, -23.8, -46.3, -23.3],
    beforeYear: 2018,
    afterYear: 2023,
    zoom: 10,
    color: '#7c3aed',
    application: 'urban-analysis'
  }
];
