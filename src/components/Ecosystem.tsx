import { useRef } from 'react';

export default function Ecosystem() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} className="section ecosystem-section" data-section="ecosystem">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">The Stack</span>
          <h2>The Emerging Ecosystem</h2>
          <p className="section-subtitle">
            From raw pixels to actionable insights — the geo-embedding stack is taking shape.
          </p>
        </div>

        <div className="ecosystem-layers fade-in">
          <div className="ecosystem-layer" style={{ '--layer-color': '#059669' } as React.CSSProperties}>
            <div className="layer-label">Data Providers</div>
            <div className="layer-items">
              <span className="ecosystem-item">ESA (Sentinel)</span>
              <span className="ecosystem-item">NASA (Landsat, MODIS)</span>
              <span className="ecosystem-item">Planet</span>
              <span className="ecosystem-item">Vantor (formerly Maxar)</span>
            </div>
            <div className="layer-desc">Raw satellite imagery — petabytes of pixels</div>
          </div>
          <div className="ecosystem-arrow">↓</div>
          <div className="ecosystem-layer" style={{ '--layer-color': '#6366f1' } as React.CSSProperties}>
            <div className="layer-label">LEOMs (Foundation Models)</div>
            <div className="layer-items">
              <span className="ecosystem-item highlight">AlphaEarth</span>
              <span className="ecosystem-item highlight">Google RSFM</span>
              <span className="ecosystem-item highlight">Clay</span>
              <span className="ecosystem-item">Prithvi</span>
              <span className="ecosystem-item">SatMAE</span>
              <span className="ecosystem-item">SkySense</span>
              <span className="ecosystem-item">CROMA</span>
              <span className="ecosystem-item">DOFA</span>
              <span className="ecosystem-item">SpectralGPT</span>
            </div>
            <div className="layer-desc">Transform raw pixels into geo-embeddings — compact, semantic vector representations</div>
          </div>
          <div className="ecosystem-arrow">↓</div>
          <div className="ecosystem-layer" style={{ '--layer-color': '#e07a2f' } as React.CSSProperties}>
            <div className="layer-label">Infrastructure & Delivery</div>
            <div className="layer-items">
              <span className="ecosystem-item highlight">LGND (geo-embedding infrastructure)</span>
              <span className="ecosystem-item">Google Earth Engine</span>
              <span className="ecosystem-item">Source Cooperative</span>
              <span className="ecosystem-item">Microsoft Planetary Computer</span>
            </div>
            <div className="layer-desc">Store, index, search, and serve geo-embeddings at planetary scale</div>
          </div>
          <div className="ecosystem-arrow">↓</div>
          <div className="ecosystem-layer" style={{ '--layer-color': '#e11d48' } as React.CSSProperties}>
            <div className="layer-label">Applications</div>
            <div className="layer-items">
              <span className="ecosystem-item">Precision Agriculture</span>
              <span className="ecosystem-item">Disaster Response</span>
              <span className="ecosystem-item">Conservation Monitoring</span>
              <span className="ecosystem-item">Urban Planning</span>
              <span className="ecosystem-item">Carbon Markets</span>
              <span className="ecosystem-item">Insurance / Risk</span>
            </div>
            <div className="layer-desc">Domain-specific tools that consume geo-embeddings to answer real-world questions</div>
          </div>
        </div>

        <div className="ecosystem-insight fade-in">
          <div className="ecosystem-insight-icon"></div>
          <div>
            <strong>The key insight:</strong> Just as NLP needed infrastructure companies between language models and 
            applications (Pinecone, Weaviate for vector search), geo-embeddings need their own infrastructure layer. 
            LGND — founded by the Clay team (Dan Hammer, Bruno Sánchez-Andrade Nuño) — is building this: 
            the "Standard Oil for geo-embeddings" that makes LEOM outputs queryable, composable, and production-ready.
            Recent research validates the ecosystem approach: foundation models consistently outperform task-specific 
            models when labeled training data is limited, making the infrastructure investment worthwhile for 
            applications ranging from precision agriculture to disaster response.
          </div>
        </div>

        <div className="ecosystem-deployment fade-in">
          <h3>Commercial Deployment: From Research to Production</h3>
          <p className="ecosystem-deployment-desc">
            LEOMs are no longer just research artifacts — they're being deployed in production environments 
            by major commercial and government organizations, validating the "deployment gap" thesis.
          </p>
          <div className="deployment-cards">
            <div className="deployment-card">
              <div className="deployment-logo"></div>
              <div>
                <strong>Vantor</strong>
                <span className="deployment-detail">(formerly Maxar Intelligence, rebranded Oct 2025)</span>
                <p>First to deploy Google Earth AI in air-gapped government environments via their Tensorglobe platform. Trusted tester for Google RSFM.</p>
              </div>
            </div>
            <div className="deployment-card">
              <div className="deployment-logo"></div>
              <div>
                <strong>Planet Labs</strong>
                <p>Trusted tester for Google RSFM — integrating vision-language models with their daily satellite imagery constellation for commercial analysis.</p>
              </div>
            </div>
            <div className="deployment-card">
              <div className="deployment-logo"></div>
              <div>
                <strong>Airbus</strong>
                <p>Trusted tester for Google RSFM — applying open-vocabulary detection and vision-language capabilities to their high-resolution satellite and aerial imagery products.</p>
              </div>
            </div>
            <div className="deployment-card">
              <div className="deployment-logo"></div>
              <div>
                <strong>LGND</strong>
                <span className="deployment-detail">(Founded by Clay creators Dan Hammer & Bruno Sánchez-Andrade Nuño)</span>
                <p>Geo-embeddings infrastructure company. Raised $9M seed (Jul 2025, led by Javelin Venture Partners) to build queryable, production-ready embedding pipelines.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="ecosystem-trends fade-in">
          <h3>2024-2026 Ecosystem Developments</h3>
          <div className="trend-cards">
            <div className="trend-card">
              <span className="trend-icon"></span>
              <div>
                <strong>Institutional Adoption</strong>
                <p>NASA and IBM's collaboration established the first open-source geospatial foundation model, signaling institutional validation of the LEOM approach.</p>
              </div>
            </div>
            <div className="trend-card">
              <span className="trend-icon"></span>
              <div>
                <strong>Standardized Benchmarking</strong>
                <p>GeoBench ecosystem expansion (GEO-Bench-2, GeoCrossBench) provides standardized evaluation frameworks for cross-satellite and multi-modal performance assessment.</p>
              </div>
            </div>
            <div className="trend-card">
              <span className="trend-icon"></span>
              <div>
                <strong>Commercial Validation</strong>
                <p>LGND's $9M seed funding (2025) and partnerships with major agricultural companies demonstrate commercial viability of geo-embedding infrastructure.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
