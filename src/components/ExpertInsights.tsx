import { useState, useRef, useEffect } from 'react';

// ─── Types ───
type TabId = 'pretrain' | 'embedding' | 'questions' | 'geofm';

interface Citation {
  id: string;
  text: string;
  url?: string;
}

// ─── Citations Database ───
const CITATIONS: Record<string, Citation> = {
  he2022mae: { id: 'he2022mae', text: 'He et al. "Masked Autoencoders Are Scalable Vision Learners." CVPR 2022.', url: 'https://arxiv.org/abs/2111.06377' },
  cong2022satmae: { id: 'cong2022satmae', text: 'Cong et al. "SatMAE: Pre-training Transformers for Temporal and Multi-Spectral Satellite Imagery." NeurIPS 2022.', url: 'https://arxiv.org/abs/2207.08051' },
  clay2024: { id: 'clay2024', text: 'Clay Foundation. "Clay v1.5: An Open Foundation Model for Earth." 2024.', url: 'https://clay.earth' },
  jakubik2024prithvi: { id: 'jakubik2024prithvi', text: 'Jakubik et al. "Prithvi-EO 2.0: A Versatile Multi-Temporal Foundation Model." 2024.', url: 'https://arxiv.org/abs/2407.06764' },
  alphaearth2025: { id: 'alphaearth2025', text: 'Google Research. "AlphaEarth: Global 10m Embeddings from Multi-Source Assimilation." 2025.', url: 'https://sites.research.google/alphaearth/' },
  fuller2024croma: { id: 'fuller2024croma', text: 'Fuller et al. "CROMA: Remote Sensing Representations with Contrastive Radar-Optical Masked Autoencoders." NeurIPS 2023.', url: 'https://arxiv.org/abs/2311.00566' },
  guo2024skysense: { id: 'guo2024skysense', text: 'Guo et al. "SkySense: A Multi-Modal Remote Sensing Foundation Model." CVPR 2024.', url: 'https://arxiv.org/abs/2312.10115' },
  xiong2024dofa: { id: 'xiong2024dofa', text: 'Xiong et al. "Neural Plasticity-Inspired Foundation Model for Observing the Earth Crossing Modalities." 2024.', url: 'https://arxiv.org/abs/2403.15356' },
  lacoste2023geobench: { id: 'lacoste2023geobench', text: 'Lacoste et al. "GEO-Bench: Toward Foundation Models for Earth Observation." NeurIPS 2023.', url: 'https://arxiv.org/abs/2306.03831' },
  reed2023scalemae: { id: 'reed2023scalemae', text: 'Reed et al. "Scale-MAE: A Scale-Aware Masked Autoencoder for Multiscale Geospatial Representation Learning." ICCV 2023.', url: 'https://arxiv.org/abs/2212.14532' },
};

function Cite({ ids }: { ids: string[] }) {
  return (
    <span className="ei-citations">
      [{ids.map((id, i) => {
        const c = CITATIONS[id];
        return (
          <span key={id}>
            {i > 0 && ', '}
            {c?.url ? (
              <a href={c.url} target="_blank" rel="noopener noreferrer" className="ei-cite-link" title={c?.text}>
                {c?.text?.split('.')[0] || id}
              </a>
            ) : (
              <span title={c?.text}>{c?.text?.split('.')[0] || id}</span>
            )}
          </span>
        );
      })}]
    </span>
  );
}

// ─── Collapsible Section ───
function Collapsible({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`ei-collapsible ${open ? 'open' : ''}`}>
      <button className="ei-collapsible-header" onClick={() => setOpen(!open)}>
        <span className="ei-collapsible-title">{title}</span>
        <svg className="ei-collapsible-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4 6 8 10 12 6" />
        </svg>
      </button>
      {open && <div className="ei-collapsible-body">{children}</div>}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// TAB 1: Pre-training Strategies Deep Dive
// ═════════════════════════════════════════════════════════════════
function PretrainingDeepDive() {
  return (
    <div className="ei-tab-content">
      <h3 className="insights-subtitle">How GeoFMs Learn from the Unlabeled Archive</h3>
      <p className="insights-desc">
        Self-supervised pre-training is the engine that makes foundation models possible. But the choice of
        pre-training strategy has profound implications for downstream task performance, embedding quality,
        and what the model actually learns about the Earth's surface.
      </p>

      <Collapsible title="MAE vs Contrastive vs Generative — When Each Works Best" defaultOpen={true}>
        <div className="ei-strategy-grid">
          <div className="ei-strategy-card" style={{ '--sc': '#059669' } as React.CSSProperties}>
            <div className="ei-strategy-header">
              <span className="ei-strategy-badge mae">MAE</span>
              <span className="ei-strategy-label">Masked Autoencoding</span>
            </div>
            <p>
              Randomly mask 75–90% of input patches and train the encoder-decoder to reconstruct them.
              The encoder learns rich spatial representations because it must infer missing context from
              sparse visible patches.
            </p>
            <div className="ei-strategy-detail">
              <strong>Best for:</strong> Dense prediction (segmentation, change detection), spatial understanding
            </div>
            <div className="ei-strategy-detail">
              <strong>Models:</strong> Clay v1.5, SatMAE, Prithvi-EO 2.0, Scale-MAE
            </div>
            <div className="ei-strategy-detail">
              <strong>Limitation:</strong> Reconstruction objective optimizes for pixel-level fidelity, not necessarily
              semantic understanding. A model can perfectly reconstruct textures without "understanding" what a forest is.
            </div>
          </div>

          <div className="ei-strategy-card" style={{ '--sc': '#f59e0b' } as React.CSSProperties}>
            <div className="ei-strategy-header">
              <span className="ei-strategy-badge contrastive">Contrastive</span>
              <span className="ei-strategy-label">Contrastive Learning</span>
            </div>
            <p>
              Pull together representations of the same location across time, modality, or augmentation;
              push apart representations of different locations. Learns view-invariant features.
            </p>
            <div className="ei-strategy-detail">
              <strong>Best for:</strong> Retrieval, cross-modal alignment (SAR↔optical), few-shot classification
            </div>
            <div className="ei-strategy-detail">
              <strong>Models:</strong> CROMA (cross-modal), SeCo, seasonal contrast methods
            </div>
            <div className="ei-strategy-detail">
              <strong>Limitation:</strong> Requires careful pair construction. Negative mining is critical —
              a forest in Oregon and a forest in Bavaria should be positive despite geographic distance, but
              most implementations treat spatial proximity as the only pairing signal.
            </div>
          </div>

          <div className="ei-strategy-card" style={{ '--sc': '#6366f1' } as React.CSSProperties}>
            <div className="ei-strategy-header">
              <span className="ei-strategy-badge hybrid">Hybrid</span>
              <span className="ei-strategy-label">MAE + Contrastive</span>
            </div>
            <p>
              Combine reconstruction loss with contrastive alignment. The model must both reconstruct missing
              patches AND align representations across modalities/views. This gives the best of both worlds.
            </p>
            <div className="ei-strategy-detail">
              <strong>Best for:</strong> Multi-modal scenarios, balanced spatial + semantic features
            </div>
            <div className="ei-strategy-detail">
              <strong>Models:</strong> CROMA, SkySense
            </div>
            <div className="ei-strategy-detail">
              <strong>Limitation:</strong> Loss balancing is non-trivial. SkySense uses a multi-granularity
              contrastive objective at scene, object, and pixel levels — but the optimal weighting between
              reconstruction and contrastive losses remains empirical.
            </div>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="Why 75% Masking Ratio Is Standard for Spatial Data">
        <div className="ei-prose">
          <p>
            He et al. (2022) established that 75% masking works well for ImageNet <Cite ids={['he2022mae']} />,
            but the EO community adopted this ratio for deeper reasons. Satellite imagery has much higher
            spatial redundancy than natural photos — neighboring pixels in a Sentinel-2 tile are highly
            correlated over 10m patches. A model can trivially interpolate from 50% visible patches
            by exploiting local texture patterns.
          </p>
          <div className="ei-callout">
            <div className="ei-callout-icon">💡</div>
            <div>
              <strong>SatMAE</strong> found that going to 75% masking on multi-spectral data forces the model to
              learn spectral correlations across bands, not just spatial interpolation <Cite ids={['cong2022satmae']} />.
              At 50% masking, the model could ignore spectral information entirely and still achieve low reconstruction loss.
            </div>
          </div>
          <p>
            Clay v1.5 pushes this further with 75% random masking combined with temporal stacking —
            the model sees 3 timesteps with 75% of patches masked independently at each time, forcing
            it to jointly reason about space AND time <Cite ids={['clay2024']} />.
          </p>
          <p>
            Scale-MAE introduced a twist: masking ratio varies with the scale of the image. At low resolution (large GSD),
            less masking is needed because each patch already represents a larger area. At high resolution, more masking
            forces the model to learn fine-grained features <Cite ids={['reed2023scalemae']} />.
          </p>
        </div>
      </Collapsible>

      <Collapsible title="The Temporal Encoding Problem">
        <div className="ei-prose">
          <p>
            Time is the biggest unsolved encoding challenge in geospatial AI. Standard vision transformers
            have no concept of when an image was captured, but for Earth observation, the temporal dimension
            is as important as the spatial one — the same field looks completely different in January vs July.
          </p>

          <div className="ei-compare-table">
            <table>
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Temporal Approach</th>
                  <th>Resolution</th>
                  <th>Trade-off</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>SatMAE</strong></td>
                  <td>Temporal positional encoding — sinusoidal encoding of acquisition timestamp added to patch tokens</td>
                  <td>3 dates</td>
                  <td>Simple but limited to short sequences. Cannot reason about phenological cycles.</td>
                </tr>
                <tr>
                  <td><strong>Prithvi-EO 2.0</strong></td>
                  <td>Multi-temporal ViT — separate temporal position tokens with learned embeddings for up to 4 timestamps</td>
                  <td>1–4 dates</td>
                  <td>More flexible, but fixed temporal capacity. Token count scales linearly with timestamps.</td>
                </tr>
                <tr>
                  <td><strong>AlphaEarth</strong></td>
                  <td>Annual composite — assimilates entire year of observations into a single embedding, bypassing the encoding problem</td>
                  <td>Annual</td>
                  <td>Avoids temporal encoding complexity, but collapses intra-annual dynamics into a static vector.</td>
                </tr>
                <tr>
                  <td><strong>Clay v1.5</strong></td>
                  <td>Learned timestep encoding — continuous date encoded as (year, day_of_year) fed through MLP to produce temporal tokens</td>
                  <td>3 dates</td>
                  <td>Flexible temporal resolution, but still limited to 3 time steps during pre-training.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="ei-callout warning">
            <div className="ei-callout-icon">⚠️</div>
            <div>
              <strong>The fundamental tension:</strong> More timestamps = richer temporal modeling, but quadratic
              attention cost with sequence length. A ViT processing 4 Sentinel-2 dates at 224×224 with 16×16 patches
              already has 784 tokens per date → 3,136 total tokens. Going to 12 monthly observations would need 9,408
              tokens — currently impractical for standard attention.
            </div>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="Multi-Modal Fusion: Early vs Late">
        <div className="ei-prose">
          <p>
            Earth observation involves multiple sensor modalities — optical (Sentinel-2, Landsat), SAR (Sentinel-1),
            multispectral, hyperspectral, LiDAR, and climate data. How you fuse these fundamentally different
            data types determines what the model can learn.
          </p>

          <div className="ei-fusion-compare">
            <div className="ei-fusion-card">
              <h5>Early Fusion (Joint Encoder)</h5>
              <div className="ei-fusion-diagram">
                <div className="ei-fusion-box input">SAR</div>
                <div className="ei-fusion-box input">Optical</div>
                <div className="ei-fusion-arrow">→</div>
                <div className="ei-fusion-box encoder">Joint Encoder</div>
                <div className="ei-fusion-arrow">→</div>
                <div className="ei-fusion-box output">Unified Embedding</div>
              </div>
              <p>
                <strong>AlphaEarth</strong> fuses 7+ data sources at the input level before encoding.
                All modalities are assimilated together, allowing cross-modal interactions from the first layer.
                This captures correlations between SAR backscatter and optical reflectance that late fusion misses <Cite ids={['alphaearth2025']} />.
              </p>
              <div className="ei-pro-con">
                <span className="ei-pro">✓ Captures cross-modal correlations early</span>
                <span className="ei-pro">✓ Single unified representation</span>
                <span className="ei-con">✗ Requires all modalities at inference</span>
                <span className="ei-con">✗ Training data must be co-registered across modalities</span>
              </div>
            </div>

            <div className="ei-fusion-card">
              <h5>Late Fusion (Separate Encoders)</h5>
              <div className="ei-fusion-diagram">
                <div className="ei-fusion-box input">SAR → Encoder₁</div>
                <div className="ei-fusion-box input">Optical → Encoder₂</div>
                <div className="ei-fusion-arrow">→</div>
                <div className="ei-fusion-box encoder">Fusion Layer</div>
                <div className="ei-fusion-arrow">→</div>
                <div className="ei-fusion-box output">Combined Embedding</div>
              </div>
              <p>
                <strong>CROMA</strong> uses separate ViT encoders for SAR and optical, then aligns them through
                contrastive loss in embedding space <Cite ids={['fuller2024croma']} />. <strong>SkySense</strong>
                extends this with a factorized multi-modal encoder that processes each modality independently,
                then fuses through cross-attention layers <Cite ids={['guo2024skysense']} />.
              </p>
              <div className="ei-pro-con">
                <span className="ei-pro">✓ Can work with missing modalities</span>
                <span className="ei-pro">✓ Each encoder specializes</span>
                <span className="ei-con">✗ Cross-modal interactions only at fusion point</span>
                <span className="ei-con">✗ More parameters (separate encoders)</span>
              </div>
            </div>
          </div>

          <p>
            <strong>DOFA</strong> takes a third approach: a single shared ViT backbone with a dynamic wavelength
            adapter (hypernetwork) that generates input projection weights conditioned on the band wavelengths
            in nm <Cite ids={['xiong2024dofa']} />. This implicitly performs early fusion at the spectral level
            while remaining agnostic to which sensor captured the data.
          </p>
        </div>
      </Collapsible>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// TAB 2: Embedding Spaces Deep Dive
// ═════════════════════════════════════════════════════════════════
function EmbeddingSpaceDeepDive() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [showMetric, _setShowMetric] = useState<'cosine' | 'euclidean'>('cosine');

  // Hypersphere vs flat space visualization
  const spaces = [
    {
      name: 'AlphaEarth',
      dims: 64,
      geometry: 'Hypersphere (‖v‖ = 1)',
      color: '#1a73e8',
      metric: 'Cosine similarity',
      notes: 'Unit-length vectors on S⁶³. The L₂ constraint forces embeddings onto a hypersphere surface, meaning all information is encoded in angular relationships. This geometric constraint acts as a regularizer — preventing embedding collapse while encouraging uniform coverage of the manifold.',
      tradeoff: 'Compact storage (64 × float32 = 256 bytes/pixel at 10m), but limited representational capacity. 64D may not capture fine-grained distinctions between similar land cover subtypes.',
    },
    {
      name: 'Clay v1.5',
      dims: 1024,
      geometry: 'Flat Euclidean',
      color: '#059669',
      metric: 'L₂ distance / Cosine',
      notes: 'ViT-Large CLS token output. No norm constraint — embeddings can vary in magnitude, which encodes additional information (confidence/specificity). Embeddings cluster in a cone-like structure rather than uniformly on a sphere.',
      tradeoff: 'Rich representations (1024D encodes subtle features), but 16× larger per embedding. Not pre-computed globally — must run inference on demand.',
    },
    {
      name: 'Prithvi-EO 2.0',
      dims: 1024,
      geometry: 'Flat Euclidean',
      color: '#dc2626',
      metric: 'L₂ distance',
      notes: 'ViT-Large with temporal tokens. Uses the average of patch tokens (not CLS). The spatial averaging preserves local information better than CLS for dense tasks.',
      tradeoff: 'Best suited for fine-tuning rather than direct embedding use. The 1024D space is optimized for reconstruction, not retrieval.',
    },
  ];

  // Draw the embedding geometry comparison
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    ctx.fillStyle = '#fafaf8';
    ctx.fillRect(0, 0, w, h);

    const midX = w / 2;

    // Left: Hypersphere
    const leftCx = w * 0.25;
    const topCy = h * 0.45;
    const r = Math.min(w * 0.18, h * 0.32);

    // Circle (sphere projection)
    ctx.strokeStyle = '#1a73e8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(leftCx, topCy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Points on sphere
    const seeded = (s: number) => { let x = Math.sin(s * 9301 + 49297) * 49297; return x - Math.floor(x); };
    const sphereColors = ['#059669', '#eab308', '#0ea5e9', '#6366f1', '#c67b2e', '#ec4899'];
    const sphereLabels = ['Forest', 'Crop', 'Water', 'Urban', 'Bare', 'Wetland'];

    for (let i = 0; i < 36; i++) {
      const angle = seeded(i * 17) * Math.PI * 2;
      const px = leftCx + Math.cos(angle) * r;
      const py = topCy + Math.sin(angle) * r * (0.3 + seeded(i * 31) * 0.7);
      const ci = Math.floor(seeded(i * 7 + 3) * 6);
      const isHl = highlighted === sphereLabels[ci] || highlighted === null;

      ctx.globalAlpha = isHl ? 0.8 : 0.15;
      ctx.fillStyle = sphereColors[ci];
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Labels
    ctx.font = '600 13px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#1a73e8';
    ctx.textAlign = 'center';
    ctx.fillText('AlphaEarth: Hypersphere (64D)', leftCx, h * 0.08);
    ctx.font = '11px "DM Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('‖v‖ = 1.0 — all vectors on surface', leftCx, h * 0.14);
    ctx.fillText('Angular distance = semantic distance', leftCx, h * 0.19);

    // Right: Flat space
    const rightCx = w * 0.75;

    // Axes
    ctx.strokeStyle = '#e2e0d8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightCx - r, topCy);
    ctx.lineTo(rightCx + r, topCy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rightCx, topCy - r);
    ctx.lineTo(rightCx, topCy + r);
    ctx.stroke();

    // Points scattered (cone-like)
    for (let i = 0; i < 36; i++) {
      const dx = (seeded(i * 23) - 0.5) * r * 1.6;
      const dy = (seeded(i * 29 + 10) - 0.5) * r * 1.6;
      const mag = Math.sqrt(dx * dx + dy * dy);
      const ci = Math.floor(seeded(i * 7 + 3) * 6);
      const isHl = highlighted === sphereLabels[ci] || highlighted === null;

      // Cone: points further from origin have larger spread
      const px = rightCx + dx * (0.4 + mag / (r * 1.6) * 0.6);
      const py = topCy + dy * (0.4 + mag / (r * 1.6) * 0.6);

      ctx.globalAlpha = isHl ? 0.8 : 0.15;
      ctx.fillStyle = sphereColors[ci];
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.font = '600 13px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#059669';
    ctx.textAlign = 'center';
    ctx.fillText('Clay / Prithvi: Euclidean (1024D)', rightCx, h * 0.08);
    ctx.font = '11px "DM Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Variable magnitude — encodes specificity', rightCx, h * 0.14);
    ctx.fillText('Both L₂ and cosine distances meaningful', rightCx, h * 0.19);

    // Divider
    ctx.strokeStyle = '#e2e0d8';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(midX, h * 0.05);
    ctx.lineTo(midX, h * 0.85);
    ctx.stroke();
    ctx.setLineDash([]);

    // Legend at bottom
    const legendY = h * 0.88;
    const legendStartX = w * 0.15;
    const legendSpacing = w / 7;
    sphereLabels.forEach((label, i) => {
      const lx = legendStartX + i * legendSpacing;
      ctx.fillStyle = sphereColors[i];
      ctx.globalAlpha = highlighted === label || highlighted === null ? 1 : 0.3;
      ctx.beginPath();
      ctx.arc(lx, legendY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '10px "DM Sans", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText(label, lx, legendY + 16);
    });
    ctx.globalAlpha = 1;
  }, [highlighted, showMetric]);

  return (
    <div className="ei-tab-content">
      <h3 className="insights-subtitle">Embedding Geometry & Interpretability</h3>
      <p className="insights-desc">
        Foundation model embeddings aren't just feature vectors — they define a geometry of landscape similarity.
        The choice of embedding space topology (hypersphere vs flat), dimensionality, and distance metric
        fundamentally determines what relationships the model can represent.
      </p>

      <Collapsible title="64D Hypersphere vs 1024D Flat Space" defaultOpen={true}>
        <div className="ei-canvas-wrap">
          <canvas ref={canvasRef} className="ei-embed-canvas" />
          <div className="ei-embed-legend">
            {['Forest', 'Crop', 'Water', 'Urban', 'Bare', 'Wetland'].map(label => (
              <button
                key={label}
                className={`ei-legend-btn ${highlighted === label ? 'active' : ''}`}
                onMouseEnter={() => setHighlighted(label)}
                onMouseLeave={() => setHighlighted(null)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="ei-space-grid">
          {spaces.map(s => (
            <div key={s.name} className="ei-space-card" style={{ borderTopColor: s.color }}>
              <div className="ei-space-header">
                <span className="ei-space-name">{s.name}</span>
                <span className="ei-space-dims" style={{ color: s.color }}>{s.dims}D</span>
              </div>
              <div className="ei-space-meta">
                <span>Geometry: {s.geometry}</span>
                <span>Metric: {s.metric}</span>
              </div>
              <p className="ei-space-notes">{s.notes}</p>
              <div className="ei-space-tradeoff">
                <strong>Trade-off:</strong> {s.tradeoff}
              </div>
            </div>
          ))}
        </div>
      </Collapsible>

      <Collapsible title="What Do the Dimensions Actually Encode?">
        <div className="ei-prose">
          <p>
            In AlphaEarth's 64D space, individual dimensions don't have clean semantic interpretations like
            "greenness" or "elevation." Instead, they encode distributed representations where meaning emerges
            from patterns across multiple dimensions. However, PCA analysis reveals interpretable structure:
          </p>
          <div className="ei-dim-grid">
            <div className="ei-dim-card">
              <div className="ei-dim-label">PC1 (18% variance)</div>
              <div className="ei-dim-desc">Broadly correlates with <strong>vegetation density</strong> — separates forests/crops from bare soil/urban</div>
            </div>
            <div className="ei-dim-card">
              <div className="ei-dim-label">PC2 (12% variance)</div>
              <div className="ei-dim-desc">Captures <strong>moisture/water content</strong> — separates water bodies and wetlands from dry classes</div>
            </div>
            <div className="ei-dim-card">
              <div className="ei-dim-label">PC3 (8% variance)</div>
              <div className="ei-dim-desc">Encodes <strong>surface roughness/structure</strong> — distinguishes urban (high texture) from smooth surfaces</div>
            </div>
            <div className="ei-dim-card">
              <div className="ei-dim-label">PC4–10</div>
              <div className="ei-dim-desc">Fine-grained distinctions: crop type, tree species composition, urbanization density, seasonal variation</div>
            </div>
          </div>
          <div className="ei-callout">
            <div className="ei-callout-icon">🔬</div>
            <div>
              The hypersphere constraint in AlphaEarth means that embedding dimensions are not independent —
              they are constrained by ‖v‖ = 1, so increasing one component must decrease others. This
              creates natural trade-offs between features (more "vegetation" means less "urban") that
              mirror real-world land cover exclusivity.
            </div>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="Cosine Similarity → Real-World Similarity">
        <div className="ei-prose">
          <p>
            The power of embeddings lies in the mapping between vector similarity and landscape similarity.
            In AlphaEarth's hypersphere:
          </p>
          <div className="ei-sim-table">
            <table>
              <thead>
                <tr>
                  <th>Pair</th>
                  <th>Cosine Similarity</th>
                  <th>Interpretation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Forest ↔ Forest (same biome)</td>
                  <td className="ei-sim-high">0.92–0.98</td>
                  <td>Nearly identical embeddings within land cover class</td>
                </tr>
                <tr>
                  <td>Forest ↔ Cropland</td>
                  <td className="ei-sim-mid">0.55–0.70</td>
                  <td>Both vegetated but structurally different</td>
                </tr>
                <tr>
                  <td>Forest ↔ Water</td>
                  <td className="ei-sim-low">0.10–0.30</td>
                  <td>Fundamentally different spectral/structural signatures</td>
                </tr>
                <tr>
                  <td>Forest ↔ Urban</td>
                  <td className="ei-sim-low">0.05–0.25</td>
                  <td>Opposing embedding directions: vegetation vs built</td>
                </tr>
                <tr>
                  <td>Wetland ↔ Water</td>
                  <td className="ei-sim-mid">0.45–0.65</td>
                  <td>Transitional zone — embeddings reflect ecological gradient</td>
                </tr>
                <tr>
                  <td>Cropland ↔ Grassland</td>
                  <td className="ei-sim-high">0.70–0.85</td>
                  <td>Spectrally similar herbaceous cover, structural differences encoded weakly at 10m</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            This structure is not explicitly supervised — it emerges from the pre-training objective.
            The model learns that forest and cropland co-occur in similar geographic contexts (temperate zones,
            alluvial plains) while water and urban have completely different radiometric signatures.
          </p>
        </div>
      </Collapsible>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// TAB 3: Open Questions (as of early 2026)
// ═════════════════════════════════════════════════════════════════
function OpenQuestionsDeepDive() {
  const questions = [
    {
      title: 'Scaling Laws for EO Foundation Models',
      icon: '📈',
      status: 'Unresolved',
      statusColor: '#dc2626',
      body: (
        <>
          <p>
            In NLP, scaling laws are well-characterized — loss decreases predictably with compute, data, and parameters.
            For EO foundation models, we don't know if this holds. SkySense (2.6B params) outperforms
            smaller models on many benchmarks, but AlphaEarth achieves strong results at 10m global scale
            without disclosing model size. Clay v1.5 (0.3B) beats many larger models on specific tasks.
          </p>
          <p>
            The key question: <strong>does more data matter more than more parameters for EO?</strong> The
            evidence suggests yes — Clay's improvement from v1.0 to v1.5 came primarily from better data
            curation (LULC-stratified sampling), not more parameters <Cite ids={['clay2024']} />.
          </p>
        </>
      ),
    },
    {
      title: 'The Resolution–Coverage Trade-off',
      icon: '🔍',
      status: 'Structural',
      statusColor: '#f59e0b',
      body: (
        <>
          <p>
            AlphaEarth produces 10m global embeddings — but can't resolve individual buildings.
            SkySense handles 0.3m–10m multi-resolution data — but only for limited geographic coverage.
            No model currently provides both high resolution AND global coverage.
          </p>
          <p>
            This is partly a data problem (sub-meter imagery isn't freely available globally),
            partly a compute problem (10× resolution = 100× more pixels), and partly an architectural
            problem (features that matter at 10m are different from features at 0.5m).
          </p>
        </>
      ),
    },
    {
      title: 'Why Don\'t Sub-Meter Foundation Models Exist?',
      icon: '🏗️',
      status: 'Data-limited',
      statusColor: '#6366f1',
      body: (
        <>
          <p>
            At &lt;1m GSD, EO enters the domain of individual objects — cars, buildings, trees. This is closer to
            traditional computer vision than to remote sensing. Several barriers prevent sub-meter GFMs:
          </p>
          <ul>
            <li><strong>Data access:</strong> Sub-meter imagery (WorldView, Pléiades) is commercially licensed.
            Unlike Sentinel-2 (free, open), there's no large-scale open sub-meter archive for pre-training.</li>
            <li><strong>Scale mismatch:</strong> Features at 0.3m (roof materials, road markings) are fundamentally
            different from features at 10m (land cover, vegetation indices). Transfer learning across scales is poor.</li>
            <li><strong>Annotation cost:</strong> Labeling at sub-meter requires per-object annotation (similar to COCO),
            which is 100× more expensive than pixel-level land cover mapping.</li>
          </ul>
        </>
      ),
    },
    {
      title: 'Temporal Resolution: Annual vs Multi-Date vs None',
      icon: '⏱️',
      status: 'Active research',
      statusColor: '#059669',
      body: (
        <>
          <p>
            AlphaEarth's annual composites collapse an entire year into one embedding — phenological cycles,
            flood events, and harvest patterns are all averaged away <Cite ids={['alphaearth2025']} />.
            Prithvi supports up to 4 timestamps but can't model full seasonal cycles <Cite ids={['jakubik2024prithvi']} />.
            Most other models ignore time entirely.
          </p>
          <p>
            For applications like crop type classification (needs phenology), disaster response (needs daily/weekly),
            or deforestation monitoring (needs monthly), current temporal resolutions are inadequate. The field
            needs models that can efficiently process 12–52 timesteps per year.
          </p>
        </>
      ),
    },
    {
      title: 'SAR Integration — Why Most Models Skip It',
      icon: '📡',
      status: 'Hard problem',
      statusColor: '#dc2626',
      body: (
        <>
          <p>
            Synthetic Aperture Radar (SAR) provides cloud-free, day/night observations — exactly what's needed
            for global monitoring. Yet most GFMs skip SAR entirely:
          </p>
          <ul>
            <li><strong>Different physics:</strong> SAR measures backscatter intensity + phase, not reflectance.
            The same forest produces completely different SAR vs optical signatures.</li>
            <li><strong>Speckle noise:</strong> SAR images contain multiplicative noise that requires specialized
            filtering. Standard augmentations (flip, rotate) don't address this.</li>
            <li><strong>Geometric distortions:</strong> Layover, foreshortening, and shadow in mountainous terrain
            create artifacts that have no optical equivalent.</li>
          </ul>
          <p>
            CROMA is the notable exception, explicitly designed for SAR-optical fusion through contrastive
            alignment <Cite ids={['fuller2024croma']} />. AlphaEarth also incorporates SAR, but the
            architectural details are proprietary.
          </p>
        </>
      ),
    },
    {
      title: 'Benchmark Standardization — GEO-Bench Limitations',
      icon: '📏',
      status: 'Improving',
      statusColor: '#f59e0b',
      body: (
        <>
          <p>
            GEO-Bench <Cite ids={['lacoste2023geobench']} /> was the first attempt at standardized benchmarking
            for geospatial foundation models, providing 12 classification and segmentation tasks. But significant gaps remain:
          </p>
          <ul>
            <li><strong>Limited task diversity:</strong> No change detection, temporal tasks, or regression benchmarks</li>
            <li><strong>Geographic bias:</strong> Most tasks concentrated in North America and Europe</li>
            <li><strong>Resolution locked:</strong> Primarily Sentinel-2 (10m) — no multi-resolution evaluation</li>
            <li><strong>No cross-modal tasks:</strong> SAR→optical transfer, multi-modal fusion quality not measured</li>
          </ul>
          <p>
            Prithvi-EO 2.0 is the most extensively benchmarked model to date, reporting on 41 downstream tasks.
            But each paper still uses different evaluation protocols, making head-to-head comparison unreliable.
          </p>
        </>
      ),
    },
    {
      title: 'Proprietary vs Open: The Sustainability Question',
      icon: '🔓',
      status: 'Philosophical',
      statusColor: '#6366f1',
      body: (
        <>
          <p>
            The GeoFM field is split between open models (Clay, Prithvi, CROMA, DOFA) and proprietary ones
            (AlphaEarth/Google, SkySense). This matters because:
          </p>
          <div className="ei-debate-grid">
            <div className="ei-debate-side open">
              <h6>Open Models</h6>
              <ul>
                <li>Reproducible science</li>
                <li>Community fine-tuning</li>
                <li>No vendor lock-in</li>
                <li>Inspectable for bias</li>
              </ul>
              <p className="ei-debate-catch"><strong>But:</strong> Limited compute for pre-training → often smaller scale</p>
            </div>
            <div className="ei-debate-side proprietary">
              <h6>Proprietary Models</h6>
              <ul>
                <li>Massive compute/data</li>
                <li>Production-quality outputs</li>
                <li>AlphaEarth: global pre-computed</li>
                <li>Integrated with platforms (GEE)</li>
              </ul>
              <p className="ei-debate-catch"><strong>But:</strong> Black box, can't reproduce, may disappear or price-gate</p>
            </div>
          </div>
          <p>
            For science that depends on reproducibility, proprietary models are fundamentally problematic —
            you can't verify, extend, or reproduce results built on undisclosed architectures. For
            operational deployment, proprietary models often win on quality and convenience.
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="ei-tab-content">
      <h3 className="insights-subtitle">Open Questions in EO Foundation Models (2026)</h3>
      <p className="insights-desc">
        Despite remarkable progress, the field of geospatial foundation models faces fundamental unresolved
        challenges. These aren't incremental improvements — they're structural questions about how we
        build AI systems for Earth observation.
      </p>

      <div className="ei-questions-list">
        {questions.map((q, i) => (
          <Collapsible key={i} title={`${q.icon}  ${q.title}`} defaultOpen={i === 0}>
            <div className="ei-question-status">
              <span className="ei-status-badge" style={{ color: q.statusColor, borderColor: q.statusColor }}>
                {q.status}
              </span>
            </div>
            <div className="ei-prose">{q.body}</div>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// TAB 4: GeoFM vs ImageNet (kept from original, enhanced)
// ═════════════════════════════════════════════════════════════════
function GeoFMvsImageNet() {
  const challenges = [
    {
      challenge: 'Spectral Depth',
      imagenet: '3 channels (RGB)',
      geofm: '2–200+ bands spanning 400nm–2500nm (optical) + radar wavelengths',
      icon: '🌈',
      detail: 'Standard CNNs assume 3-channel input with batch normalization calibrated for [0,255] uint8. EO data uses calibrated reflectance (float32), negative values (SAR dB), and band counts that vary by sensor. the DOFA hypernetwork addresses this by generating input weights from wavelength metadata.',
    },
    {
      challenge: 'Temporal Dimension',
      imagenet: 'Single snapshot',
      geofm: 'Time series (days to decades) — phenology, seasonal cycles, change events',
      icon: '📅',
      detail: 'A wheat field photographed in January vs July produces completely different embeddings. Foundation models must encode not just what the surface looks like, but when it was observed. This requires temporal positional encoding that has no ImageNet equivalent.',
    },
    {
      challenge: 'Spatial Scale',
      imagenet: 'Object-centric (224×224 at ~1m)',
      geofm: '0.3m to 1km GSD — different features emerge at different scales',
      icon: '🔎',
      detail: 'At 0.3m you see roof materials; at 10m you see land parcels; at 100m you see biomes. The same ViT patch size (16×16 pixels) captures fundamentally different information at each scale. Scale-MAE explicitly addresses this with scale-aware positional encoding.',
    },
    {
      challenge: 'Multi-Modal Inputs',
      imagenet: 'Single camera',
      geofm: 'Optical, SAR, LiDAR, thermal, hyperspectral — each with unique physics',
      icon: '📡',
      detail: 'SAR backscatter and optical reflectance measure completely different physical properties. Fusing them requires understanding that high SAR backscatter + high NDVI = forest, while high SAR backscatter + low NDVI = urban. This cross-modal reasoning is absent from ImageNet pre-training.',
    },
    {
      challenge: 'Geospatial Context',
      imagenet: 'No location awareness',
      geofm: 'Same patch looks different at different latitudes/altitudes/climates',
      icon: '🌍',
      detail: 'A green patch at 60°N is probably boreal forest; the same spectral signature at 10°N is tropical agriculture. Geographic context (latitude, elevation, climate zone) modulates interpretation. Clay v1.5 and Prithvi encode lat/lon as additional input features.',
    },
    {
      challenge: 'Data Volume',
      imagenet: '14M images',
      geofm: 'Petabytes of continuously acquired global imagery (Sentinel alone: 12TB/day)',
      icon: '📊',
      detail: 'ImageNet was curated once. Sentinel-2 generates 1.6 TB/day of new imagery. Pre-training must handle data that is continuously growing, seasonally varying, and unevenly distributed (more clear observations in arid regions than cloudy tropical zones).',
    },
    {
      challenge: 'Label Scarcity',
      imagenet: 'Crowd-sourced labels for 1000 classes',
      geofm: 'Expensive expert annotations — a single land cover map costs $100K+',
      icon: '🏷️',
      detail: 'ImageNet labels can be crowd-sourced ("is this a dog?"). EO labels require domain expertise ("is this Spartina alterniflora or Phragmites?"). This is why self-supervised pre-training is not just useful but essential for EO foundation models.',
    },
    {
      challenge: 'Physical Constraints',
      imagenet: 'None — pure pattern recognition',
      geofm: 'Must respect physics: atmospheric correction, sun angle, SAR geometry, sensor calibration',
      icon: '⚛️',
      detail: 'The same surface produces different pixel values depending on atmospheric conditions, sun-sensor geometry, and sensor calibration. Pre-processing (TOA→SR correction) is not standardized, creating domain shift between datasets that doesn\'t exist in ImageNet.',
    },
  ];

  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="ei-tab-content">
      <h3 className="insights-subtitle">Why ImageNet Models Fail on Earth Observation</h3>
      <p className="insights-desc">
        Geospatial data operates in a fundamentally different regime. Standard computer vision models expect
        3-channel RGB images at fixed resolution with no temporal, spectral, or geographic context.
        EO data breaks every one of these assumptions.
      </p>

      <div className="ei-vs-grid">
        {challenges.map((c, i) => (
          <div
            key={i}
            className={`ei-vs-card ${expanded === i ? 'expanded' : ''}`}
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            <div className="ei-vs-header">
              <span className="ei-vs-icon">{c.icon}</span>
              <div className="ei-vs-titles">
                <span className="ei-vs-challenge">{c.challenge}</span>
                <div className="ei-vs-compare">
                  <span className="ei-vs-imagenet">{c.imagenet}</span>
                  <span className="ei-vs-arrow">→</span>
                  <span className="ei-vs-geofm">{c.geofm}</span>
                </div>
              </div>
              <svg className="ei-vs-expand" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 5 7 9 11 5" />
              </svg>
            </div>
            {expanded === i && (
              <div className="ei-vs-detail">
                <p>{c.detail}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════
export default function ExpertInsights() {
  const [activeTab, setActiveTab] = useState<TabId>('pretrain');

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'pretrain', label: 'Pre-training Strategies', icon: '⚙️' },
    { id: 'embedding', label: 'Embedding Spaces', icon: '🌌' },
    { id: 'questions', label: 'Open Questions', icon: '❓' },
    { id: 'geofm', label: 'GeoFM vs ImageNet', icon: '🧠' },
  ];

  return (
    <section className="section insights-section" data-section="insights">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">Expert Analysis</span>
          <h2>Deep Dive: Understanding GeoFMs</h2>
          <p className="section-subtitle">
            Pre-training strategies, embedding geometry, and the open questions shaping
            the next generation of Earth observation AI — written for practitioners.
          </p>
        </div>

        <div className="insights-tabs fade-in">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`insights-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="insights-tab-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="insights-content fade-in">
          {activeTab === 'pretrain' && <PretrainingDeepDive />}
          {activeTab === 'embedding' && <EmbeddingSpaceDeepDive />}
          {activeTab === 'questions' && <OpenQuestionsDeepDive />}
          {activeTab === 'geofm' && <GeoFMvsImageNet />}
        </div>
      </div>
    </section>
  );
}
