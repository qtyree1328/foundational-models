import { useEffect } from 'react';
import { useInView } from '../hooks/useInView';
import DeepComparison from '../components/DeepComparison';

export default function ArchitecturePage() {
  const ref = useInView();

  useEffect(() => {
    document.title = 'Architecture | Geospatial Foundation Models';
  }, []);

  return (
    <div ref={ref}>
      <div className="page-header">
        <div className="container">
          <span className="page-label">Technical Deep Dive</span>
          <h1>Architecture & Comparison</h1>
          <p>Radar profiles, specification tables, benchmark results, and architecture diagrams across all models.</p>
        </div>
      </div>
      <DeepComparison />
    </div>
  );
}
