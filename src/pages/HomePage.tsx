import { useInView } from '../hooks/useInView';
import Hero from '../components/Hero';
import Pipeline from '../components/Pipeline';
import ParadigmShift from '../components/ParadigmShift';
import ModelGallery from '../components/ModelGallery';
import Ecosystem from '../components/Ecosystem';
import PageSummaryCards from '../components/PageSummaryCards';

export default function HomePage() {
  const ref = useInView();

  return (
    <div ref={ref}>
      <Hero />
      <Pipeline />
      <ParadigmShift />
      <ModelGallery preview={9} />
      <Ecosystem />
      <PageSummaryCards />
    </div>
  );
}
