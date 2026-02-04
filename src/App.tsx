import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import Hero from './components/Hero';
import Pipeline from './components/Pipeline';
import ModelGallery from './components/ModelGallery';
import CaseStudyMap from './components/CaseStudyMap';
import LiveExplorer from './components/LiveExplorer';
import EmbeddingViz from './components/EmbeddingViz';
import DeepComparison from './components/DeepComparison';
import ModelRecommender from './components/ModelRecommender';
import GettingStarted from './components/GettingStarted';
import { useInView, useSectionInView } from './hooks/useInView';

// Lazy load heavy components
const ExpertInsights = lazy(() => import('./components/ExpertInsights'));
const DemoClassification = lazy(() => import('./components/DemoClassification'));

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

const NAV_ITEMS = [
  { id: 'pipeline', label: 'How It Works' },
  { id: 'models', label: 'Models' },
  { id: 'deep-compare', label: 'Compare' },
  { id: 'explorer', label: 'Live Explorer' },
  { id: 'demo-classify', label: 'Demo' },
  { id: 'map', label: 'Case Studies' },
  { id: 'insights', label: 'Expert' },
  { id: 'recommender', label: 'Recommender' },
  { id: 'embeddings', label: 'Embedding Viz' },
];

function Nav({ activeSection }: { activeSection: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.querySelector(`[data-section="${id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className={`main-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <div className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>GeoFM Explorer</span>
        </div>
        <div className="nav-links">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => scrollTo(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>Geospatial Foundation Models Explorer</span>
          </div>
          <div className="footer-center">
            <span>Built by <a href="https://tyreespatial.com" target="_blank" rel="noopener">Quintin Tyree</a></span>
          </div>
          <div className="footer-right">
            <span>All specifications verified from published papers • Satellite imagery © Esri, Maxar</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const containerRef = useInView();

  const handleSectionChange = useCallback((id: string) => {
    setActiveSection(id);
  }, []);

  useSectionInView(handleSectionChange);

  return (
    <div ref={containerRef} className="app">
      <Nav activeSection={activeSection} />
      <Hero />
      <Pipeline />
      <ModelGallery />
      <DeepComparison />
      <LiveExplorer />
      <LazySection><DemoClassification /></LazySection>
      <CaseStudyMap />
      <LazySection><ExpertInsights /></LazySection>
      <ModelRecommender />
      <EmbeddingViz />
      <GettingStarted />
      <Footer />
    </div>
  );
}
