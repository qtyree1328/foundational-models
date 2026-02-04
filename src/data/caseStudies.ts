export interface CaseStudy {
  id: string;
  title: string;
  location: string;
  coords: [number, number]; // [lng, lat]
  modelId: string;
  modelName: string;
  description: string;
  detail: string;
  bbox: [number, number, number, number]; // [west, south, east, north] — tight for STAC search
  beforeDate: string; // RFC3339 range: "YYYY-MM-DDT00:00:00Z/YYYY-MM-DDT23:59:59Z"
  afterDate: string;
  zoom: number;
  color: string;
}

export const caseStudies: CaseStudy[] = [
  {
    id: 'valencia-floods',
    title: 'Valencia Floods',
    location: 'Valencia, Spain',
    coords: [-0.38, 39.47],
    modelId: 'prithvi',
    modelName: 'Prithvi-EO 2.0',
    description: 'Rapid flood extent mapping after devastating October 2024 floods using temporal Sentinel data fusion.',
    detail: 'Prithvi-EO 2.0 fused Sentinel-1 radar (which penetrates clouds) with Sentinel-2 optical data to map over 120 km² of flood damage. The temporal attention mechanism compared pre- and post-flood imagery to identify inundated areas with 30% higher accuracy than optical-only methods.',
    bbox: [-0.55, 39.35, -0.2, 39.55],
    beforeDate: '2024-09-01T00:00:00Z/2024-10-25T23:59:59Z',
    afterDate: '2024-11-01T00:00:00Z/2024-12-15T23:59:59Z',
    zoom: 11,
    color: '#059669'
  },
  {
    id: 'amazon-deforestation',
    title: 'Amazon Deforestation',
    location: 'Amazonas, Brazil',
    coords: [-60.0, -3.0],
    modelId: 'clay',
    modelName: 'Clay v1.5 / AlphaEarth',
    description: 'Tracking deforestation patterns and forest degradation across the Amazon basin using embedding change detection.',
    detail: 'By comparing annual embeddings from 2017 to 2024, change detection algorithms identify areas where the embedding space shifted significantly — indicating deforestation, degradation, or regrowth. The dot product between temporal embeddings quantifies landscape change magnitude.',
    bbox: [-60.5, -3.5, -59.5, -2.5],
    beforeDate: '2023-07-01T00:00:00Z/2023-10-30T23:59:59Z',
    afterDate: '2024-07-01T00:00:00Z/2024-10-30T23:59:59Z',
    zoom: 9,
    color: '#e07a2f'
  },
  {
    id: 'cropland-classification',
    title: 'US Cropland Classification',
    location: 'Iowa, USA',
    coords: [-93.5, 42.0],
    modelId: 'alphaearth',
    modelName: 'AlphaEarth Foundations',
    description: 'Mapping crop types across the US Corn Belt using 64-dimensional annual embeddings.',
    detail: 'AlphaEarth embeddings capture phenological signatures — the spectral and temporal patterns unique to each crop type. A simple k-nearest-neighbors classifier on the 64-dim embeddings achieves crop type accuracy comparable to dedicated models, without any fine-tuning.',
    bbox: [-93.8, 41.8, -93.2, 42.2],
    beforeDate: '2024-06-01T00:00:00Z/2024-07-31T23:59:59Z',
    afterDate: '2024-08-01T00:00:00Z/2024-09-30T23:59:59Z',
    zoom: 10,
    color: '#1a73e8'
  },
  {
    id: 'baltimore-heat',
    title: 'Baltimore Urban Heat',
    location: 'Baltimore, MD, USA',
    coords: [-76.61, 39.29],
    modelId: 'alphaearth',
    modelName: 'AlphaEarth Foundations',
    description: 'Analyzing urban heat island effects and green infrastructure using multi-modal embeddings.',
    detail: 'Embedding similarity analysis reveals how urban surfaces cluster differently from vegetated areas. The distance in embedding space between a park and surrounding asphalt correlates with measured temperature differentials, enabling city planners to identify heat vulnerability zones.',
    bbox: [-76.72, 39.22, -76.52, 39.38],
    beforeDate: '2024-05-01T00:00:00Z/2024-06-30T23:59:59Z',
    afterDate: '2024-07-01T00:00:00Z/2024-08-31T23:59:59Z',
    zoom: 12,
    color: '#1a73e8'
  },
  {
    id: 'open-buildings',
    title: 'Global Building Detection',
    location: 'Nairobi, Kenya',
    coords: [36.82, -1.29],
    modelId: 'alphaearth',
    modelName: 'AlphaEarth Foundations',
    description: 'Supporting Google Open Buildings initiative with embedding-based building footprint detection.',
    detail: 'AlphaEarth embeddings encode structural patterns that distinguish buildings from surrounding terrain. Fine-tuned classifiers on these embeddings detect building footprints across diverse architectural styles and environments, contributing to the Open Buildings dataset covering 1.8B structures.',
    bbox: [36.72, -1.36, 36.92, -1.22],
    beforeDate: '2024-01-01T00:00:00Z/2024-03-31T23:59:59Z',
    afterDate: '2024-07-01T00:00:00Z/2024-09-30T23:59:59Z',
    zoom: 13,
    color: '#1a73e8'
  },
  {
    id: 'wildfire-california',
    title: 'Wildfire Scar Mapping',
    location: 'Los Angeles, California',
    coords: [-118.5, 34.1],
    modelId: 'prithvi',
    modelName: 'Prithvi-EO 2.0',
    description: 'Mapping post-fire burn severity and vegetation recovery using temporal embeddings.',
    detail: 'Prithvi\'s temporal attention mechanism compares pre- and post-fire HLS imagery to generate burn severity maps. The model identifies not just burned areas but gradations of severity, supporting post-fire recovery planning and erosion risk assessment.',
    bbox: [-118.7, 34.0, -118.3, 34.2],
    beforeDate: '2024-10-01T00:00:00Z/2024-12-31T23:59:59Z',
    afterDate: '2025-01-10T00:00:00Z/2025-02-28T23:59:59Z',
    zoom: 11,
    color: '#059669'
  }
];
