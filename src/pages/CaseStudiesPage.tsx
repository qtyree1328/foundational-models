import { useEffect } from 'react';
import { useInView } from '../hooks/useInView';
import CaseStudyMap from '../components/CaseStudyMap';
import RealApplications from '../components/RealApplications';

export default function CaseStudiesPage() {
  const ref = useInView();

  useEffect(() => {
    document.title = 'Case Studies | Geospatial Foundation Models';
  }, []);

  return (
    <div ref={ref}>
      <div className="page-header">
        <div className="container">
          <span className="page-label">Real-World Evidence</span>
          <h1>Case Studies</h1>
          <p>Before/after satellite imagery, embedding visualizations, and real-world production applications.</p>
        </div>
      </div>
      <CaseStudyMap />
      <RealApplications />
    </div>
  );
}
