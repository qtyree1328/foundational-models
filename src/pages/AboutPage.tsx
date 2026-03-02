import { useEffect, lazy, Suspense } from 'react';
import { useInView } from '../hooks/useInView';
import Sources from '../components/Sources';
import GettingStarted from '../components/GettingStarted';

const ExpertInsights = lazy(() => import('../components/ExpertInsights'));

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

export default function AboutPage() {
  const ref = useInView();

  useEffect(() => {
    document.title = 'About | Geospatial Foundation Models';
  }, []);

  return (
    <div ref={ref}>
      <div className="page-header">
        <div className="container">
          <span className="page-label">Research & References</span>
          <h1>About This Project</h1>
          <p>Expert insights, academic sources, and getting started guides for working with geospatial foundation models.</p>
        </div>
      </div>
      <LazySection><ExpertInsights /></LazySection>
      <GettingStarted />
      <Sources />
    </div>
  );
}
