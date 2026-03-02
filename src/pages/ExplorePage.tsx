import { useEffect, lazy, Suspense } from 'react';
import { useInView } from '../hooks/useInView';
import LiveExplorer from '../components/LiveExplorer';

const DemoClassification = lazy(() => import('../components/DemoClassification'));
const FMExplorer = lazy(() => import('../components/FMExplorer'));

function LazySection({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="section" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="stac-spinner" />
      </div>
    }>
      {children}
    </Suspense>
  );
}

export default function ExplorePage() {
  const ref = useInView();

  useEffect(() => {
    document.title = 'Explore | Geospatial Foundation Models';
  }, []);

  return (
    <div ref={ref}>
      <div className="page-header">
        <div className="container">
          <span className="page-label">Interactive Tools</span>
          <h1>Live Explorer</h1>
          <p>Interact with real AlphaEarth embeddings via Google Earth Engine — clustering, change detection, similarity search, and more.</p>
        </div>
      </div>
      <LiveExplorer />
      <LazySection><DemoClassification /></LazySection>
      <LazySection><FMExplorer /></LazySection>
    </div>
  );
}
