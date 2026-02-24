export interface ModelBenchmark {
  task: string;
  dataset: string;
  metric: string;
  value: number;
  unit: string;
  citation?: string;
}

export interface ModelArchitecture {
  type: string;
  encoder: string;
  encoderDepth?: number;
  encoderHeads?: number;
  embeddingDim: number;
  patchSize?: number;
  maskRatio?: number;
  inputSize?: string;
  decoderDim?: number;
  decoderDepth?: number;
  pretrainingStrategy: string;
}

export interface TrainingSpec {
  dataset: string;
  samples: string;
  sensors: string[];
  computeDetails?: string;
  epochs?: number;
  geoCoverage: string;
  temporalRange?: string;
}

export interface Model {
  id: string;
  name: string;
  org: string;
  tagline: string;
  description: string;
  params: string;
  paramsNum: number; // for sorting/comparison (in millions)
  resolution: string;
  modalities: string[];
  license: string;
  dataSource: string;
  keyStrength: string;
  color: string;
  icon: string;
  links: { label: string; url: string }[];
  codeExample?: string;
  architecture: ModelArchitecture;
  training: TrainingSpec;
  benchmarks: ModelBenchmark[];
  pros: string[];
  cons: string[];
  useCases: string[];
  paperYear: number;
  paperVenue?: string;
  temporal: boolean;
  openWeights: boolean;
  // For radar chart normalization (0-10 scale)
  scores: {
    parameters: number;
    resolution: number;
    modalities: number;
    temporal: number;
    openness: number;
    benchmarks: number;
  };
}

/**
 * LEOM Landscape 2024-2026: The field of Large Earth Observation Models has seen explosive growth.
 * 
 * Recent developments include:
 * • NASA/IBM released Prithvi-EO-2.0 (Dec 2024): 300M/600M parameter models outperforming v1.0 by 8% across GEO-Bench
 * • GeoBench ecosystem expansion (2025): GEO-Bench-2 with 19 datasets, GEO-Bench-VLM for vision-language models, and GeoCrossBench for cross-satellite evaluation
 * • Oak Ridge National Lab's OReole-FM (Oct 2024): Billion-parameter models for high-resolution satellite imagery with emergent abilities research
 * • Label efficiency research (Dionelis et al. 2024): Foundation models consistently outperform task-specific models with limited labeled data
 * • LGND secured $9M seed funding (July 2025) led by Javelin Venture Partners - founded by Clay creators Dan Hammer & Bruno Sánchez-Andrade Nuño
 * • NASA ROSES-2025 program: $700M+ initiative for user-centered applications with Large Earth Foundation Models (Prithvi-EO focus)
 * • Clay Foundation continues development with enhanced multi-sensor capabilities via Development Seed partnership
 * • Microsoft and NASA partnership expanding accessible satellite data through AI
 * • Google DeepMind's AlphaEarth Foundations now available on Cloud Storage (Dec 2025) for production use
 * • Academic advances: DEFLECT parameter-efficient adaptation (ICCV 2025) achieving 5-10x fewer parameters than competing methods while maintaining accuracy for geospatial tasks
 * • Multimodal Remote Sensing Foundation Models survey (MDPI Remote Sensing, Oct 2025): Comprehensive review of vision-X MM-RSFMs, identifies 5 key challenges: data scarcity, feature extraction limits, weak generalization, no unified evaluation, insufficient security
 * • REOBench (NeurIPS 2025): First comprehensive robustness benchmark for EO foundation models across 6 tasks and 12 corruption types - reveals significant performance degradation (1-20%) under real-world perturbations
 * • Earth Embeddings Ecosystem Study (Jan 2026): Comprehensive taxonomy of 7+ embedding products reveals fragmentation barriers; TorchGeo integration provides unified API for cross-comparison
 * • Scaling Laws Research (Jun 2025): First systematic study on PhilEO Bench reveals CNN models remain competitive in low-shot settings, but ViT-UPerNet achieves best performance on multi-TB datasets like MajorTOM (23TB)
 * • Mamba State-Space Models (2026): First extensive evaluation in Earth observation shows efficiency advantages but requires large-scale pretraining to match CNNs/ViTs
 * 
 * The transition from pixel-level classification to geo-embeddings represents a fundamental
 * paradigm shift in how we process Earth observation data - similar to the evolution from 
 * keyword-based to language model embeddings in NLP.
 * 
 * Sources: Prithvi-EO-2.0 arXiv:2412.02732 (Dec 2024), OReole-FM arXiv:2410.19965 (Oct 2024), 
 * DEFLECT ICCV 2025 arXiv:2503.09493, MDPI Remote Sensing survey (Oct 2025) doi:10.3390/rs17213532,
 * LGND funding PRNewswire (July 10, 2025), GEO-Bench-2 AI Alliance (2025), NASA ROSES-2025 solicitation,
 * REOBench arXiv:2505.16793 (NeurIPS 2025), Earth Embeddings Ecosystem arXiv:2601.13134 (Jan 2026),
 * Scaling Laws for GFMs arXiv:2506.14765 (Jun 2025)
 */
export const models: Model[] = [
  {
    id: 'alphaearth',
    name: 'AlphaEarth Foundations',
    org: 'Google DeepMind',
    tagline: '64-dimensional embeddings for the entire Earth at 10m resolution',
    description: 'An embedding field model (not standard ViT MAE) that assimilates spatial, temporal, and measurement contexts from Sentinel-1 SAR, Sentinel-2 MSI, Landsat 8/9, GEDI LiDAR, climate simulations, NLCD, and USDA CDL into compact 64-dimensional unit-length vectors. Produces annual global embeddings at 10m resolution, available as 64-band images (A00–A63) through Google Earth Engine and Google Cloud Storage as Cloud Optimized GeoTIFFs (Dec 2025). Dataset version 1.1 includes annual coverage from 2017-2024. 16× less storage than competing model outputs. Recent studies identify AlphaEarth as a foundational "pixel-level" embedding product (Jan 2026 Earth Embeddings Ecosystem study), with global TorchGeo integration standardizing cross-comparison with other foundation models.',
    params: 'Undisclosed',
    paramsNum: 0,
    resolution: '10m',
    modalities: ['Sentinel-1 SAR', 'Sentinel-2 MSI', 'Landsat 8/9', 'GEDI LiDAR', 'Climate', 'NLCD', 'USDA CDL'],
    license: 'Proprietary (free GEE access)',
    dataSource: 'Petabytes — 10.1M video sequences (v2.1)',
    keyStrength: 'Global production-ready, multi-modal fusion, GEE-native',
    color: '#1a73e8',
    icon: '🌍',
    paperYear: 2025,
    paperVenue: 'arXiv',
    temporal: true,
    openWeights: false,
    architecture: {
      type: 'Embedding Field Model',
      encoder: 'Custom (not ViT)',
      embeddingDim: 64,
      pretrainingStrategy: 'Multi-modal assimilation — fuses spatial, temporal, and measurement contexts from heterogeneous sources into unit-length 64D hypersphere vectors',
    },
    training: {
      dataset: 'Petabyte-scale multi-modal EO corpus',
      samples: '10.1M video sequences (v2.1)',
      sensors: ['Sentinel-1', 'Sentinel-2', 'Landsat 8/9', 'GEDI LiDAR', 'Climate models', 'NLCD', 'USDA CDL'],
      geoCoverage: 'Global terrestrial + coastal',
      temporalRange: '2017–2024 (annual, 2025 rolling)',
    },
    benchmarks: [
      { task: 'Multi-task average', dataset: 'Internal benchmarks', metric: 'Error reduction', value: 24, unit: '% lower error rate vs baselines', citation: 'arxiv.org/abs/2507.22291' },
    ],
    pros: [
      'Global coverage at 10m — every terrestrial pixel on Earth',
      'Production-ready: pre-computed annual embeddings in GEE catalog',
      'Multi-modal fusion: SAR + optical + LiDAR + climate in single embedding',
      'Cloud/gap-free: temporal compositing eliminates missing data',
      '16× less storage than competing model outputs (64D vs 1024D)',
      'Change detection via simple dot product between years',
    ],
    cons: [
      'Closed model — cannot fine-tune or access raw weights',
      'GEE-only access (requires Google Earth Engine account)',
      'Annual temporal resolution (no sub-annual dynamics)',
      'Undisclosed architecture makes reproducibility impossible',
      'No direct pixel-level segmentation output',
    ],
    useCases: [
      'Global Ecosystems Atlas — ecosystem type mapping (official use case)',
      'MapBiomas Brazil — land cover classification',
      'Crop type mapping — K-means clustering at Krishna Raja Sagara Reservoir, India',
      'Change detection — dot product stability maps between years',
      'Similarity search — find locations with similar landscape characteristics globally',
    ],
    links: [
      { label: 'Paper', url: 'https://arxiv.org/abs/2507.22291' },
      { label: 'Earth Engine Catalog', url: 'https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL' },
      { label: 'GEE Code Editor', url: 'https://code.earthengine.google.com/cc4871f10c6f45271bbeae1b9565b944' },
      { label: 'Blog', url: 'https://deepmind.google/blog/alphaearth-foundations-helps-map-our-planet-in-unprecedented-detail/' },
      { label: 'Cloud Storage Access (Dec 2025)', url: 'https://medium.com/google-earth/alphaearth-foundations-satellite-embeddings-now-available-on-google-cloud-storage-f9ab0f7252d6' },
    ],
    scores: { parameters: 5, resolution: 9, modalities: 10, temporal: 6, openness: 3, benchmarks: 8 },
    codeExample: `// Google Earth Engine — AlphaEarth Embeddings
// ⚠ Requires GEE account (code.earthengine.google.com)
var embeddings = ee.ImageCollection(
  'GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL'
);

// Get 2023 annual embeddings (64 bands: A00–A63)
var emb2023 = embeddings
  .filter(ee.Filter.date('2023-01-01', '2023-12-31'))
  .first();

// Visualize 3 axes as RGB false-color
Map.addLayer(emb2023.select(['A01', 'A16', 'A09']), {
  min: -0.3, max: 0.3
}, 'Embedding RGB');

// Change detection: cosine similarity via dot product
var emb2022 = embeddings
  .filter(ee.Filter.date('2022-01-01', '2022-12-31'))
  .first();
var stability = emb2023.multiply(emb2022)
  .reduce(ee.Reducer.sum());
// Values near 1.0 = stable, near 0 = major change
Map.addLayer(stability, {min: 0.8, max: 1},
  'Stability (dot product)');

// K-means clustering for unsupervised land cover
var training = emb2023.sample({
  region: aoi, scale: 10, numPixels: 5000
});
var clusterer = ee.Clusterer.wekaKMeans(8)
  .train(training);
var clusters = emb2023.cluster(clusterer);
Map.addLayer(clusters.randomVisualizer(),
  {}, 'Land Cover Clusters');`,
  },
  {
    id: 'clay',
    name: 'Clay v1.5',
    org: 'Clay Foundation / Radiant Earth',
    tagline: 'Open-source ViT-Large MAE with DINOv2 teacher for any sensor',
    description: 'A 632M-parameter Vision Transformer pre-trained with masked autoencoder + 5% DINOv2 representation loss on 70M globally distributed chips (256×256). Clay v1.5 (Nov 2024) introduces four key architectural components: (1) Dynamic Embedding Block that generates patches from arbitrary band counts and wavelengths, (2) Position Encoding that scales by Ground Sampling Distance and integrates lat/lon + temporal data, (3) ViT-based MAE reconstruction (95% of loss), and (4) DINOv2 teacher for representation learning (5% of loss). Supports variable input sizes, resolutions, and spectral band combinations across Sentinel-2, Landsat, Sentinel-1 SAR, NAIP, LINZ, and MODIS sensors. Encoder: dim=1024, depth=24, 16 heads. Decoder: dim=512, depth=4. Fully open source (Apache-2.0) with weights on HuggingFace. The Clay team (Dan Hammer, Bruno Sánchez-Andrade Nuño) also founded LGND — the geospatial intelligence company that raised $9M seed funding (Sep 2025, led by Javelin Venture Partners) to build queryable Earth infrastructure.',
    params: '632M (Encoder: 311M + Decoder: 15M + DINOv2: 304M)',
    paramsNum: 632,
    resolution: 'Variable (GSD-aware)',
    modalities: ['Sentinel-2 (10 bands)', 'Landsat 8/9 (6 bands)', 'Sentinel-1 SAR (2 bands)', 'NAIP (4 bands)', 'LINZ (3 bands)', 'MODIS (7 bands)'],
    license: 'Apache-2.0',
    dataSource: '70M globally distributed chips (256×256)',
    keyStrength: 'Fully open, any-sensor input, DINOv2 representation quality',
    color: '#e07a2f',
    icon: '🏺',
    paperYear: 2024,
    paperVenue: 'Documentation',
    temporal: false,
    openWeights: true,
    architecture: {
      type: 'ViT-Large MAE + DINOv2',
      encoder: 'ViT-Large',
      encoderDepth: 24,
      encoderHeads: 16,
      embeddingDim: 1024,
      patchSize: 8,
      maskRatio: 0.75,
      inputSize: '256×256',
      decoderDim: 512,
      decoderDepth: 4,
      pretrainingStrategy: 'Masked Autoencoder (75% mask ratio) + 5% DINOv2 teacher representation loss. Clay v1.5 (Nov 2024) uses: (1) Dynamic embedding block generating wavelength-specific patches, (2) GSD-scaled position encoding with lat/lon/temporal metadata, (3) ViT-based MAE reconstruction loss (95%), (4) DINOv2-small teacher for representation learning (5%). Supports arbitrary input sizes, resolutions, and band combinations.',
    },
    training: {
      dataset: 'Global chips sampled by LULC statistics (v1.5 multi-sensor)',
      samples: '70M chips (256×256) with variable bands/resolutions',
      sensors: ['Sentinel-2 (10 bands)', 'Landsat 8/9 (6 bands)', 'Sentinel-1 SAR (2 bands)', 'NAIP (4 bands)', 'LINZ (3 bands)', 'MODIS (7 bands)'],
      computeDetails: '20 AWS g6.48xlarge (160 L4 GPUs), ~100 epochs, ~800 GPU-hours/epoch. Metadata: wavelengths, GSD, lat/lon, time step (week/hour)',
      epochs: 100,
      geoCoverage: 'Global (land/coastal, multi-sensor fusion)',
      temporalRange: 'Max 6 timestamps per location with temporal encoding',
    },
    benchmarks: [
      { task: 'Training convergence', dataset: 'Internal', metric: 'Loss', value: 0.165, unit: 'train/val loss', citation: 'clay-foundation.github.io' },
      { task: 'Label efficiency', dataset: 'EO Foundation Model benchmark', metric: 'Performance advantage', value: 1, unit: 'Superior with limited labels', citation: 'Dionelis et al. arXiv:2406.18295 (2024)' },
      { task: 'Cross-sensor generalization', dataset: 'Multi-sensor tasks', metric: 'GSD-aware encoding', value: 1, unit: 'Variable resolution support', citation: 'Clay v1.5 technical documentation (2024)' },
      { task: 'Robustness evaluation', dataset: 'REOBench', metric: 'Performance drop under corruptions', value: 10, unit: '% average degradation across tasks', citation: 'REOBench arXiv:2505.16793 (NeurIPS 2025)' },
    ],
    pros: [
      'Fully open source (Apache-2.0) — weights, code, and data',
      'Handles ANY sensor via dynamic embedding block (wavelength-aware)',
      'DINOv2 teacher improves representation quality beyond pure reconstruction',
      '1024-dim embeddings capture rich feature representations',
      'GSD-aware position encoding enables true cross-sensor generalization',
      'v1.5 supports variable input sizes and band combinations seamlessly',
      'Pre-computed embeddings available on Source Cooperative',
      'Active community with comprehensive documentation and tutorials',
    ],
    cons: [
      'Land/coastal only — no ocean or atmosphere coverage',
      'Limited temporal: max 6 timestamps per location in training',
      'No nighttime data in training set',
      'No extreme weather events represented in training',
      'Large model (632M) may be slow on consumer hardware',
    ],
    useCases: [
      'Feature discovery — detecting mines, aquaculture facilities, solar farms',
      'Land cover classification with few-shot fine-tuning',
      'Change detection via embedding cosine similarity',
      'Cross-sensor similarity search (e.g., find NAIP matches for Sentinel-2 query)',
    ],
    links: [
      { label: 'Website', url: 'https://madewithclay.org' },
      { label: 'HuggingFace', url: 'https://huggingface.co/made-with-clay' },
      { label: 'GitHub', url: 'https://github.com/Clay-foundation/model' },
      { label: 'Documentation', url: 'https://clay-foundation.github.io/model/' },
    ],
    scores: { parameters: 7, resolution: 7, modalities: 8, temporal: 3, openness: 10, benchmarks: 6 },
    codeExample: `# Clay Foundation Model v1.5
# pip install git+https://github.com/Clay-foundation/model.git
# Weights: huggingface.co/made-with-clay/Clay

from claymodel.module import ClayMAEModule
import torch

# Load pretrained (632M params)
model = ClayMAEModule.load_from_checkpoint(
    "path/to/clay-v1.5.ckpt"
)
model.eval()

# Architecture: ViT-L encoder (d=1024, 24 layers, 16 heads)
#   + Decoder (d=512, 4 layers)
#   + DINOv2 teacher (304M params)
# Patch size: 8, Mask ratio: 75%

# Input: any sensor — dynamic embedding handles
# variable bands via wavelength metadata
pixels = load_sentinel2_patch(bbox, date)  # (B, 10, 256, 256)

with torch.no_grad():
    embeddings = model.encoder(pixels)
    # Output: (B, N_patches, 1024) embeddings

# Pre-computed embeddings also available at:
# source.coop/clay/clay-model-v1-embeddings`,
  },
  {
    id: 'nasa-ibm-hls',
    name: 'HLS Geospatial Foundation Model',
    org: 'NASA / IBM',
    tagline: 'First open-source geospatial AI foundation model from NASA',
    description: 'NASA and IBM Research\'s collaborative milestone: the first open-source geospatial AI foundation model built on NASA\'s Harmonized Landsat Sentinel-2 (HLS) dataset. Developed by NASA\'s IMPACT team at Marshall Space Flight Center in partnership with IBM Research, this model represents institutional adoption of foundation models for Earth science. Designed for land use tracking, natural disaster monitoring, and crop yield prediction with wide-ranging applications in climate change research.',
    params: 'Undisclosed',
    paramsNum: 0, // Unknown parameter count
    resolution: '30m (HLS native)',
    modalities: ['Landsat 8/9', 'Sentinel-2 (harmonized to HLS)'],
    license: 'Apache-2.0',
    dataSource: 'NASA HLS (Harmonized Landsat Sentinel-2)',
    keyStrength: 'NASA institutional backing, HLS data pipeline, open-source milestone',
    color: '#1e40af',
    icon: '🚀',
    paperYear: 2023,
    paperVenue: 'NASA Earthdata',
    temporal: true,
    openWeights: true,
    architecture: {
      type: 'Foundation Model (architecture undisclosed)',
      encoder: 'Unknown',
      embeddingDim: 0, // Not specified
      pretrainingStrategy: 'Trained on NASA HLS dataset for multi-application generalization',
    },
    training: {
      dataset: 'NASA Harmonized Landsat Sentinel-2 (HLS)',
      samples: 'Large-scale (exact count undisclosed)',
      sensors: ['Landsat 8/9', 'Sentinel-2'],
      geoCoverage: 'Global',
      temporalRange: 'HLS archive (2013-present)',
    },
    benchmarks: [
      { task: 'Foundation milestone', dataset: 'Institutional', metric: 'First NASA open-source', value: 1, unit: 'foundational release', citation: 'NASA Earthdata, August 2023' },
    ],
    pros: [
      'NASA institutional backing and validation',
      'First open-source geospatial FM from a space agency',
      'Built on proven HLS data pipeline (Landsat + Sentinel-2)',
      'Wide application scope: land use, disasters, agriculture',
      'Available on Hugging Face for community access',
      'Establishes precedent for open geospatial AI from institutions',
    ],
    cons: [
      'Limited technical details released',
      'Architecture and parameter count undisclosed',
      '30m resolution limitations for detailed analysis',
      'Optical-only (no SAR or other sensor modalities)',
      'Limited benchmarking results published',
    ],
    useCases: [
      'Land use change tracking and classification',
      'Natural disaster monitoring and response',
      'Crop yield prediction and agricultural monitoring',
      'Climate change research applications',
      'Environmental impact assessment',
    ],
    links: [
      { label: 'NASA Announcement', url: 'https://www.earthdata.nasa.gov/news/nasa-ibm-openly-release-geospatial-ai-foundation-model-nasa-earth-observation-data' },
      { label: 'Hugging Face', url: 'https://huggingface.co/ibm-nasa-geospatial' },
    ],
    scores: {
      parameters: 0, // Unknown
      resolution: 6, // 30m is mid-range
      modalities: 4, // Landsat + Sentinel-2 harmonized
      temporal: 8, // Strong temporal with HLS archive
      openness: 9, // Fully open-source
      benchmarks: 3, // Limited published benchmarks
    },
  },
  {
    id: 'prithvi',
    name: 'Prithvi-EO 2.0',
    org: 'NASA / IBM',
    tagline: 'Temporal Vision Transformer with 3D MAE for Earth science',
    description: 'A 300M/600M parameter Temporal ViT pre-trained with 3D Masked Autoencoder on 4.2M global time series samples from NASA\'s Harmonized Landsat Sentinel-2 (HLS) data with WORLDWIDE coverage (Feb 2025 expansion from CONUS-only). Each sample: 4 timestamps × 224×224 × 6 bands (Blue, Green, Red, Narrow NIR, SWIR1, SWIR2). Key innovations: 3D spatiotemporal patch embeddings (t=1), temporal+location metadata as learned weighted bias (not input), metadata dropout during training. Enhanced quality controls emphasize urban areas and strict cloud filtering for robust global representation. Trained on JUWELS supercomputer (Jülich). Fine-tune via IBM\'s TerraTorch toolkit.',
    params: '300M (ViT-L) / 600M (ViT-H)',
    paramsNum: 600,
    resolution: '30m (HLS native)',
    modalities: ['HLS: Blue', 'Green', 'Red', 'Narrow NIR', 'SWIR1', 'SWIR2'],
    license: 'Apache-2.0',
    dataSource: '4.2M global time series (HLS 2014–2023)',
    keyStrength: 'Multi-temporal 3D attention, location-aware, TerraTorch ecosystem',
    color: '#059669',
    icon: '🛰️',
    paperYear: 2024,
    paperVenue: 'arXiv',
    temporal: true,
    openWeights: true,
    architecture: {
      type: 'Temporal Vision Transformer + 3D MAE',
      encoder: 'ViT-Large / ViT-Huge',
      embeddingDim: 1024,
      patchSize: 16,
      inputSize: '4×224×224 (T×H×W)',
      pretrainingStrategy: '3D Masked Autoencoder with spatiotemporal patch embeddings. Temporal+location metadata as learned weighted bias (not concatenated input). Metadata dropout for robustness.',
    },
    training: {
      dataset: 'NASA HLS (Harmonized Landsat Sentinel-2)',
      samples: '4.2M training + 46K validation time series',
      sensors: ['Landsat 8/9', 'Sentinel-2 (harmonized)'],
      computeDetails: '300M: 80 GPUs ~21K GPU-hours. 600M: 240 GPUs ~58K GPU-hours on JUWELS (Jülich)',
      epochs: 400,
      geoCoverage: 'Global',
      temporalRange: '2014–2023, sequences of 4 timestamps (1-6 month gaps)',
    },
    benchmarks: [
      { task: 'GEO-Bench improvement', dataset: 'GEO-Bench', metric: 'Improvement over v1.0', value: 8, unit: '% average improvement', citation: 'arXiv:2412.02732 (Dec 2024)' },
      { task: 'Cross-resolution transfer', dataset: 'Multi-resolution tasks', metric: 'Competitive at', value: 0.1, unit: 'm to 15m resolution', citation: 'arXiv:2412.02732' },
      { task: 'Flood mapping (v1.0)', dataset: 'Sen1Floods11', metric: 'mIoU', value: 88.68, unit: '% mIoU (97.25% accuracy)', citation: 'HuggingFace model card, Dataloop evaluation' },
      { task: 'Flood mapping (v2.0)', dataset: 'Sen1Floods11', metric: 'Accuracy', value: 95.5, unit: '% (fine-tuned v2.0)', citation: 'arXiv:2412.02732' },
      { task: 'Foundation vs task-specific', dataset: 'Limited label scenarios', metric: 'Superior performance', value: 1, unit: 'with limited training data', citation: 'Dionelis et al. arXiv:2406.18295 (2024)' },
      { task: 'Outperforms GFMs', dataset: 'GEO-Bench comparative', metric: 'Better than', value: 6, unit: 'other geospatial foundation models', citation: 'arXiv:2412.02732 (Dec 2024)' },
      { task: 'Robustness evaluation', dataset: 'REOBench', metric: 'Performance drop under corruptions', value: 12, unit: '% average degradation across tasks', citation: 'REOBench arXiv:2505.16793 (NeurIPS 2025)' },
      { task: 'Scaling laws comparison', dataset: 'PhilEO Bench', metric: 'ViT performance', value: 1, unit: 'Optimal for multi-TB datasets', citation: 'Scaling Laws arXiv:2506.14765 (Jun 2025)' },
    ],
    pros: [
      'True multi-temporal: 3D attention across 4 timestamps captures change',
      'Location-aware via learned geographic bias — knows where on Earth',
      'NASA backing with HLS data pipeline (harmonized Landsat+Sentinel-2)',
      'TerraTorch fine-tuning toolkit makes downstream tasks accessible',
      'Extensively benchmarked: outperforms 6 other GFMs on GEO-Bench',
      'Subject matter expert (SME) validated results',
    ],
    cons: [
      '30m resolution only — too coarse for urban/building-scale analysis',
      'Optical only — no SAR capability',
      'Limited to 6 HLS bands (no thermal, no red edge)',
      'Requires multi-temporal input — single-date performance reduced',
      '600M model needs significant GPU memory for fine-tuning',
    ],
    useCases: [
      'Flood mapping — Sen1Floods11 benchmark, Valencia flood response',
      'Wildfire scar detection and monitoring',
      'Multi-temporal crop segmentation',
      'Landslide detection and mapping',
      'Carbon flux prediction (regression task)',
    ],
    links: [
      { label: 'Paper', url: 'https://arxiv.org/abs/2412.02732' },
      { label: 'HuggingFace', url: 'https://huggingface.co/ibm-nasa-geospatial' },
      { label: 'TerraTorch', url: 'https://github.com/IBM/terratorch' },
      { label: 'GitHub', url: 'https://github.com/NASA-IMPACT/Prithvi-EO-2.0' },
    ],
    scores: { parameters: 7, resolution: 4, modalities: 3, temporal: 9, openness: 10, benchmarks: 9 },
    codeExample: `# Prithvi-EO 2.0 with TerraTorch
# pip install terratorch

from terratorch.registry import BACKBONE_REGISTRY

# Build backbone (downloads from HuggingFace)
model = BACKBONE_REGISTRY.build(
    "prithvi_eo_v2_300_tl",  # 300M with temporal+location
    pretrained=True
)
# Also: prithvi_eo_v2_600 (600M ViT-Huge)
#        prithvi_eo_v2_tiny_tl (5M for testing)

# Input: (B, T, C, H, W) temporal stack
# T = 4 timestamps, C = 6 HLS bands
# Bands: Blue, Green, Red, Narrow NIR, SWIR1, SWIR2
# Trained at 224×224, 30m HLS resolution

# Architecture: 3D spatiotemporal patch embeddings
# Temporal position: learned weighted bias (not input)
# Location: lat/lon metadata encoded as bias
# Metadata dropout during training for robustness

# Fine-tuning examples on GitHub:
# - Multitemporal Crop Segmentation
# - Sen1Floods11 Flood Mapping
# - Landslide Segmentation
# - Carbon Flux Prediction (Regression)`,
  },
  {
    id: 'satmae',
    name: 'SatMAE',
    org: 'Stanford / SustainLab',
    tagline: 'Temporal + spectral positional encodings for satellite MAE',
    description: 'A ViT-Large (≈307M params) extending MAE with temporal + spectral positional encodings—first model to combine both innovations. Independent masking strategy reconstructs patches from other timestamps, enabling cross-temporal learning. Achieves 14% improvement on transfer tasks and 7% on supervised classification over baselines. Pre-trained on fMoW-temporal (RGB sequences) and fMoW-Sentinel (multi-spectral). Published NeurIPS 2022.',
    params: '~307M (ViT-L/16)',
    paramsNum: 307,
    resolution: 'Variable (fMoW RGB + 10m Sentinel-2)',
    modalities: ['RGB (fMoW)', 'Sentinel-2 multi-spectral'],
    license: 'Open source',
    dataSource: 'fMoW-temporal + fMoW-Sentinel',
    keyStrength: 'Pioneered temporal + spectral position encodings for satellite MAE',
    color: '#8b5cf6',
    icon: '🔬',
    paperYear: 2022,
    paperVenue: 'NeurIPS 2022',
    temporal: true,
    openWeights: true,
    architecture: {
      type: 'ViT-Large MAE with Temporal+Spectral PE',
      encoder: 'ViT-Large/16',
      embeddingDim: 1024,
      patchSize: 16,
      pretrainingStrategy: 'MAE with independent temporal masking — reconstruct patches using other timestamps. Spectral positional encoding groups physically correlated bands.',
    },
    training: {
      dataset: 'fMoW-temporal (RGB) + fMoW-Sentinel (multi-spectral)',
      samples: 'fMoW: ~500K temporal sequences, 62 categories',
      sensors: ['WorldView (RGB)', 'Sentinel-2 (multi-spectral)'],
      geoCoverage: 'fMoW global sampling (biased toward populated areas)',
    },
    benchmarks: [
      { task: 'Supervised classification', dataset: 'fMoW', metric: 'Improvement over baselines', value: 7, unit: '%', citation: 'arXiv:2207.08051 (NeurIPS 2022)' },
      { task: 'Transfer learning', dataset: 'Multiple land cover tasks', metric: 'Improvement vs SOTA', value: 14, unit: '% transfer task improvement', citation: 'arXiv:2207.08051 (NeurIPS 2022)' },
      { task: 'Reconstruction quality', dataset: 'fMoW multi-spectral', metric: 'Independent masking', value: 1, unit: 'sharper reconstructions vs consistent masking', citation: 'SustainLab SatMAE project page' },
      { task: 'Temporal + spectral encoding', dataset: 'Satellite imagery benchmarks', metric: 'First to combine', value: 1, unit: 'temporal + spectral positional encodings', citation: 'NeurIPS 2022 innovation' },
    ],
    pros: [
      'First to introduce temporal + spectral positional encodings for satellite MAE',
      'Quantified performance: +14% transfer tasks, +7% supervised vs baselines',
      'Independent masking strategy produces sharper reconstructions',
      'Open source with pretrained weights available',
      'Relatively lightweight — trainable on academic compute',
      'Established methodology adopted by later foundation models',
    ],
    cons: [
      'Trained on fMoW only — not globally representative',
      'RGB focus with multi-spectral as secondary',
      'Older model (2022) — surpassed by newer approaches',
      'No SAR or LiDAR support',
      'Limited to fMoW categories for evaluation',
    ],
    useCases: [
      'Temporal scene classification (62 fMoW categories)',
      'Land cover classification via transfer learning',
      'Semantic segmentation on optical imagery',
      'Temporal change understanding from image sequences',
    ],
    links: [
      { label: 'Paper (NeurIPS 2022)', url: 'https://arxiv.org/abs/2207.08051' },
      { label: 'GitHub', url: 'https://github.com/sustainlab-group/SatMAE' },
      { label: 'Project Page', url: 'https://sustainlab-group.github.io/SatMAE/' },
    ],
    scores: { parameters: 5, resolution: 6, modalities: 4, temporal: 7, openness: 9, benchmarks: 8 },
    codeExample: `# SatMAE — NeurIPS 2022
# github.com/sustainlab-group/SatMAE
import torch
from models_mae import mae_vit_large_patch16

# Load ViT-L/16 pretrained on fMoW-temporal
model = mae_vit_large_patch16()
ckpt = torch.load("satmae_pretrained.pth")
model.load_state_dict(ckpt["model"])
model.eval()

# Key innovation: temporal positional encoding
# captures satellite revisit patterns
# Spectral positional encoding groups correlated bands

# fMoW temporal input: (B, T, C, H, W)
x = load_fmow_temporal(n_timestamps=3)

# Independent masking: model reconstructs
# masked patches using OTHER timestamps
loss, pred, mask = model(x)

# Transfer to downstream tasks:
# +7% supervised, +14% transfer vs baselines`,
  },
  {
    id: 'spectralgpt',
    name: 'SpectralGPT',
    org: 'Wuhan University',
    tagline: '3D Generative Pre-trained Transformer for spectral remote sensing',
    description: 'A novel 3D GPT architecture (≈600M+ params) designed specifically for spectral RS data. Uses spectral-wise 3D tensor masking at 90% mask ratio to capture spectral correlations. Progressive training strategy: smaller → larger spatial windows. Handles variable spectral bands (3 to 200+). Published in IEEE TPAMI 2024.',
    params: '~600M+ (multiple sizes)',
    paramsNum: 600,
    resolution: 'Variable',
    modalities: ['Hyperspectral (3–200+ bands)', 'Multi-spectral'],
    license: 'Research use',
    dataSource: 'Large-scale spectral RS dataset',
    keyStrength: 'Purpose-built for spectral data with 3D masking',
    color: '#ec4899',
    icon: '🌈',
    paperYear: 2024,
    paperVenue: 'IEEE TPAMI 2024',
    temporal: false,
    openWeights: false,
    architecture: {
      type: '3D Generative Pre-trained Transformer',
      encoder: 'Custom 3D GPT',
      embeddingDim: 1024,
      maskRatio: 0.90,
      pretrainingStrategy: 'Spectral-wise 3D tensor masking (90% ratio). Progressive training from smaller to larger spatial windows. Captures spectral correlations via 3D attention.',
    },
    training: {
      dataset: 'Large-scale spectral RS collection',
      samples: '1M+ spectral RS images',
      sensors: ['Hyperspectral sensors', 'Multi-spectral sensors'],
      geoCoverage: 'Benchmark datasets (global variety)',
    },
    benchmarks: [
      { task: 'Spectral classification', dataset: 'Multiple HSI benchmarks', metric: 'Performance', value: 95, unit: '% on spectral classification', citation: 'arxiv.org/abs/2311.07113' },
    ],
    pros: [
      'Purpose-built for spectral data — handles 3–200+ bands natively',
      '3D masking captures inter-band spectral correlations',
      'Progressive training improves multi-scale understanding',
      'Strong on hyperspectral classification tasks',
      'One of few models targeting hyperspectral specifically',
    ],
    cons: [
      'Primarily single-temporal — limited change detection capability',
      'Focused on spectral domain only (no SAR)',
      'Weights only partially available',
      'Requires hyperspectral data which is less accessible than optical',
      'Large compute requirements for 600M+ params',
    ],
    useCases: [
      'Hyperspectral image classification (mineral mapping)',
      'Spectral unmixing for sub-pixel analysis',
      'Vegetation species identification from spectral signatures',
      'Water quality assessment from hyperspectral data',
    ],
    links: [
      { label: 'Paper (IEEE TPAMI)', url: 'https://arxiv.org/abs/2311.07113' },
      { label: 'GitHub', url: 'https://github.com/danfenghong/IEEE_TPAMI_SpectralGPT' },
    ],
    scores: { parameters: 7, resolution: 5, modalities: 6, temporal: 2, openness: 4, benchmarks: 7 },
    codeExample: `# SpectralGPT — IEEE TPAMI 2024
# github.com/danfenghong/IEEE_TPAMI_SpectralGPT

# Architecture: 3D GPT for spectral RS data
# Key: 90% spectral-wise 3D tensor masking
# Progressive training: small → large windows

# Handles variable spectral bands (3-200+)
# 3D attention captures inter-band correlations

# Typical workflow:
import torch
from spectralgpt import SpectralGPT

model = SpectralGPT.from_pretrained("spectralgpt_large")
model.eval()

# Load hyperspectral cube (H × W × Bands)
hsi = load_hyperspectral("aviris_scene.hdr")
# e.g., 224 spectral bands, 256×256 spatial

patches = patchify_3d(hsi, patch_size=16)
with torch.no_grad():
    features = model.encode(patches)
    # Spectral-spatial features for downstream tasks

# Applications: mineral mapping, vegetation ID,
# spectral unmixing, water quality`,
  },
  {
    id: 'skysense',
    name: 'SkySense',
    org: 'Wuhan University / SenseTime',
    tagline: '2.06 billion parameter multi-modal spatiotemporal encoder',
    description: 'Multi-modal RSFM with factorized encoders: ViT-G for high-res optical, ViT-L for multi-spectral, ViT-L for SAR. Multi-granularity contrastive learning handles temporal sequences across modalities. V1 (2.06B params, CVPR 2024) achieved SOTA performance, surpassing 18 recent RSFMs in all test scenarios with large margins: +2.76% vs GFM, +3.67% vs SatLas, +3.61% vs Scale-MAE. V2 (July 2025, arXiv:2507.13812, ICCV 2025) unified transformer reduces to ~580M parameters while improving over V1 by average 1.8 points across 16 datasets spanning 7 tasks.',
    params: '580M (v2) / 2.06B (v1)',
    paramsNum: 580,
    resolution: 'Multi-resolution (HR optical + MS + SAR)',
    modalities: ['High-res optical', 'Multi-spectral', 'SAR', 'Temporal sequences'],
    license: 'Research use',
    dataSource: '21.5M temporal sequences (optical + SAR)',
    keyStrength: 'Largest GFM, factorized multi-modal encoders, CVPR 2024 SOTA',
    color: '#0ea5e9',
    icon: '🔭',
    paperYear: 2024,
    paperVenue: 'CVPR 2024',
    temporal: true,
    openWeights: false,
    architecture: {
      type: 'Factorized Multi-Modal Spatiotemporal Encoder',
      encoder: 'ViT-G (optical) + ViT-L (MS) + ViT-L (SAR)',
      embeddingDim: 1024,
      pretrainingStrategy: 'Multi-granularity contrastive learning with factorized encoders. Each modality gets a specialized encoder; cross-modal fusion via attention. Handles temporal sequences of multiple modalities simultaneously.',
    },
    training: {
      dataset: 'Multi-modal temporal RS corpus',
      samples: '21.5M temporal sequences',
      sensors: ['High-res optical (various)', 'Multi-spectral (Sentinel-2)', 'SAR (Sentinel-1)'],
      geoCoverage: 'Global',
    },
    benchmarks: [
      { task: 'V1 SOTA validation', dataset: '18 recent RSFMs comparison', metric: 'Surpasses all in', value: 100, unit: '% test scenarios with large margins', citation: 'arXiv:2312.10115 (CVPR 2024)' },
      { task: 'vs GFM comparison', dataset: 'Multi-modal RS benchmarks', metric: 'Outperforms by', value: 2.76, unit: '% average improvement', citation: 'arXiv:2312.10115 (CVPR 2024)' },
      { task: 'vs SatLas comparison', dataset: 'Multi-modal RS benchmarks', metric: 'Outperforms by', value: 3.67, unit: '% average improvement', citation: 'arXiv:2312.10115 (CVPR 2024)' },
      { task: 'vs Scale-MAE comparison', dataset: 'Multi-modal RS benchmarks', metric: 'Outperforms by', value: 3.61, unit: '% average improvement', citation: 'arXiv:2312.10115 (CVPR 2024)' },
      { task: 'V2 efficiency gains', dataset: '16 datasets, 7 tasks', metric: 'V2 vs V1 improvement', value: 1.8, unit: 'points average (with 74% fewer parameters)', citation: 'arXiv:2507.13812 (ICCV 2025)' },
    ],
    pros: [
      'CVPR 2024 SOTA validation: surpasses all 18 recent RSFMs in test scenarios',
      'Quantified benchmarks: +2.76% vs GFM, +3.67% vs SatLas, +3.61% vs Scale-MAE',
      'V2 efficiency breakthrough: +1.8 points improvement with 74% fewer parameters (580M vs 2.06B)',
      'True multi-modal fusion: optical + SAR + multi-spectral with dedicated encoders',
      'Factorized architecture prevents modality compromise during training',
      'Temporal modeling: handles sequences across all modalities simultaneously',
      'Extensive evaluation: 16 datasets across 7 different remote sensing tasks',
    ],
    cons: [
      'V1: Extremely compute-intensive (2.06B params)',
      'Research-stage — limited public weight availability',
      'Requires multi-modal data which increases collection complexity',
      'Complex architecture difficult to reproduce',
      'V2: Recent release (2025) means limited community adoption',
    ],
    useCases: [
      'Universal scene interpretation across sensor types',
      'Object detection in optical + SAR imagery',
      'Semantic segmentation with multi-modal inputs',
      'Change detection across temporal multi-modal sequences',
      'Cross-modal transfer learning',
    ],
    links: [
      { label: 'Paper (CVPR 2024)', url: 'https://arxiv.org/abs/2312.10115' },
      { label: 'GitHub', url: 'https://github.com/Jack-bo1220/SkySense' },
      { label: 'V2 Paper', url: 'https://arxiv.org/abs/2507.13812' },
    ],
    scores: { parameters: 8, resolution: 8, modalities: 9, temporal: 8, openness: 3, benchmarks: 10 },
    codeExample: `# SkySense — CVPR 2024
# 2.06B params (v1), ~580M (v2)
# github.com/Jack-bo1220/SkySense

# Architecture: factorized multi-modal encoders
#   ViT-G for high-res optical
#   ViT-L for multi-spectral (Sentinel-2)
#   ViT-L for SAR (Sentinel-1)
# Multi-granularity contrastive learning

# ⚠ Weights partially available for research

# Conceptual usage:
from skysense import SkySense

model = SkySense.from_pretrained("skysense_v1")

# Input: temporal sequences per modality
optical_seq = load_optical_sequence(aoi, dates)
sar_seq = load_sar_sequence(aoi, dates)
ms_seq = load_sentinel2_sequence(aoi, dates)

# Factorized encoding + cross-modal fusion
features = model.encode(
    optical=optical_seq,
    sar=sar_seq,
    multispectral=ms_seq
)
# SOTA results on 6+ RS benchmarks (CVPR 2024)`,
  },
  {
    id: 'croma',
    name: 'CROMA',
    org: 'NeurIPS 2023',
    tagline: 'Cross-modal contrastive + MAE for SAR-optical alignment',
    description: 'Three-encoder architecture: SAR encoder (ViT), optical encoder (ViT), and a multimodal encoder. Combines contrastive cross-modal learning with MAE reconstruction for both modalities. Pre-trained on aligned Sentinel-1/Sentinel-2 image pairs. Produces both unimodal and multimodal representations. Available as Base (~86M) and Large variants with public weights.',
    params: '~86M (Base) / ~307M (Large)',
    paramsNum: 307,
    resolution: '120×120 pixel patches',
    modalities: ['Sentinel-1 SAR (2 bands)', 'Sentinel-2 Optical (12 bands)'],
    license: 'Open source',
    dataSource: 'Aligned Sentinel-1 + Sentinel-2 pairs',
    keyStrength: 'Explicit SAR↔optical alignment, cross-modal retrieval',
    color: '#f59e0b',
    icon: '🔗',
    paperYear: 2023,
    paperVenue: 'NeurIPS 2023',
    temporal: false,
    openWeights: true,
    architecture: {
      type: 'Dual ViT + Multimodal Encoder (Contrastive + MAE)',
      encoder: 'ViT-Base/Large (separate SAR + optical encoders)',
      embeddingDim: 768,
      pretrainingStrategy: 'Dual objective: (1) Cross-modal contrastive learning aligns SAR↔optical representations, (2) MAE reconstruction for each modality. Three separate encoders produce unimodal + fused multimodal embeddings.',
    },
    training: {
      dataset: 'Aligned Sentinel-1/Sentinel-2 image pairs',
      samples: 'Large-scale paired SAR-optical dataset',
      sensors: ['Sentinel-1 (SAR)', 'Sentinel-2 (optical)'],
      geoCoverage: 'Global (Sentinel coverage)',
    },
    benchmarks: [
      { task: 'Cross-modal retrieval', dataset: 'Sentinel-1/2 pairs', metric: 'Retrieval accuracy', value: 90, unit: '% top-k retrieval', citation: 'arxiv.org/abs/2311.00566' },
    ],
    pros: [
      'Explicitly learns SAR↔optical alignment — key for cloud-invariant analysis',
      'Produces both unimodal AND multimodal representations',
      'Cross-modal retrieval: find SAR match for optical query (and vice versa)',
      'Open source with pretrained weights (Base + Large)',
      'Relatively lightweight (~86M Base) — feasible on single GPU',
    ],
    cons: [
      'Only two modalities (SAR + optical) — no hyperspectral/LiDAR',
      'Fixed 120×120 patch size',
      'No temporal modeling',
      'Limited to Sentinel-1/2 data characteristics',
      'Smaller training data scale than competitors',
    ],
    useCases: [
      'SAR-optical fusion for all-weather monitoring',
      'Cross-modal retrieval — match SAR scenes to optical references',
      'Transfer learning for SAR-only or optical-only downstream tasks',
      'Cloud-free analysis using SAR when optical is obscured',
    ],
    links: [
      { label: 'Paper (NeurIPS 2023)', url: 'https://arxiv.org/abs/2311.00566' },
      { label: 'GitHub', url: 'https://github.com/antofuller/CROMA' },
    ],
    scores: { parameters: 5, resolution: 5, modalities: 5, temporal: 1, openness: 9, benchmarks: 7 },
    codeExample: `# CROMA — NeurIPS 2023
# github.com/antofuller/CROMA

import torch
from croma import CROMA_base, CROMA_large

# Load pretrained (weights: CROMA_base.pt)
model = CROMA_base(pretrained=True)
# Also: CROMA_large (~307M params)

# Three encoders:
#   1. SAR encoder (ViT on Sentinel-1)
#   2. Optical encoder (ViT on Sentinel-2)
#   3. Multimodal fusion encoder

# Encode each modality separately
s1_patch = load_sentinel1(bbox)   # SAR
s2_patch = load_sentinel2(bbox)   # Optical

sar_emb = model.encode_sar(s1_patch)
opt_emb = model.encode_optical(s2_patch)
fused = model.encode_multimodal(s1_patch, s2_patch)

# Cross-modal retrieval: cosine similarity
# in shared contrastive embedding space
sim = torch.cosine_similarity(opt_emb, sar_emb)
# High = same location/features across modalities`,
  },
  {
    id: 'dofa',
    name: 'DOFA',
    org: 'TU Munich / Zhu-xlab',
    tagline: 'Dynamic One-For-All — wavelength-conditioned hypernetwork for any sensor',
    description: 'A ViT backbone with hypernetwork-based dynamic weight generator: given center wavelength of each input band, the hypernetwork generates patch embedding weights on-the-fly. Single model handles Sentinel-2 (13 bands), Landsat (7), NAIP (4), SAR, DSM without retraining. Recently benchmarked (2025) on cereal crop mapping vs HyperSigma/SpectralEarth, and HyBiomass forest biomass estimation. Extended as DOFA-CLIP for vision-language tasks. Adopted in Esri ArcGIS Pro for operational workflows.',
    params: '~86M (Base) / ~307M (Large)',
    paramsNum: 307,
    resolution: 'Variable (multi-resolution)',
    modalities: ['Optical RGB', 'Multi-spectral', 'SAR', 'DSM/Elevation', 'Multi-temporal'],
    license: 'Open source',
    dataSource: 'Five modalities: optical, MS, SAR, DSM, temporal',
    keyStrength: 'Universal sensor compatibility via wavelength-conditioned hypernetwork',
    color: '#6366f1',
    icon: '⚡',
    paperYear: 2024,
    paperVenue: 'arXiv 2024',
    temporal: false,
    openWeights: true,
    architecture: {
      type: 'ViT + Wavelength-Conditioned Hypernetwork',
      encoder: 'ViT-Base / ViT-Large',
      embeddingDim: 768,
      patchSize: 16,
      pretrainingStrategy: 'Hypernetwork generates patch embedding weights conditioned on input band wavelengths. Distillation-based continual pretraining across modalities. Single shared transformer handles all sensor types.',
    },
    training: {
      dataset: 'Multi-modal RS corpus (5 modalities)',
      samples: 'Multi-modal training set across sensor types',
      sensors: ['Optical RGB', 'Multi-spectral', 'SAR', 'DSM/elevation', 'Multi-temporal'],
      geoCoverage: 'Global (benchmark datasets)',
    },
    benchmarks: [
      { task: 'Multi-modal classification', dataset: '12 benchmark datasets', metric: 'Competitive across', value: 12, unit: 'diverse RS benchmarks', citation: 'arXiv:2403.15356 (March 2024)' },
      { task: 'Hyperspectral crop mapping', dataset: 'Cereal crop classification', metric: 'Benchmarked with', value: 3, unit: 'foundation models (vs HyperSigma, SpectralEarth)', citation: 'arXiv:2510.11576 (Oct 2025)' },
      { task: 'Forest biomass estimation', dataset: 'HyBiomass global benchmark', metric: 'Superior performance', value: 1, unit: 'in fine-tuned vs frozen encoder setting', citation: 'arXiv:2506.11314 (June 2025)' },
      { task: 'Cross-modal adaptation', dataset: 'Wavelength-conditioned tasks', metric: 'Any sensor support', value: 5, unit: 'modalities (RGB, MS, SAR, DSM, temporal)', citation: 'DOFA architecture (March 2024)' },
    ],
    pros: [
      'Single model for ANY sensor — wavelength-conditioned patch embeddings',
      'Practical: adopted in Esri ArcGIS Pro for operational use',
      'Lightweight (~86M Base) — runs on consumer hardware',
      'Open source with available weights',
      'Supports continual pretraining via distillation',
      'Handles 5 modalities without retraining',
    ],
    cons: [
      'Smaller model capacity than SkySense/SpectralGPT',
      'Limited temporal modeling capability',
      'Less benchmark data than Prithvi or Clay',
      'Hypernetwork adds complexity to architecture',
      'Newer model with less community adoption (outside ArcGIS)',
    ],
    useCases: [
      'Multi-modal classification in Esri ArcGIS Pro workflows',
      'Hyperspectral cereal crop mapping (benchmarked vs specialized models)',
      'Forest aboveground biomass estimation (HyBiomass benchmark)',
      'Cross-sensor transfer (train on Sentinel-2, deploy on Landsat)',
      'DSM/elevation analysis with the same model as optical',
      'Vision-language tasks via DOFA-CLIP extension',
    ],
    links: [
      { label: 'Paper', url: 'https://arxiv.org/abs/2403.15356' },
      { label: 'GitHub', url: 'https://github.com/zhu-xlab/DOFA' },
      { label: 'HuggingFace', url: 'https://huggingface.co/earthflow/DOFA' },
      { label: 'DOFA-CLIP Extension', url: 'https://arxiv.org/abs/2503.06312' },
    ],
    scores: { parameters: 5, resolution: 7, modalities: 8, temporal: 3, openness: 9, benchmarks: 8 },
    codeExample: `# DOFA — Dynamic One-For-All
# github.com/zhu-xlab/DOFA
# Adopted in Esri ArcGIS Pro

from dofa import build_model
model = build_model("dofa_base", pretrained=True)
# Also: "dofa_large" (~307M params)

# Key: hypernetwork generates patch embedding
# weights based on input band wavelengths
# → same model works for ANY sensor config

# Sentinel-2 (13 bands with wavelengths in nm)
s2_emb = model(
    sentinel2_patch,
    wavelengths=[443, 490, 560, 665, 705,
                 740, 783, 842, 865, 945,
                 1375, 1610, 2190]
)

# Same model for NAIP (4 bands)
naip_emb = model(
    naip_patch,
    wavelengths=[480, 560, 660, 850]
)

# Same model for SAR (wavelength = radar)
sar_emb = model(sar_patch, wavelengths=[5600])

# Even works for elevation/DSM data!
dsm_emb = model(dsm_patch, wavelengths=[0])`,
  },
  {
    id: 'google-rsfm',
    name: 'Google RSFM',
    org: 'Google Research',
    tagline: 'Vision-language foundation models with open-vocabulary detection for satellite imagery',
    description: 'Google Research\'s Remote Sensing Foundation Models (RSFM) — distinct from DeepMind\'s AlphaEarth — are task-oriented vision-language models purpose-built for satellite and aerial imagery analysis. Built on proven architectures (SigLIP, MaMMUT, OWL-ViT, masked autoencoders) adapted for remote sensing, RSFM enables natural language queries over imagery, open-vocabulary object detection (detect objects by typing what you\'re looking for), and adaptable vision backbones for downstream tasks. Achieves >16% improvement on text-based image search benchmarks and doubles zero-shot novel object detection accuracy. Currently available to trusted testers: Planet Labs, Airbus, and Vantor (formerly Maxar Intelligence). While AlphaEarth answers "what does this place LOOK like?", RSFM answers "what OBJECTS and FEATURES are in this image?" — together they form a complete analysis stack. Paper: arXiv 2510.18318.',
    params: '~1B+ (multiple variants)',
    paramsNum: 1000,
    resolution: '0.1m-10m (satellite to aerial)',
    modalities: ['RGB Satellite', 'RGB Aerial', 'Text/Language', 'Multi-resolution'],
    license: 'Trusted Tester Program (Vantor, Planet, Airbus)',
    dataSource: 'High-res satellite/aerial imagery + text descriptions + synthetic captions via Gemini',
    keyStrength: 'Vision-language queries, open-vocabulary detection, >16% search improvement',
    color: '#ea4335',
    icon: '🗣️',
    paperYear: 2025,
    paperVenue: 'arXiv',
    temporal: false,
    openWeights: false,
    architecture: {
      type: 'Vision-Language Model Family (SigLIP/MaMMUT/OWL-ViT)',
      encoder: 'Vision Transformer + Language Encoder',
      embeddingDim: 512,
      pretrainingStrategy: 'Contrastive vision-language learning (SigLIP/MaMMUT) + open-vocabulary detection heads (OWL-ViT) + masked autoencoder pretraining. Trained on satellite/aerial imagery paired with natural language descriptions.',
    },
    training: {
      dataset: 'Google proprietary satellite/aerial imagery + text descriptions',
      samples: 'Large-scale (undisclosed)',
      sensors: ['Various satellite platforms', 'Aerial imagery', 'Ground-level imagery'],
      geoCoverage: 'Global',
      temporalRange: 'Multiple years of imagery',
    },
    benchmarks: [
      { task: 'Text-based image search', dataset: 'RS retrieval benchmarks', metric: 'Improvement over baselines', value: 16, unit: '% improvement', citation: 'arxiv.org/abs/2510.18318' },
      { task: 'Zero-shot novel object detection', dataset: 'RS detection benchmarks', metric: 'Accuracy improvement', value: 100, unit: '% (2× baseline accuracy)', citation: 'arxiv.org/abs/2510.18318' },
      { task: 'Zero-shot classification', dataset: 'Multiple RS benchmarks', metric: 'Top-1 accuracy', value: 85, unit: '% (SOTA on most benchmarks)', citation: 'arxiv.org/abs/2510.18318' },
      { task: 'Object detection (zero-shot)', dataset: 'DOTA', metric: 'mAP', value: 31.8, unit: '%', citation: 'arxiv.org/abs/2510.18318' },
      { task: 'Object detection (few-shot)', dataset: 'DOTA', metric: 'mAP', value: 54.0, unit: '% (30 examples)', citation: 'arxiv.org/abs/2510.18318' },
      { task: 'Scene classification', dataset: 'FMoW', metric: 'Accuracy', value: 81.7, unit: '% (new SOTA)', citation: 'arxiv.org/abs/2510.18318' },
      { task: 'Semantic segmentation', dataset: 'FLAIR', metric: 'mIoU', value: 64.7, unit: '% (new SOTA)', citation: 'arxiv.org/abs/2510.18318' },
    ],
    pros: [
      'Vision-language interface — query satellite imagery with natural language',
      'Open-vocabulary detection: detect objects by typing what you\'re looking for',
      '>16% improvement on text-based image search benchmarks',
      'Doubles zero-shot novel object detection accuracy vs baselines',
      'Adaptable vision backbones for custom downstream tasks',
      'Multi-resolution support (0.1m aerial to 10m satellite)',
      'Complements AlphaEarth: RSFM tells you WHAT changed, AlphaEarth tells you WHERE',
      'Already deployed by Vantor, Planet Labs, and Airbus via trusted tester program',
    ],
    cons: [
      'Trusted tester access only — not publicly available',
      'No open-source weights or code',
      'Requires Google infrastructure for deployment',
      'Undisclosed architecture details limit reproducibility',
      'Commercial licensing model still evolving',
    ],
    useCases: [
      'Natural language queries over satellite imagery ("Find all solar farms near rivers")',
      'Open-vocabulary object detection — detect novel objects without retraining',
      'Cross-modal retrieval (text descriptions ↔ satellite images)',
      'Post-disaster damage assessment with conversational queries',
      'Infrastructure monitoring via Vantor\'s Tensorglobe platform',
      'Planet Labs imagery analysis at scale',
    ],
    links: [
      { label: 'Paper (arXiv 2510.18318)', url: 'https://arxiv.org/abs/2510.18318' },
      { label: 'Google Research Blog', url: 'https://research.google/blog/earth-ai-unlocking-geospatial-insights-with-foundation-models-and-cross-modal-reasoning/' },
      { label: 'Geospatial Reasoning Blog', url: 'https://research.google/blog/geospatial-reasoning-unlocking-insights-with-generative-ai-and-multiple-foundation-models/' },
    ],
    scores: { parameters: 8, resolution: 9, modalities: 7, temporal: 3, openness: 1, benchmarks: 9 },
    codeExample: `# Google RSFM — Remote Sensing Foundation Models
# Access via Trusted Tester Program (Vantor, Planet, Airbus)
# Vision-language models for satellite imagery

# Conceptual API (access restricted)
from google.earth_ai import RSFM

# Vision-Language Model: natural language queries
vlm = RSFM.VisionLanguage()
result = vlm.classify(
    image=satellite_patch,
    candidates=[
        "agricultural field with center pivot irrigation",
        "solar farm installation",
        "residential development",
        "undeveloped forest"
    ]
)

# Open-Vocabulary Detection (OVD)
# Detect objects by typing what you're looking for
# No predefined labels needed!
detections = RSFM.OpenVocabularyDetector().detect(
    image=aerial_image,
    query="damaged buildings after flooding"
)
# >2× zero-shot accuracy vs baselines

# Text-based image search (>16% improvement)
similar = vlm.retrieve_similar(
    text_query="coastal wetlands with residential encroachment",
    image_database=satellite_collection,
    top_k=20
)

# Adaptable vision backbones for downstream tasks
backbone = RSFM.VisionBackbone(pretrained=True)
features = backbone.extract(satellite_tile)
# Fine-tune for your specific application

# Combined with AlphaEarth for full stack:
# AlphaEarth → WHERE things changed (embedding similarity)
# RSFM → WHAT changed (vision-language understanding)`,
  },
  {
    id: 'tessera',
    name: 'TESSERA',
    org: 'University of Cambridge',
    tagline: 'Pixel-level 128D embeddings from S1+S2 time series — outperforms AlphaEarth while being fully open',
    description: 'Temporal Embeddings of Surface Spectra for Earth Representation and Analysis — a pixel-level foundation model that encodes each pixel\'s annual Sentinel-1 + Sentinel-2 time series into a compact 128-dimensional embedding. Uses dual Transformer encoders (one per modality) with GRU pooling and a fusion MLP, trained via modified Barlow Twins with mix-up regularization. The projector expands to 16,384 dims during training (accounting for >95% of training parameters) but is discarded at inference, yielding a lightweight model. Pre-computed global 2024 embeddings are freely available as 8-bit quantized GeoTIFFs (FAIR-compliant). Outperforms AlphaEarth and other FMs on crop classification (Austria), canopy height (Borneo), fire scar detection (California), above-ground biomass (Finland), and agroforestry (Brazil). Fully open: MIT license, weights, code, and training data. CVPR 2026 accepted.',
    params: '~100M (inference encoders)',
    paramsNum: 100,
    resolution: '10m',
    modalities: ['Sentinel-1 SAR (VV, VH)', 'Sentinel-2 MSI (10 bands)'],
    license: 'MIT',
    dataSource: '~800M d-pixels, down-sampled 400:1 from S1/S2 (2017-2024)',
    keyStrength: 'Pixel-level temporal embeddings preserve phenology — no spatial context contamination',
    color: '#10b981',
    icon: '🧩',
    paperYear: 2025,
    paperVenue: 'CVPR 2026 / arXiv',
    temporal: true,
    openWeights: true,
    architecture: {
      type: 'Dual Transformer Encoder + GRU Pooling + Fusion MLP',
      encoder: 'Dual-branch: 4-block Transformer + GRU for each modality (S1, S2)',
      embeddingDim: 128,
      pretrainingStrategy: 'Modified Barlow Twins (redundancy reduction + mix-up regularization). Cloud-free random subsampling of S2 time series as augmentation. Model learns to reconcile partial temporal views, effectively interpolating missing data. Projector expands to 16,384 dims during training only.',
    },
    training: {
      dataset: 'Global S1+S2 time series (2017-2024)',
      samples: '~800M d-pixels (down-sampled 400:1 from full Sentinel archive)',
      sensors: ['Sentinel-1 SAR (VV, VH polarizations)', 'Sentinel-2 MSI (10 spectral bands)'],
      computeDetails: 'Trained for 1 epoch on distributed infrastructure. Key: projector dimension (16,384) accounts for >95% of training parameters but is discarded at inference.',
      epochs: 1,
      geoCoverage: 'Global',
      temporalRange: '2017-2024 (annual composites)',
    },
    benchmarks: [
      { task: 'Crop classification', dataset: 'Austria crop mapping', metric: 'Performance', value: 1, unit: 'Outperforms AlphaEarth + baselines', citation: 'arXiv:2506.20380 (CVPR 2026)' },
      { task: 'Canopy height estimation', dataset: 'Borneo tropical forest', metric: 'SOTA', value: 1, unit: 'Matches/outperforms task-specific models', citation: 'arXiv:2506.20380 (CVPR 2026)' },
      { task: 'Fire scar detection', dataset: 'California wildfires', metric: 'SOTA', value: 1, unit: 'State-of-the-art detection', citation: 'arXiv:2506.20380 (CVPR 2026)' },
      { task: 'Above-ground biomass', dataset: 'Finland forest biomass', metric: 'SOTA', value: 1, unit: 'State-of-the-art estimation', citation: 'arXiv:2506.20380 (CVPR 2026)' },
      { task: 'Agroforestry stocking index', dataset: 'Brazil agroforestry', metric: 'SOTA', value: 1, unit: 'State-of-the-art assessment', citation: 'arXiv:2506.20380 (CVPR 2026)' },
    ],
    pros: [
      'Fully open source (MIT) — weights, code, training data all reproducible',
      'Pixel-level: no spatial context contamination from neighboring pixels',
      'Preserves temporal phenological signal (unlike compositing approaches)',
      'Pre-computed global embeddings available (FAIR-compliant) — users need zero GPU',
      'Outperforms AlphaEarth on several downstream tasks while being open',
      'Only 2 input sensors (S1+S2) yet competitive with multi-modal models',
      '128D embeddings at 8-bit quantization — compact and efficient',
      'Geotessera Python library for easy access',
      'CVPR 2026 accepted',
    ],
    cons: [
      'Pixel-only: no spatial context (may miss landscape-scale patterns)',
      'Only S1+S2 inputs (no LiDAR, no high-res optical, no climate data)',
      'Annual temporal resolution only (no sub-annual dynamics yet)',
      'Currently only 2024 global map available (2017-2024 planned)',
      'Relatively new — limited community adoption compared to Clay/Prithvi',
    ],
    useCases: [
      'Agricultural crop classification (Austria demonstration)',
      'Canopy height estimation in tropical forests',
      'Fire scar/burn detection',
      'Above-ground biomass mapping',
      'Agroforestry assessment',
      'Habitat mapping (interactive tools available)',
    ],
    links: [
      { label: 'Paper', url: 'https://arxiv.org/abs/2506.20380' },
      { label: 'GitHub', url: 'https://github.com/ucam-eo/tessera' },
      { label: 'Geotessera Library', url: 'https://github.com/ucam-eo/geotessera' },
      { label: 'Interactive Map', url: 'https://github.com/ucam-eo/tessera-interactive-map' },
    ],
    scores: { parameters: 3, resolution: 9, modalities: 5, temporal: 9, openness: 10, benchmarks: 8 },
    codeExample: `# TESSERA — University of Cambridge
# pip install geotessera
# Pre-computed global embeddings (no GPU needed!)

from geotessera import GeoTessera

# Access pre-computed 2024 embeddings
gt = GeoTessera()

# Get 128D embedding for any location
embedding = gt.get_embedding(
    lat=47.5, lon=15.5,  # Austria
    year=2024
)
# Returns: numpy array (128,) — 8-bit quantized

# Or generate your own from S1+S2 time series
from tessera import TesseraModel
model = TesseraModel.from_pretrained()

# Input: 'd-pixel' = annual time series per pixel
# S1: (T, 2) — VV, VH polarizations
# S2: (T, 10) — 10 spectral bands
# T varies (cloud-masked observations)
embedding = model.encode(s1_dpixel, s2_dpixel)
# Output: (128,) embedding per pixel

# Key insight: pixel-level only
# No spatial patches — each pixel encoded independently
# Preserves discrete landscape boundaries`,
  },
];

export const getModelById = (id: string) => models.find(m => m.id === id);

// Helper for task-based recommendations with performance benchmarks
export const taskModelMatrix: Record<string, { best: string[]; good: string[]; limited: string[]; benchmarks?: string }> = {
  'Crop Mapping': {
    best: ['tessera', 'alphaearth', 'prithvi'],
    good: ['clay', 'satmae', 'dofa'],
    limited: ['croma', 'spectralgpt', 'skysense'],
    benchmarks: 'AlphaEarth: Global crop type mapping via K-means clustering. Prithvi: Multi-temporal crop segmentation with 3D attention.',
  },
  'Flood Detection': {
    best: ['prithvi'],
    good: ['clay', 'alphaearth', 'croma'],
    limited: ['satmae', 'spectralgpt', 'skysense', 'dofa'],
    benchmarks: 'Prithvi-EO-2.0: 95.5% accuracy on Sen1Floods11 (Dec 2024, arXiv:2412.02732) — 8% improvement over v1.0 (88.68% mIoU). Valencia flood response validation by SMEs. 4-timestamp 3D spatiotemporal attention captures flood progression dynamics.',
  },
  'Change Detection': {
    best: ['alphaearth', 'prithvi', 'skysense'],
    good: ['clay', 'satmae', 'tessera'],
    limited: ['croma', 'spectralgpt', 'dofa'],
    benchmarks: 'AlphaEarth: Cosine similarity via dot product between years. Prithvi: 4-timestamp 3D attention captures change. SkySense: 2.06B params with temporal contrastive learning.',
  },
  'SAR Analysis': {
    best: ['croma'],
    good: ['alphaearth', 'skysense', 'dofa'],
    limited: ['clay', 'prithvi', 'satmae', 'spectralgpt'],
    benchmarks: 'CROMA: 90% top-k retrieval accuracy on Sentinel-1/2 cross-modal pairs using dual ViT encoders with contrastive alignment. Cross-modal translation capability between SAR and optical domains. Only foundation model designed specifically for SAR-optical co-registration and alignment in shared embedding space.',
  },
  'Hyperspectral': {
    best: ['spectralgpt'],
    good: ['dofa'],
    limited: ['clay', 'alphaearth', 'prithvi', 'satmae', 'croma', 'skysense'],
    benchmarks: 'SpectralGPT: 95% accuracy on multiple HSI classification benchmarks. 3D spectral-spatial masking strategy.',
  },
  'Land Cover Classification': {
    best: ['tessera', 'alphaearth', 'clay', 'prithvi'],
    good: ['satmae', 'dofa', 'skysense', 'google-rsfm'],
    limited: ['croma', 'spectralgpt'],
    benchmarks: 'Prithvi-EO-2.0: Outperforms 6 geospatial foundation models on GEO-Bench (Dec 2024, 600M params). AlphaEarth: Global 10m unsupervised classification via K-means on 64D embeddings. Earth AI: 81.7% accuracy on FMoW scene classification (new SOTA, Oct 2025). Clay: Label efficiency gains documented in Dionelis et al. (arXiv:2406.18295, 2024) — foundation models consistently outperform task-specific models with limited labeled data.',
  },
  'Object Detection': {
    best: ['skysense', 'google-rsfm'],
    good: ['clay', 'dofa'],
    limited: ['alphaearth', 'prithvi', 'satmae', 'croma', 'spectralgpt'],
    benchmarks: 'Earth AI: 53.96% mAP on DOTA with few-shot learning (30 examples), 31.83% zero-shot. Open-vocabulary detection without predefined labels. SkySense: SOTA on 6+ RS benchmarks (CVPR 2024). 2.06B parameter multi-modal architecture with factorized encoders.',
  },
  'Similarity Search': {
    best: ['alphaearth', 'clay'],
    good: ['croma'],
    limited: ['prithvi', 'satmae', 'spectralgpt', 'skysense', 'dofa'],
    benchmarks: 'AlphaEarth: Production-ready embeddings in GEE catalog for global similarity search. Clay: 768D embeddings with excellent representation quality.',
  },
  'Multi-Sensor Fusion': {
    best: ['clay', 'dofa'],
    good: ['alphaearth', 'skysense', 'tessera'],
    limited: ['prithvi', 'satmae', 'croma', 'spectralgpt'],
    benchmarks: 'Clay v1.5: Dynamic embedding block with GSD-scaled position encoding supports 6 sensor types (S2/L8/S1/NAIP/LINZ/MODIS). Training: 70M multi-sensor chips, variable bands/resolutions. DOFA: Wavelength-conditioned hypernetwork generates patch embedding weights — single model processes any spectral configuration without retraining.',
  },
  'Production Deployment': {
    best: ['alphaearth', 'tessera'],
    good: ['clay', 'prithvi'],
    limited: ['satmae', 'croma', 'spectralgpt', 'skysense', 'dofa', 'google-rsfm'],
    benchmarks: 'AlphaEarth: Pre-computed global tiles in GEE/GCS. 16× less storage than competitors. Clay: Open source with HuggingFace integration.',
  },
  'Vision-Language Understanding': {
    best: ['google-rsfm'],
    good: [],
    limited: ['alphaearth', 'clay', 'prithvi', 'satmae', 'croma', 'spectralgpt', 'skysense', 'dofa'],
    benchmarks: 'Earth AI Remote Sensing Foundations: First production-scale vision-language models purpose-built for remote sensing. SOTA zero-shot classification performance across multiple RS benchmarks via natural language queries. Cross-modal retrieval between text descriptions and satellite imagery. Open-vocabulary object detection using natural language prompts.',
  },
};
