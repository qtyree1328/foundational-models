import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import SearchOverlay from './components/SearchOverlay';

// Lazy load all pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const ModelsPage = lazy(() => import('./pages/ModelsPage'));
const ArchitecturePage = lazy(() => import('./pages/ArchitecturePage'));
const CaseStudiesPage = lazy(() => import('./pages/CaseStudiesPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

const NAV_ITEMS = [
  { path: '/', label: 'Home' },
  { path: '/models', label: 'Models' },
  { path: '/architecture', label: 'Architecture' },
  { path: '/case-studies', label: 'Case Studies' },
  { path: '/explore', label: 'Explore' },
  { path: '/about', label: 'About' },
];

function PageLoader() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="stac-spinner" />
    </div>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  // Cmd+K / Ctrl+K to open search
  const handleSearchClose = useCallback(() => setSearchOpen(false), []);
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

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

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // On home page and not scrolled, use transparent nav with white text
  const isHome = location.pathname === '/';
  const navClass = `main-nav ${scrolled ? 'scrolled' : ''} ${!isHome ? 'scrolled' : ''}`;

  return (
    <>
      <nav className={navClass}>
        <div className="nav-inner">
          <NavLink to="/" className="nav-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>Geospatial Foundation Models</span>
          </NavLink>
          <div className="nav-links">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <button
            className="nav-search-btn"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <span className="nav-search-label">Search</span>
            <kbd className="nav-search-kbd">&#8984;K</kbd>
          </button>
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
      <SearchOverlay open={searchOpen} onClose={handleSearchClose} />

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)} />
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <span>Navigate</span>
        </div>
        <div className="mobile-menu-links">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `mobile-menu-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
}

function NotFound() {
  return (
    <div className="page-header" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '72px', marginBottom: '16px' }}>404</h1>
        <p style={{ marginBottom: '32px' }}>Page not found</p>
        <NavLink to="/" className="cta-button">Back to Home</NavLink>
      </div>
    </div>
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
            <span>All specifications verified from published papers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="app">
      <ScrollToTop />
      <Nav />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/case-studies" element={<CaseStudiesPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Footer />
    </div>
  );
}
