import { useRef } from 'react';

export default function GoogleDualApproach() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} className="section google-dual-section" data-section="google-dual">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">Google's Dual Strategy</span>
          <h2>Two Models, One Complete Stack</h2>
          <p className="section-subtitle">
            Google built two fundamentally different model families for Earth observation — not because
            of internal competition, but because they solve different halves of the same problem.
            Together, AlphaEarth and RSFM form a complete analysis pipeline: one tells you WHERE 
            things changed, the other tells you WHAT changed.
          </p>
        </div>

        <div className="dual-approach-grid fade-in">
          {/* AlphaEarth Card */}
          <div className="dual-card alphaearth-card">
            <div className="dual-card-header">
              <div className="dual-card-badge deepmind">DeepMind</div>
              <h3> AlphaEarth Foundations</h3>
              <p className="dual-card-purpose">Representation Layer</p>
            </div>
            <div className="dual-card-body">
              <div className="dual-card-question">
                "What does this place <em>look like</em> in embedding space?"
              </div>
              <ul className="dual-card-specs">
                <li>
                  <strong>Purpose:</strong> Universal Earth representation — compress the planet into embeddings
                </li>
                <li>
                  <strong>Approach:</strong> Self-supervised learning on satellite imagery → 64-dim vectors per location
                </li>
                <li>
                  <strong>Strength:</strong> Change detection, similarity search, clustering — no labels needed
                </li>
                <li>
                  <strong>Access:</strong> Public via Google Earth Engine
                </li>
                <li>
                  <strong>Output:</strong> 64-band annual embeddings (A00–A63) at 10m resolution
                </li>
              </ul>
              <div className="dual-card-analogy">
                <span className="analogy-label">Think of it as:</span>
                Embeddings for ANY downstream task — the raw representation layer
              </div>
            </div>
          </div>

          {/* RSFM Card */}
          <div className="dual-card rsfm-card">
            <div className="dual-card-header">
              <div className="dual-card-badge research">Google Research</div>
              <h3> RSFM</h3>
              <p className="dual-card-purpose">Task Layer</p>
            </div>
            <div className="dual-card-body">
              <div className="dual-card-question">
                "What <em>objects and features</em> are in this image?"
              </div>
              <ul className="dual-card-specs">
                <li>
                  <strong>Purpose:</strong> Task-oriented imagery analysis — answer questions about what's IN the image
                </li>
                <li>
                  <strong>Approach:</strong> Vision-language training, supervised detection heads (SigLIP, OWL-ViT)
                </li>
                <li>
                  <strong>Strength:</strong> Object detection, scene understanding, natural language queries
                </li>
                <li>
                  <strong>Access:</strong> Trusted tester program (Vantor, Planet Labs, Airbus)
                </li>
                <li>
                  <strong>Output:</strong> Classifications, detections, text-image embeddings
                </li>
              </ul>
              <div className="dual-card-analogy">
                <span className="analogy-label">Think of it as:</span>
                Pre-built capabilities for specific analysis — the task execution layer
              </div>
            </div>
          </div>
        </div>

        {/* Why Both? */}
        <div className="dual-why fade-in">
          <h3>Why Both?</h3>
          <p>They solve fundamentally different problems that combine into a complete workflow:</p>
          <div className="dual-workflow">
            <div className="workflow-step">
              <div className="workflow-icon"></div>
              <div className="workflow-label">AlphaEarth</div>
              <div className="workflow-action">Embedding similarity detects <strong>WHERE</strong> things changed</div>
              <div className="workflow-detail">Dot product between annual embeddings → stability map</div>
            </div>
            <div className="workflow-arrow">→</div>
            <div className="workflow-step">
              <div className="workflow-icon"></div>
              <div className="workflow-label">RSFM</div>
              <div className="workflow-action">Vision-language analysis identifies <strong>WHAT</strong> changed</div>
              <div className="workflow-detail">Natural language query: "What structures were damaged?"</div>
            </div>
            <div className="workflow-arrow">→</div>
            <div className="workflow-step">
              <div className="workflow-icon"></div>
              <div className="workflow-label">Complete Picture</div>
              <div className="workflow-action"><strong>WHERE</strong> + <strong>WHAT</strong> = actionable intelligence</div>
              <div className="workflow-detail">Full situational awareness from satellite imagery</div>
            </div>
          </div>
        </div>

        {/* Key Differences Table */}
        <div className="dual-comparison-table fade-in">
          <div className="dual-table-header">
            <span></span>
            <span>AlphaEarth</span>
            <span>RSFM</span>
          </div>
          <div className="dual-table-row">
            <span className="dual-table-label">Team</span>
            <span>DeepMind</span>
            <span>Google Research</span>
          </div>
          <div className="dual-table-row">
            <span className="dual-table-label">Architecture</span>
            <span>Custom embedding field model</span>
            <span>SigLIP / MaMMUT / OWL-ViT</span>
          </div>
          <div className="dual-table-row">
            <span className="dual-table-label">Training</span>
            <span>Self-supervised (no labels)</span>
            <span>Vision-language (text + imagery)</span>
          </div>
          <div className="dual-table-row">
            <span className="dual-table-label">Output</span>
            <span>64-dim embeddings per pixel</span>
            <span>Classifications, detections, text matches</span>
          </div>
          <div className="dual-table-row">
            <span className="dual-table-label">Resolution</span>
            <span>10m global (annual composites)</span>
            <span>0.1m–10m (multi-resolution)</span>
          </div>
          <div className="dual-table-row">
            <span className="dual-table-label">Access</span>
            <span>Public (GEE catalog)</span>
            <span>Trusted tester program</span>
          </div>
          <div className="dual-table-row">
            <span className="dual-table-label">Best for</span>
            <span>Change detection, similarity search, clustering</span>
            <span>Object detection, scene understanding, NL queries</span>
          </div>
        </div>
      </div>
    </section>
  );
}
