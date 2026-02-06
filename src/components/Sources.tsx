import { useEffect, useRef } from 'react';

/**
 * Sources & Citations Component
 * 
 * Every claim on this website is backed by a primary source.
 * This page documents all sources used.
 */

interface SourceEntry {
  claim: string;
  source: string;
  url: string;
  accessed: string;
  verified: boolean;
}

interface ModelSources {
  id: string;
  name: string;
  primarySource: { type: string; url: string; citation: string };
  sources: SourceEntry[];
}

const modelSources: ModelSources[] = [
  {
    id: 'alphaearth',
    name: 'AlphaEarth Foundations',
    primarySource: {
      type: 'arXiv Preprint',
      url: 'https://arxiv.org/abs/2507.22291',
      citation: 'Brown, C.F., Kazmierski, M.R., Pasquarella, V.J., et al. (2025). AlphaEarth Foundations: An embedding field model for accurate and efficient global mapping from sparse label data. arXiv:2507.22291'
    },
    sources: [
      { claim: '64-dimensional embeddings at 10m resolution', source: 'Google Earth Engine Dataset Catalog', url: 'https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL', accessed: '2026-02-04', verified: true },
      { claim: 'Embeddings are unit-length vectors', source: 'GEE Dataset Description', url: 'https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL', accessed: '2026-02-04', verified: true },
      { claim: 'Available 2017-2024', source: 'GEE Dataset Catalog', url: 'https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL', accessed: '2026-02-04', verified: true },
      { claim: 'Multi-modal: Sentinel-1, Sentinel-2, Landsat, GEDI, etc.', source: 'arXiv Paper Abstract & GEE Docs', url: 'https://arxiv.org/abs/2507.22291', accessed: '2026-02-04', verified: true },
      { claim: 'Produced by Google DeepMind', source: 'DeepMind Blog', url: 'https://deepmind.google/discover/blog/alphaearth-foundations-helps-map-our-planet-in-unprecedented-detail/', accessed: '2026-02-04', verified: true },
      { claim: 'v2.1 model version', source: 'GEE Dataset Description', url: 'https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL', accessed: '2026-02-04', verified: true },
    ]
  },
  {
    id: 'clay',
    name: 'Clay Foundation Model v1.5',
    primarySource: {
      type: 'Documentation',
      url: 'https://clay-foundation.github.io/model/',
      citation: 'Clay Foundation. (2024). Clay Foundation Model v1.5. https://madewithclay.org'
    },
    sources: [
      { claim: 'Apache-2.0 license', source: 'GitHub Repository', url: 'https://github.com/Clay-foundation/model/blob/main/LICENSE', accessed: '2026-02-04', verified: true },
      { claim: 'Vision Transformer with MAE', source: 'Clay Documentation', url: 'https://clay-foundation.github.io/model/', accessed: '2026-02-04', verified: true },
      { claim: 'Weights on HuggingFace', source: 'HuggingFace Repository', url: 'https://huggingface.co/made-with-clay/Clay/', accessed: '2026-02-04', verified: true },
      { claim: 'Fiscal sponsored by Radiant Earth', source: 'Clay Documentation', url: 'https://clay-foundation.github.io/model/', accessed: '2026-02-04', verified: true },
      { claim: '70M training chips', source: 'Clay Model Card', url: 'https://clay-foundation.github.io/model/model-card.html', accessed: '2026-02-04', verified: true },
      { claim: 'Embeddings on Source Cooperative', source: 'Clay Documentation', url: 'https://source.coop/clay/clay-model-v0-embeddings', accessed: '2026-02-04', verified: true },
    ]
  },
  {
    id: 'prithvi',
    name: 'Prithvi-EO 2.0',
    primarySource: {
      type: 'arXiv Preprint',
      url: 'https://arxiv.org/abs/2412.02732',
      citation: 'Szwarcman, D., Roy, S., Fraccaro, P., et al. (2024). Prithvi-EO-2.0: A Versatile Multi-Temporal Foundation Model for Earth Observation Applications. arXiv:2412.02732'
    },
    sources: [
      { claim: '300M/600M parameters', source: 'arXiv Paper', url: 'https://arxiv.org/abs/2412.02732', accessed: '2026-02-04', verified: true },
      { claim: 'NASA Harmonized Landsat Sentinel-2 (HLS) data', source: 'arXiv Paper', url: 'https://arxiv.org/abs/2412.02732', accessed: '2026-02-04', verified: true },
      { claim: '4.2M training samples', source: 'arXiv Paper', url: 'https://arxiv.org/abs/2412.02732', accessed: '2026-02-04', verified: true },
      { claim: 'TerraTorch fine-tuning toolkit', source: 'GitHub Repository', url: 'https://github.com/IBM/terratorch', accessed: '2026-02-04', verified: true },
      { claim: 'Apache-2.0 license', source: 'HuggingFace Model Card', url: 'https://huggingface.co/ibm-nasa-geospatial', accessed: '2026-02-04', verified: true },
      { claim: 'Temporal ViT with 3D MAE', source: 'arXiv Paper', url: 'https://arxiv.org/abs/2412.02732', accessed: '2026-02-04', verified: true },
    ]
  },
  {
    id: 'satmae',
    name: 'SatMAE',
    primarySource: {
      type: 'NeurIPS 2022 Paper',
      url: 'https://arxiv.org/abs/2207.08051',
      citation: 'Cong, Y., et al. (2022). SatMAE: Pre-training Transformers for Temporal and Multi-Spectral Satellite Imagery. NeurIPS 2022. arXiv:2207.08051'
    },
    sources: [
      { claim: 'ViT-Large architecture', source: 'arXiv Paper', url: 'https://arxiv.org/abs/2207.08051', accessed: '2026-02-04', verified: true },
      { claim: 'Temporal + spectral positional encodings', source: 'arXiv Paper', url: 'https://arxiv.org/abs/2207.08051', accessed: '2026-02-04', verified: true },
      { claim: 'fMoW-temporal dataset', source: 'arXiv Paper', url: 'https://arxiv.org/abs/2207.08051', accessed: '2026-02-04', verified: true },
      { claim: 'Open source with weights', source: 'GitHub Repository', url: 'https://github.com/sustainlab-group/SatMAE', accessed: '2026-02-04', verified: true },
    ]
  },
  {
    id: 'spectralgpt',
    name: 'SpectralGPT',
    primarySource: {
      type: 'IEEE TPAMI 2024',
      url: 'https://arxiv.org/abs/2311.07113',
      citation: 'Hong, D., et al. (2024). SpectralGPT: Spectral Remote Sensing Foundation Model. IEEE TPAMI. arXiv:2311.07113'
    },
    sources: [
      { claim: '3D GPT architecture for spectral data', source: 'arXiv Paper', url: 'https://arxiv.org/abs/2311.07113', accessed: '2026-02-04', verified: true },
      { claim: '90% mask ratio', source: 'arXiv Paper', url: 'https://arxiv.org/abs/2311.07113', accessed: '2026-02-04', verified: true },
      { claim: 'Handles 3-200+ bands', source: 'arXiv Paper', url: 'https://arxiv.org/abs/2311.07113', accessed: '2026-02-04', verified: true },
      { claim: 'Code on GitHub', source: 'GitHub Repository', url: 'https://github.com/danfenghong/IEEE_TPAMI_SpectralGPT', accessed: '2026-02-04', verified: true },
    ]
  },
  {
    id: 'skysense',
    name: 'SkySense',
    primarySource: {
      type: 'CVPR 2024 Paper',
      url: 'https://arxiv.org/abs/2312.10115',
      citation: 'Guo, X., et al. (2024). SkySense: A Multi-Modal Remote Sensing Foundation Model Towards Universal Interpretation for Earth Observation Imagery. CVPR 2024. arXiv:2312.10115'
    },
    sources: [
      { claim: '2.06B parameters (v1)', source: 'arXiv Paper', url: 'https://arxiv.org/abs/2312.10115', accessed: '2026-02-04', verified: true },
      { claim: 'Factorized multi-modal encoders', source: 'arXiv Paper', url: 'https://arxiv.org/abs/2312.10115', accessed: '2026-02-04', verified: true },
      { claim: 'SOTA on 6+ benchmarks', source: 'arXiv Paper', url: 'https://arxiv.org/abs/2312.10115', accessed: '2026-02-04', verified: true },
      { claim: 'V2 at ~580M params', source: 'arXiv V2 Paper', url: 'https://arxiv.org/abs/2507.13812', accessed: '2026-02-04', verified: true },
    ]
  },
  {
    id: 'croma',
    name: 'CROMA',
    primarySource: {
      type: 'NeurIPS 2023 Paper',
      url: 'https://arxiv.org/abs/2311.00566',
      citation: 'Fuller, A., et al. (2023). CROMA: Remote Sensing Representations with Contrastive Radar-Optical Masked Autoencoders. NeurIPS 2023. arXiv:2311.00566'
    },
    sources: [
      { claim: 'Cross-modal contrastive + MAE', source: 'arXiv Paper', url: 'https://arxiv.org/abs/2311.00566', accessed: '2026-02-04', verified: true },
      { claim: 'Sentinel-1/Sentinel-2 pairs', source: 'arXiv Paper', url: 'https://arxiv.org/abs/2311.00566', accessed: '2026-02-04', verified: true },
      { claim: 'Open source with weights', source: 'GitHub Repository', url: 'https://github.com/antofuller/CROMA', accessed: '2026-02-04', verified: true },
    ]
  },
  {
    id: 'dofa',
    name: 'DOFA',
    primarySource: {
      type: 'arXiv 2024',
      url: 'https://arxiv.org/abs/2403.15356',
      citation: 'Xiong, Z., et al. (2024). Neural Plasticity-Inspired Foundation Model for Observing the Earth Crossing Modalities. arXiv:2403.15356'
    },
    sources: [
      { claim: 'Wavelength-conditioned hypernetwork', source: 'arXiv Paper', url: 'https://arxiv.org/abs/2403.15356', accessed: '2026-02-04', verified: true },
      { claim: 'Adopted in Esri ArcGIS Pro', source: 'Esri Documentation', url: 'https://www.esri.com/en-us/about/newsroom/announcements/esri-partners-with-ai-leaders-for-geospatial-foundation-models', accessed: '2026-02-04', verified: true },
      { claim: 'Open source with weights', source: 'GitHub Repository', url: 'https://github.com/zhu-xlab/DOFA', accessed: '2026-02-04', verified: true },
    ]
  },
  {
    id: 'benchmarks',
    name: 'Benchmark & Evaluation Studies',
    primarySource: {
      type: 'arXiv 2024',
      url: 'https://arxiv.org/abs/2412.04204',
      citation: 'Marsocci, V., et al. (2024). PANGAEA: A Global and Inclusive Benchmark for Geospatial Foundation Models. arXiv:2412.04204'
    },
    sources: [
      { claim: 'PANGAEA benchmark covers diverse datasets, tasks, resolutions, and sensor modalities', source: 'arXiv Paper Abstract', url: 'https://arxiv.org/abs/2412.04204', accessed: '2026-02-06', verified: true },
      { claim: 'Most existing benchmarks are geographically biased towards North America and Europe', source: 'PANGAEA Paper', url: 'https://arxiv.org/abs/2412.04204', accessed: '2026-02-06', verified: true },
      { claim: 'GFMs do not consistently outperform supervised models', source: 'PANGAEA Paper', url: 'https://arxiv.org/abs/2412.04204', accessed: '2026-02-06', verified: true },
      { claim: 'Foundation Models should be used when solving several problems jointly with high performance', source: 'Evaluation Paper', url: 'https://arxiv.org/abs/2406.18295', accessed: '2026-02-06', verified: true },
      { claim: 'Foundation Models achieve improved performance with limited labeled data', source: 'Evaluation Paper', url: 'https://arxiv.org/abs/2406.18295', accessed: '2026-02-06', verified: true },
      { claim: 'PANGAEA evaluation code available on GitHub', source: 'GitHub Repository', url: 'https://github.com/VMarsocci/pangaea-bench', accessed: '2026-02-06', verified: true },
      { claim: 'Google Earth AI includes Planet-scale Imagery, Population, and Environment models', source: 'Earth AI Paper', url: 'https://arxiv.org/html/2510.18318v2', accessed: '2026-02-06', verified: true },
    ]
  }
];

const generalSources = [
  {
    topic: 'Foundation Model Definition',
    source: 'Ada Lovelace Institute',
    url: 'https://www.adalovelaceinstitute.org/resource/foundation-models-explainer/',
    citation: 'Ada Lovelace Institute. (2023). Foundation Models Explainer.'
  },
  {
    topic: 'Masked Autoencoder (MAE) Method',
    source: 'CVPR 2022',
    url: 'https://arxiv.org/abs/2111.06377',
    citation: 'He, K., et al. (2022). Masked Autoencoders Are Scalable Vision Learners. CVPR 2022.'
  },
  {
    topic: 'Vision Transformer (ViT)',
    source: 'ICLR 2021',
    url: 'https://arxiv.org/abs/2010.11929',
    citation: 'Dosovitskiy, A., et al. (2021). An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale. ICLR 2021.'
  },
  {
    topic: 'GEO-Bench Benchmark',
    source: 'NeurIPS 2023',
    url: 'https://arxiv.org/abs/2306.05064',
    citation: 'Lacoste, A., et al. (2023). GEO-Bench: Toward Foundation Models for Earth Monitoring. NeurIPS 2023.'
  },
  {
    topic: 'LGND — Geo-Embedding Infrastructure',
    source: 'lgnd.ai',
    url: 'https://lgnd.ai',
    citation: 'LGND (2025). Infrastructure for geo-embeddings. Founded by Dan Hammer & Bruno Sánchez-Andrade Nuño (Clay Foundation). $9M seed, July 2025.'
  },
  {
    topic: 'Geo-Embeddings 101 (Paradigm Shift Analogy)',
    source: 'LGND Blog',
    url: 'https://lgnd.ai/blog/geo-embeddings-101',
    citation: 'LGND. (2025). Geo-Embeddings 101: How Foundation Models Are Changing Geospatial Analysis.'
  },
  {
    topic: 'LEOM Terminology',
    source: 'Industry Standard',
    url: 'https://lgnd.ai',
    citation: 'Large Earth Observation Model (LEOM) — industry term for foundation models pre-trained on satellite imagery to produce geo-embeddings.'
  },
  {
    topic: 'PANGAEA Benchmark (2024)',
    source: 'arXiv 2024',
    url: 'https://arxiv.org/abs/2412.04204',
    citation: 'Marsocci, V., et al. (2024). PANGAEA: A Global and Inclusive Benchmark for Geospatial Foundation Models. arXiv:2412.04204'
  },
  {
    topic: 'Geospatial Foundation Models Evaluation',
    source: 'arXiv 2024',
    url: 'https://arxiv.org/abs/2406.18295',
    citation: 'Dionelis, N., et al. (2024). Evaluating and Benchmarking Foundation Models for Earth Observation and Geospatial AI. arXiv:2406.18295'
  },
  {
    topic: 'Earth AI (Google Research 2025)',
    source: 'arXiv 2025',
    url: 'https://arxiv.org/html/2510.18318v2',
    citation: 'Shekel, T., Shetty, S., et al. (2025). Earth AI: Unlocking Geospatial Insights with Foundation Models and Cross-Modal Reasoning. arXiv:2510.18318'
  },
  {
    topic: 'GeoFM Review Paper (2025)',
    source: 'International Journal of GIS',
    url: 'https://www.tandfonline.com/doi/full/10.1080/13658816.2025.2543038',
    citation: 'Unknown Authors (2025). GeoFM: how will geo-foundation models reshape spatial data science and GeoAI? International Journal of GIS.'
  },
  {
    topic: 'Remote Sensing Foundation Models (Awesome List)',
    source: 'GitHub',
    url: 'https://github.com/Jack-bo1220/Awesome-Remote-Sensing-Foundation-Models',
    citation: 'Jack-bo1220. (2024). Awesome Remote Sensing Foundation Models - Comprehensive collection of papers and resources.'
  }
];

export default function Sources() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.05 }
    );
    el.querySelectorAll('.fade-in').forEach(child => observer.observe(child));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="section sources-section" data-section="sources">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">Transparency</span>
          <h2>Sources & Citations</h2>
          <p className="section-subtitle">
            Every claim on this website is backed by a primary source. This page documents 
            all sources used to ensure accuracy and enable verification.
          </p>
        </div>

        <div className="sources-disclaimer fade-in">
          <div className="disclaimer-icon">⚠️</div>
          <div className="disclaimer-content">
            <h4>Accuracy Notice</h4>
            <p>
              This dashboard synthesizes information from multiple sources. While we strive for accuracy, 
              model specifications change frequently. Always verify critical details against the primary 
              sources linked below. Last comprehensive review: February 2026.
            </p>
          </div>
        </div>

        <div className="sources-grid fade-in">
          {modelSources.map(model => (
            <div key={model.id} className="source-card">
              <div className="source-card-header">
                <h3>{model.name}</h3>
                <span className="verified-badge">
                  {model.sources.every(s => s.verified) ? '✓ All Verified' : '⚠ Partially Verified'}
                </span>
              </div>
              
              <div className="primary-source">
                <span className="source-type">{model.primarySource.type}</span>
                <a href={model.primarySource.url} target="_blank" rel="noopener noreferrer">
                  {model.primarySource.url.replace('https://', '').split('/')[0]}
                </a>
              </div>
              
              <p className="citation">{model.primarySource.citation}</p>
              
              <details className="source-details">
                <summary>View {model.sources.length} specific claims</summary>
                <ul className="claim-list">
                  {model.sources.map((source, i) => (
                    <li key={i} className={source.verified ? 'verified' : ''}>
                      <span className="claim-text">{source.claim}</span>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="claim-source">
                        {source.source}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>

        <div className="general-sources fade-in">
          <h3>General References</h3>
          <div className="general-sources-grid">
            {generalSources.map((source, i) => (
              <div key={i} className="general-source-item">
                <span className="topic">{source.topic}</span>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.source}
                </a>
                <p className="gen-citation">{source.citation}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="methodology-note fade-in">
          <h3>Methodology</h3>
          <p>
            Information was gathered from: (1) peer-reviewed papers on arXiv and conference proceedings, 
            (2) official documentation and model cards, (3) GitHub repositories, and (4) HuggingFace model pages. 
            Parameter counts, architecture details, and benchmark results are taken directly from primary sources 
            where available. Benchmark comparisons use metrics reported in the original papers.
          </p>
          <p>
            <strong>Unverified claims:</strong> Some architectural details (exact layer counts, training hyperparameters) 
            for proprietary models like AlphaEarth are marked as "undisclosed" where official documentation is limited.
          </p>
        </div>
      </div>
    </section>
  );
}
