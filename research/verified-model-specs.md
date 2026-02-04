# Verified Geospatial Foundation Model Specifications
# All data sourced from published papers, official docs, and HuggingFace model cards
# Last updated: 2026-02-04

## 1. AlphaEarth Foundations (Google DeepMind)
- **Paper:** arxiv.org/abs/2507.22291 (Jul 2025)
- **Authors:** Brown, Kazmierski, Pasquarella, Rucklidge, Samsikova, Zhang, Shelhamer, et al.
- **Architecture:** Embedding field model (not standard ViT MAE — custom architecture)
- **Parameters:** Undisclosed
- **Embedding dim:** 64 (unit-length vectors on 64D hypersphere)
- **Resolution:** 10m per pixel
- **Training data:** Petabytes — Sentinel-1 SAR, Sentinel-2 MSI, Landsat 8/9, LiDAR (GEDI), climate simulations, NLCD, USDA CDL. 10.1M video sequences (v2.1)
- **Temporal coverage:** Annual embeddings 2017–2024 (2025 rolling)
- **Spatial coverage:** Global terrestrial + coastal waters
- **Output:** 64-band annual embedding images (bands A00–A63)
- **Key innovation:** Assimilates spatial, temporal, and measurement contexts across multiple sources into compact 64D representation (16x less storage than competing models)
- **Benchmark:** Consistently outperforms all tested featurization approaches; 24% lower error rate on average
- **Access:** Google Earth Engine (`GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL`), Google Cloud Storage (`gs://alphaearth_foundations` requester-pays)
- **License:** Free for research via GEE; proprietary model
- **Strengths:** Global production-ready dataset, multi-modal fusion, cloud/gap-free, GEE integration
- **Weaknesses:** Closed model (can't fine-tune), GEE-only access, no raw model weights
- **Use cases:** Crop type mapping, land cover classification, change detection, similarity search, ecosystem mapping (Global Ecosystems Atlas), MapBiomas

## 2. Clay v1.5 (Clay Foundation / Radiant Earth)
- **Paper:** No single paper; documentation at clay-foundation.github.io
- **Architecture:** ViT-Large MAE with DINOv2 teacher (5% representation loss)
- **Total parameters:** 632M (Encoder: 311M, Decoder: 15M, Teacher/DINOv2: 304M)
- **Encoder specs:** dim=1024, depth=24, heads=16, dim_head=64, mlp_ratio=4
- **Decoder specs:** dim=512, depth=4, heads=4
- **Embedding dim:** 1024
- **Resolution:** Variable (supports multi-resolution input)
- **Patch size:** 8
- **Input size:** 256×256
- **Mask ratio:** 75%
- **Training data:** 70M globally distributed chips (256×256), sampled by LULC statistics
- **Sensors:** Sentinel-2 (10 bands), Landsat 8/9 (6 bands), Sentinel-1 SAR (2 bands), NAIP (4 bands), LINZ (3 bands), MODIS (7 bands)
- **Training compute:** 20 AWS g6.48xlarge (160 L4 GPUs), ~100 epochs, ~800 GPU-hours per epoch
- **Key innovation:** Dynamic embedding block handles any number of bands/wavelengths; DINOv2 teacher for representation quality; position encoding scales by GSD
- **Training loss:** 0.165 (train and val converged)
- **Access:** Apache-2.0, weights on HuggingFace, embeddings on Source Cooperative
- **License:** Apache-2.0 (fully open)
- **Strengths:** Fully open source, handles any sensor, flexible input size/bands
- **Weaknesses:** Only land/coastal (no ocean/atmosphere), limited temporal samples per location (max 6), no night data, no extreme events in training
- **Use cases:** Feature finding (mines, aquaculture), classification, change detection, similarity search

## 3. Prithvi-EO 2.0 (NASA/IBM)
- **Paper:** arxiv.org/abs/2412.02732 (Dec 2024)
- **Authors:** Roy, Fraccaro, Gíslason, Blumenstiel, et al.
- **Architecture:** Temporal Vision Transformer with 3D MAE
- **Parameters:** 300M (ViT-L) and 600M (ViT-H) versions
- **Resolution:** 30m (HLS native)
- **Bands:** 6 channels common to Landsat+Sentinel-2 (Blue, Green, Red, Narrow NIR, SWIR, SWIR2)
- **Training data:** 4.2M global time series samples, 46k validation. Each sample: 4 timestamps × 224×224 pixels
- **Temporal:** Sequences of 4 timestamps, 1-6 month gaps, HLS data 2014-2023
- **Training:** 400 epochs on JUWELS supercomputer (Jülich). 300M: 80 GPUs, ~21k GPU-hours. 600M: 240 GPUs, ~58k GPU-hours
- **Key innovations:** 3D spatiotemporal patch embeddings (t=1), temporal+location metadata as learned weighted bias (not input), metadata dropout during training
- **Benchmark:** 600M-TL outperforms Prithvi-EO-1.0 by 8% on GEO-Bench; outperforms 6 other GFMs across 0.1m–15m resolution tasks
- **Access:** HuggingFace (`ibm-nasa-geospatial`), TerraTorch toolkit for fine-tuning
- **License:** Apache-2.0
- **Strengths:** Multi-temporal, location-aware, extensively benchmarked, SME-validated, TerraTorch ecosystem
- **Weaknesses:** 30m resolution only, optical-only (no SAR), 6 bands only
- **Use cases:** Flood mapping (Sen1Floods11, Valencia), wildfire scar mapping, crop classification, carbon cycle analysis

## 4. SatMAE (Stanford / SustainLab)
- **Paper:** NeurIPS 2022, arxiv.org/abs/2207.08051
- **Authors:** Cong, Khanna, Meng, Liu, Rozi, He, Burke, Lobell, Ermon
- **Architecture:** ViT-Large with temporal/spectral MAE
- **Parameters:** ~307M (ViT-L/16)
- **Resolution:** Variable (trained on fMoW RGB at various GSD, fMoW-Sentinel at 10m)
- **Training data:** fMoW-temporal (RGB satellite sequences), fMoW-Sentinel (multi-spectral Sentinel-2 cross-referenced with fMoW)
- **Key innovations:** Temporal positional encoding for image sequences; spectral positional encoding grouping bands; independent masking (reconstruct from other timestamps)
- **Benchmark:** +7% supervised learning on benchmarks, +14% transfer learning on land cover classification vs previous SOTA
- **Access:** GitHub (sustainlab-group/SatMAE), pretrained weights available
- **License:** Open source
- **Strengths:** Pioneered temporal+spectral positional encodings for satellite MAE, strong transfer learning
- **Weaknesses:** Trained on fMoW only (not global), RGB focus with multi-spectral as secondary
- **Use cases:** Land cover classification, semantic segmentation, temporal scene understanding

## 5. SpectralGPT (Wuhan University)
- **Paper:** IEEE TPAMI 2024, arxiv.org/abs/2311.07113
- **Authors:** Hong, Zhang, et al.
- **Architecture:** 3D Generative Pre-trained Transformer (novel 3D GPT for spectral data)
- **Parameters:** ~600M+ (multiple sizes)
- **Resolution:** Variable
- **Training data:** Large-scale spectral RS dataset (multi-spectral and hyperspectral)
- **Key innovations:** Spectral-wise 3D tensor masking (90% mask ratio); handles variable spectral bands; progressive training from smaller to larger spatial windows
- **Benchmark:** Strong performance on spectral classification and segmentation tasks
- **Access:** Paper describes approach; code/weights partially available
- **License:** Research use
- **Strengths:** Purpose-built for spectral data, handles hyperspectral natively, 3D masking captures spectral correlations
- **Weaknesses:** Primarily single-temporal, focused on spectral domain
- **Use cases:** Hyperspectral classification, spectral unmixing, mineral mapping, vegetation species identification

## 6. SkySense (Wuhan University / SenseTime)
- **Paper:** CVPR 2024, arxiv.org/abs/2312.10115
- **Authors:** Guo et al.
- **Architecture:** Factorized multi-modal spatiotemporal encoder (ViT-G for HR optical, ViT-L for MS, ViT-L for SAR)
- **Parameters:** 2.06 billion (v1) — one of the largest GFMs
- **SkySense V2:** Unified transformer, ~580M params (arxiv.org/abs/2507.13812, Jul 2025)
- **Resolution:** Multi-resolution (high-res optical, medium-res multispectral, SAR)
- **Training data:** 21.5M temporal sequences from HR optical, temporal multispectral, temporal SAR
- **Key innovations:** Factorized encoders for each modality, multi-granularity contrastive learning, handles temporal sequences of optical AND SAR simultaneously
- **Benchmark:** SOTA on 6+ RS benchmarks at CVPR 2024
- **Access:** GitHub (Jack-bo1220/SkySense), weights partially available
- **License:** Research use
- **Strengths:** Largest GFM, multi-modal (optical+SAR), temporal, state-of-the-art results
- **Weaknesses:** Compute-intensive (2B params), research-stage, limited public access
- **Use cases:** Universal scene interpretation, object detection, segmentation, change detection

## 7. CROMA (NeurIPS 2023)
- **Paper:** NeurIPS 2023, arxiv.org/abs/2311.00566
- **Authors:** Fuller et al.
- **Architecture:** Three encoders: SAR encoder (ViT), optical encoder (ViT), multimodal encoder. Combines contrastive + MAE objectives
- **Parameters:** Base (~86M) and Large variants
- **Resolution:** 120×120 pixel patches
- **Training data:** Aligned Sentinel-1 (SAR) and Sentinel-2 (optical) image pairs
- **Key innovations:** Cross-modal contrastive learning between SAR and optical; masked reconstruction for both modalities; produces both unimodal and multimodal representations
- **Benchmark:** Strong cross-modal retrieval and transfer learning
- **Access:** GitHub (antofuller/CROMA), pretrained weights (CROMA_base.pt, CROMA_large.pt)
- **License:** Open source
- **Strengths:** Explicitly learns SAR↔optical alignment, produces rich multimodal embeddings
- **Weaknesses:** Only two modalities (SAR+optical), fixed patch size
- **Use cases:** SAR-optical fusion, cross-modal retrieval, transfer learning for SAR/optical tasks

## 8. DOFA (TU Munich / Zhu-xlab)
- **Paper:** arxiv.org/abs/2403.15356 (2024)
- **Authors:** Xiong, Wang et al.
- **Architecture:** ViT backbone with hypernetwork-based dynamic weight generator for wavelength-conditioned patch embedding
- **Parameters:** ~86M (Base) / ~307M (Large)
- **Resolution:** Variable (handles multi-resolution)
- **Training data:** Five modalities: optical RGB, multi-spectral, SAR, DSM/elevation, multi-temporal
- **Key innovations:** Wavelength-conditioned dynamic patch embedding (hypernetwork generates weights based on spectral wavelength); single shared transformer handles all modalities; distillation-based continual pretraining
- **Benchmark:** Competitive across diverse RS tasks; adopted in ArcGIS Pro (Esri)
- **Access:** GitHub (zhu-xlab/DOFA), weights available
- **License:** Open source
- **Strengths:** Single model for any modality/band count, wavelength-aware, practical (ArcGIS integration)
- **Weaknesses:** Smaller than competitors, less temporal modeling
- **Use cases:** Multi-modal classification, cross-sensor transfer, operational GIS workflows

---

## Comparison Summary

| Model | Params | Embedding Dim | Resolution | Modalities | Temporal | Open Source | Training Scale |
|-------|--------|---------------|------------|------------|----------|-------------|----------------|
| AlphaEarth | Undisclosed | 64 | 10m | Optical+SAR+LiDAR+Climate | Annual | No (GEE access) | 10.1M sequences |
| Clay v1.5 | 632M | 1024 | Variable | 6 sensors | Limited (6 times/loc) | Yes (Apache-2.0) | 70M chips |
| Prithvi-EO 2.0 | 300M/600M | ViT-L/H | 30m | Optical (6 bands) | Yes (4 timestamps) | Yes (Apache-2.0) | 4.2M time series |
| SatMAE | ~307M | ViT-L | Variable | Optical+MS | Yes (sequences) | Yes | fMoW dataset |
| SpectralGPT | ~600M | Variable | Variable | Spectral/Hyperspectral | No | Partial | RS spectral dataset |
| SkySense | 2.06B | Multi | Multi-res | Optical+SAR | Yes | Partial | 21.5M sequences |
| CROMA | 86M-307M | ViT | 120px | SAR+Optical | No | Yes | Sentinel-1+2 pairs |
| DOFA | 86M-307M | ViT | Variable | 5 modalities | Limited | Yes | Multi-modal |
