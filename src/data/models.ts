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

export const models: Model[] = [
  {
    id: 'alphaearth',
    name: 'AlphaEarth Foundations',
    org: 'Google DeepMind',
    tagline: '64-dimensional embeddings for the entire Earth at 10m resolution',
    description: 'An embedding field model (not standard ViT MAE) that assimilates spatial, temporal, and measurement contexts from Sentinel-1 SAR, Sentinel-2 MSI, Landsat 8/9, GEDI LiDAR, climate simulations, NLCD, and USDA CDL into compact 64-dimensional unit-length vectors. Produces annual global embeddings at 10m resolution, available as 64-band images (A00–A63) through Google Earth Engine. 16× less storage than competing model outputs.',
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
    description: 'A 632M-parameter Vision Transformer pre-trained with masked autoencoder + 5% DINOv2 representation loss on 70M globally distributed chips (256×256). Features a dynamic embedding block that handles any number of input bands/wavelengths. Position encoding scales by GSD, enabling cross-sensor generalization. Encoder: dim=1024, depth=24, 16 heads. Decoder: dim=512, depth=4. Fully open source (Apache-2.0) with weights on HuggingFace.',
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
      pretrainingStrategy: 'Masked Autoencoder (75% mask ratio) + 5% DINOv2 teacher representation loss. Dynamic embedding block handles variable bands/wavelengths.',
    },
    training: {
      dataset: 'Global chips sampled by LULC statistics',
      samples: '70M chips (256×256)',
      sensors: ['Sentinel-2', 'Landsat 8/9', 'Sentinel-1', 'NAIP', 'LINZ', 'MODIS'],
      computeDetails: '20 AWS g6.48xlarge (160 L4 GPUs), ~100 epochs, ~800 GPU-hours/epoch',
      epochs: 100,
      geoCoverage: 'Global (land/coastal)',
      temporalRange: 'Max 6 timestamps per location',
    },
    benchmarks: [
      { task: 'Training convergence', dataset: 'Internal', metric: 'Loss', value: 0.165, unit: 'train/val loss', citation: 'clay-foundation.github.io' },
    ],
    pros: [
      'Fully open source (Apache-2.0) — weights, code, and data',
      'Handles ANY sensor via dynamic embedding block (wavelength-aware)',
      'DINOv2 teacher improves representation quality beyond pure reconstruction',
      '1024-dim embeddings capture rich feature representations',
      'Pre-computed embeddings available on Source Cooperative',
      'Active community and documentation',
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
    id: 'prithvi',
    name: 'Prithvi-EO 2.0',
    org: 'NASA / IBM',
    tagline: 'Temporal Vision Transformer with 3D MAE for Earth science',
    description: 'A 300M/600M parameter Temporal ViT pre-trained with 3D Masked Autoencoder on 4.2M global time series samples from NASA\'s Harmonized Landsat Sentinel-2 (HLS) data. Each sample: 4 timestamps × 224×224 × 6 bands (Blue, Green, Red, Narrow NIR, SWIR1, SWIR2). Key innovations: 3D spatiotemporal patch embeddings (t=1), temporal+location metadata as learned weighted bias (not input), metadata dropout during training. Trained on JUWELS supercomputer (Jülich). Fine-tune via IBM\'s TerraTorch toolkit.',
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
      { task: 'GEO-Bench improvement', dataset: 'GEO-Bench', metric: 'Improvement over v1.0', value: 8, unit: '% average improvement', citation: 'arxiv.org/abs/2412.02732' },
      { task: 'Cross-resolution transfer', dataset: 'Multi-resolution tasks', metric: 'Competitive at', value: 0.1, unit: 'm to 15m resolution', citation: 'arxiv.org/abs/2412.02732' },
      { task: 'Flood mapping', dataset: 'Sen1Floods11', metric: 'Accuracy', value: 95.5, unit: '% (fine-tuned)', citation: 'arxiv.org/abs/2412.02732' },
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
    description: 'A ViT-Large (≈307M params) extending the MAE framework with two innovations: (1) temporal positional encoding capturing satellite revisit patterns, and (2) spectral positional encoding grouping correlated bands. Pre-trained on fMoW-temporal (RGB sequences, 62 land-use categories) and fMoW-Sentinel (Sentinel-2 cross-referenced with fMoW). Independent masking strategy: reconstruct patches from other timestamps. Published at NeurIPS 2022.',
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
      { task: 'Supervised classification', dataset: 'fMoW', metric: 'Improvement over baselines', value: 7, unit: '%', citation: 'arxiv.org/abs/2207.08051' },
      { task: 'Transfer learning', dataset: 'Land cover', metric: 'Improvement vs SOTA', value: 14, unit: '%', citation: 'arxiv.org/abs/2207.08051' },
    ],
    pros: [
      'First to introduce temporal + spectral positional encodings for satellite MAE',
      'Strong transfer learning performance (+14% over prior SOTA)',
      'Open source with pretrained weights available',
      'Independent masking enables cross-temporal learning',
      'Relatively lightweight — trainable on academic compute',
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
    ],
    scores: { parameters: 5, resolution: 6, modalities: 4, temporal: 7, openness: 9, benchmarks: 7 },
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
    description: 'One of the largest GFMs at 2.06B parameters (v1). Uses factorized multi-modal spatiotemporal encoders: ViT-G for high-res optical, ViT-L for multi-spectral, ViT-L for SAR. Multi-granularity contrastive learning handles temporal sequences of optical AND SAR simultaneously. CVPR 2024 — achieved SOTA on 6+ RS benchmarks. V2 (Jul 2025): unified transformer at ~580M params.',
    params: '2.06B (v1) / ~580M (v2)',
    paramsNum: 2060,
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
      { task: 'Multi-benchmark SOTA', dataset: '6+ RS benchmarks', metric: 'State-of-the-art', value: 6, unit: 'benchmarks with SOTA results', citation: 'arxiv.org/abs/2312.10115 (CVPR 2024)' },
    ],
    pros: [
      'Largest GFM (2.06B params) with massive capacity',
      'True multi-modal: optical + SAR + multi-spectral jointly',
      'Factorized encoders avoid modality compromise problem',
      'Temporal: handles sequences across modalities',
      'CVPR 2024 — SOTA on 6+ RS benchmarks',
      'V2 reduces to 580M params while maintaining performance',
    ],
    cons: [
      'Extremely compute-intensive (2B params for v1)',
      'Research-stage — limited public weight availability',
      'Requires multi-modal data which increases collection complexity',
      'V1 weights not publicly released',
      'Complex architecture difficult to reproduce',
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
    scores: { parameters: 10, resolution: 8, modalities: 9, temporal: 8, openness: 3, benchmarks: 9 },
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
    description: 'A ViT backbone with a hypernetwork-based dynamic weight generator: given the center wavelength of each input band, the hypernetwork generates appropriate patch embedding weights on-the-fly. This means a single model handles Sentinel-2 (13 bands), Landsat (7 bands), NAIP (4 bands), SAR, DSM, or any other sensor without retraining. Available as Base (~86M) and Large (~307M). Adopted in Esri\'s ArcGIS Pro for operational GIS workflows. Distillation-based continual pretraining.',
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
      { task: 'Multi-modal classification', dataset: '12 benchmark datasets', metric: 'Competitive across', value: 12, unit: 'diverse RS benchmarks', citation: 'arxiv.org/abs/2403.15356' },
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
      'Cross-sensor transfer (train on Sentinel-2, deploy on Landsat)',
      'Operational GIS pipelines requiring sensor flexibility',
      'DSM/elevation analysis with the same model as optical',
    ],
    links: [
      { label: 'Paper', url: 'https://arxiv.org/abs/2403.15356' },
      { label: 'GitHub', url: 'https://github.com/zhu-xlab/DOFA' },
    ],
    scores: { parameters: 5, resolution: 7, modalities: 8, temporal: 3, openness: 9, benchmarks: 7 },
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
];

export const getModelById = (id: string) => models.find(m => m.id === id);

// Helper for task-based recommendations
export const taskModelMatrix: Record<string, { best: string[]; good: string[]; limited: string[] }> = {
  'Crop Mapping': {
    best: ['alphaearth', 'prithvi'],
    good: ['clay', 'satmae', 'dofa'],
    limited: ['croma', 'spectralgpt', 'skysense'],
  },
  'Flood Detection': {
    best: ['prithvi'],
    good: ['clay', 'alphaearth', 'croma'],
    limited: ['satmae', 'spectralgpt', 'skysense', 'dofa'],
  },
  'Change Detection': {
    best: ['alphaearth', 'prithvi', 'skysense'],
    good: ['clay', 'satmae'],
    limited: ['croma', 'spectralgpt', 'dofa'],
  },
  'SAR Analysis': {
    best: ['croma'],
    good: ['alphaearth', 'skysense', 'dofa'],
    limited: ['clay', 'prithvi', 'satmae', 'spectralgpt'],
  },
  'Hyperspectral': {
    best: ['spectralgpt'],
    good: ['dofa'],
    limited: ['clay', 'alphaearth', 'prithvi', 'satmae', 'croma', 'skysense'],
  },
  'Land Cover Classification': {
    best: ['alphaearth', 'clay', 'prithvi'],
    good: ['satmae', 'dofa', 'skysense'],
    limited: ['croma', 'spectralgpt'],
  },
  'Object Detection': {
    best: ['skysense'],
    good: ['clay', 'dofa'],
    limited: ['alphaearth', 'prithvi', 'satmae', 'croma', 'spectralgpt'],
  },
  'Similarity Search': {
    best: ['alphaearth', 'clay'],
    good: ['croma'],
    limited: ['prithvi', 'satmae', 'spectralgpt', 'skysense', 'dofa'],
  },
};
