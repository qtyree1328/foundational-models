import { useEffect, lazy, Suspense } from 'react';
import { useInView } from '../hooks/useInView';
import LiveExplorer from '../components/LiveExplorer';
import RealApplications from '../components/RealApplications';

const DemoClassification = lazy(() => import('../components/DemoClassification'));
const UnifiedExplorer = lazy(() => import('../components/UnifiedExplorer'));

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
          <p>Interact with real AlphaEarth embeddings via Google Earth Engine — 19 case studies, band experimentation, clustering, change detection, and similarity search.</p>
        </div>
      </div>
      <LiveExplorer />
      <LazySection><UnifiedExplorer /></LazySection>
      <LazySection><DemoClassification /></LazySection>
      <RealApplications />
    </div>
  );
}
