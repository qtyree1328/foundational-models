import { useEffect } from 'react';
import { useInView } from '../hooks/useInView';
import ModelGallery from '../components/ModelGallery';
import GoogleDualApproach from '../components/GoogleDualApproach';
import ModelRecommender from '../components/ModelRecommender';

export default function ModelsPage() {
  const ref = useInView();

  useEffect(() => {
    document.title = 'Models | Geospatial Foundation Models';
  }, []);

  return (
    <div ref={ref}>
      <div className="page-header">
        <div className="container">
          <span className="page-label">Model Database</span>
          <h1>Foundation Models</h1>
          <p>Explore the leading Large Earth Observation Models — architecture details, benchmarks, training data, and code examples for each.</p>
        </div>
      </div>
      <ModelGallery />
      <GoogleDualApproach />
      <ModelRecommender />
    </div>
  );
}
