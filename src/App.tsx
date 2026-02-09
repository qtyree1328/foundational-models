import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import Hero from './components/Hero';
import Pipeline from './components/Pipeline';
import ParadigmShift from './components/ParadigmShift';
import ModelGallery from './components/ModelGallery';
import CaseStudyMap from './components/CaseStudyMap';
import LiveExplorer from './components/LiveExplorer';
import EmbeddingViz from './components/EmbeddingViz';
import DeepComparison from './components/DeepComparison';
import Ecosystem from './components/Ecosystem';
import ModelRecommender from './components/ModelRecommender';
import GettingStarted from './components/GettingStarted';
import Sources from './components/Sources';
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
  { id: 'paradigm', label: 'Why It Matters' },
  { id: 'models', label: 'Models' },
  { id: 'deep-compare', label: 'Compare' },
  { id: 'ecosystem', label: 'Ecosystem' },
  { id: 'explorer', label: 'Live Explorer' },
  { id: 'demo-classify', label: 'Demo' },
  { id: 'cases', label: 'Case Studies' },
  { id: 'insights', label: 'Expert' },
  { id: 'recommender', label: 'Recommender' },
  { id: 'sources', label: 'Sources' },
];

function Nav({ activeSection }: { activeSection: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const scrollTo = (id: string) => {
    const el = document.querySelector(`[data-section="${id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className={`main-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>LEOM Explorer</span>
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
          <button 
            className={`mobile-menu-btn ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>
      
      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)} />
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <span>Navigate</span>
        </div>
        <div className="mobile-menu-links">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`mobile-menu-link ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => scrollTo(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
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
            <span>Large Earth Observation Models Explorer</span>
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
      <ParadigmShift />
      <ModelGallery />
      <DeepComparison />
      <Ecosystem />
      <LiveExplorer />
      <LazySection><DemoClassification /></LazySection>
      <CaseStudyMap />
      <LazySection><ExpertInsights /></LazySection>
      <ModelRecommender />
      <Sources />
      <GettingStarted />
      <Footer />
    </div>
  );
}
