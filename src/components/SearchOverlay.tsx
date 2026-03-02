import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { models } from '../data/models';
import { caseStudies } from '../data/caseStudies';

interface SearchResult {
  type: 'model' | 'case-study' | 'page';
  id: string;
  title: string;
  subtitle: string;
  color: string;
  path: string;
}

const PAGES: SearchResult[] = [
  { type: 'page', id: 'home', title: 'Home', subtitle: 'Overview and introduction', color: '#0d4f4f', path: '/' },
  { type: 'page', id: 'models', title: 'Models', subtitle: 'Architecture, benchmarks, radar profiles', color: '#0d4f4f', path: '/models' },
  { type: 'page', id: 'explore', title: 'Explore', subtitle: 'Live GEE explorer, case studies, demos', color: '#0d4f4f', path: '/explore' },
  { type: 'page', id: 'about', title: 'About', subtitle: 'Expert insights and sources', color: '#0d4f4f', path: '/about' },
];

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return PAGES;
    const q = query.toLowerCase();

    const modelResults: SearchResult[] = models
      .filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.org.toLowerCase().includes(q) ||
        m.tagline.toLowerCase().includes(q) ||
        m.modalities.some(mod => mod.toLowerCase().includes(q)) ||
        m.useCases.some(uc => uc.toLowerCase().includes(q)) ||
        m.license.toLowerCase().includes(q)
      )
      .map(m => ({
        type: 'model' as const,
        id: m.id,
        title: m.name,
        subtitle: `${m.org} — ${m.tagline}`,
        color: m.color,
        path: '/models',
      }));

    const caseResults: SearchResult[] = caseStudies
      .filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.detail.toLowerCase().includes(q) ||
        c.application.toLowerCase().includes(q)
      )
      .map(c => ({
        type: 'case-study' as const,
        id: c.id,
        title: c.title,
        subtitle: c.location,
        color: c.color,
        path: '/explore',
      }));

    const pageResults: SearchResult[] = PAGES.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.subtitle.toLowerCase().includes(q)
    );

    return [...modelResults, ...caseResults, ...pageResults].slice(0, 10);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="search-overlay-backdrop" onClick={onClose} />
      <div className="search-overlay">
        <div className="search-input-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search models, case studies, pages..."
            className="search-input"
          />
          <kbd className="search-kbd">ESC</kbd>
        </div>
        {results.length > 0 && (
          <div className="search-results">
            {results.map((r, i) => (
              <button
                key={`${r.type}-${r.id}`}
                className={`search-result ${i === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSelect(r)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span className="search-result-dot" style={{ background: r.color }} />
                <div className="search-result-text">
                  <span className="search-result-title">{r.title}</span>
                  <span className="search-result-subtitle">{r.subtitle}</span>
                </div>
                <span className="search-result-type">
                  {r.type === 'model' ? 'Model' : r.type === 'case-study' ? 'Case Study' : 'Page'}
                </span>
              </button>
            ))}
          </div>
        )}
        {query.trim() && results.length === 0 && (
          <div className="search-empty">No results for &ldquo;{query}&rdquo;</div>
        )}
      </div>
    </>
  );
}
