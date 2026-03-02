import { useEffect, lazy, Suspense } from 'react';
import { useInView } from '../hooks/useInView';
import ModelGallery from '../components/ModelGallery';
import GoogleDualApproach from '../components/GoogleDualApproach';
import ModelRecommender from '../components/ModelRecommender';

const DeepComparison = lazy(() => import('../components/DeepComparison'));

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
          <p>Architecture details, radar profiles, benchmarks, training data, and code examples for every major geospatial foundation model.</p>
        </div>
      </div>
      <ModelGallery />
      <GoogleDualApproach />
      <Suspense fallback={<div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="stac-spinner" /></div>}>
        <DeepComparison />
      </Suspense>
      <ModelRecommender />
    </div>
  );
}
